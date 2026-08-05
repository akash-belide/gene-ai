"use client";

import ReactMarkdown, { type Components } from "react-markdown";

/**
 * Renders an assistant answer as Markdown using Tailwind-styled elements.
 *
 * Security: raw HTML is NOT enabled (no rehype-raw, no dangerouslySetInnerHTML).
 * External links always open safely with rel="noopener noreferrer".
 */
const markdownComponents: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 wrap-break-word hover:text-indigo-500 dark:text-indigo-400"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </strong>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] wrap-break-word text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="mt-3 mb-1 text-base font-semibold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1 text-base font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold">{children}</h3>
  ),
};

export function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed wrap-break-word text-zinc-700 dark:text-zinc-300">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
