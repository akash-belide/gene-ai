import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Prisma 7 requires a driver adapter. We use the pg adapter pointed at the
 * runtime connection string (Supabase pooled `DATABASE_URL`). This module is
 * server-only so the connection string never reaches client bundles.
 *
 * Client construction is deferred until first use via a proxy. This keeps the
 * module import side-effect free so a Vercel build (which imports route modules
 * to collect metadata) never crashes when `DATABASE_URL` is not present at
 * build time. The connection is only required when a query actually runs.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. It is required to connect the Prisma Client.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Module-level singleton for production; `globalForPrisma` additionally keeps a
// single instance across dev HMR reloads.
let client: PrismaClient | undefined = globalForPrisma.prisma;

function getPrismaClient(): PrismaClient {
  if (!client) {
    client = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
  }
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
