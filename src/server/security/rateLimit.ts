const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 1000;
const MS_PER_SECOND = 1000;

export interface RateLimitOptions {
  readonly limit?: number;
  readonly windowMs?: number;
  readonly maxEntries?: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, ClientRecord>();

function evictOldestIfNeeded(maxEntries: number): void {
  if (store.size < maxEntries) return;
  const firstKey = store.keys().next().value;
  if (firstKey !== undefined) {
    store.delete(firstKey);
  }
}

function updateRecord(rec: ClientRecord, now: number, windowMs: number): ClientRecord {
  if (now > rec.resetTime) {
    return { count: 1, resetTime: now + windowMs };
  }
  return { count: rec.count + 1, resetTime: rec.resetTime };
}

/** Checks and updates rate limit for a client IP using an in-memory LRU store. */
export function checkRateLimit(ip: string, options: RateLimitOptions = {}): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const now = Date.now();

  const existing = store.get(ip);
  const updated = existing
    ? updateRecord(existing, now, windowMs)
    : { count: 1, resetTime: now + windowMs };

  store.delete(ip);
  evictOldestIfNeeded(maxEntries);
  store.set(ip, updated);

  const allowed = updated.count <= limit;
  const remaining = Math.max(0, limit - updated.count);
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((updated.resetTime - now) / MS_PER_SECOND));

  return { allowed, remaining, retryAfterSeconds };
}

/** Clears all rate limits in memory (useful for test isolation). */
export function clearRateLimits(): void {
  store.clear();
}
