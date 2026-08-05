This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The Gene chat interface lives at [http://localhost:3000/gene](http://localhost:3000/gene).

### Local environment

Copy `.env.example` to `.env` and fill in the values (never commit `.env`):

- `DATABASE_URL` — Supabase pooled connection (runtime).
- `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL` — OpenAI access; `OPENAI_EMBEDDING_MODEL` defaults to `text-embedding-3-small`.
- `GENE_MINIMUM_SIMILARITY` — retrieval threshold (defaults to `0.45`).
- `GENE_PUBLIC_ENABLED` — leave `false` locally; the chat route runs in development regardless.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — optional locally (rate limiting is skipped without them), required in production.
- `MIGRATION_DATABASE_URL` — manual migrations only; not used at app runtime.

In development, `POST /api/gene/chat` runs without Upstash. In production it is
served only when `GENE_PUBLIC_ENABLED=true` and requires Upstash rate limiting.

## Deployment

Gene AI deploys to Vercel using standard Next.js conventions (no `vercel.json`,
build command `npm run build`, Node 22.x). Migrations never run on Vercel.

- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — step-by-step Vercel deployment and the required environment variables.
- [`docs/PORTFOLIO_INTEGRATION.md`](./docs/PORTFOLIO_INTEGRATION.md) — linking Gene from the separate static portfolio.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
