import { describe, expect, it } from 'vitest';
import { bufferDays, buildOrder, computeSchedule } from './cpm';
import { normalCdf, pertEstimate, probabilityOnTime } from './pert';
import type { TaskInput } from './types';

const task = (
  id: string,
  d: number,
  dependsOn: string[] = [],
  extra: Partial<TaskInput> = {},
): TaskInput => ({
  id,
  name: id,
  optimistic: d,
  mostLikely: d,
  pessimistic: d,
  dependsOn,
  ...extra,
});

/** Classic network: A(3) -> B(4), C(2) -> D(5). Critical path A-B-D = 12 days, C has 2 days float. */
const classic = [task('A', 3), task('B', 4, ['A']), task('C', 2, ['A']), task('D', 5, ['B', 'C'])];

describe('AC9 critical path method', () => {
  it('finds the critical path and project duration', () => {
    const result = computeSchedule(classic);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.projectDuration).toBe(12);
    expect(result.value.criticalPath).toEqual(['A', 'B', 'D']);
  });

  it('computes float for non-critical tasks', () => {
    const result = computeSchedule(classic);
    if (!result.ok) throw new Error('expected ok');
    const c = result.value.tasks.find((t) => t.id === 'C');
    expect(c?.totalFloat).toBe(2);
    expect(c?.critical).toBe(false);
    expect(c?.earliestStart).toBe(3);
    expect(c?.latestStart).toBe(5);
  });

  it('rejects cycles, unknown dependencies, duplicates, bad estimates and empty plans', () => {
    expect(buildOrder([task('A', 1, ['B']), task('B', 1, ['A'])])).toMatchObject({
      ok: false,
      error: { code: 'CYCLE' },
    });
    expect(buildOrder([task('A', 1, ['Z'])])).toMatchObject({
      ok: false,
      error: { code: 'MISSING_DEPENDENCY' },
    });
    expect(buildOrder([task('A', 1), task('A', 2)])).toMatchObject({
      ok: false,
      error: { code: 'DUPLICATE_ID' },
    });
    expect(buildOrder([{ ...task('A', 1), optimistic: 5 }])).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ESTIMATE' },
    });
    expect(buildOrder([])).toMatchObject({ ok: false, error: { code: 'EMPTY' } });
    expect(buildOrder([task('A', 1, ['A'])])).toMatchObject({
      ok: false,
      error: { code: 'CYCLE' },
    });
  });

  it('honours notBefore constraints', () => {
    const result = computeSchedule([task('A', 2, [], { notBefore: 10 })]);
    if (!result.ok) throw new Error('expected ok');
    expect(result.value.projectDuration).toBe(12);
  });

  it('treats completed tasks as zero duration and not critical', () => {
    const result = computeSchedule([task('A', 3, [], { done: true }), task('B', 4, ['A'])]);
    if (!result.ok) throw new Error('expected ok');
    expect(result.value.projectDuration).toBe(4);
    expect(result.value.tasks.find((t) => t.id === 'A')?.critical).toBe(false);
    expect(result.value.criticalPath).toEqual(['B']);
  });

  it('returns an empty critical path when everything is done', () => {
    const result = computeSchedule([task('A', 3, [], { done: true })]);
    if (!result.ok) throw new Error('expected ok');
    expect(result.value.criticalPath).toEqual([]);
    expect(result.value.sigma).toBe(0);
  });

  it('reports buffer against the available days, negative when behind', () => {
    const result = computeSchedule(classic);
    if (!result.ok) throw new Error('expected ok');
    expect(bufferDays(result.value, 20)).toBe(8);
    expect(bufferDays(result.value, 10)).toBe(-2);
  });
});

describe('AC10 PERT estimates and probability', () => {
  it('computes expected duration and sigma', () => {
    const e = pertEstimate(2, 3, 10);
    expect(e.expected).toBe(4);
    expect(e.sigma).toBeCloseTo(8 / 6, 10);
  });

  it('approximates the normal CDF', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  it('gives a step function when there is no uncertainty', () => {
    const result = computeSchedule(classic);
    if (!result.ok) throw new Error('expected ok');
    expect(probabilityOnTime(result.value, 12)).toBe(1);
    expect(probabilityOnTime(result.value, 11)).toBe(0);
  });

  it('is 50 percent when available days equal the expected duration', () => {
    const result = computeSchedule([
      { ...task('A', 4), optimistic: 2, pessimistic: 10, mostLikely: 3 },
    ]);
    if (!result.ok) throw new Error('expected ok');
    expect(probabilityOnTime(result.value, result.value.projectDuration)).toBeCloseTo(0.5, 6);
  });
});

describe('efficiency', () => {
  it('schedules a 2000 task layered network quickly', () => {
    const tasks: TaskInput[] = [];
    for (let i = 0; i < 2000; i += 1) {
      tasks.push(task(`t${i}`, 1 + (i % 5), i < 10 ? [] : [`t${i - 10}`, `t${i - 7}`]));
    }
    const started = performance.now();
    const result = computeSchedule(tasks);
    const elapsed = performance.now() - started;
    expect(result.ok).toBe(true);
    expect(elapsed).toBeLessThan(250);
  });
});
