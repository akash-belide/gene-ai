import { generateEmbedding } from "@/lib/openai";
import {
  searchKnowledgeChunks,
  type KnowledgeSearchResult,
} from "@/lib/knowledge";

// This route runs database + OpenAI calls, so it must use the Node.js runtime
// and always execute at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchRequestBody = {
  query?: unknown;
  limit?: unknown;
  sourceType?: unknown;
  minimumSimilarity?: unknown;
};

/**
 * Development-only test route for the knowledge retrieval pipeline.
 *
 * POST /api/gene/search
 * Body: {
 *   "query": string,
 *   "limit"?: number,
 *   "sourceType"?: string,
 *   "minimumSimilarity"?: number  // between 0 and 1
 * }
 */
export async function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: SearchRequestBody;
  try {
    body = (await request.json()) as SearchRequestBody;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { query, limit, sourceType, minimumSimilarity } = body;

  if (typeof query !== "string" || query.trim().length === 0) {
    return Response.json(
      { error: "`query` is required and must be a non-empty string." },
      { status: 400 },
    );
  }

  if (
    limit !== undefined &&
    (typeof limit !== "number" || !Number.isFinite(limit))
  ) {
    return Response.json(
      { error: "`limit` must be a finite number when provided." },
      { status: 400 },
    );
  }

  if (
    sourceType !== undefined &&
    (typeof sourceType !== "string" || sourceType.trim().length === 0)
  ) {
    return Response.json(
      { error: "`sourceType` must be a non-empty string when provided." },
      { status: 400 },
    );
  }

  if (
    minimumSimilarity !== undefined &&
    (typeof minimumSimilarity !== "number" ||
      !Number.isFinite(minimumSimilarity) ||
      minimumSimilarity < 0 ||
      minimumSimilarity > 1)
  ) {
    return Response.json(
      {
        error:
          "`minimumSimilarity` must be a finite number between 0 and 1 when provided.",
      },
      { status: 400 },
    );
  }

  const filters = {
    sourceType: sourceType as string | undefined,
    minimumSimilarity: minimumSimilarity as number | undefined,
  };

  try {
    const embedding = await generateEmbedding(query);
    const results: KnowledgeSearchResult[] = await searchKnowledgeChunks(
      embedding,
      {
        limit,
        sourceType: filters.sourceType,
        minimumSimilarity: filters.minimumSimilarity,
      },
    );

    return Response.json({
      query,
      filters,
      count: results.length,
      results,
    });
  } catch (error) {
    // Never leak internal details (e.g. the API key) to the client.
    console.error("[/api/gene/search] search failed:", error);
    return Response.json(
      { error: "Failed to search knowledge chunks." },
      { status: 500 },
    );
  }
}
