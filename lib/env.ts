import "server-only";

/**
 * Server-only environment access and validation for Gene AI.
 *
 * This module must never be imported by a client component. It centralizes the
 * production access flag and the runtime configuration checks so route handlers
 * can fail fast with generic client responses while logging only variable
 * NAMES (never secret values) on the server.
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Server-side feature flag controlling public availability of the Gene chat
 * route. Never exposed to client JavaScript and never uses a NEXT_PUBLIC_
 * prefix.
 */
export function isGenePublicEnabled(): boolean {
  return process.env.GENE_PUBLIC_ENABLED === "true";
}

/**
 * Whether POST /api/gene/chat is allowed to run:
 * - development: always allowed
 * - production: only when GENE_PUBLIC_ENABLED=true
 */
export function isGeneChatRouteAllowed(): boolean {
  return !isProduction() || isGenePublicEnabled();
}

/**
 * Variables that must be present at runtime once Gene is publicly enabled.
 * Only NAMES are ever surfaced from validation; values are never read into
 * logs or responses.
 */
const REQUIRED_WHEN_PUBLIC = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_CHAT_MODEL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export type EnvValidationResult =
  | { ok: true }
  | { ok: false; missing: string[] };

/**
 * Validates the runtime configuration required for public Gene traffic.
 *
 * Returns only the NAMES of missing variables so callers can log a safe
 * diagnostic. Secret values are never returned. This intentionally does not
 * validate migration-only configuration (e.g. MIGRATION_DATABASE_URL), which
 * is not a normal application runtime dependency.
 */
export function validateGenePublicEnv(): EnvValidationResult {
  const missing = REQUIRED_WHEN_PUBLIC.filter((name) => {
    const value = process.env[name];
    return value === undefined || value.trim().length === 0;
  });

  return missing.length === 0 ? { ok: true } : { ok: false, missing: [...missing] };
}
