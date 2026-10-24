import { monthOf } from '../dates';
import type { PlanTask } from '../plan/types';

const ROUNDING = 10;

export type Region = 'north-india' | 'default';

/** Heuristic seasonal profile for a date and region. Not market data. */
export interface SeasonProfile {
  readonly region: Region;
  readonly month: number;
  readonly weddingPeak: boolean;
  readonly monsoon: boolean;
  readonly fog: boolean;
  readonly heatWave: boolean;
  /** Multiplier for booking lead times (vendors book out in peak season). */
  readonly leadMultiplier: number;
  /** Multiplier for price expectations in peak season. */
  readonly priceMultiplier: number;
}

const NORTH_CITIES = [
  'chandigarh',
  'mohali',
  'panchkula',
  'ludhiana',
  'amritsar',
  'jalandhar',
  'patiala',
  'bathinda',
  'ambala',
  'karnal',
  'delhi',
  'gurgaon',
  'gurugram',
  'noida',
  'shimla',
  'dehradun',
];

const PEAK_MONTHS = [11, 12, 1, 2];
const SHOULDER_MONTHS = [10, 4, 5];
const MONSOON_MONTHS = [7, 8, 9];
const FOG_MONTHS = [12, 1];
const HEAT_MONTHS = [5, 6];
const PEAK_LEAD = 1.4;
const SHOULDER_LEAD = 1.15;
const PEAK_PRICE = 1.25;
const SHOULDER_PRICE = 1.1;

/** Maps a city name to a seasonal region. Extend with Places administrative-area data when available. */
export function regionForCity(city: string): Region {
  const name = city.toLowerCase();
  return NORTH_CITIES.some((c) => name.includes(c)) ? 'north-india' : 'default';
}

/** Seasonal profile for an event date. Returns null when the date is invalid. */
export function seasonProfile(isoDate: string, region: Region): SeasonProfile | null {
  const month = monthOf(isoDate);
  if (month === null) return null;
  if (region === 'default') {
    return {
      region,
      month,
      weddingPeak: false,
      monsoon: false,
      fog: false,
      heatWave: false,
      leadMultiplier: 1,
      priceMultiplier: 1,
    };
  }
  const peak = PEAK_MONTHS.includes(month);
  const shoulder = SHOULDER_MONTHS.includes(month);
  return {
    region,
    month,
    weddingPeak: peak,
    monsoon: MONSOON_MONTHS.includes(month),
    fog: FOG_MONTHS.includes(month),
    heatWave: HEAT_MONTHS.includes(month),
    leadMultiplier: peak ? PEAK_LEAD : shoulder ? SHOULDER_LEAD : 1,
    priceMultiplier: peak ? PEAK_PRICE : shoulder ? SHOULDER_PRICE : 1,
  };
}

/** Stretches booking-task estimates by the seasonal lead multiplier. Other tasks keep identity. */
export function applyLeadMultiplier(
  tasks: readonly PlanTask[],
  profile: SeasonProfile,
): readonly PlanTask[] {
  if (profile.leadMultiplier === 1) return tasks;
  const stretch = (v: number): number =>
    Math.round(v * profile.leadMultiplier * ROUNDING) / ROUNDING;
  return tasks.map((task) =>
    task.bookingFor
      ? {
          ...task,
          optimistic: stretch(task.optimistic),
          mostLikely: stretch(task.mostLikely),
          pessimistic: stretch(task.pessimistic),
        }
      : task,
  );
}
