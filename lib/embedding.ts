/**
 * The embedding dimensionality that the `knowledge_chunks.embedding`
 * column (`vector(1536)`) and the OpenAI `text-embedding-3-small` model
 * both use. Every embedding in this system must match exactly.
 */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Asserts that `embedding` is a valid embedding vector for this system:
 * an array of exactly {@link EMBEDDING_DIMENSIONS} finite numbers.
 *
 * Throws a descriptive error otherwise. On success, TypeScript narrows
 * `embedding` to `number[]`.
 */
export function validateEmbedding(
  embedding: unknown,
): asserts embedding is number[] {
  if (!Array.isArray(embedding)) {
    throw new Error(
      `Invalid embedding: expected an array, received ${typeof embedding}.`,
    );
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding: expected exactly ${EMBEDDING_DIMENSIONS} values, received ${embedding.length}.`,
    );
  }

  for (let i = 0; i < embedding.length; i++) {
    const value = embedding[i];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(
        `Invalid embedding: value at index ${i} is not a finite number (received ${String(
          value,
        )}).`,
      );
    }
  }
}

/**
 * Serializes an embedding into the textual format pgvector accepts as input
 * to a `::vector` cast, e.g. `[0.1,0.2,0.3]`. The embedding is validated
 * first so malformed data can never reach the database.
 */
export function toVectorLiteral(embedding: number[]): string {
  validateEmbedding(embedding);
  return `[${embedding.join(",")}]`;
}
