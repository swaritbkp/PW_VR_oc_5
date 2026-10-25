import { pertEstimate } from './pert';
import type { GraphError, Result, Schedule, ScheduledTask, TaskInput } from './types';

/** Tolerance for floating point comparison of day offsets. */
export const EPSILON = 1e-9;

function fail(code: GraphError['code'], message: string, ids: readonly string[]): GraphError {
  return { code, message, ids };
}

function estimateError(task: TaskInput): boolean {
  const values = [task.optimistic, task.mostLikely, task.pessimistic];
  const finite = values.every((v) => Number.isFinite(v) && v >= 0);
  return !finite || task.optimistic > task.mostLikely || task.mostLikely > task.pessimistic;
}

function findStructuralError(tasks: readonly TaskInput[]): GraphError | null {
  if (tasks.length === 0) return fail('EMPTY', 'The plan has no tasks.', []);
  const ids = new Set<string>();
  for (const task of tasks) {
    if (ids.has(task.id)) return fail('DUPLICATE_ID', `Duplicate task id ${task.id}.`, [task.id]);
    ids.add(task.id);
  }
  const bad = tasks.find(estimateError);
  if (bad) return fail('INVALID_ESTIMATE', `Task ${bad.id} needs 0 <= o <= m <= p.`, [bad.id]);
  const missing = tasks.find((t) => t.dependsOn.some((d) => !ids.has(d)));
  if (missing) {
    return fail('MISSING_DEPENDENCY', `Task ${missing.id} depends on an unknown task.`, [
      missing.id,
    ]);
  }
  return null;
}

/** Kahn's algorithm. Returns ids in dependency order, or the ids stuck in a cycle. */
function sortTopologically(
  tasks: readonly TaskInput[],
): Result<readonly string[], readonly string[]> {
  const remaining = new Map(tasks.map((t) => [t.id, t.dependsOn.length]));
  const dependents = new Map<string, string[]>(tasks.map((t) => [t.id, []]));
  tasks.forEach((t) => t.dependsOn.forEach((d) => dependents.get(d)?.push(t.id)));
  const queue = tasks.filter((t) => t.dependsOn.length === 0).map((t) => t.id);
  const order: string[] = [];
  for (let head = 0; head < queue.length; head += 1) {
    const id = queue[head];
    if (!id) continue;
    order.push(id);
    for (const next of dependents.get(id) ?? []) {
      const left = (remaining.get(next) ?? 0) - 1;
      remaining.set(next, left);
      if (left === 0) queue.push(next);
    }
  }
  if (order.length === tasks.length) return { ok: true, value: order };
  const stuck = tasks.filter((t) => !order.includes(t.id)).map((t) => t.id);
  return { ok: false, error: stuck };
}

/** Validates the network and returns a dependency-ordered list of task ids. */
export function buildOrder(tasks: readonly TaskInput[]): Result<readonly string[], GraphError> {
  const structural = findStructuralError(tasks);
  if (structural) return { ok: false, error: structural };
  const sorted = sortTopologically(tasks);
  if (sorted.ok) return sorted;
  return { ok: false, error: fail('CYCLE', 'Tasks depend on each other in a loop.', sorted.error) };
}

interface Timing {
  readonly expected: number;
  readonly sigma: number;
  readonly es: number;
  readonly ef: number;
}

function forwardPass(
  order: readonly string[],
  byId: ReadonlyMap<string, TaskInput>,
): ReadonlyMap<string, Timing> {
  const timings = new Map<string, Timing>();
  for (const id of order) {
    const task = byId.get(id);
    if (!task) continue;
    const est = task.done
      ? { expected: 0, sigma: 0 }
      : pertEstimate(task.optimistic, task.mostLikely, task.pessimistic);
    let es = task.notBefore ?? 0;
    for (const dep of task.dependsOn) {
      const depTiming = timings.get(dep);
      if (depTiming) es = Math.max(es, depTiming.ef);
    }
    timings.set(id, { ...est, es, ef: es + est.expected });
  }
  return timings;
}

function backwardPass(
  order: readonly string[],
  byId: ReadonlyMap<string, TaskInput>,
  timings: ReadonlyMap<string, Timing>,
  projectDuration: number,
): ReadonlyMap<string, number> {
  const latestFinish = new Map<string, number>(order.map((id) => [id, projectDuration]));
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const id = order[i];
    if (!id) continue;
    const t = timings.get(id);
    const task = byId.get(id);
    const lf = latestFinish.get(id) ?? projectDuration;
    if (!t || !task) continue;
    const latestStart = lf - t.expected;
    for (const dep of task.dependsOn) {
      const depLf = latestFinish.get(dep) ?? projectDuration;
      latestFinish.set(dep, Math.min(depLf, latestStart));
    }
  }
  return latestFinish;
}

/** Later finish wins; on a tie the later start wins, so a zero-length milestone ends the chain. */
function finishesLater(candidate: ScheduledTask, current: ScheduledTask): boolean {
  const gap = candidate.earliestFinish - current.earliestFinish;
  if (Math.abs(gap) > EPSILON) return gap > 0;
  return candidate.earliestStart > current.earliestStart + EPSILON;
}

/** Walks back from the latest critical finish to produce one longest chain. */
function extractChain(critical: readonly ScheduledTask[]): readonly ScheduledTask[] {
  if (critical.length === 0) return [];
  let current = critical.reduce((a, b) => (finishesLater(b, a) ? b : a));
  const chain: ScheduledTask[] = [current];
  for (;;) {
    const prev = critical.find(
      (t) =>
        current.dependsOn.includes(t.id) &&
        Math.abs(t.earliestFinish - current.earliestStart) <= EPSILON,
    );
    if (!prev) break;
    chain.unshift(prev);
    current = prev;
  }
  return chain;
}

/**
 * Critical Path Method with PERT durations. Returns early/late times, total
 * float per task, one critical chain, and the chain's duration uncertainty.
 */
export function computeSchedule(tasks: readonly TaskInput[]): Result<Schedule, GraphError> {
  const ordered = buildOrder(tasks);
  if (!ordered.ok) return ordered;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const timings = forwardPass(ordered.value, byId);
  const projectDuration = [...timings.values()].reduce((max, t) => Math.max(max, t.ef), 0);
  const latestFinish = backwardPass(ordered.value, byId, timings, projectDuration);

  const scheduled: ScheduledTask[] = tasks.map((task) => {
    const t = timings.get(task.id) ?? { expected: 0, sigma: 0, es: 0, ef: 0 };
    const lf = latestFinish.get(task.id) ?? t.ef;
    const totalFloat = lf - t.expected - t.es;
    return {
      ...task,
      expected: t.expected,
      sigma: t.sigma,
      earliestStart: t.es,
      earliestFinish: t.ef,
      latestStart: lf - t.expected,
      latestFinish: lf,
      totalFloat,
      critical: !task.done && totalFloat <= EPSILON,
    };
  });

  const chain = extractChain(scheduled.filter((t) => t.critical));
  const variance = chain.reduce((sum, t) => sum + t.sigma * t.sigma, 0);
  return {
    ok: true,
    value: {
      tasks: scheduled,
      projectDuration,
      criticalPath: chain.map((t) => t.id),
      sigma: Math.sqrt(variance),
    },
  };
}

/** Days of spare time (negative = behind) between plan finish and the event date. */
export function bufferDays(schedule: Schedule, availableDays: number): number {
  return availableDays - schedule.projectDuration;
}
