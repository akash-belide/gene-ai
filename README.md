# Gene AI

Gene AI is a grounded, retrieval-augmented assistant that answers questions
about Akash's professional experience, projects, skills, education, and academic
work. Every answer is generated only from a verified knowledge base — when the
knowledge base does not support a question, Gene refuses instead of inventing an
answer. The chat interface lives at `/gene`.

## What it does

- Accepts a natural-language question at `/gene`.
- Embeds the question and performs semantic (vector) retrieval over a curated
  knowledge base.
- Automatically routes the query to likely source types (experience, projects,
  skills, education, etc.) — users never pick a category.
- Generates a grounded answer from the retrieved context and attributes the
  sources used.
- Refuses cleanly, with no sources, when nothing relevant is found.

## Features

- **Grounded RAG answers** — responses are constrained to verified context.
- **Automatic intent routing** — deterministic source-type inference per query.
- **Semantic retrieval** — pgvector cosine similarity with a configurable
  minimum-similarity threshold.
- **Source attribution** — answers cite the knowledge chunks they used.
- **Refusal handling** — a canonical refusal when context is insufficient.
- **Responsive chat UI** — self-contained React interface, embeddable later.
- **Production safety** — server-side access flag, IP rate limiting, generic
  error responses, and no-store caching on chat responses.

## Architecture

```
Browser (/gene)
   │  POST /api/gene/chat  { message }
   ▼
Access flag ─► Config validation ─► Rate limit (Upstash) ─► Retrieval ─► Generation
                                                              │             │
                                          OpenAI embeddings ◄─┘             │
                                          Supabase Postgres + pgvector      │
                                          (KnowledgeChunk, cosine search)   │
                                                              OpenAI Responses API
```

- **Retrieval:** the question is embedded, then matched against
  `KnowledgeChunk` rows using pgvector cosine similarity, filtered by inferred
  source types and a minimum-similarity threshold.
- **Generation:** retrieved context is passed as untrusted reference data to the
  OpenAI Responses API; the trusted system prompt is server-side only and never
  returned to the client.
- **Server-only boundaries:** database, OpenAI, rate-limit, and environment
  helpers are `server-only` so secrets never reach the client bundle.

## Technology stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase PostgreSQL with the `pgvector` extension
- **ORM:** Prisma 7 with the `@prisma/adapter-pg` driver adapter (pooled runtime
  connection)
- **AI:** OpenAI (embeddings + Responses API)
- **Rate limiting:** Upstash Redis via `@upstash/ratelimit`
- **Runtime:** Node.js 22.x

## Local setup

Requires Node.js (see `engines` in `package.json`).

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # then fill in the values (never commit .env)
npm run dev
```

Open [http://localhost:3000/gene](http://localhost:3000/gene).

In development, `POST /api/gene/chat` runs without Upstash (rate limiting is
skipped). Do **not** run database migrations or the seed script as part of
normal setup.

## Environment variables

Copy `.env.example` to `.env` and provide values. Never place real credentials
in the repository.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase **pooled** connection (transaction pooler, port 6543). Used by the app at runtime. |
| `OPENAI_API_KEY` | Yes | Server-only OpenAI key. |
| `OPENAI_EMBEDDING_MODEL` | Optional | Defaults to `text-embedding-3-small`. |
| `OPENAI_CHAT_MODEL` | Yes | e.g. `gpt-5.4-mini`. Never selectable from the browser. |
| `GENE_MINIMUM_SIMILARITY` | Optional | Retrieval threshold (0–1). Defaults to `0.45`. |
| `GENE_PUBLIC_ENABLED` | Prod | Server-only flag (no `NEXT_PUBLIC_` prefix). Chat is served in production only when this is exactly `true`. |
| `UPSTASH_REDIS_REST_URL` | Prod (public) | Upstash Redis REST URL for rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Prod (public) | Upstash Redis REST token. |
| `MIGRATION_DATABASE_URL` | Migrations only | Supabase **session** pooler (port 5432). Used **only** for manual Prisma migrations — never an application runtime dependency and never used to serve requests. |

## npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Production build (`next build`). |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Type-check with `tsc --noEmit`. |
| `postinstall` | Runs `prisma generate` (automatic on install). |
| `npm run db:seed` | Seed the knowledge base (manual, not part of build/deploy). |

## API routes

| Method & path | Availability | Purpose |
| --- | --- | --- |
| `POST /api/gene/chat` | Dev always; prod when `GENE_PUBLIC_ENABLED=true` | Grounded RAG answer. Body: `{ message }` (max 1000 chars). |
| `POST /api/gene/search` | Development only (404 in production) | Raw retrieval inspection for local debugging. |
| `GET /api/health` | Always | Application-availability check → `{ "status": "ok" }`. No external calls. |

The chat route never accepts a model name, system prompt, or raw SQL from the
browser.

## Production safety

- **Access flag:** `POST /api/gene/chat` is gated by the server-only
  `GENE_PUBLIC_ENABLED` flag; otherwise it returns a generic `404`.
- **Rate limiting:** 10 requests per IP over a sliding 10-minute window
  (Upstash), applied before any paid OpenAI call. Over-limit returns `429` with
  a `Retry-After` header. In production, missing rate-limit configuration fails
  closed with a generic `503` rather than running unlimited.
- **No metadata leakage:** production chat responses omit internal retrieval
  metadata; errors are generic and internals are only logged (never keys, URLs,
  tokens, full questions, or full model output).
- **No caching:** chat responses set `Cache-Control: no-store`.
- **Security headers:** `X-Content-Type-Options`, `Referrer-Policy`, and a
  restrictive `Permissions-Policy` are applied via `next.config.ts`.

## Deployment

Gene AI deploys to Vercel using standard Next.js conventions (no `vercel.json`,
build command `npm run build`, Node 22.x). Migrations never run on Vercel.

- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — step-by-step Vercel deployment
  and the required environment variables.
- [`docs/PORTFOLIO_INTEGRATION.md`](./docs/PORTFOLIO_INTEGRATION.md) — linking
  Gene from the separate static portfolio.

## Project status

Working and verified: the `/gene` chat interface, Supabase Postgres with
pgvector, the Prisma `KnowledgeChunk` model and its migration, OpenAI embedding
generation, semantic retrieval, automatic intent routing, grounded responses,
source attribution, and refusal handling. The application is prepared for a
secure, low-cost Vercel deployment.
