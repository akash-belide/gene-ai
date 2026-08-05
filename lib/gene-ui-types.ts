/**
 * Shared UI types and small helpers for the Gene chat interface.
 *
 * These are client-safe (no secrets, no `server-only`) and describe the public
 * API contract plus the in-memory message model used by the React UI.
 */

/** A source record returned by POST /api/gene/chat (client-facing shape). */
export type ChatSource = {
  id: string;
  sourceTitle: string;
  sourceType: string;
  section: string | null;
  similarity: number;
};

/** Request body sent from the browser. Only `message` is sent publicly. */
export type ChatRequest = {
  message: string;
};

/** Successful response body from POST /api/gene/chat. */
export type ChatResponse = {
  answer: string;
  sources: ChatSource[];
  // Development-only retrieval metadata. The UI must never display this.
  retrieval?: {
    inferredSourceTypes: string[];
    appliedSourceTypes: string[];
    minimumSimilarity: number;
  };
};

export type UserMessage = {
  id: string;
  role: "user";
  content: string;
  status: "complete";
};

export type AssistantCompleteMessage = {
  id: string;
  role: "assistant";
  content: string;
  status: "complete";
  sources: ChatSource[];
  isRefusal?: boolean;
  /** Marks the locally-created welcome message (never has sources/refusal UI). */
  isWelcome?: boolean;
};

export type AssistantLoadingMessage = {
  id: string;
  role: "assistant";
  content: string;
  status: "loading";
  sources: [];
};

export type AssistantErrorMessage = {
  id: string;
  role: "assistant";
  content: string;
  status: "error";
  sources: [];
  failedQuestion: string;
  /** User-safe error text to display (e.g. rate-limit vs. generic). */
  errorMessage?: string;
};

export type ChatMessage =
  | UserMessage
  | AssistantCompleteMessage
  | AssistantLoadingMessage
  | AssistantErrorMessage;

/** Human-readable labels for each supported source type. */
export const SOURCE_TYPE_LABELS: Record<string, string> = {
  profile: "Profile",
  education: "Education",
  skills: "Skills",
  experience: "Professional Experience",
  "academic-experience": "Academic Experience",
  leadership: "Leadership",
  project: "Project",
  "freelance-project": "Freelance Project",
  "independent-experience": "Independent Experience",
};

/** Maps a raw source type to a human-readable label, with a safe fallback. */
export function sourceTypeLabel(sourceType: string): string {
  return SOURCE_TYPE_LABELS[sourceType] ?? sourceType;
}

/**
 * De-duplicates source cards by `sourceTitle + section`, preserving API order.
 */
export function dedupeSources(sources: ChatSource[]): ChatSource[] {
  const seen = new Set<string>();
  const result: ChatSource[] = [];
  for (const source of sources) {
    const key = `${source.sourceTitle}||${source.section ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(source);
  }
  return result;
}

/** Generates a client-side message id (never a database id). */
export function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
