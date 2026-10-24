import type { LatLng, Vendor } from './types';

/** Places API (New) Text Search endpoint. Always call from the server; never ship the key to the browser. */
export const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
/** Place Details endpoint base; append the place id. */
export const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

/** Lean search mask. Contact fields are fetched lazily with the details mask to keep billing low. */
export const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.googleMapsUri',
].join(',');

/** Details mask used only when a person opens or shortlists a vendor. */
export const DETAILS_FIELD_MASK =
  'id,displayName,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri';

export const MAX_RADIUS_M = 50_000;
export const DEFAULT_RADIUS_M = 15_000;
export const MAX_RESULTS = 20;
export const DEFAULT_RESULTS = 12;
const EARTH_RADIUS_KM = 6371;
const DEGREES_TO_RADIANS = Math.PI / 180;

const PRICE_LEVELS: Readonly<Record<string, 0 | 1 | 2 | 3 | 4>> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export interface SearchInput {
  readonly textQuery: string;
  readonly center: LatLng;
  readonly radiusMeters?: number;
  readonly maxResults?: number;
  readonly languageCode?: string;
}

/** Request body for Text Search (New), biased to a circle around the event. Clamps radius and result count. */
export function buildSearchBody(input: SearchInput): Record<string, unknown> {
  const radius = Math.min(MAX_RADIUS_M, Math.max(1, input.radiusMeters ?? DEFAULT_RADIUS_M));
  const count = Math.min(MAX_RESULTS, Math.max(1, input.maxResults ?? DEFAULT_RESULTS));
  return {
    textQuery: input.textQuery,
    locationBias: {
      circle: { center: { latitude: input.center.lat, longitude: input.center.lng }, radius },
    },
    maxResultCount: count,
    languageCode: input.languageCode ?? 'en',
    regionCode: 'IN',
  };
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * DEGREES_TO_RADIANS;
  const dLng = (b.lng - a.lng) * DEGREES_TO_RADIANS;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEGREES_TO_RADIANS) *
      Math.cos(b.lat * DEGREES_TO_RADIANS) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null;
const asString = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined;
const asNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

function readLocation(raw: unknown): LatLng | undefined {
  if (!isObject(raw)) return undefined;
  const lat = asNumber(raw.latitude);
  const lng = asNumber(raw.longitude);
  return lat === undefined || lng === undefined ? undefined : { lat, lng };
}

interface Meta {
  readonly rating?: number;
  readonly ratingCount?: number;
  readonly priceLevel?: Vendor['priceLevel'];
  readonly mapsUrl?: string;
  readonly distanceKm?: number;
}

function readMeta(raw: Json, location: LatLng, center?: LatLng): Meta {
  const rating = asNumber(raw.rating);
  const ratingCount = asNumber(raw.userRatingCount);
  const priceLevel = typeof raw.priceLevel === 'string' ? PRICE_LEVELS[raw.priceLevel] : undefined;
  const mapsUrl = asString(raw.googleMapsUri);
  const distanceKm = center ? Math.round(haversineKm(center, location) * 10) / 10 : undefined;
  return { rating, ratingCount, priceLevel, mapsUrl, distanceKm };
}

function assignMeta(target: Vendor, meta: Meta): void {
  if (meta.rating !== undefined) Object.assign(target, { rating: meta.rating });
  if (meta.ratingCount !== undefined) Object.assign(target, { ratingCount: meta.ratingCount });
  if (meta.priceLevel !== undefined) Object.assign(target, { priceLevel: meta.priceLevel });
  if (meta.mapsUrl) Object.assign(target, { mapsUrl: meta.mapsUrl });
  if (meta.distanceKm !== undefined) Object.assign(target, { distanceKm: meta.distanceKm });
}

function readVendor(raw: unknown, center?: LatLng): Vendor | undefined {
  if (!isObject(raw)) return undefined;
  const placeId = asString(raw.id);
  const name = isObject(raw.displayName) ? asString(raw.displayName.text) : undefined;
  const location = readLocation(raw.location);
  if (!placeId || !name || !location) return undefined;
  const vendor: Vendor = {
    placeId,
    name,
    address: asString(raw.formattedAddress) ?? '',
    location,
  };
  assignMeta(vendor, readMeta(raw, location, center));
  return vendor;
}

/** Converts a Text Search response into vendors. Skips malformed entries and duplicate place ids. */
export function normalisePlacesResponse(json: unknown, center?: LatLng): Vendor[] {
  if (!isObject(json) || !Array.isArray(json.places)) return [];
  const seen = new Set<string>();
  const vendors: Vendor[] = [];
  for (const raw of json.places) {
    const vendor = readVendor(raw, center);
    if (vendor && !seen.has(vendor.placeId)) {
      seen.add(vendor.placeId);
      vendors.push(vendor);
    }
  }
  return vendors;
}

/** Reads contact details from a Place Details response. */
export function normaliseDetails(json: unknown): {
  phone?: string;
  website?: string;
  mapsUrl?: string;
} {
  if (!isObject(json)) return {};
  const phone = asString(json.internationalPhoneNumber) ?? asString(json.nationalPhoneNumber);
  const website = asString(json.websiteUri);
  const mapsUrl = asString(json.googleMapsUri);
  return {
    ...(phone ? { phone } : {}),
    ...(website ? { website } : {}),
    ...(mapsUrl ? { mapsUrl } : {}),
  };
}
