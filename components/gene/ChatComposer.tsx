"use client";

import { type KeyboardEvent, type RefObject } from "react";

export const MAX_MESSAGE_LENGTH = 1000;
const CHAR_COUNT_THRESHOLD = 800;

/**
 * Message composer: an accessible textarea plus a Send button.
 *
 * - Enter submits; Shift+Enter inserts a newline.
 * - Empty / whitespace-only input cannot submit.
 * - Send is disabled while a request is active (communicated with text +
 *   opacity + aria-disabled, not color alone).
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
  textareaRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !isLoading;
  const showCount = value.length >= CHAR_COUNT_THRESHOLD;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          onSubmit();
        }
      }}
      className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <label htmlFor="gene-composer" className="sr-only">
        Ask Gene a question about Akash
      </label>
      <textarea
        id="gene-composer"
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        maxLength={MAX_MESSAGE_LENGTH}
        aria-busy={isLoading}
        placeholder="Ask about Akash's experience, projects, skills, or education..."
        className="block max-h-40 w-full resize-y bg-transparent px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      <div className="mt-1 flex items-center justify-between gap-3 px-1">
        <span
          className="text-xs text-zinc-400 tabular-nums dark:text-zinc-500"
          aria-hidden={!showCount}
        >
          {showCount ? `${value.length} / ${MAX_MESSAGE_LENGTH}` : ""}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950"
        >
          {isLoading ? "Sending" : "Send"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 12h15m0 0-6-6m6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
