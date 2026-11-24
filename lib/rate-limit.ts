interface RateLimitEntry {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitEntry>();
let lastPrune = 0;

function pruneExpired(now: number, maxWindowMs: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, entry] of buckets.entries()) {
    const kept = entry.timestamps.filter((t) => now - t < maxWindowMs);
    if (kept.length === 0) {
      buckets.delete(key);
    } else {
      entry.timestamps = kept;
    }
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "local";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  pruneExpired(now, Math.max(windowMs, 15 * 60_000));

  const entry = buckets.get(key) || { timestamps: [] };
  const recent = entry.timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, { timestamps: recent });
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  recent.push(now);
  buckets.set(key, { timestamps: recent });
  return {
    allowed: true,
    remaining: Math.max(0, limit - recent.length),
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}
