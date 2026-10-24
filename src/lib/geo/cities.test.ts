import { describe, expect, it } from 'vitest';
import { DEFAULT_COORDINATES, lookupCityCoordinates, resolveCityCoordinates } from './cities';

describe('Geo Cities (AC20)', () => {
  it('AC20 resolves coordinates for known celebration hubs', () => {
    const chd = lookupCityCoordinates('Chandigarh');
    expect(chd).toBeDefined();
    expect(chd?.lat).toBeCloseTo(30.7333, 3);
    expect(chd?.lng).toBeCloseTo(76.7794, 3);

    const delhi = lookupCityCoordinates('Delhi');
    expect(delhi?.lat).toBeCloseTo(28.6139, 3);

    const jaipur = lookupCityCoordinates('Jaipur');
    expect(jaipur?.lat).toBeCloseTo(26.9124, 3);
  });

  it('AC20 normalizes case and whitespace', () => {
    const ludhiana = lookupCityCoordinates('  LuDhIaNa  ');
    expect(ludhiana).toBeDefined();
    expect(ludhiana?.lat).toBeCloseTo(30.901, 3);
  });

  it('AC20 falls back to default celebration coordinates when city is unknown', () => {
    expect(lookupCityCoordinates('UnknownCity123')).toBeUndefined();
    const fallback = resolveCityCoordinates('UnknownCity123');
    expect(fallback).toEqual(DEFAULT_COORDINATES);
  });
});
