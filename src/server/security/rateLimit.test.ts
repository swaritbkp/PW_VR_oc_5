import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, clearRateLimits } from './rateLimit';

describe('rateLimit (AC5, AC6)', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it('allows requests within the limit', () => {
    const ip = '192.168.1.1';
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(ip, { limit: 5, windowMs: 60_000 });
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(5 - (i + 1));
    }
  });

  it('blocks requests exceeding the limit and returns retryAfterSeconds', () => {
    const ip = '192.168.1.2';
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ip, { limit: 3, windowMs: 60_000 });
    }
    const blocked = checkRateLimit(ip, { limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('evicts oldest entries when capacity exceeds maxEntries', () => {
    const options = { limit: 2, windowMs: 60_000, maxEntries: 2 };
    checkRateLimit('ip-1', options);
    checkRateLimit('ip-2', options);
    checkRateLimit('ip-3', options); // Should evict ip-1

    // ip-1 was evicted, so a new call for ip-1 starts fresh
    const fresh = checkRateLimit('ip-1', options);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(1);
  });
});
