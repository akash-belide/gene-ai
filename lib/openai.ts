import "server-only";

import OpenAI from "openai";

import { validateEmbedding } from "@/lib/embedding";

/**
 * Default embedding model. `text-embedding-3-small` returns 1536-dim vectors,
 * matching the `knowledge_chunks.embedding` column.
 */
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;

let cachedClient: OpenAI | null = null;

/**
 * Lazily constructs a single server-side OpenAI client. The API key is read
 * from the environment and is never bundled for the client (`server-only`).
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. It is required to call the OpenAI API.",
    );
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

/**
 * Returns the configured chat model for the OpenAI Responses API.
 * Throws a clear configuration error if `OPENAI_CHAT_MODEL` is not set.
 */
export function getChatModel(): string {
  const model = process.env.OPENAI_CHAT_MODEL?.trim();

  if (!model) {
    throw new Error(
      "OPENAI_CHAT_MODEL is not set. It is required to call the OpenAI Responses API.",
    );
  }

  return model;
}

/**
 * Generates an embedding for `text` using the configured OpenAI model.
 *
 * - Rejects empty / whitespace-only input.
 * - Validates that the response contains exactly 1536 finite numbers.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("generateEmbedding: `text` must be a non-empty string.");
  }

  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  const embedding = response.data[0]?.embedding;

  // Throws with a clear message if the shape is unexpected (e.g. wrong model).
  validateEmbedding(embedding);

  return embedding;
}
