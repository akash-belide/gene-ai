import type { ChatResponse, ChatSource } from "@/lib/gene-ui-types";

export const GENERIC_ERROR_MESSAGE =
  "Gene couldn't answer that right now. Please try again.";
export const RATE_LIMIT_MESSAGE =
  "Gene has received too many questions. Please try again in a few minutes.";
export const UNAVAILABLE_MESSAGE =
  "Gene is temporarily unavailable. Please try again later.";

export type GeneChatErrorKind = "generic" | "rate_limit" | "unavailable";

/**
 * Client-safe error thrown for any chat request failure. `userMessage` is always
 * generic and safe to surface; technical details are never included. The `kind`
 * distinguishes 429 (rate limit) and 503 (unavailable) so the UI can show the
 * appropriate wording without ever reading the server body.
 */
export class GeneChatError extends Error {
  readonly kind: GeneChatErrorKind;
  readonly userMessage: string;

  constructor(kind: GeneChatErrorKind = "generic") {
    const userMessage =
      kind === "rate_limit"
        ? RATE_LIMIT_MESSAGE
        : kind === "unavailable"
          ? UNAVAILABLE_MESSAGE
          : GENERIC_ERROR_MESSAGE;
    super(userMessage);
    this.name = "GeneChatError";
    this.kind = kind;
    this.userMessage = userMessage;
  }
}

function isChatSource(value: unknown): value is ChatSource {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const source = value as Record<string, unknown>;
  return (
    typeof source.id === "string" &&
    typeof source.sourceTitle === "string" &&
    typeof source.sourceType === "string" &&
    (source.section === null || typeof source.section === "string") &&
    typeof source.similarity === "number"
  );
}

function isChatResponse(value: unknown): value is ChatResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (typeof body.answer !== "string") {
    return false;
  }
  if (!Array.isArray(body.sources) || !body.sources.every(isChatSource)) {
    return false;
  }
  return true;
}

/**
 * Sends a question to POST /api/gene/chat and returns the validated response.
 *
 * Handles non-2xx statuses (including the development-only 404 guard), non-JSON
 * bodies, and malformed shapes by throwing a {@link GeneChatError} with a
 * client-safe message. The browser never talks to OpenAI directly.
 *
 * FUTURE WORK (not in this task): persistent conversation memory, streaming
 * responses, production authentication, and rate limiting.
 */
export async function sendGeneChat(
  message: string,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  let response: Response;
  try {
    response = await fetch("/api/gene/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal,
    });
  } catch {
    // Network failure / aborted request.
    throw new GeneChatError();
  }

  if (!response.ok) {
    // We intentionally do not read or surface the server body to avoid leaking
    // internal details. 429 and 503 map to specific user-safe messages; all
    // other statuses (400/404/500/502) fall back to the generic message.
    if (response.status === 429) {
      throw new GeneChatError("rate_limit");
    }
    if (response.status === 503) {
      throw new GeneChatError("unavailable");
    }
    throw new GeneChatError();
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new GeneChatError();
  }

  if (!isChatResponse(data)) {
    throw new GeneChatError();
  }

  return data;
}
