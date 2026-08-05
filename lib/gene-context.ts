import type { KnowledgeSearchResult } from "@/lib/knowledge";

/**
 * Pure, framework-agnostic helpers for the Gene chat endpoint: request
 * validation, verified-context formatting, and source summarisation.
 *
 * This module intentionally avoids `server-only` and any I/O so it can be unit
 * tested in isolation. The `KnowledgeSearchResult` import is type-only, so it
 * does not pull the server-only knowledge module into a test runtime.
 */

export const MAX_MESSAGE_LENGTH = 1000;
export const DEFAULT_LIMIT = 6;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 10;

/** Conservative default retrieval threshold (overridable via env). */
export const DEFAULT_MINIMUM_SIMILARITY = 0.45;

/**
 * Parses the `GENE_MINIMUM_SIMILARITY` env value, falling back to
 * {@link DEFAULT_MINIMUM_SIMILARITY} when unset or invalid (non-finite or
 * outside 0-1).
 */
export function parseMinimumSimilarityEnv(raw: string | undefined): number {
  if (raw === undefined || raw.trim().length === 0) {
    return DEFAULT_MINIMUM_SIMILARITY;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return DEFAULT_MINIMUM_SIMILARITY;
  }
  return value;
}

/** De-duplicates items by their `id`, preserving first-seen order. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

/** Shape of the parsed request once validated. */
export type ChatRequest = {
  message: string;
  sourceType?: string;
  limit: number;
  minimumSimilarity?: number;
};

export type ChatRequestValidation =
  | { ok: true; data: ChatRequest }
  | { ok: false; error: string };

/** A source record safe to return to the client (no embedding, no metadata). */
export type ChatSource = {
  id: string;
  sourceTitle: string;
  sourceType: string;
  section: string | null;
  similarity: number;
};

type RawChatRequest = {
  message?: unknown;
  sourceType?: unknown;
  limit?: unknown;
  minimumSimilarity?: unknown;
};

/**
 * Validates the raw request body for POST /api/gene/chat.
 *
 * Mirrors the conventions used by POST /api/gene/search. Returns a discriminated
 * union so callers can map failures to a 400 response and successes to a typed
 * {@link ChatRequest}. The `message` is trimmed and length-checked; `limit`
 * defaults to {@link DEFAULT_LIMIT} and must be an integer within range.
 */
export function validateChatRequest(body: unknown): ChatRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { message, sourceType, limit, minimumSimilarity } =
    body as RawChatRequest;

  if (typeof message !== "string") {
    return { ok: false, error: "`message` is required and must be a string." };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return { ok: false, error: "`message` must not be empty." };
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `\`message\` must be at most ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  let sourceTypeValue: string | undefined;
  if (sourceType !== undefined) {
    if (typeof sourceType !== "string" || sourceType.trim().length === 0) {
      return {
        ok: false,
        error: "`sourceType` must be a non-empty string when provided.",
      };
    }
    sourceTypeValue = sourceType;
  }

  let limitValue = DEFAULT_LIMIT;
  if (limit !== undefined) {
    if (
      typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < MIN_LIMIT ||
      limit > MAX_LIMIT
    ) {
      return {
        ok: false,
        error: `\`limit\` must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}.`,
      };
    }
    limitValue = limit;
  }

  let minimumSimilarityValue: number | undefined;
  if (minimumSimilarity !== undefined) {
    if (
      typeof minimumSimilarity !== "number" ||
      !Number.isFinite(minimumSimilarity) ||
      minimumSimilarity < 0 ||
      minimumSimilarity > 1
    ) {
      return {
        ok: false,
        error:
          "`minimumSimilarity` must be a finite number between 0 and 1 when provided.",
      };
    }
    minimumSimilarityValue = minimumSimilarity;
  }

  return {
    ok: true,
    data: {
      message: trimmedMessage,
      sourceType: sourceTypeValue,
      limit: limitValue,
      minimumSimilarity: minimumSimilarityValue,
    },
  };
}

/**
 * Formats retrieved chunks into a clearly delimited, verified-context block.
 * Never includes embeddings or private database identifiers.
 */
export function formatContextBlock(chunks: KnowledgeSearchResult[]): string {
  return chunks
    .map((chunk, index) => {
      const lines = [
        `[Source ${index + 1}]`,
        `Title: ${chunk.sourceTitle}`,
        `Type: ${chunk.sourceType}`,
      ];

      if (chunk.section) {
        lines.push(`Section: ${chunk.section}`);
      }

      lines.push("Content:");
      lines.push(chunk.content);

      return lines.join("\n");
    })
    .join("\n\n");
}

function roundSimilarity(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Maps retrieved chunks to client-safe source summaries. Excludes embeddings,
 * content, and metadata; rounds similarity to 4 decimal places.
 */
export function toSourceSummaries(
  chunks: KnowledgeSearchResult[],
): ChatSource[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    sourceTitle: chunk.sourceTitle,
    sourceType: chunk.sourceType,
    section: chunk.section,
    similarity: roundSimilarity(chunk.similarity),
  }));
}
