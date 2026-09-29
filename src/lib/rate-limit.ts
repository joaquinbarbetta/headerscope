/**
 * Tiny in-memory sliding-window rate limiter.
 * Good enough for a single instance / demo. For serverless or multi-instance
 * deployments, swap it for a shared store such as Upstash Redis.
 */
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 10, now = Date.now()): { ok: boolean; retryAfter: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow forever.
  if (hits.size > 5_000) {
    for (const [k, ts] of hits) if (ts.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}
