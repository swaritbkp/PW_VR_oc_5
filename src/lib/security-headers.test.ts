import { describe, expect, it } from 'vitest';
import { getSecurityHeaders } from './security-headers';

describe('security headers', () => {
  it('defines strict security headers including CSP, X-Content-Type-Options, and Referrer-Policy', () => {
    const headers = getSecurityHeaders();
    expect(headers.length).toBeGreaterThanOrEqual(4);

    const csp = headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp?.value).toContain("default-src 'self'");
    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(csp?.value).toContain('https://maps.googleapis.com');

    const nosniff = headers.find((h) => h.key === 'X-Content-Type-Options');
    expect(nosniff?.value).toBe('nosniff');

    const perm = headers.find((h) => h.key === 'Permissions-Policy');
    expect(perm?.value).toBe('geolocation=(self)');
  });
});
