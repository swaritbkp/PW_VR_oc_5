import type { Vendor } from './types';

const PRIOR_MEAN = 4;
const PRIOR_WEIGHT = 20;
const DISTANCE_PENALTY_PER_KM = 0.03;

export interface RankedVendor {
  readonly vendor: Vendor;
  readonly score: number;
}

export interface RankOptions {
  /** Drop vendors above this price level (vendors without a price level are kept). */
  readonly maxPriceLevel?: number;
}

/** Bayesian average: pulls ratings with few reviews toward the prior mean. */
export function bayesianRating(rating: number | undefined, count: number | undefined): number {
  const votes = count ?? 0;
  const value = rating ?? PRIOR_MEAN;
  return (value * votes + PRIOR_MEAN * PRIOR_WEIGHT) / (votes + PRIOR_WEIGHT);
}

/** Ranks by trusted rating, then nearness. Stable and deterministic. */
export function rankVendors(vendors: readonly Vendor[], options: RankOptions = {}): RankedVendor[] {
  const max = options.maxPriceLevel;
  return vendors
    .filter((v) => max === undefined || v.priceLevel === undefined || v.priceLevel <= max)
    .map((vendor) => ({
      vendor,
      score:
        bayesianRating(vendor.rating, vendor.ratingCount) -
        DISTANCE_PENALTY_PER_KM * (vendor.distanceKm ?? 0),
    }))
    .sort((a, b) => b.score - a.score || a.vendor.name.localeCompare(b.vendor.name));
}
