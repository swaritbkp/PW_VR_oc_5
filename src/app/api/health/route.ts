import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/server/security/rateLimit';

const STATUS_TOO_MANY_REQUESTS = 429;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : '127.0.0.1';
}

/**
 * Handles health check requests with rate limiting and service key presence inspection.
 *
 * @param req - Incoming HTTP request
 * @returns JSON response indicating configuration status
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

  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const places = Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
  const mapsBrowser = Boolean(process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY?.trim());

  return NextResponse.json({
    ok: true,
    configured: {
      gemini,
      places,
      mapsBrowser,
    },
  });
}
