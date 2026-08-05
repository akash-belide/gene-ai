import type { Metadata } from "next";

import { GeneChat } from "@/components/gene/GeneChat";
import { GeneIcon } from "@/components/gene/GeneIcon";

export const metadata: Metadata = {
  title: "Gene AI",
  description:
    "Ask questions about Akash's experience, projects, skills, education, and academic work.",
};

/**
 * Standalone Gene AI page. Server component that renders a static header and
 * embeds the interactive <GeneChat /> client component. The homepage and other
 * portfolio pages are intentionally untouched.
 */
export default function GenePage() {
  return (
    <main className="min-h-full bg-zinc-50 px-4 py-8 sm:py-12 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <GeneIcon size={44} />
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Gene AI
            </h1>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Ask questions about Akash&apos;s experience, projects, skills,
            education, and academic work.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-indigo-600 dark:text-indigo-400"
            >
              <path
                d="M12 3 4 6v5c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6l-8-3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Answers are generated from verified portfolio data.
          </p>
        </header>

        <GeneChat />
      </div>
    </main>
  );
}
