import { describe, expect, it } from 'vitest';
import { computeSchedule } from './cpm';
import { probabilityOnTime } from './pert';
import { evaluate, nextBestAction } from './sentinel';
import type { Schedule, TaskInput } from './types';

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

function build(tasks: TaskInput[]): Schedule {
  const result = computeSchedule(tasks);
  if (!result.ok) throw new Error('expected ok');
  return result.value;
}
const classic = [task('A', 3), task('B', 4, ['A']), task('C', 2, ['A']), task('D', 5, ['B', 'C'])];

describe('AC12 sentinel alerts are deterministic and ranked', () => {
  it('flags a critical task that must start within three days', () => {
    const schedule = build(classic);
    const alerts = evaluate({ schedule, today: 0, availableDays: 12, probabilityOnTime: 1 });
    expect(alerts[0]).toMatchObject({ ruleId: 'R1_START_SOON', severity: 'critical', taskId: 'A' });
  });

  it('flags overdue tasks and missing buffer', () => {
    const schedule = build(classic);
    const alerts = evaluate({
      schedule,
      today: 2,
      availableDays: 10,
      probabilityOnTime: probabilityOnTime(schedule, 10),
    });
    const ids = alerts.map((a) => a.ruleId);
    expect(ids).toContain('R2_OVERDUE');
    expect(ids).toContain('R3_NO_BUFFER');
    expect(alerts.find((a) => a.ruleId === 'R3_NO_BUFFER')?.params).toEqual({ shortfallDays: 2 });
  });

  it('is quiet when there is plenty of buffer and confidence', () => {
    const schedule = build(classic);
    expect(evaluate({ schedule, today: 0, availableDays: 60, probabilityOnTime: 1 })).toEqual([]);
  });

  it('grades low confidence by severity', () => {
    const schedule = build(classic);
    const warn = evaluate({ schedule, today: 0, availableDays: 60, probabilityOnTime: 0.7 });
    const crit = evaluate({ schedule, today: 0, availableDays: 60, probabilityOnTime: 0.3 });
    expect(warn[0]).toMatchObject({ ruleId: 'R4_LOW_CONFIDENCE', severity: 'warning' });
    expect(crit[0]).toMatchObject({ ruleId: 'R4_LOW_CONFIDENCE', severity: 'critical' });
  });

  it('aggregates near-critical tasks and ranks critical first', () => {
    const schedule = build(classic);
    const alerts = evaluate({ schedule, today: 0, availableDays: 12, probabilityOnTime: 1 });
    expect(alerts.find((a) => a.ruleId === 'R5_NEAR_CRITICAL')?.params).toEqual({ count: 1 });
    const ranks = alerts.map((a) => a.severity);
    expect(ranks).toEqual(
      [...ranks].sort(
        (x, y) =>
          ['critical', 'warning', 'info'].indexOf(x) - ['critical', 'warning', 'info'].indexOf(y),
      ),
    );
  });

  it('ignores tasks that are started or done', () => {
    const schedule = build([
      task('A', 3, [], { started: true }),
      task('B', 2, ['A'], { done: false }),
    ]);
    const alerts = evaluate({ schedule, today: 50, availableDays: 5, probabilityOnTime: 1 });
    expect(alerts.some((a) => a.taskId === 'A')).toBe(false);
  });
});

describe('AC13 next best action', () => {
  it('picks the ready task with the least slack', () => {
    expect(nextBestAction(build(classic), 12)?.id).toBe('A');
  });

  it('only offers tasks whose dependencies are done', () => {
    const after = build([{ ...classic[0], done: true } as TaskInput, ...classic.slice(1)]);
    expect(nextBestAction(after, 12)?.id).toBe('B');
  });

  it('returns undefined when nothing is left', () => {
    const all = build(classic.map((t) => ({ ...t, done: true })));
    expect(nextBestAction(all, 12)).toBeUndefined();
  });
});
