import { NextResponse } from 'next/server';
import { DETAILS_FIELD_MASK, PLACES_DETAILS_URL, normaliseDetails } from '@/lib/vendors/places';
import { VendorDetailsRequestSchema } from '@/lib/vendors/schemas';
import { checkRateLimit } from '@/server/security/rateLimit';
import { getServerSettings } from '@/lib/config/settings';

const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_TOO_MANY_REQUESTS = 429;
const STATUS_BAD_GATEWAY = 502;
const STATUS_SERVICE_UNAVAILABLE = 503;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : '127.0.0.1';
}

function parsePlaceId(req: Request): string | null {
  const url = new URL(req.url);
  const param = url.searchParams.get('placeId') ?? '';
  const parsed = VendorDetailsRequestSchema.safeParse({ placeId: param });
  return parsed.success ? parsed.data.placeId : null;
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<unknown | null> {
  try {
    const url = `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function checkRateLimitGuard(ip: string, limit: number): Response | null {
  const rate = checkRateLimit(ip, { limit });
  if (rate.allowed) return null;
  return NextResponse.json(
    { ok: false, error: 'Rate limit exceeded' },
    {
      status: STATUS_TOO_MANY_REQUESTS,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    },
  );
}

/**
 * Handles GET /api/vendors/details?placeId=... for lazy retrieval of vendor contact fields.
 *
 * @param req - Incoming HTTP request
 * @returns JSON response with normalized contact details
 */
export async function GET(req: Request): Promise<Response> {
  const settings = getServerSettings();
  const rateBlocked = checkRateLimitGuard(getClientIp(req), settings.rateLimitPerMin);
  if (rateBlocked) return rateBlocked;

  const placeId = parsePlaceId(req);
  if (!placeId) {
    return NextResponse.json({ ok: false, error: 'Valid placeId is required' }, { status: STATUS_BAD_REQUEST });
  }

  const apiKey = settings.googlePlacesApiKey;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: STATUS_SERVICE_UNAVAILABLE });
  }

  const raw = await fetchPlaceDetails(placeId, apiKey);
  if (!raw) {
    return NextResponse.json({ ok: false, error: 'Places details upstream failed' }, { status: STATUS_BAD_GATEWAY });
  }

  const details = normaliseDetails(raw);
  return NextResponse.json({ ok: true, placeId, details }, { status: STATUS_OK });
}
