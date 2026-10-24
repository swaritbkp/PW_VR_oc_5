import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('Vendor Search Route (AC20, AC21, AC27)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('AC27 degrades gracefully when GOOGLE_PLACES_API_KEY is missing', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;

    const req = new Request('http://localhost:3000/api/vendors/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        need: 'caterer',
        eventType: 'wedding',
        city: 'Chandigarh',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.vendors).toEqual([]);
    expect(data.fallback).toBeDefined();
    expect(data.fallback.reason).toBe('NO_KEY');
    expect(data.fallback.mapsSearchUrl).toContain('google.com/maps/search');
    expect(data.fallback.query).toBeDefined();
  });

  it('AC21 proxies search through Places API and ranks results server-side', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'mock-places-key';

    const mockPlacesResponse = {
      places: [
        {
          id: 'place_caterer_1',
          displayName: { text: 'Royal Amritsari Caterers' },
          formattedAddress: 'Sector 35, Chandigarh',
          location: { latitude: 30.725, longitude: 76.768 },
          rating: 4.8,
          userRatingCount: 120,
          priceLevel: 'PRICE_LEVEL_MODERATE',
          googleMapsUri: 'https://maps.google.com/?cid=123',
        },
        {
          id: 'place_caterer_2',
          displayName: { text: 'Deluxe Halwai Caterers' },
          formattedAddress: 'Sector 22, Chandigarh',
          location: { latitude: 30.738, longitude: 76.772 },
          rating: 4.5,
          userRatingCount: 40,
          priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
          googleMapsUri: 'https://maps.google.com/?cid=456',
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlacesResponse,
    } as Response);

    const req = new Request('http://localhost:3000/api/vendors/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        need: 'caterer',
        eventType: 'wedding',
        city: 'Chandigarh',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.vendors.length).toBe(2);
    expect(data.vendors[0].name).toBe('Royal Amritsari Caterers');
    expect(data.vendors[0].placeId).toBe('place_caterer_1');
    expect(data.ranked[0].score).toBeGreaterThan(0);

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('places:searchText');
    const headers = calledInit?.headers as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toBe('mock-places-key');
  });

  it('AC20 uses event city coordinates when center is not provided', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'mock-places-key';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [] }),
    } as Response);

    const req = new Request('http://localhost:3000/api/vendors/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        need: 'venue',
        eventType: 'birthday',
        city: 'Ludhiana',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(fetchSpy).toHaveBeenCalled();
    const [, calledInit] = fetchSpy.mock.calls[0];
    const body = JSON.parse(calledInit?.body as string);
    expect(body.locationBias.circle.center.latitude).toBeCloseTo(30.901, 3);
  });

  it('AC27 handles upstream error with fallback', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'mock-places-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const req = new Request('http://localhost:3000/api/vendors/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        need: 'photographer',
        eventType: 'wedding',
        city: 'Amritsar',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.fallback.reason).toBe('UPSTREAM_ERROR');
    expect(data.fallback.mapsSearchUrl).toContain('google.com/maps/search');
  });
});
