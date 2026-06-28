import { headers } from "next/headers";

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 1000;

interface UsageBucket {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  clientKey: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const buckets = new Map<string, UsageBucket>();

function getClientIp(headerStore: Headers): string {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-client-ip") ||
    "unknown"
  );
}

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < MAX_TRACKED_CLIENTS) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export async function checkGenerationRateLimit(): Promise<RateLimitResult> {
  const headerStore = await headers();
  const clientIp = getClientIp(headerStore);
  const clientKey = `ip:${clientIp}`;
  const limit = Number(process.env.GENERATION_RATE_LIMIT_PER_HOUR || DEFAULT_LIMIT);
  const windowMs = Number(process.env.GENERATION_RATE_LIMIT_WINDOW_MS || DEFAULT_WINDOW_MS);
  const now = Date.now();

  pruneExpiredBuckets(now);

  const existing = buckets.get(clientKey);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  if (bucket.count >= limit) {
    return {
      allowed: false,
      clientKey,
      limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  buckets.set(clientKey, bucket);

  return {
    allowed: true,
    clientKey,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  };
}

export function formatRetryAfter(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 1) return "約 1 分鐘";
  if (minutes < 60) return `約 ${minutes} 分鐘`;
  return "約 1 小時";
}
