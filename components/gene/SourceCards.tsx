import {
  dedupeSources,
  sourceTypeLabel,
  type ChatSource,
} from "@/lib/gene-ui-types";

/**
 * Compact, non-interactive source cards shown under an assistant answer.
 *
 * The API does not return source URLs, so cards are semantic list items, not
 * links. We never render database ids, similarity scores, embeddings, raw
 * metadata, or routing/retrieval information.
 */
export function SourceCards({ sources }: { sources: ChatSource[] }) {
  const unique = dedupeSources(sources);

  if (unique.length === 0) {
    return null;
  }

  return (
    <section className="mt-3" aria-label="Sources">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Sources
      </h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {unique.map((source) => (
          <li
            key={`${source.sourceTitle}||${source.section ?? ""}`}
            className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30">
              {sourceTypeLabel(source.sourceType)}
            </span>
            <p className="mt-1.5 text-sm font-medium wrap-break-word text-zinc-900 dark:text-zinc-100">
              {source.sourceTitle}
            </p>
            {source.section ? (
              <p className="mt-0.5 text-xs wrap-break-word text-zinc-500 dark:text-zinc-400">
                {source.section}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
