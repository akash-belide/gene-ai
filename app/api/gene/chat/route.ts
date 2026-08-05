import { generateEmbedding, getChatModel, getOpenAIClient } from "@/lib/openai";
import { searchKnowledgeChunks } from "@/lib/knowledge";
import { GENE_SYSTEM_PROMPT, NO_CONTEXT_ANSWER } from "@/lib/gene-prompt";
import {
  MAX_LIMIT,
  dedupeById,
  formatContextBlock,
  parseMinimumSimilarityEnv,
  toSourceSummaries,
  validateChatRequest,
} from "@/lib/gene-context";
import { inferSourceTypes } from "@/lib/gene-intent";

// This route runs database + OpenAI calls, so it must use the Node.js runtime
// and always execute at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OUTPUT_TOKENS = 500;
// Retrieve a slightly larger candidate pool than requested so multiple inferred
// source types can each contribute before we trim to the requested limit.
const MAX_CANDIDATE_POOL = 20;

/**
 * Gene conversational endpoint (grounded RAG answer).
 *
 * POST /api/gene/chat
 * Body: {
 *   message: string,
 *   sourceType?: string,       // optional dev override; not required publicly
 *   limit?: number,            // integer 1-10, default 6
 *   minimumSimilarity?: number // 0-1, dev-only override of GENE_MINIMUM_SIMILARITY
 * }
 *
 * Public callers only need `message`; likely source types are inferred by the
 * deterministic intent router.
 *
 * SECURITY: This endpoint is development-only (returns 404 in production),
 * matching POST /api/gene/search. Before this is exposed publicly, it MUST get
 * rate limiting, abuse/spend protection, and production access control
 * (e.g. auth or an allowlist). Do not remove the production guard without them.
 */
export async function POST(request: Request): Promise<Response> {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { message, sourceType, limit, minimumSimilarity } = validation.data;

  // Resolve server configuration first so we fail fast (before any paid API
  // call) if the deployment is misconfigured.
  let openai;
  let chatModel: string;
  try {
    openai = getOpenAIClient();
    chatModel = getChatModel();
  } catch (error) {
    console.error("[/api/gene/chat] configuration error:", error);
    return Response.json(
      { error: "The chat service is not configured correctly." },
      { status: 500 },
    );
  }

  // Retrieval orchestration.
  // 1. Explicit sourceType wins (dev override).
  // 2. Otherwise infer likely source types from the question.
  // 3. If none inferred, search unfiltered.
  const inferredSourceTypes = inferSourceTypes(message);
  const appliedSourceTypes = sourceType
    ? [sourceType]
    : inferredSourceTypes;

  // Threshold: env default, with a dev-only per-request override.
  const baseMinimumSimilarity = parseMinimumSimilarityEnv(
    process.env.GENE_MINIMUM_SIMILARITY,
  );
  const effectiveMinimumSimilarity =
    !isProduction && minimumSimilarity !== undefined
      ? minimumSimilarity
      : baseMinimumSimilarity;

  const candidatePoolSize = Math.min(
    MAX_CANDIDATE_POOL,
    Math.max(limit * 2, MAX_LIMIT),
  );

  // Retrieval: embed the question and fetch grounding chunks. A single query
  // with a safe `IN` filter covers all applied source types (no per-type
  // OpenAI calls). We still dedupe + re-sort defensively.
  let results;
  try {
    const queryEmbedding = await generateEmbedding(message);
    const candidates = await searchKnowledgeChunks(queryEmbedding, {
      limit: candidatePoolSize,
      sourceTypes: appliedSourceTypes.length > 0 ? appliedSourceTypes : undefined,
      minimumSimilarity: effectiveMinimumSimilarity,
    });

    results = dedupeById(candidates)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error("[/api/gene/chat] retrieval failed:", error);
    return Response.json(
      { error: "Failed to retrieve information for your question." },
      { status: 500 },
    );
  }

  // Retrieval metadata for development visibility. This must be removed or
  // gated before the endpoint is exposed publicly.
  const retrieval = {
    inferredSourceTypes,
    appliedSourceTypes,
    minimumSimilarity: effectiveMinimumSimilarity,
  };

  // No verified context survived the threshold -> do not call the chat model.
  if (results.length === 0) {
    return Response.json({
      answer: NO_CONTEXT_ANSWER,
      retrieval,
      sources: [],
    });
  }

  const context = formatContextBlock(results);

  // Generation via the OpenAI Responses API. Retrieved context is provided as
  // untrusted reference data in `input`; the trusted instructions live in
  // `instructions` (GENE_SYSTEM_PROMPT), never returned to the client.
  let answer: string;
  try {
    const response = await openai.responses.create({
      model: chatModel,
      instructions: GENE_SYSTEM_PROMPT,
      input: `User question:\n${message}\n\nVerified context:\n${context}`,
      store: false,
      max_output_tokens: MAX_OUTPUT_TOKENS,
    });

    answer = response.output_text?.trim() ?? "";
  } catch (error) {
    console.error("[/api/gene/chat] OpenAI Responses API error:", error);
    return Response.json(
      { error: "The assistant is temporarily unavailable." },
      { status: 502 },
    );
  }

  if (answer.length === 0) {
    console.error("[/api/gene/chat] OpenAI returned an empty answer.");
    return Response.json(
      { error: "The assistant returned an empty response." },
      { status: 502 },
    );
  }

  return Response.json({
    answer,
    retrieval,
    sources: toSourceSummaries(results),
  });
}
