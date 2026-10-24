import { EPSILON } from './cpm';
import type { GraphError, Result, Schedule, TaskInput } from './types';

/** A change that happens while the plan is being executed. */
export type PlanChange =
  | { readonly type: 'slip'; readonly taskId: string; readonly days: number }
  | { readonly type: 'start'; readonly taskId: string }
  | { readonly type: 'complete'; readonly taskId: string }
  | { readonly type: 'block'; readonly taskId: string; readonly notBefore: number };

export interface ScheduleDiff {
  readonly taskId: string;
  readonly field: 'start' | 'float' | 'critical';
  readonly before: number | boolean;
  readonly after: number | boolean;
}

function problem(code: GraphError['code'], message: string, id: string): GraphError {
  return { code, message, ids: [id] };
}

function patch(task: TaskInput, change: PlanChange): Result<TaskInput, GraphError> {
  switch (change.type) {
    case 'slip':
      if (!Number.isFinite(change.days) || change.days <= 0) {
        return {
          ok: false,
          error: problem('INVALID_CHANGE', 'Slip must be a positive number of days.', task.id),
        };
      }
      return {
        ok: true,
        value: {
          ...task,
          optimistic: task.optimistic + change.days,
          mostLikely: task.mostLikely + change.days,
          pessimistic: task.pessimistic + change.days,
        },
      };
    case 'start':
      return { ok: true, value: { ...task, started: true } };
    case 'complete':
      return { ok: true, value: { ...task, started: true, done: true } };
    case 'block':
      return { ok: true, value: { ...task, notBefore: change.notBefore } };
  }
}

/** Applies one change immutably. Only the named task is touched. */
export function applyChange(
  tasks: readonly TaskInput[],
  change: PlanChange,
): Result<readonly TaskInput[], GraphError> {
  const target = tasks.find((t) => t.id === change.taskId);
  if (!target) return { ok: false, error: problem('UNKNOWN_TASK', 'No such task.', change.taskId) };
  const patched = patch(target, change);
  if (!patched.ok) return patched;
  return { ok: true, value: tasks.map((t) => (t.id === change.taskId ? patched.value : t)) };
}

function differs(a: number | boolean, b: number | boolean): boolean {
  return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) > EPSILON : a !== b;
}

/** Lists only what moved between two schedules, so the UI can show a precise diff. */
export function diffSchedules(before: Schedule, after: Schedule): readonly ScheduleDiff[] {
  const prior = new Map(before.tasks.map((t) => [t.id, t]));
  const diffs: ScheduleDiff[] = [];
  for (const next of after.tasks) {
    const old = prior.get(next.id);
    if (!old) continue;
    const pairs: ReadonlyArray<[ScheduleDiff['field'], number | boolean, number | boolean]> = [
      ['start', old.earliestStart, next.earliestStart],
      ['float', old.totalFloat, next.totalFloat],
      ['critical', old.critical, next.critical],
    ];
    for (const [field, was, now] of pairs) {
      if (differs(was, now)) diffs.push({ taskId: next.id, field, before: was, after: now });
    }
  }
  return diffs;
}
