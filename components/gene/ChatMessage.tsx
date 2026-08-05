"use client";

import { GeneIcon } from "@/components/gene/GeneIcon";
import { MarkdownAnswer } from "@/components/gene/MarkdownAnswer";
import { SourceCards } from "@/components/gene/SourceCards";
import type { ChatMessage as ChatMessageType } from "@/lib/gene-ui-types";

const GENERIC_ERROR = "Gene couldn't answer that right now. Please try again.";

function TypingIndicator() {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-hidden="true"
    >
      {["", "[animation-delay:150ms]", "[animation-delay:300ms]"].map(
        (delay, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 motion-reduce:animate-none dark:bg-zinc-500 ${delay}`}
          />
        ),
      )}
    </span>
  );
}

const assistantBubble =
  "rounded-2xl rounded-bl-sm border px-4 py-3 text-sm";

export function ChatMessage({
  message,
  isLoading,
  onRetry,
}: {
  message: ChatMessageType;
  isLoading: boolean;
  onRetry: (assistantId: string, failedQuestion: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm whitespace-pre-wrap text-white wrap-break-word">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <GeneIcon size={32} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {message.status === "loading" ? (
          <div
            className={`${assistantBubble} inline-flex items-center gap-2 border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400`}
          >
            <TypingIndicator />
            <span>Gene is searching verified sources...</span>
          </div>
        ) : message.status === "error" ? (
          <div
            className={`${assistantBubble} border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300`}
          >
            <p>{message.errorMessage ?? GENERIC_ERROR}</p>
            <button
              type="button"
              onClick={() => onRetry(message.id, message.failedQuestion)}
              disabled={isLoading}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-500/10"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4v6h6M20 20v-6h-6M20 10a8 8 0 0 0-14.3-3.7M4 14a8 8 0 0 0 14.3 3.7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Retry
            </button>
          </div>
        ) : message.isRefusal ? (
          <div
            className={`${assistantBubble} border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300`}
          >
            <p className="flex items-start gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-zinc-400"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8h.01M11 12h1v4h1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{message.content}</span>
            </p>
          </div>
        ) : (
          <div
            className={`${assistantBubble} border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900`}
          >
            <MarkdownAnswer content={message.content} />
            {message.sources.length > 0 ? (
              <SourceCards sources={message.sources} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
