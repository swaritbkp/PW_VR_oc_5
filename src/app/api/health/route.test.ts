import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('/api/health route', () => {
  it('returns status 200 with service configuration presence flags', async () => {
    const req = new Request('http://localhost:3000/api/health');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.configured).toBeDefined();
    expect(typeof data.configured.gemini).toBe('boolean');
    expect(typeof data.configured.places).toBe('boolean');
    expect(typeof data.configured.mapsBrowser).toBe('boolean');
  });

  it('rate limits excessive requests with 429 Too Many Requests', async () => {
    const ip = '10.99.88.77';
    let lastRes: Response | null = null;
    for (let i = 0; i < 65; i++) {
      const req = new Request('http://localhost:3000/api/health', {
        headers: { 'x-forwarded-for': ip },
      });
      lastRes = await GET(req);
    }

    expect(lastRes).not.toBeNull();
    expect(lastRes?.status).toBe(429);
    expect(lastRes?.headers.get('Retry-After')).toBeDefined();
  });
});
