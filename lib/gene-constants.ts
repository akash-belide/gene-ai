/**
 * Client-safe Gene constants shared by the server route and the browser UI.
 *
 * This module intentionally has no `server-only` import and no secrets, so it
 * can be imported from both the API route and client components to keep the
 * refusal text consistent in one place.
 */

/**
 * The canonical answer Gene returns when there is no verified context to ground
 * a response. Server and client must use this exact string.
 */
export const NO_CONTEXT_ANSWER =
  "I don't have enough verified information to answer that.";

/**
 * Returns true when `text` is the canonical refusal answer, tolerant of
 * surrounding whitespace and letter case.
 */
export function isRefusalAnswer(text: string): boolean {
  return text.trim().toLowerCase() === NO_CONTEXT_ANSWER.toLowerCase();
}
