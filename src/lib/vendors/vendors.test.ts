import { describe, expect, it } from 'vitest';
import {
  buildEnquiry,
  humanDate,
  mapsDirectionsUrl,
  mapsSearchUrl,
  normalisePhoneIN,
  telLink,
  whatsAppLink,
} from './contact';
import { VENDOR_NEEDS, buildQueries } from './needs';
import {
  MAX_RADIUS_M,
  MAX_RESULTS,
  buildSearchBody,
  haversineKm,
  normaliseDetails,
  normalisePlacesResponse,
} from './places';
import { bayesianRating, rankVendors } from './rank';
import {
  applyVendorStatus,
  backedUpNeeds,
  bookedSpendInr,
  bookingEffect,
  canTransition,
} from './status';
import { SKELETONS } from '../templates/skeletons';
import type { Vendor, VendorSelection } from './types';

const CHD = { lat: 30.7333, lng: 76.7794 };
const place = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  displayName: { text: `Vendor ${id}` },
  formattedAddress: 'Sector 17, Chandigarh',
  location: { latitude: 30.74, longitude: 76.78 },
  ...extra,
});

describe('AC2 AC21 vendor search builds real queries and never invents vendors', () => {
  it('builds event-specific queries scoped to the city, capped and de-duplicated', () => {
    expect(buildQueries('venue', 'wedding', 'Chandigarh')).toEqual([
      'wedding venue in Chandigarh',
      'marriage palace in Chandigarh',
    ]);
    expect(buildQueries('cake', 'wedding', 'Mohali')).toEqual(['custom cake bakery in Mohali']);
    expect(buildQueries('venue', 'community', '', 1)).toEqual(['community hall']);
    expect(buildQueries('stay', 'birthday', 'Ludhiana', 0)).toHaveLength(1);
    Object.keys(VENDOR_NEEDS).forEach((need) =>
      expect(VENDOR_NEEDS[need as keyof typeof VENDOR_NEEDS].label).toBeTruthy(),
    );
  });

  it('builds a Places text-search body and clamps radius and result count', () => {
    const body = buildSearchBody({ textQuery: 'banquet hall in Chandigarh', center: CHD });
    expect(body).toMatchObject({ regionCode: 'IN', maxResultCount: 12, languageCode: 'en' });
    const clamped = buildSearchBody({
      textQuery: 'x',
      center: CHD,
      radiusMeters: 900_000,
      maxResults: 99,
      languageCode: 'hi',
    });
    expect((clamped.locationBias as { circle: { radius: number } }).circle.radius).toBe(
      MAX_RADIUS_M,
    );
    expect(clamped.maxResultCount).toBe(MAX_RESULTS);
    expect(
      buildSearchBody({ textQuery: 'x', center: CHD, radiusMeters: -5, maxResults: 0 })
        .maxResultCount,
    ).toBe(1);
  });

  it('normalises a response, skips malformed and duplicate places, adds distance', () => {
    const json = {
      places: [
        place('a', {
          rating: 4.6,
          userRatingCount: 120,
          priceLevel: 'PRICE_LEVEL_MODERATE',
          googleMapsUri: 'https://maps.google.com/?cid=1',
        }),
        place('a'),
        { id: 'b' },
        null,
        place('c', { priceLevel: 'UNKNOWN' }),
      ],
    };
    const vendors = normalisePlacesResponse(json, CHD);
    expect(vendors.map((v) => v.placeId)).toEqual(['a', 'c']);
    expect(vendors[0]).toMatchObject({
      rating: 4.6,
      ratingCount: 120,
      priceLevel: 2,
      mapsUrl: 'https://maps.google.com/?cid=1',
    });
    expect(vendors[0]?.distanceKm).toBeGreaterThan(0);
    expect(vendors[1]?.priceLevel).toBeUndefined();
    expect(normalisePlacesResponse({ places: [place('z')] })[0]?.distanceKm).toBeUndefined();
    expect(normalisePlacesResponse('nope')).toEqual([]);
    expect(normalisePlacesResponse({})).toEqual([]);
  });

  it('reads place details defensively', () => {
    expect(
      normaliseDetails({
        internationalPhoneNumber: '+91 98765 43210',
        websiteUri: 'https://x.in',
        googleMapsUri: 'https://m',
      }),
    ).toEqual({
      phone: '+91 98765 43210',
      website: 'https://x.in',
      mapsUrl: 'https://m',
    });
    expect(normaliseDetails({ nationalPhoneNumber: '098765 43210' }).phone).toBe('098765 43210');
    expect(normaliseDetails(null)).toEqual({});
  });

  it('computes great-circle distance', () => {
    expect(haversineKm(CHD, CHD)).toBe(0);
    expect(haversineKm(CHD, { lat: 28.6139, lng: 77.209 })).toBeGreaterThan(220);
    expect(haversineKm(CHD, { lat: 28.6139, lng: 77.209 })).toBeLessThan(260);
  });
});

describe('vendor ranking', () => {
  const v = (
    id: string,
    rating: number | undefined,
    count: number | undefined,
    km: number,
    price?: 0 | 1 | 2 | 3 | 4,
  ): Vendor => ({
    placeId: id,
    name: id,
    address: '',
    location: CHD,
    distanceKm: km,
    ...(rating !== undefined ? { rating } : {}),
    ...(count !== undefined ? { ratingCount: count } : {}),
    ...(price !== undefined ? { priceLevel: price } : {}),
  });

  it('shrinks thin ratings toward the prior', () => {
    expect(bayesianRating(5, 1)).toBeLessThan(bayesianRating(4.6, 300));
    expect(bayesianRating(undefined, undefined)).toBe(4);
  });

  it('ranks by trusted rating then nearness, and filters by price level', () => {
    const ranked = rankVendors(
      [
        v('thin', 5, 1, 1),
        v('solid', 4.6, 300, 4),
        v('far', 4.6, 300, 40),
        v('pricey', 4.9, 500, 1, 4),
      ],
      { maxPriceLevel: 3 },
    );
    expect(ranked.map((r) => r.vendor.placeId)).toEqual(['solid', 'thin', 'far']);
    expect(rankVendors([v('b', 4, 10, 1), v('a', 4, 10, 1)]).map((r) => r.vendor.placeId)).toEqual([
      'a',
      'b',
    ]);
    expect(rankVendors([v('x', 4, 10, 1, 4)], {})).toHaveLength(1);
  });
});

describe('AC22 contact helpers', () => {
  it('normalises Indian phone numbers', () => {
    expect(normalisePhoneIN('098765 43210')).toEqual({ e164: '+919876543210', kind: 'mobile' });
    expect(normalisePhoneIN('+91 98765 43210')).toEqual({ e164: '+919876543210', kind: 'mobile' });
    expect(normalisePhoneIN('919876543210')).toEqual({ e164: '+919876543210', kind: 'mobile' });
    expect(normalisePhoneIN('9876543210')?.kind).toBe('mobile');
    expect(normalisePhoneIN('0172 2345678')).toEqual({ e164: '+911722345678', kind: 'landline' });
    expect(normalisePhoneIN('+1 415 555 0100')).toBeNull();
    expect(normalisePhoneIN('12345')).toBeNull();
    expect(normalisePhoneIN('')).toBeNull();
  });

  it('builds tel, WhatsApp and Maps links without API keys', () => {
    const mobile = normalisePhoneIN('9876543210')!;
    const landline = normalisePhoneIN('0172 2345678')!;
    expect(telLink(mobile)).toBe('tel:+919876543210');
    expect(whatsAppLink(mobile, 'Hi there & you')).toBe(
      'https://wa.me/919876543210?text=Hi%20there%20%26%20you',
    );
    expect(whatsAppLink(landline, 'hi')).toBeNull();
    expect(mapsSearchUrl('banquet hall')).toBe(
      'https://www.google.com/maps/search/?api=1&query=banquet%20hall',
    );
    expect(mapsSearchUrl('x', 'ChIJ1')).toContain('&query_place_id=ChIJ1');
    expect(mapsDirectionsUrl('Hall A')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Hall%20A',
    );
    expect(mapsDirectionsUrl('Hall A', 'ChIJ1')).toContain('&destination_place_id=ChIJ1');
  });

  it('writes the first message in three languages with event facts only', () => {
    const base = {
      eventType: 'wedding',
      date: '2026-12-14',
      city: 'Chandigarh',
      guests: 300,
    } as const;
    expect(buildEnquiry({ ...base, language: 'en' })).toContain('14 Dec 2026');
    expect(buildEnquiry({ ...base, language: 'en' })).toContain('300 guests');
    expect(buildEnquiry({ ...base, language: 'hi' })).toContain('विवाह');
    expect(buildEnquiry({ ...base, language: 'pa' })).toContain('ਵਿਆਹ');
    expect(humanDate('not-a-date')).toBe('not-a-date');
  });
});

describe('AC23 vendor status drives the plan', () => {
  it('follows the pipeline rules', () => {
    expect(canTransition('shortlisted', 'contacted')).toBe(true);
    expect(canTransition('quoted', 'booked')).toBe(true);
    expect(canTransition('booked', 'contacted')).toBe(false);
    expect(canTransition('rejected', 'shortlisted')).toBe(true);
    expect(bookingEffect('booked')).toBe('complete');
    expect(bookingEffect('quoted')).toBe('start');
    expect(bookingEffect('backup')).toBe('none');
  });

  it('marks only the booking task for that need', () => {
    const tasks = SKELETONS.wedding;
    const booked = applyVendorStatus(tasks, 'venue', 'booked');
    expect(booked.find((t) => t.id === 'W04')).toMatchObject({ done: true, started: true });
    expect(booked.find((t) => t.id === 'W05')?.done).toBeUndefined();
    const contacted = applyVendorStatus(tasks, 'caterer', 'contacted');
    expect(contacted.find((t) => t.id === 'W05')).toMatchObject({ started: true });
    expect(contacted.find((t) => t.id === 'W05')?.done).toBeUndefined();
    expect(applyVendorStatus(tasks, 'venue', 'backup')).toBe(tasks);
  });

  it('AC24 tracks backups and booked spend', () => {
    const sel: VendorSelection[] = [
      { placeId: 'a', need: 'venue', status: 'booked', quoteInr: 200000 },
      { placeId: 'b', need: 'venue', status: 'backup' },
      { placeId: 'c', need: 'caterer', status: 'booked' },
    ];
    expect([...backedUpNeeds(sel)]).toEqual(['venue']);
    expect(bookedSpendInr(sel)).toBe(200000);
  });
});
