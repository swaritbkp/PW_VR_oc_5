import { scaleForBudget, type BudgetLine } from '../budget/engine';
import { daysBetween } from '../dates';
import type { Schedule, ScheduledTask } from '../schedule/types';
import type { Driver, PlanTask } from './types';
import type { IntakeInput } from './schemas';

export interface PlanState {
  readonly id: string;
  readonly intake: IntakeInput;
  readonly tasks: readonly PlanTask[];
  readonly budgetLines: readonly BudgetLine[];
  readonly targetDays: number;
}

export type PlanChange =
  | { readonly kind: 'guests'; readonly guests: number }
  | { readonly kind: 'budget'; readonly budgetInr: number }
  | { readonly kind: 'date'; readonly date: string }
  | { readonly kind: 'city'; readonly city: string }
  | { readonly kind: 'task'; readonly taskId: string; readonly updates: Partial<PlanTask> };

export interface PropagateResult {
  readonly plan: PlanState;
  readonly dirtyIds: readonly string[];
  readonly diff: readonly string[];
}

export interface CrunchOption {
  readonly taskId: string;
  readonly taskName: string;
  readonly action: 'drop' | 'compress' | 'parallelise' | 'parallelize';
  readonly daysSaved: number;
  readonly reason: string;
}

export interface CrunchAnalysis {
  readonly shortfallDays: number;
  readonly isCrunch: boolean;
  readonly options: readonly CrunchOption[];
}

function updateTasksForDriver(
  tasks: readonly PlanTask[],
  driver: Driver,
  scaleFactor: number,
): { tasks: readonly PlanTask[]; dirtyIds: string[] } {
  const dirtyIds: string[] = [];
  const updated = tasks.map((t) => {
    if (!t.drivers.includes(driver)) return t;
    dirtyIds.push(t.id);
    if (scaleFactor === 1) return t;
    return {
      ...t,
      optimistic: Math.round(t.optimistic * scaleFactor),
      mostLikely: Math.round(t.mostLikely * scaleFactor),
      pessimistic: Math.round(t.pessimistic * scaleFactor),
    };
  });
  return { tasks: updated, dirtyIds };
}

function handleGuests(plan: PlanState, guests: number): PropagateResult {
  const diff = [`Guests changed from ${plan.intake.guests} to ${guests}`];
  const dirtyIds: string[] = [];
  const bLines = plan.budgetLines.map((line) => {
    if (line.drivers.includes('guests')) {
      dirtyIds.push(line.id);
      if (line.unit === 'per_head') {
        return { ...line, quantity: guests };
      }
    }
    return line;
  });
  const ratio = plan.intake.guests > 0 ? guests / plan.intake.guests : 1;
  const tResult = updateTasksForDriver(plan.tasks, 'guests', ratio);
  dirtyIds.push(...tResult.dirtyIds);
  return {
    plan: {
      ...plan,
      intake: { ...plan.intake, guests },
      budgetLines: bLines,
      tasks: tResult.tasks,
    },
    dirtyIds,
    diff,
  };
}

function handleBudget(plan: PlanState, budgetInr: number): PropagateResult {
  const diff = [`Budget changed to ₹${budgetInr}`];
  const currentSpend = plan.budgetLines.reduce((sum, b) => sum + b.rateInr, 0);
  const scaled = scaleForBudget(plan.budgetLines, budgetInr, currentSpend);
  diff.push(...scaled.cuts);
  const dirtyIds: string[] = [];
  for (const b of scaled.lines) {
    if (b.drivers.includes('budget') && !b.locked) dirtyIds.push(b.id);
  }
  return {
    plan: { ...plan, intake: { ...plan.intake, budgetInr }, budgetLines: scaled.lines },
    dirtyIds,
    diff,
  };
}

function handleDateOrCity(
  plan: PlanState,
  change: { kind: 'date'; date: string } | { kind: 'city'; city: string },
): PropagateResult {
  if (change.kind === 'date') {
    const today = new Date().toISOString().slice(0, 10);
    const targetDays = Math.max(1, daysBetween(today, change.date) ?? 1);
    const diff = [`Date moved to ${change.date} (${targetDays} days remaining)`];
    const tResult = updateTasksForDriver(plan.tasks, 'date', 1);
    return {
      plan: {
        ...plan,
        intake: { ...plan.intake, date: change.date },
        targetDays,
        tasks: tResult.tasks,
      },
      dirtyIds: tResult.dirtyIds,
      diff,
    };
  }
  const diff = [`City changed to ${change.city}`];
  const tResult = updateTasksForDriver(plan.tasks, 'city', 1);
  return {
    plan: { ...plan, intake: { ...plan.intake, city: change.city }, tasks: tResult.tasks },
    dirtyIds: tResult.dirtyIds,
    diff,
  };
}

function findDownstreamDependents(taskId: string, tasks: readonly PlanTask[]): string[] {
  const dirty = new Set<string>([taskId]);
  const queue = [taskId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const t of tasks) {
      if (t.dependsOn.includes(cur) && !dirty.has(t.id)) {
        dirty.add(t.id);
        queue.push(t.id);
      }
    }
  }
  return Array.from(dirty);
}

function handleTaskUpdate(
  plan: PlanState,
  taskId: string,
  updates: Partial<PlanTask>,
): PropagateResult {
  const updatedTasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
  const dirtyIds = findDownstreamDependents(taskId, updatedTasks);
  const target = updatedTasks.find((t) => t.id === taskId);
  const durDesc = target
    ? `${target.optimistic}d/${target.mostLikely}d/${target.pessimistic}d`
    : '';
  const diff = [`Updated task ${taskId}: ${updates.name ?? ''} ${durDesc}`.trim()];

  return {
    plan: { ...plan, tasks: updatedTasks },
    dirtyIds,
    diff,
  };
}

/** Propagates changes across the plan, updating ONLY dirty nodes per AC3. */
export function propagate(plan: PlanState, change: PlanChange): PropagateResult {
  if (change.kind === 'guests') return handleGuests(plan, change.guests);
  if (change.kind === 'budget') return handleBudget(plan, change.budgetInr);
  if (change.kind === 'task') return handleTaskUpdate(plan, change.taskId, change.updates);
  return handleDateOrCity(plan, change);
}

function collectCrunchOptionsForTask(st: ScheduledTask, orig: PlanTask): CrunchOption[] {
  const result: CrunchOption[] = [];
  if (orig.optional && orig.category !== 'milestone') {
    result.push({
      taskId: orig.id,
      taskName: orig.name,
      action: 'drop',
      daysSaved: Math.round(st.expected),
      reason: 'Optional non-core task can be dropped',
    });
  }
  const compressible = Math.round(st.expected - orig.optimistic);
  if (compressible > 0) {
    result.push({
      taskId: orig.id,
      taskName: orig.name,
      action: 'compress',
      daysSaved: compressible,
      reason: `Fast-track to optimistic ${orig.optimistic}d`,
    });
  } else if (orig.dependsOn.length > 1) {
    result.push({
      taskId: orig.id,
      taskName: orig.name,
      action: 'parallelise',
      daysSaved: Math.max(1, Math.round(st.expected / 2)),
      reason: 'Split workstreams across concurrent crews',
    });
  }
  return result;
}

/** Analyzes schedule crunch and ranks mitigation options per AC4. */
export function rankCrunchOptions(
  schedule: Schedule,
  tasks: readonly PlanTask[],
  availableDays: number,
): CrunchAnalysis {
  const shortfall = Math.ceil(schedule.projectDuration - availableDays);
  if (shortfall <= 0) return { shortfallDays: 0, isCrunch: false, options: [] };

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const critical = schedule.tasks.filter((t) => t.critical);
  const options = critical.flatMap((st) => {
    const orig = byId.get(st.id);
    return orig ? collectCrunchOptionsForTask(st, orig) : [];
  });

  options.sort((a, b) => b.daysSaved - a.daysSaved);
  return { shortfallDays: shortfall, isCrunch: true, options };
}
