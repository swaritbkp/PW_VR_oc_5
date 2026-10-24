import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { clearRateLimits } from '../../../server/security/rateLimit';

describe('/api/plan route (AC5, AC6)', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    clearRateLimits();
    process.env.GEMINI_API_KEY = 'test_key';
  });

  afterEach(() => {
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  it('rejects oversized payloads > 8KB with 413 (AC5)', async () => {
    const hugeBody = JSON.stringify({
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2027-11-15',
      guests: 300,
      budgetInr: 2500000,
      style: 'A'.repeat(9000),
    });

    const req = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: hugeBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('rejects invalid intake parameters with 400 (AC5)', async () => {
    const invalidBody = JSON.stringify({
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2020-01-01', // Date in the past
      guests: -10, // Invalid guests
      budgetInr: 100, // Below minimum budget
    });

    const req = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: invalidBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it('returns 503 when GEMINI_API_KEY is missing (AC6)', async () => {
    delete process.env.GEMINI_API_KEY;

    const validBody = JSON.stringify({
      eventType: 'wedding',
      templateId: 'wedding-phulkari-courtyard',
      city: 'Chandigarh',
      date: '2027-11-15',
      guests: 300,
      budgetInr: 2500000,
      style: 'Traditional Punjabi',
    });

    const req = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe('MISSING_API_KEY');
  });

  it('returns 429 Too Many Requests when rate limit is exceeded (AC5, AC6)', async () => {
    const validBody = JSON.stringify({
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2027-11-15',
      guests: 300,
      budgetInr: 2500000,
    });

    for (let i = 0; i < 10; i++) {
      const req = new Request('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
        body: validBody,
      });
      await POST(req);
    }

    const blockedReq = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: validBody,
    });
    const res = await POST(blockedReq);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});
