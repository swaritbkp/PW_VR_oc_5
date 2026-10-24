import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('Vendor Details Route (AC21, AC22)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('AC21 rejects request when GOOGLE_PLACES_API_KEY is missing', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;

    const req = new Request('http://localhost:3000/api/vendors/details?placeId=place_123');
    const res = await GET(req);
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it('AC22 fetches contact details lazily with places field mask', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'mock-key';

    const mockDetails = {
      id: 'place_123',
      displayName: { text: 'Grand Imperial Palace' },
      nationalPhoneNumber: '09876543210',
      internationalPhoneNumber: '+91 98765 43210',
      websiteUri: 'https://grandimperial.example.com',
      googleMapsUri: 'https://maps.google.com/?cid=123',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetails,
    } as Response);

    const req = new Request('http://localhost:3000/api/vendors/details?placeId=place_123');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.placeId).toBe('place_123');
    expect(data.details.phone).toBe('+91 98765 43210');
    expect(data.details.website).toBe('https://grandimperial.example.com');

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/places/place_123');
  });
});
