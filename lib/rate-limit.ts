type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

const defaultLimits: Record<string, number> = {
  generate: 12,
  recognize: 30,
  assistant: 60
};

const globalStore = globalThis as typeof globalThis & {
  __maopuRateLimits?: Map<string, RateLimitBucket>;
};

const buckets = globalStore.__maopuRateLimits ?? new Map<string, RateLimitBucket>();
globalStore.__maopuRateLimits = buckets;

export function checkRateLimit(request: Request, scope: keyof typeof defaultLimits): RateLimitResult {
  const limit = readPositiveInt(`AI_RATE_LIMIT_${scope.toUpperCase()}`, defaultLimits[scope]);
  const windowMs = readPositiveInt("AI_RATE_LIMIT_WINDOW_MS", DEFAULT_WINDOW_MS);
  const now = Date.now();
  const key = `${scope}:${clientFingerprint(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    pruneExpired(now);
    return { ok: true, limit, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { ok: true, limit, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
  };
}

function clientFingerprint(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 80) ?? "unknown-agent";
  return `${forwardedFor || realIp || cfIp || "local"}:${userAgent}`;
}

function readPositiveInt(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function pruneExpired(now: number) {
  if (buckets.size < 500) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
