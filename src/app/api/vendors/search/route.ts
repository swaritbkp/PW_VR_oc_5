import { NextResponse } from 'next/server';
import { resolveCityCoordinates } from '@/lib/geo/cities';
import { mapsSearchUrl } from '@/lib/vendors/contact';
import { buildQueries } from '@/lib/vendors/needs';
import {
  PLACES_SEARCH_URL,
  SEARCH_FIELD_MASK,
  buildSearchBody,
  normalisePlacesResponse,
} from '@/lib/vendors/places';
import { rankVendors } from '@/lib/vendors/rank';
import { VendorSearchRequestSchema, type VendorSearchRequest } from '@/lib/vendors/schemas';
import type { LatLng } from '@/lib/vendors/types';
import { checkRateLimit } from '@/server/security/rateLimit';

const CACHE_TTL_MS = 600_000;
const MAX_CACHE_ENTRIES = 200;
const MAX_BODY_BYTES = 8192;
const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_TOO_MANY_REQUESTS = 429;
const STATUS_PAYLOAD_TOO_LARGE = 413;

interface CacheEntry {
  readonly timestamp: number;
  readonly data: unknown;
}

const cacheStore = new Map<string, CacheEntry>();

function getCached(key: string): unknown | undefined {
  const hit = cacheStore.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return undefined;
  }
  return hit.data;
}

function setCached(key: string, data: unknown): void {
  if (cacheStore.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey) cacheStore.delete(oldestKey);
  }
  cacheStore.set(key, { timestamp: Date.now(), data });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : '127.0.0.1';
}

function buildFallbackResponse(reason: 'NO_KEY' | 'UPSTREAM_ERROR', query: string) {
  return NextResponse.json(
    {
      ok: true,
      vendors: [],
      ranked: [],
      fallback: { reason, query, mapsSearchUrl: mapsSearchUrl(query) },
    },
    { status: STATUS_OK },
  );
}

interface FetchParams {
  readonly apiKey: string;
  readonly query: string;
  readonly center: LatLng;
  readonly radiusMeters?: number;
}

async function fetchFromPlaces(params: FetchParams): Promise<unknown | null> {
  const searchBody = buildSearchBody({
    textQuery: params.query,
    center: params.center,
    radiusMeters: params.radiusMeters,
  });
  try {
    const res = await fetch(PLACES_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': params.apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(searchBody),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function executeSearch(input: VendorSearchRequest, query: string, center: LatLng) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return buildFallbackResponse('NO_KEY', query);

  const rawPlaces = await fetchFromPlaces({
    apiKey,
    query,
    center,
    radiusMeters: input.radiusMeters,
  });
  if (!rawPlaces) return buildFallbackResponse('UPSTREAM_ERROR', query);

  const vendors = normalisePlacesResponse(rawPlaces, center);
  const ranked = rankVendors(vendors, { maxPriceLevel: input.maxPriceLevel });
  return NextResponse.json(
    {
      ok: true,
      vendors: ranked.map((r) => r.vendor),
      ranked,
      query,
      mapsSearchUrl: mapsSearchUrl(query),
    },
    { status: STATUS_OK },
  );
}

async function parseSearchBody(
  req: Request,
): Promise<
  | { ok: true; input: VendorSearchRequest }
  | { ok: false; status: number; message: string; details?: unknown }
> {
  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return { ok: false, status: STATUS_BAD_REQUEST, message: 'Invalid JSON' };
  }
  if (rawText.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: STATUS_PAYLOAD_TOO_LARGE,
      message: 'Request body exceeds 8 KB limit',
    };
  }
  let body: unknown;
  try {
    body = JSON.parse(rawText);
  } catch {
    return { ok: false, status: STATUS_BAD_REQUEST, message: 'Invalid JSON' };
  }
  const parsed = VendorSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: STATUS_BAD_REQUEST,
      message: 'Validation failed',
      details: parsed.error.issues,
    };
  }
  return { ok: true, input: parsed.data };
}

function buildCacheKey(input: VendorSearchRequest, center: LatLng): string {
  return `${input.need}:${input.eventType}:${input.city}:${center.lat},${center.lng}:${input.maxPriceLevel ?? ''}`;
}

async function cacheIfSuccess(key: string, res: NextResponse): Promise<void> {
  if (res.status !== STATUS_OK) return;
  try {
    const body = await res.clone().json();
    if (!body.fallback) setCached(key, body);
  } catch {
    // ignore caching clone failures
  }
}

/**
 * Handles POST requests to search and rank nearby celebration vendors via Google Places.
 *
 * @param req - Incoming HTTP request with search criteria
 * @returns Ranked vendor list or structured fallback
 */
export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip, { limit: 30 });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      {
        status: STATUS_TOO_MANY_REQUESTS,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      },
    );
  }

  const parsed = await parseSearchBody(req);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.message, details: parsed.details },
      { status: parsed.status },
    );
  }

  const input = parsed.input;
  const center = input.center ?? resolveCityCoordinates(input.city);
  const queries = buildQueries(input.need, input.eventType, input.city);
  const primaryQuery = queries[0] ?? `${input.need} in ${input.city}`;

  const cacheKey = buildCacheKey(input, center);
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached, { status: STATUS_OK });

  const response = await executeSearch(input, primaryQuery, center);
  await cacheIfSuccess(cacheKey, response);
  return response;
}
