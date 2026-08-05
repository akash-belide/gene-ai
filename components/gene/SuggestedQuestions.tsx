"use client";

export const SUGGESTED_QUESTIONS: string[] = [
  "What makes Akash a strong backend candidate?",
  "What AI projects has Akash built?",
  "What AWS experience does Akash have?",
  "What teaching experience does Akash have?",
  "What degrees does Akash have?",
  "What freelance work has Akash completed?",
];

/**
 * Empty-state suggested questions. Each is a keyboard-accessible button that
 * immediately submits its question. Disabled while a request is active.
 */
export function SuggestedQuestions({
  onSelect,
  disabled,
}: {
  onSelect: (question: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Try asking
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onSelect(question)}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
