import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('Geo API Route (AC20)', () => {
  it('AC20 resolves coordinates for known city', async () => {
    const req = new Request('http://localhost:3000/api/geo?city=Chandigarh');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as { ok: boolean; city: string; coordinates: { lat: number; lng: number } };
    expect(data.ok).toBe(true);
    expect(data.city).toBe('Chandigarh');
    expect(data.coordinates.lat).toBeCloseTo(30.7333, 3);
    expect(data.coordinates.lng).toBeCloseTo(76.7794, 3);
  });

  it('AC20 rejects empty city query', async () => {
    const req = new Request('http://localhost:3000/api/geo?city=');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('AC20 falls back to default coordinates for unknown city', async () => {
    const req = new Request('http://localhost:3000/api/geo?city=HimalayanVillage');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as { ok: boolean; city: string; coordinates: { lat: number; lng: number } };
    expect(data.ok).toBe(true);
    expect(data.coordinates.lat).toBeCloseTo(30.7333, 3);
  });
});
