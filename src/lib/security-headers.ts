/**
 * Security headers configuration per .agents/rules/10-security.md.
 * Strictly restricts sources while permitting Google Maps JS API and Google Fonts.
 */
export interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://maps.gstatic.com https://*.googleapis.com https://*.google.com",
  "connect-src 'self' https://maps.googleapis.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

/** Returns the strict HTTP security headers for Next.js responses. */
export function getSecurityHeaders(): readonly SecurityHeader[] {
  return [
    { key: 'Content-Security-Policy', value: CSP_POLICY },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'geolocation=(self)' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ];
}
