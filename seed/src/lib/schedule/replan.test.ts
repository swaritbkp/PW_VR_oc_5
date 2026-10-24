import { describe, expect, it } from 'vitest';
import { computeSchedule } from './cpm';
import { applyChange, diffSchedules } from './replan';
import type { Schedule, TaskInput } from './types';

const task = (id: string, d: number, dependsOn: string[] = []): TaskInput => ({
  id,
  name: id,
  optimistic: d,
  mostLikely: d,
  pessimistic: d,
  dependsOn,
});
const classic = [task('A', 3), task('B', 4, ['A']), task('C', 2, ['A']), task('D', 5, ['B', 'C'])];

function schedule(tasks: readonly TaskInput[]): Schedule {
  const result = computeSchedule(tasks);
  if (!result.ok) throw new Error('expected ok');
  return result.value;
}

describe('AC11 replanning after a change', () => {
  it('moves the critical path when a non-critical task slips past its float', () => {
    const slipped = applyChange(classic, { type: 'slip', taskId: 'C', days: 4 });
    if (!slipped.ok) throw new Error('expected ok');
    const after = schedule(slipped.value);
    expect(after.criticalPath).toEqual(['A', 'C', 'D']);
    expect(after.projectDuration).toBe(14);
  });

  it('diffs only what changed', () => {
    const slipped = applyChange(classic, { type: 'slip', taskId: 'C', days: 4 });
    if (!slipped.ok) throw new Error('expected ok');
    const diffs = diffSchedules(schedule(classic), schedule(slipped.value));
    const touched = new Set(diffs.map((d) => d.taskId));
    expect(touched.has('C')).toBe(true);
    expect(touched.has('B')).toBe(true);
    expect(touched.has('A')).toBe(false);
    expect(diffs.find((d) => d.taskId === 'C' && d.field === 'critical')).toMatchObject({ before: false, after: true });
  });

  it('returns no diffs for identical schedules and never mutates the input', () => {
    const before = JSON.stringify(classic);
    applyChange(classic, { type: 'complete', taskId: 'A' });
    expect(JSON.stringify(classic)).toBe(before);
    expect(diffSchedules(schedule(classic), schedule(classic))).toEqual([]);
  });

  it('completing a task shortens the plan', () => {
    const done = applyChange(classic, { type: 'complete', taskId: 'A' });
    if (!done.ok) throw new Error('expected ok');
    expect(schedule(done.value).projectDuration).toBe(9);
  });

  it('rejects unknown tasks and invalid slips', () => {
    expect(applyChange(classic, { type: 'start', taskId: 'Z' })).toMatchObject({ ok: false, error: { code: 'UNKNOWN_TASK' } });
    expect(applyChange(classic, { type: 'slip', taskId: 'A', days: -1 })).toMatchObject({ ok: false, error: { code: 'INVALID_CHANGE' } });
    expect(applyChange(classic, { type: 'slip', taskId: 'A', days: Number.NaN })).toMatchObject({ ok: false });
  });

  it('block applies a notBefore constraint', () => {
    const blocked = applyChange(classic, { type: 'block', taskId: 'A', notBefore: 5 });
    if (!blocked.ok) throw new Error('expected ok');
    expect(schedule(blocked.value).projectDuration).toBe(17);
  });
});
