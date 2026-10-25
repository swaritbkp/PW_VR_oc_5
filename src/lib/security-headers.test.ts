import { describe, expect, it } from 'vitest';
import { getSecurityHeaders } from './security-headers';

describe('security headers', () => {
  it('defines strict security headers including CSP, X-Content-Type-Options, Referrer-Policy, HSTS, COOP, and CORP', () => {
    const headers = getSecurityHeaders();
    expect(headers.length).toBeGreaterThanOrEqual(7);

    const csp = headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp?.value).toContain("default-src 'self'");
    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(csp?.value).toContain('https://maps.googleapis.com');
    expect(csp?.value).not.toContain("'unsafe-eval'");

    const nosniff = headers.find((h) => h.key === 'X-Content-Type-Options');
    expect(nosniff?.value).toBe('nosniff');

    const perm = headers.find((h) => h.key === 'Permissions-Policy');
    expect(perm?.value).toBe('geolocation=(self)');

    const hsts = headers.find((h) => h.key === 'Strict-Transport-Security');
    expect(hsts?.value).toBe('max-age=63072000; includeSubDomains; preload');

    const coop = headers.find((h) => h.key === 'Cross-Origin-Opener-Policy');
    expect(coop?.value).toBe('same-origin');

    const corp = headers.find((h) => h.key === 'Cross-Origin-Resource-Policy');
    expect(corp?.value).toBe('same-origin');
  });
});
