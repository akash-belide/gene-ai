# Deploying Gene AI to Vercel

This guide covers a secure, low-cost deployment of the Gene AI Next.js app to
Vercel. It uses standard Next.js conventions — no `vercel.json` and no custom
build command are required.

## Overview

- **Framework preset:** Next.js
- **Install command:** package-manager default (`npm install`)
- **Build command:** `npm run build`
- **Output directory:** Next.js default (`.next`)
- **Runtime:** Node.js (`engines.node >= 22.12.0`). Select **Node 22.x** in
  Vercel Project Settings.

`prisma generate` runs automatically via the `postinstall` script, so the
generated Prisma Client is always produced on a clean deploy (it is not
committed to the repository). **Migrations never run on Vercel.**

## 1. Push the repository to GitHub

```bash
git push origin main
```

Do **not** commit `.env` or any real credentials. Only `.env.example` is
tracked.

## 2. Import the project into Vercel

- In Vercel, choose **Add New… → Project** and import the GitHub repository.

## 3. Select the Next.js framework preset

- Vercel auto-detects Next.js. Leave install/build/output at their defaults.
- Under **Settings → General → Node.js Version**, select **22.x**.

## 4. Add Production environment variables

Add these under **Settings → Environment Variables** for the **Production**
environment. Do not paste real keys into GitHub or the repository.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase **pooled** connection (transaction pooler, port 6543). Used at runtime. |
| `OPENAI_API_KEY` | Yes | Server-only OpenAI key. |
| `OPENAI_EMBEDDING_MODEL` | Optional | Defaults to `text-embedding-3-small`. |
| `OPENAI_CHAT_MODEL` | Yes | e.g. `gpt-5.4-mini`. Never selectable by the browser. |
| `GENE_MINIMUM_SIMILARITY` | Optional | Defaults to `0.45`. |
| `GENE_PUBLIC_ENABLED` | Yes | Set to `true` to serve `/api/gene/chat` publicly. Any other value returns 404. |
| `UPSTASH_REDIS_REST_URL` | Yes (when public) | Upstash Redis REST URL for rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (when public) | Upstash Redis REST token. |

When `GENE_PUBLIC_ENABLED=true`, the Upstash variables **must** be present. If
rate-limit configuration is missing, the chat endpoint fails closed with a
generic `503` rather than running unlimited.

### About `MIGRATION_DATABASE_URL`

`MIGRATION_DATABASE_URL` (Supabase session pooler, port 5432) is for **manual**
migration work only. It is **not** an application runtime dependency and the app
never uses it at runtime. Add it to Vercel **only** if a specific build step
truly requires it. **Migrations must not run automatically on Vercel.**

## 5. Add Preview variables only when needed

- Add Preview-scoped variables only if you intend to exercise Gene on preview
  deployments. You can leave `GENE_PUBLIC_ENABLED` unset (or not `true`) on
  Preview to keep the chat endpoint returning 404 there.

## 6. Do not add real keys to GitHub

- Keep all secrets in Vercel's Environment Variables, never in the repo.

## 7. Do not run migrations from Vercel

- The build only runs `next build` (plus `prisma generate` via `postinstall`).
- Apply schema changes manually from a trusted machine using
  `MIGRATION_DATABASE_URL`, outside of the Vercel build.

## 8. Deploy

- Trigger the deploy (push to the connected branch or click **Deploy**).

## 9. Test `/api/health`

```bash
curl -s https://YOUR-DEPLOYMENT.vercel.app/api/health
# => {"status":"ok"}
```

This endpoint performs no external calls (no OpenAI, embeddings, or database).

## 10. Test `/gene`

- Open `https://YOUR-DEPLOYMENT.vercel.app/gene` and confirm the chat UI loads.

## 11. Test a supported question

- Ask something covered by the portfolio knowledge base and confirm a grounded
  answer with source cards.

## 12. Test a refusal question

- Ask something clearly out of scope and confirm Gene refuses without inventing
  facts and shows no sources.

## 13. Test rate limiting

- Submit more than 10 questions from the same client within 10 minutes and
  confirm you receive the rate-limit message and an HTTP `429`.

## 14. Review Vercel function logs

- In **Deployments → Functions**, confirm logs show request status and error
  categories only — no API keys, database URLs, Redis tokens, full questions, or
  full model responses.

## 15. Review OpenAI usage

- Check the OpenAI dashboard to confirm request volume and spend look expected.

## 16. Review Supabase status

- Confirm the Supabase project is healthy and connection counts are reasonable.

## Rollback / disabling access

To take Gene offline without redeploying code, set `GENE_PUBLIC_ENABLED` to a
value other than `true` (or remove it) and redeploy/refresh the environment. The
chat endpoint then returns `404`.
