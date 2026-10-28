import type { Schedule } from './types';

const PERT_MODE_WEIGHT = 4;
const PERT_DIVISOR = 6;

/** Abramowitz and Stegun 7.1.26 coefficients for the error function (max error ~1.5e-7). */
const ERF_P = 0.3275911;
const ERF_A: readonly [number, number, number, number, number] = [
  0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429,
];

/** PERT expected duration and standard deviation from three-point estimates. */
export function pertEstimate(
  optimistic: number,
  mostLikely: number,
  pessimistic: number,
): { expected: number; sigma: number } {
  return {
    expected: (optimistic + PERT_MODE_WEIGHT * mostLikely + pessimistic) / PERT_DIVISOR,
    sigma: (pessimistic - optimistic) / PERT_DIVISOR,
  };
}

/** Standard normal cumulative distribution function. */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + ERF_P * x);
  const poly = ((((ERF_A[4] * t + ERF_A[3]) * t + ERF_A[2]) * t + ERF_A[1]) * t + ERF_A[0]) * t;
  const erf = 1 - poly * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

/**
 * Probability the plan finishes within `availableDays`, using the classic PERT
 * normal approximation along the critical chain. Optimistic when near-critical
 * paths exist; cross-check with `simulate`.
 */
export function probabilityOnTime(schedule: Schedule, availableDays: number): number {
  const gap = availableDays - schedule.projectDuration;
  if (schedule.sigma === 0) return gap >= 0 ? 1 : 0;
  return normalCdf(gap / schedule.sigma);
}
