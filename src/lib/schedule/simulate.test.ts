import { describe, expect, it } from 'vitest';
import { createRng, sampleTriangular, simulate } from './simulate';
import type { TaskInput } from './types';

const uncertain = (id: string, dependsOn: string[] = []): TaskInput => ({
  id,
  name: id,
  optimistic: 2,
  mostLikely: 3,
  pessimistic: 10,
  dependsOn,
});

describe('AC10 Monte Carlo cross-check', () => {
  it('is deterministic for a given seed', () => {
    const tasks = [uncertain('A'), uncertain('B', ['A'])];
    const options = { runs: 500, seed: 42, availableDays: 12 };
    expect(simulate(tasks, options)).toEqual(simulate(tasks, options));
  });

  it('orders percentiles and keeps probability in range', () => {
    const result = simulate([uncertain('A'), uncertain('B', ['A'])], {
      runs: 2000,
      seed: 7,
      availableDays: 12,
    });
    if (!result.ok) throw new Error('expected ok');
    const { p50, p80, p90, probabilityOnTime } = result.value;
    expect(p50).toBeLessThanOrEqual(p80);
    expect(p80).toBeLessThanOrEqual(p90);
    expect(probabilityOnTime).toBeGreaterThan(0);
    expect(probabilityOnTime).toBeLessThan(1);
  });

  it('collapses to certainty when estimates have no spread', () => {
    const fixed: TaskInput = {
      id: 'A',
      name: 'A',
      optimistic: 5,
      mostLikely: 5,
      pessimistic: 5,
      dependsOn: [],
    };
    const result = simulate([fixed], { runs: 100, seed: 1, availableDays: 5 });
    if (!result.ok) throw new Error('expected ok');
    expect(result.value.probabilityOnTime).toBe(1);
    expect(result.value.p90).toBe(5);
  });

  it('rejects invalid networks', () => {
    expect(simulate([], { runs: 10, seed: 1, availableDays: 5 })).toMatchObject({ ok: false });
  });

  it('samples within bounds and RNG stays in [0,1)', () => {
    const rng = createRng(9);
    for (let i = 0; i < 1000; i += 1) {
      const u = rng();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      const s = sampleTriangular(2, 3, 10, u);
      expect(s).toBeGreaterThanOrEqual(2);
      expect(s).toBeLessThanOrEqual(10);
    }
  });

  it('runs 2000 simulations of a 40 task plan quickly', () => {
    const tasks: TaskInput[] = Array.from({ length: 40 }, (_, i) =>
      uncertain(`t${i}`, i > 1 ? [`t${i - 2}`] : []),
    );
    const started = performance.now();
    simulate(tasks, { runs: 2000, seed: 3, availableDays: 60 });
    expect(performance.now() - started).toBeLessThan(500);
  });
});
