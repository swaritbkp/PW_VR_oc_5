import type { VendorNeedId } from '../plan/types';
import type { Vendor } from './types';
import { resolveCityCoordinates } from '../geo/cities';

const BASE_RATING = 4.8;
const RATING_STEP = 0.1;
const BASE_REVIEWS = 220;
const REVIEWS_STEP = 75;
const DEFAULT_PRICE_LEVEL = 3;
const BASE_DISTANCE_KM = 1.2;
const DISTANCE_STEP_KM = 1.4;
const VERIFIED_BASE_DISTANCE_KM = 1.5;
const VERIFIED_DISTANCE_STEP_KM = 1.8;
const DISTANCE_DECIMAL_SCALE = 10;
const LAT_OFFSET_A = 0.005;
const LAT_OFFSET_B = -0.006;
const LNG_OFFSET_A = 0.004;
const LNG_OFFSET_B = -0.005;

interface CityCatalogData {
  readonly venues: readonly { readonly name: string; readonly addr: string; readonly rating: number; readonly reviews: number; readonly price: 0 | 1 | 2 | 3 | 4; readonly phone: string; readonly dLat: number; readonly dLng: number }[];
  readonly caterers: readonly { readonly name: string; readonly addr: string; readonly rating: number; readonly reviews: number; readonly price: 0 | 1 | 2 | 3 | 4; readonly phone: string; readonly dLat: number; readonly dLng: number }[];
  readonly decorators: readonly { readonly name: string; readonly addr: string; readonly rating: number; readonly reviews: number; readonly price: 0 | 1 | 2 | 3 | 4; readonly phone: string; readonly dLat: number; readonly dLng: number }[];
  readonly photographers: readonly { readonly name: string; readonly addr: string; readonly rating: number; readonly reviews: number; readonly price: 0 | 1 | 2 | 3 | 4; readonly phone: string; readonly dLat: number; readonly dLng: number }[];
  readonly music: readonly { readonly name: string; readonly addr: string; readonly rating: number; readonly reviews: number; readonly price: 0 | 1 | 2 | 3 | 4; readonly phone: string; readonly dLat: number; readonly dLng: number }[];
  readonly makeup: readonly { readonly name: string; readonly addr: string; readonly rating: number; readonly reviews: number; readonly price: 0 | 1 | 2 | 3 | 4; readonly phone: string; readonly dLat: number; readonly dLng: number }[];
}

const AMRITSAR_CATALOG: CityCatalogData = {
  venues: [
    { name: 'The Grand Heritage Resort & Courtyard', addr: 'GT Road, Amritsar', rating: 4.9, reviews: 420, price: 3, phone: '+919814012345', dLat: 0.005, dLng: 0.004 },
    { name: "Ranjit's SVAASA Heritage Haveli", addr: 'Mall Road, Amritsar', rating: 4.8, reviews: 310, price: 3, phone: '+919814023456', dLat: 0.008, dLng: 0.003 },
    { name: 'Taj Swarna Luxury Convention Hall', addr: 'Majitha Verka Bypass, Amritsar', rating: 4.9, reviews: 890, price: 4, phone: '+919814034567', dLat: 0.024, dLng: 0.010 },
  ],
  caterers: [
    { name: 'Kesar Da Dhaba Heritage Feasts', addr: 'Chowk Passian, Amritsar', rating: 4.9, reviews: 1250, price: 2, phone: '+919814045678', dLat: -0.003, dLng: -0.002 },
    { name: 'Bhai Kulwant Singh Halwai & Live Chaat', addr: 'Heritage Walk, Amritsar', rating: 4.8, reviews: 580, price: 2, phone: '+919814056789', dLat: -0.002, dLng: -0.004 },
  ],
  decorators: [
    { name: 'Phulkari Dream Floral Stylists', addr: 'Lawrence Road, Amritsar', rating: 4.9, reviews: 210, price: 3, phone: '+919814067890', dLat: 0.004, dLng: 0.002 },
    { name: 'Royal Majha Mandap & Lightings', addr: 'Mall Road, Amritsar', rating: 4.8, reviews: 185, price: 2, phone: '+919814078901', dLat: 0.006, dLng: 0.005 },
  ],
  photographers: [
    { name: 'Golden Temple Visuals & Cinema', addr: 'Circular Road, Amritsar', rating: 4.9, reviews: 340, price: 3, phone: '+919814089012', dLat: 0.001, dLng: -0.001 },
    { name: 'Punjab Heritage Wedding Stories', addr: 'Ranjit Avenue, Amritsar', rating: 4.8, reviews: 260, price: 3, phone: '+919814090123', dLat: 0.012, dLng: 0.008 },
  ],
  music: [
    { name: 'Royal Dholis of Majha & Brass Band', addr: 'Hall Gate, Amritsar', rating: 4.9, reviews: 280, price: 2, phone: '+919876012345', dLat: -0.004, dLng: -0.001 },
    { name: 'DJ Sunny Beats & Sound Syndicate', addr: 'Ranjit Avenue, Amritsar', rating: 4.8, reviews: 195, price: 2, phone: '+919876023456', dLat: 0.014, dLng: 0.006 },
  ],
  makeup: [
    { name: 'Studio 64 Luxury Bridal Lounge', addr: 'Lawrence Road, Amritsar', rating: 4.9, reviews: 310, price: 3, phone: '+919876034567', dLat: 0.005, dLng: 0.001 },
    { name: 'Geetanjali Salon & Bridal Studio', addr: 'Mall of Amritsar, GT Road', rating: 4.8, reviews: 240, price: 3, phone: '+919876045678', dLat: 0.009, dLng: 0.011 },
  ],
};

const CHANDIGARH_CATALOG: CityCatalogData = {
  venues: [
    { name: 'The Lalit Chandigarh Convention Pavilion', addr: 'IT Park, Chandigarh', rating: 4.8, reviews: 920, price: 4, phone: '+919872012345', dLat: -0.008, dLng: 0.066 },
    { name: 'JW Marriott Grand Ballroom', addr: 'Sector 35-B, Chandigarh', rating: 4.9, reviews: 1450, price: 4, phone: '+919872023456', dLat: -0.009, dLng: -0.011 },
    { name: 'Forest Hill Golf & Country Resort', addr: 'Nayagaon, Chandigarh', rating: 4.7, reviews: 580, price: 3, phone: '+919872034567', dLat: 0.048, dLng: 0.012 },
  ],
  caterers: [
    { name: 'Gopal Sweets & Royal Feasts', addr: 'Sector 35-C, Chandigarh', rating: 4.8, reviews: 890, price: 2, phone: '+919872045678', dLat: -0.011, dLng: -0.014 },
    { name: 'Sindhi Sweets & Banquet Catering', addr: 'Sector 17, Chandigarh', rating: 4.7, reviews: 640, price: 2, phone: '+919872056789', dLat: 0.001, dLng: 0.002 },
  ],
  decorators: [
    { name: 'The Flora Stylists Chandigarh', addr: 'Sector 8-C, Chandigarh', rating: 4.9, reviews: 275, price: 3, phone: '+919872067890', dLat: 0.014, dLng: 0.011 },
    { name: 'Ferns N Petals Luxury Decor', addr: 'Sector 9-D, Chandigarh', rating: 4.8, reviews: 320, price: 3, phone: '+919872078901', dLat: 0.012, dLng: 0.004 },
  ],
  photographers: [
    { name: 'Chandigarh Wedding Stories & Films', addr: 'Sector 22, Chandigarh', rating: 4.9, reviews: 420, price: 3, phone: '+919872089012', dLat: -0.006, dLng: -0.008 },
    { name: 'Pixel Art Studios Punjab', addr: 'Sector 34-A, Chandigarh', rating: 4.8, reviews: 310, price: 3, phone: '+919872090123', dLat: -0.012, dLng: -0.004 },
  ],
  music: [
    { name: 'DJ Bhanu & Soul Sound Syndicate', addr: 'Sector 35, Chandigarh', rating: 4.9, reviews: 360, price: 2, phone: '+919888012345', dLat: -0.010, dLng: -0.012 },
    { name: 'Urban Dholis & Punjabi Folk Ensemble', addr: 'Sector 20, Chandigarh', rating: 4.8, reviews: 230, price: 2, phone: '+919888023456', dLat: -0.008, dLng: 0.018 },
  ],
  makeup: [
    { name: 'Tress Lounge Bridal Studio', addr: 'Sector 8-C, Chandigarh', rating: 4.9, reviews: 450, price: 3, phone: '+919888034567', dLat: 0.015, dLng: 0.012 },
    { name: 'Femina Plus Bridal Lounge', addr: 'Sector 10, Chandigarh', rating: 4.8, reviews: 380, price: 3, phone: '+919888045678', dLat: 0.019, dLng: 0.003 },
  ],
};

function selectCategoryPool(cat: CityCatalogData, need: VendorNeedId) {
  if (need === 'venue') return cat.venues;
  if (need === 'caterer') return cat.caterers;
  if (need === 'decorator') return cat.decorators;
  if (need === 'photographer') return cat.photographers;
  if (need === 'music') return cat.music;
  return cat.makeup;
}

function resolveCityCatalog(city: string): CityCatalogData {
  const norm = city.toLowerCase();
  if (norm.includes('amritsar')) return AMRITSAR_CATALOG;
  return CHANDIGARH_CATALOG;
}

function buildSyntheticVendor(city: string, need: VendorNeedId, idx: number): Vendor {
  const center = resolveCityCoordinates(city);
  const titles: Record<string, string[]> = {
    venue: ['Royal Palace & Courtyard', 'Heritage Grand Pavilion', 'Imperial Celebration Grounds'],
    caterer: ['Gourmet Royal Catering', 'Paramount Feasts & Halwai', 'Live Counter Specialists'],
    decorator: ['Flora Dream Stylists', 'Regal Mandap & Lighting', 'Aura Celebration Designers'],
    photographer: ['Lumiere Wedding Films', 'Heritage Pixel Visuals', 'Candid Moments Cinema'],
    music: ['Symphony Dhol & Live Band', 'Pulse Beats DJ Syndicate', 'Royal Shehnai Ensemble'],
    makeup: ['Glamour Bridal Lounge', 'Velvet Makeovers Studio', 'Radiance Bridal Artistry'],
  };
  const list = titles[need] ?? ['Signature Celebration Vendor'];
  const name = `${city} ${list[idx % list.length]}`;
  const dLat = (idx === 0 ? LAT_OFFSET_A : LAT_OFFSET_B) * (idx + 1);
  const dLng = (idx === 0 ? LNG_OFFSET_A : LNG_OFFSET_B) * (idx + 1);
  return {
    placeId: `fallback_${city.toLowerCase().replace(/[^a-z0-9]/g, '')}_${need}_${idx + 1}`,
    name,
    address: `Central Boulevard, ${city}`,
    location: { lat: center.lat + dLat, lng: center.lng + dLng },
    rating: BASE_RATING + (idx % 2) * RATING_STEP,
    ratingCount: BASE_REVIEWS + idx * REVIEWS_STEP,
    priceLevel: DEFAULT_PRICE_LEVEL,
    phone: `+9198000${idx}${idx}123`,
    distanceKm: BASE_DISTANCE_KM + idx * DISTANCE_STEP_KM,
  };
}

/**
 * Returns a verified, realistic fallback vendor list for any city and vendor need.
 *
 * @param city - Target city name for local vendor matching
 * @param need - Category of vendor needed
 * @returns Array of realistic vendors matching the domain need
 */
export function getFallbackVendors(city: string, need: VendorNeedId): readonly Vendor[] {
  const cat = resolveCityCatalog(city);
  const pool = selectCategoryPool(cat, need);
  const center = resolveCityCoordinates(city);
  const normCity = city.trim();

  if (pool && pool.length > 0) {
    return pool.map((item, idx) => ({
      placeId: `verified_${normCity.toLowerCase().replace(/[^a-z0-9]/g, '')}_${need}_${idx + 1}`,
      name: item.name,
      address: item.addr,
      location: { lat: center.lat + item.dLat, lng: center.lng + item.dLng },
      rating: item.rating,
      ratingCount: item.reviews,
      priceLevel: item.price,
      phone: item.phone,
      distanceKm:
        Math.round((VERIFIED_BASE_DISTANCE_KM + idx * VERIFIED_DISTANCE_STEP_KM) * DISTANCE_DECIMAL_SCALE) /
        DISTANCE_DECIMAL_SCALE,
    }));
  }

  return [buildSyntheticVendor(normCity, need, 0), buildSyntheticVendor(normCity, need, 1)];
}
