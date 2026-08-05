# Integrating Gene AI with the Portfolio

The portfolio is hosted separately as a static HTML/CSS/JavaScript site. Gene AI
is a standalone Next.js app deployed to Vercel. This document describes the
recommended, low-risk way to connect them.

> Do **not** modify the separate portfolio repository from this project. The
> snippets below are meant to be copied into the portfolio site.

## Recommended initial integration (link-only)

For the first integration, do **not** call the Gene API from the static site and
do **not** set up any cross-origin API access. Instead:

1. Deploy Gene on Vercel (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)).
2. Add an **Ask Gene** button/link to the existing portfolio.
3. Point it at the deployed `/gene` URL.
4. Open it in a new tab initially.
5. Always use `rel="noopener noreferrer"` on the link.

Replace `REPLACE-WITH-GENE-VERCEL-DOMAIN` with your actual Vercel domain.

### Copyable button example

```html
<a
  href="https://REPLACE-WITH-GENE-VERCEL-DOMAIN/gene"
  target="_blank"
  rel="noopener noreferrer"
  class="btn btn-color-1"
>
  Ask Gene AI
</a>
```

### Navigation link example

```html
<nav>
  <!-- existing nav items -->
  <a
    href="https://REPLACE-WITH-GENE-VERCEL-DOMAIN/gene"
    target="_blank"
    rel="noopener noreferrer"
  >
    Ask Gene AI
  </a>
</nav>
```

### Floating button example (minimal CSS)

```html
<a
  href="https://REPLACE-WITH-GENE-VERCEL-DOMAIN/gene"
  target="_blank"
  rel="noopener noreferrer"
  class="gene-fab"
>
  Ask Gene AI
</a>

<style>
  .gene-fab {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 1000;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.1rem;
    border-radius: 9999px;
    background: #4f46e5; /* indigo-600 */
    color: #fff;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
  }
  .gene-fab:hover {
    background: #4338ca; /* indigo-700 */
  }
</style>
```

## Later: custom-domain architecture

Once you are ready to present Gene under your own domain, use a subdomain so the
static portfolio and Gene stay independently deployable:

```
portfolio-domain.example         -> static portfolio site
gene.portfolio-domain.example    -> Gene AI (Vercel)
```

- Add the subdomain as a custom domain on the Gene Vercel project.
- Update the portfolio link to `https://gene.portfolio-domain.example/gene`
  (or the subdomain root if you later serve Gene there directly).
- You can keep opening in a new tab, or embed once you are comfortable with the
  UX and security posture.

Use placeholders (like `portfolio-domain.example`) until the final domain is
decided — do not hard-code a guessed production domain.

## Not recommended yet

- Calling `POST /api/gene/chat` directly from the static portfolio.
- Adding cross-origin (CORS) API access.

Keep the integration link-only until there is a concrete need for embedded API
calls; the link approach avoids exposing the API to arbitrary origins and keeps
rate limiting and access control fully server-side.
