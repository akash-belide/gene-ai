// Lightweight application-availability check. Intentionally does no external
// work: no OpenAI, no embeddings, no database, and it reveals no environment
// variables or deployment details.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
