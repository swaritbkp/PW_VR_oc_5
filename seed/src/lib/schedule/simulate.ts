import { buildOrder } from './cpm';
import type { GraphError, Result, TaskInput } from './types';

export interface SimulationOptions {
  readonly runs: number;
  readonly seed: number;
  readonly availableDays: number;
}

export interface SimulationResult {
  readonly runs: number;
  readonly probabilityOnTime: number;
  /** Project duration (days) not exceeded in 50, 80 and 90 percent of runs. */
  readonly p50: number;
  readonly p80: number;
  readonly p90: number;
}

const UINT32 = 4294967296;
const MIX_INCREMENT = 0x6d2b79f5;
const P50 = 0.5;
const P80 = 0.8;
const P90 = 0.9;

/** Small deterministic PRNG (mulberry32) so simulations are reproducible and testable. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + MIX_INCREMENT) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
}

/** Inverse-CDF sample from a triangular distribution (min a, mode c, max b). */
export function sampleTriangular(a: number, c: number, b: number, u: number): number {
  if (b - a === 0) return a;
  const split = (c - a) / (b - a);
  if (u < split) return a + Math.sqrt(u * (b - a) * (c - a));
  return b - Math.sqrt((1 - u) * (b - a) * (b - c));
}

function quantile(sorted: Float64Array, q: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[index] as number;
}

/**
 * Monte Carlo over the task network using triangular distributions. More
 * honest than the analytic PERT figure when several paths are near-critical.
 */
export function simulate(
  tasks: readonly TaskInput[],
  options: SimulationOptions,
): Result<SimulationResult, GraphError> {
  const ordered = buildOrder(tasks);
  if (!ordered.ok) return ordered;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const index = new Map(ordered.value.map((id, i) => [id, i]));
  const plan = ordered.value.map((id) => {
    const task = byId.get(id) as TaskInput;
    return { task, deps: task.dependsOn.map((d) => index.get(d) as number) };
  });

  const rng = createRng(options.seed);
  const durations = new Float64Array(options.runs);
  const finish = new Float64Array(plan.length);
  let onTime = 0;
  for (let run = 0; run < options.runs; run += 1) {
    let longest = 0;
    plan.forEach(({ task, deps }, i) => {
      const sampled = task.done
        ? 0
        : sampleTriangular(task.optimistic, task.mostLikely, task.pessimistic, rng());
      let start = task.notBefore ?? 0;
      for (const d of deps) start = Math.max(start, finish[d] as number);
      finish[i] = start + sampled;
      longest = Math.max(longest, finish[i] as number);
    });
    durations[run] = longest;
    if (longest <= options.availableDays) onTime += 1;
  }
  durations.sort();
  return {
    ok: true,
    value: {
      runs: options.runs,
      probabilityOnTime: onTime / options.runs,
      p50: quantile(durations, P50),
      p80: quantile(durations, P80),
      p90: quantile(durations, P90),
    },
  };
}
