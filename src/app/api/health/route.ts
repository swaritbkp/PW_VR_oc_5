import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/server/security/rateLimit';
import { getServerSettings } from '@/lib/config/settings';

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
  const settings = getServerSettings();
  const rateResult = checkRateLimit(ip, { limit: settings.rateLimitPerMin });
  if (!rateResult.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      {
        status: STATUS_TOO_MANY_REQUESTS,
        headers: { 'Retry-After': String(rateResult.retryAfterSeconds) },
      },
    );
  }

  const gemini = settings.isGeminiConfigured;
  const places = settings.isPlacesConfigured;
  const mapsBrowser = settings.isMapsBrowserConfigured;

  return NextResponse.json({
    ok: true,
    configured: {
      gemini,
      places,
      mapsBrowser,
    },
  });
}
