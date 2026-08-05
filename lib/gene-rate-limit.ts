import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Server-only rate limiting for the Gene chat endpoint, backed by Upstash Redis.
 *
 * Policy: 10 requests per IP within a sliding 10-minute window, under a
 * dedicated key prefix so Gene traffic is isolated from any other limiter. Only
 * the requester IP is used as the key — full questions are never stored in
 * Redis.
 */
const MAX_REQUESTS = 10;
const WINDOW = "10 m";
const PREFIX = "gene:chat";

let cachedLimiter: Ratelimit | null | undefined;

/**
 * Lazily builds the limiter. Returns null when Upstash is not configured so the
 * caller can decide how to behave (allow in development, fail closed in
 * production).
 */
function getLimiter(): Ratelimit | null {
  if (cachedLimiter !== undefined) {
    return cachedLimiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cachedLimiter = null;
    return cachedLimiter;
  }

  const redis = new Redis({ url, token });
  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW),
    prefix: PREFIX,
    analytics: false,
  });

  return cachedLimiter;
}

/**
 * Extracts a best-effort client IP from headers commonly set behind Vercel.
 * Only the first value of `x-forwarded-for` is used (trimmed). Client-provided
 * JSON is never trusted for the IP. Falls back to a shared bucket when no
 * header is present.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export type RateLimitOutcome =
  /** Request is within limits and may proceed. */
  | { status: "ok" }
  /** Development only: no limiter configured, request is allowed. */
  | { status: "skipped" }
  /** Limiter is required but not configured; caller must fail closed (503). */
  | { status: "unconfigured" }
  /** Request exceeded the limit; caller must respond 429. */
  | { status: "limited"; retryAfterSeconds: number };

/**
 * Applies the Gene chat rate limit.
 *
 * In production the limiter must be configured; a missing limiter returns
 * `unconfigured` so the route fails closed rather than running an unlimited
 * public endpoint. In development a missing limiter returns `skipped` so the
 * endpoint works without Upstash.
 */
export async function enforceGeneChatRateLimit(
  request: Request,
  { isProduction }: { isProduction: boolean },
): Promise<RateLimitOutcome> {
  const limiter = getLimiter();

  if (!limiter) {
    return isProduction ? { status: "unconfigured" } : { status: "skipped" };
  }

  const ip = getClientIp(request);
  const result = await limiter.limit(ip);

  if (!result.success) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );
    return { status: "limited", retryAfterSeconds };
  }

  return { status: "ok" };
}
