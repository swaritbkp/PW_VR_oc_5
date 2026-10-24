import type { LatLng } from '../vendors/types';

/** Standard coordinates for major celebration hubs across India. */
const CITY_COORDINATES: Readonly<Record<string, LatLng>> = {
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  mohali: { lat: 30.7046, lng: 76.7179 },
  panchkula: { lat: 30.6942, lng: 76.8606 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  ludhiana: { lat: 30.901, lng: 75.8573 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  jalandhar: { lat: 31.326, lng: 75.5762 },
  patiala: { lat: 30.3398, lng: 76.3869 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  pune: { lat: 18.5204, lng: 73.8567 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  goa: { lat: 15.2993, lng: 74.124 },
};

/** Default celebration location coordinates (Chandigarh). */
export const DEFAULT_COORDINATES: LatLng = { lat: 30.7333, lng: 76.7794 };

/**
 * Resolves known Indian celebration city names to geographic coordinates.
 * Returns coordinates if found, or undefined if unknown.
 *
 * @param city - The raw city name to look up
 * @returns Geographic coordinates or undefined
 */
export function lookupCityCoordinates(city: string): LatLng | undefined {
  const normalized = city.trim().toLowerCase();
  return CITY_COORDINATES[normalized];
}

/**
 * Resolves city coordinates, falling back to default celebration coordinates when not found.
 *
 * @param city - The raw city name to resolve
 * @returns Geographic coordinates
 */
export function resolveCityCoordinates(city: string): LatLng {
  return lookupCityCoordinates(city) ?? DEFAULT_COORDINATES;
}
