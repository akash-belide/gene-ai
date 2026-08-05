import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@/app/generated/prisma/client";
import { toVectorLiteral, validateEmbedding } from "@/lib/embedding";
import { prisma } from "@/lib/prisma";

/**
 * A knowledge chunk as stored in `knowledge_chunks`, excluding the raw
 * embedding vector (which is large and never needs to leave the database).
 */
export type KnowledgeChunkRecord = {
  id: string;
  sourceTitle: string;
  sourceType: string;
  section: string | null;
  content: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateKnowledgeChunkInput = {
  sourceTitle: string;
  sourceType: string;
  section?: string | null;
  content: string;
  metadata?: Prisma.InputJsonValue | null;
  embedding: number[];
};

export type KnowledgeSearchResult = {
  id: string;
  sourceTitle: string;
  sourceType: string;
  section: string | null;
  content: string;
  metadata: Prisma.JsonValue | null;
  similarity: number;
};

export type KnowledgeSearchOptions = {
  limit?: number;
  /** Backward-compatible single source-type filter. */
  sourceType?: string;
  /** Preferred multi source-type filter (safe parameterized `IN`). */
  sourceTypes?: string[];
  minimumSimilarity?: number;
};

const DEFAULT_SEARCH_LIMIT = 6;
const MIN_SEARCH_LIMIT = 1;
const MAX_SEARCH_LIMIT = 20;

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`createKnowledgeChunk: \`${field}\` must be a non-empty string.`);
  }
  return value;
}

/**
 * Inserts a single chunk into `knowledge_chunks`.
 *
 * The `embedding` column is `Unsupported("vector(1536)")`, so Prisma Client
 * cannot write it via the model API. We use a parameterized raw query: every
 * dynamic value is bound as a parameter (never string-concatenated), and the
 * embedding is validated + serialized before being cast to `::vector`.
 *
 * Returns the inserted record WITHOUT the embedding vector.
 */
export async function createKnowledgeChunk(
  input: CreateKnowledgeChunkInput,
): Promise<KnowledgeChunkRecord> {
  const sourceTitle = requireNonEmptyString(input.sourceTitle, "sourceTitle");
  const sourceType = requireNonEmptyString(input.sourceType, "sourceType");
  const content = requireNonEmptyString(input.content, "content");

  validateEmbedding(input.embedding);
  const vectorLiteral = toVectorLiteral(input.embedding);

  const section = input.section ?? null;
  const metadataJson =
    input.metadata === undefined || input.metadata === null
      ? null
      : JSON.stringify(input.metadata);

  const id = randomUUID();

  const rows = await prisma.$queryRaw<KnowledgeChunkRecord[]>(Prisma.sql`
    INSERT INTO "knowledge_chunks" (
      "id",
      "source_title",
      "source_type",
      "section",
      "content",
      "metadata",
      "embedding",
      "updated_at"
    )
    VALUES (
      ${id},
      ${sourceTitle},
      ${sourceType},
      ${section},
      ${content},
      ${metadataJson}::jsonb,
      ${vectorLiteral}::vector,
      NOW()
    )
    RETURNING
      "id",
      "source_title" AS "sourceTitle",
      "source_type" AS "sourceType",
      "section",
      "content",
      "metadata",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
  `);

  const record = rows[0];
  if (!record) {
    throw new Error("createKnowledgeChunk: insert did not return a record.");
  }

  return record;
}

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_SEARCH_LIMIT;
  }
  const rounded = Math.trunc(limit);
  return Math.min(MAX_SEARCH_LIMIT, Math.max(MIN_SEARCH_LIMIT, rounded));
}

/**
 * Cosine-similarity search over `knowledge_chunks` using pgvector's `<=>`
 * distance operator and the HNSW index.
 *
 * All dynamic values are bound as parameters. Ordering is done directly by
 * distance (`"embedding" <=> query`) so the HNSW index is used, while the
 * returned `similarity` is `1 - distance`.
 */
export async function searchKnowledgeChunks(
  queryEmbedding: number[],
  options: KnowledgeSearchOptions = {},
): Promise<KnowledgeSearchResult[]> {
  validateEmbedding(queryEmbedding);
  const vectorLiteral = toVectorLiteral(queryEmbedding);

  const limit = clampLimit(options.limit);

  const conditions: Prisma.Sql[] = [Prisma.sql`"embedding" IS NOT NULL`];

  const sourceTypes = (options.sourceTypes ?? []).filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  if (sourceTypes.length > 0) {
    // Safe parameterized IN: each value is bound as its own placeholder.
    conditions.push(
      Prisma.sql`"source_type" IN (${Prisma.join(sourceTypes)})`,
    );
  } else if (
    typeof options.sourceType === "string" &&
    options.sourceType.length > 0
  ) {
    conditions.push(Prisma.sql`"source_type" = ${options.sourceType}`);
  }

  if (
    typeof options.minimumSimilarity === "number" &&
    Number.isFinite(options.minimumSimilarity)
  ) {
    conditions.push(
      Prisma.sql`(1 - ("embedding" <=> ${vectorLiteral}::vector)) >= ${options.minimumSimilarity}`,
    );
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const rows = await prisma.$queryRaw<KnowledgeSearchResult[]>(Prisma.sql`
    SELECT
      "id",
      "source_title" AS "sourceTitle",
      "source_type" AS "sourceType",
      "section",
      "content",
      "metadata",
      1 - ("embedding" <=> ${vectorLiteral}::vector) AS "similarity"
    FROM "knowledge_chunks"
    WHERE ${whereClause}
    ORDER BY "embedding" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `);

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
  }));
}
