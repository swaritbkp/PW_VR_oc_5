import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveCityCoordinates } from '@/lib/geo/cities';
import { checkRateLimit } from '@/server/security/rateLimit';

const CityQuerySchema = z.string().min(1).max(60);

const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_TOO_MANY_REQUESTS = 429;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : '127.0.0.1';
}

/**
 * Handles GET /api/geo to resolve geographic coordinates for celebration cities.
 *
 * @param req - Incoming HTTP request
 * @returns JSON response with city and coordinates
 */
export async function GET(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  const rateResult = checkRateLimit(ip, { limit: 60 });
  if (!rateResult.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      {
        status: STATUS_TOO_MANY_REQUESTS,
        headers: { 'Retry-After': String(rateResult.retryAfterSeconds) },
      },
    );
  }

  const url = new URL(req.url);
  const cityParam = url.searchParams.get('city') ?? '';
  const parsed = CityQuerySchema.safeParse(cityParam);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'City name must be between 1 and 60 characters' },
      { status: STATUS_BAD_REQUEST },
    );
  }

  const coordinates = resolveCityCoordinates(parsed.data);
  return NextResponse.json(
    { ok: true, city: parsed.data, coordinates },
    { status: STATUS_OK },
  );
}
