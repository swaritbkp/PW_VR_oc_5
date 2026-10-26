import { computeSchedule } from '../schedule/cpm';
import { probabilityOnTime } from '../schedule/pert';
import { diffSchedules } from '../schedule/replan';
import type { ScheduleDiff } from '../schedule/replan';
import type { GraphError, Result } from '../schedule/types';
import type { EventType, PlanTask, TaskCategory, VendorNeedId } from '../plan/types';

export type DisruptionKind =
  'weather' | 'vendor' | 'venue' | 'people' | 'infra' | 'regulatory' | 'date';

/** How a disruption stretches the plan. Slip is the redo time without and with a Plan B ready. */
export interface DisruptionEffect {
  readonly taskId?: string;
  readonly need?: VendorNeedId;
  readonly category?: TaskCategory;
  readonly slipDays: number;
  readonly slipDaysWithBackup: number;
}

export interface SeasonalLikelihood {
  readonly months: readonly number[];
  readonly likelihood: number;
}

export interface DisruptionScenario {
  readonly id: string;
  readonly kind: DisruptionKind;
  readonly title: string;
  readonly backupPlan: string;
  /** 1 (rare) to 5 (likely). */
  readonly likelihood: number;
  /** 1 (minor) to 5 (event-threatening). */
  readonly impact: number;
  readonly seasonal?: readonly SeasonalLikelihood[];
  readonly outdoorOnly?: boolean;
  readonly eventTypes?: readonly EventType[];
  /** Backup vendors that cover this scenario. Empty means it cannot be covered by a vendor. */
  readonly needs: readonly VendorNeedId[];
  readonly effects: readonly DisruptionEffect[];
  /** The event day itself is at risk when no Plan B exists. */
  readonly eventDayRisk?: boolean;
  readonly availableDaysDelta?: number;
  readonly budgetImpactPct?: number;
}

// prettier-ignore
export const DISRUPTIONS: readonly DisruptionScenario[] = [
  { id: 'venue_cancels', kind: 'venue', title: 'Venue cancels or double-books', backupPlan: 'Hold a second hall on a refundable booking.', likelihood: 2, impact: 5, needs: ['venue'], effects: [{ need: 'venue', slipDays: 21, slipDaysWithBackup: 4 }] },
  { id: 'caterer_no_show', kind: 'vendor', title: 'Caterer pulls out', backupPlan: 'Keep a second caterer or halwai on a tasting shortlist.', likelihood: 2, impact: 4, needs: ['caterer'], effects: [{ need: 'caterer', slipDays: 10, slipDaysWithBackup: 2 }] },
  { id: 'photographer_unavailable', kind: 'vendor', title: 'Photographer becomes unavailable', backupPlan: 'Shortlist one more team with the same style.', likelihood: 3, impact: 2, eventTypes: ['wedding', 'birthday'], needs: ['photographer'], effects: [{ need: 'photographer', slipDays: 14, slipDaysWithBackup: 2 }] },
  { id: 'decorator_delay', kind: 'vendor', title: 'Decorator delays or cancels', backupPlan: 'Keep a second decorator and a simple fallback layout.', likelihood: 3, impact: 2, needs: ['decorator'], effects: [{ need: 'decorator', slipDays: 7, slipDaysWithBackup: 1 }] },
  { id: 'music_cancel', kind: 'vendor', title: 'Music or DJ cancels', backupPlan: 'Hold a second DJ or dhol group and a playlist plan.', likelihood: 2, impact: 3, needs: ['music'], effects: [{ need: 'music', slipDays: 5, slipDaysWithBackup: 1 }] },
  { id: 'entertainer_no_show', kind: 'vendor', title: 'Entertainer does not show', backupPlan: 'Keep a second entertainer and a ready activity kit.', likelihood: 2, impact: 3, eventTypes: ['birthday'], needs: ['entertainer'], effects: [{ need: 'entertainer', slipDays: 5, slipDaysWithBackup: 1 }] },
  { id: 'power_cut', kind: 'infra', title: 'Power cut during the event', backupPlan: 'Book a generator with an operator.', likelihood: 3, impact: 4, needs: ['power_backup'], effects: [], eventDayRisk: true },
  { id: 'rain_outdoor', kind: 'weather', title: 'Rain on an outdoor event', backupPlan: 'Book tents or an indoor fallback space.', likelihood: 1, impact: 5, seasonal: [{ months: [7, 8, 9], likelihood: 5 }, { months: [12, 1, 2], likelihood: 2 }], outdoorOnly: true, needs: ['tent_house'], effects: [], eventDayRisk: true },
  { id: 'fog_travel', kind: 'weather', title: 'Dense fog delays travel', backupPlan: 'Arrange transport for key guests and plan a later start.', likelihood: 1, impact: 2, seasonal: [{ months: [12, 1], likelihood: 4 }], needs: ['transport'], effects: [] },
  { id: 'heat_wave', kind: 'weather', title: 'Extreme heat', backupPlan: 'Add shade, cooling and water points, or shift to the evening.', likelihood: 1, impact: 3, seasonal: [{ months: [5, 6], likelihood: 4 }], outdoorOnly: true, needs: ['tent_house'], effects: [], eventDayRisk: true },
  { id: 'permit_denied', kind: 'regulatory', title: 'Permission delayed or denied', backupPlan: 'Hold an alternate venue that needs no special permission.', likelihood: 2, impact: 4, eventTypes: ['community'], needs: ['venue'], effects: [{ category: 'permits', slipDays: 14, slipDaysWithBackup: 3 }] },
  { id: 'guest_surge', kind: 'people', title: 'Guest count jumps by a third', backupPlan: 'Agree a flexible headcount band with the caterer.', likelihood: 3, impact: 3, needs: ['caterer'], effects: [{ taskId: 'W06', need: 'caterer', slipDays: 3, slipDaysWithBackup: 1 }], budgetImpactPct: 15 },
  { id: 'date_pulled_forward', kind: 'date', title: 'Date moves two weeks earlier', backupPlan: 'Cannot be covered by a vendor. Decide what to cut first.', likelihood: 2, impact: 4, needs: [], effects: [], availableDaysDelta: -14 },
];

export interface SimulationContext {
  readonly availableDays: number;
  readonly backedUp: ReadonlySet<VendorNeedId>;
}

interface Snapshot {
  readonly durationDays: number;
  readonly bufferDays: number;
  readonly probability: number;
}

export interface DisruptionResult {
  readonly scenarioId: string;
  /** True when every need that covers this scenario has a backup vendor. */
  readonly covered: boolean;
  readonly before: Snapshot;
  readonly after: Snapshot;
  readonly deltaDays: number;
  readonly criticalPathChanged: boolean;
  readonly eventAtRisk: boolean;
  readonly budgetImpactPct: number;
  readonly diffs: readonly ScheduleDiff[];
}

/** Whether a Plan B exists for this scenario. */
export function isCovered(
  scenario: DisruptionScenario,
  backedUp: ReadonlySet<VendorNeedId>,
): boolean {
  return scenario.needs.length > 0 && scenario.needs.every((need) => backedUp.has(need));
}

function targetEffect(
  task: PlanTask,
  effects: readonly DisruptionEffect[],
): DisruptionEffect | undefined {
  return effects.find(
    (e) =>
      (e.taskId !== undefined && task.id === e.taskId) ||
      (e.need !== undefined && task.bookingFor === e.need) ||
      (e.category !== undefined && task.category === e.category),
  );
}

function disruptTasks(
  tasks: readonly PlanTask[],
  effects: readonly DisruptionEffect[],
  covered: boolean,
): PlanTask[] {
  return tasks.map((task) => {
    const effect = targetEffect(task, effects);
    if (!effect) return task;
    const days = covered ? effect.slipDaysWithBackup : effect.slipDays;
    return {
      ...task,
      done: false,
      started: false,
      optimistic: task.optimistic + days,
      mostLikely: task.mostLikely + days,
      pessimistic: task.pessimistic + days,
    };
  });
}

/** Re-plans the event as if the scenario happened, with or without a Plan B, and reports the damage. */
export function simulateDisruption(
  tasks: readonly PlanTask[],
  scenario: DisruptionScenario,
  context: SimulationContext,
): Result<DisruptionResult, GraphError> {
  const before = computeSchedule(tasks);
  if (!before.ok) return before;
  const covered = isCovered(scenario, context.backedUp);
  const after = computeSchedule(disruptTasks(tasks, scenario.effects, covered));
  if (!after.ok) return after;
  const availableAfter = context.availableDays + (scenario.availableDaysDelta ?? 0);
  const snap = (duration: number, available: number, sigma: number): Snapshot => ({
    durationDays: duration,
    bufferDays: available - duration,
    probability: probabilityOnTime({ ...after.value, projectDuration: duration, sigma }, available),
  });
  const beforeSnap = snap(before.value.projectDuration, context.availableDays, before.value.sigma);
  const afterSnap = snap(after.value.projectDuration, availableAfter, after.value.sigma);
  return {
    ok: true,
    value: {
      scenarioId: scenario.id,
      covered,
      before: beforeSnap,
      after: afterSnap,
      deltaDays: after.value.projectDuration - before.value.projectDuration,
      criticalPathChanged: before.value.criticalPath.join() !== after.value.criticalPath.join(),
      eventAtRisk: (scenario.eventDayRisk === true && !covered) || afterSnap.bufferDays < 0,
      budgetImpactPct: scenario.budgetImpactPct ?? 0,
      diffs: diffSchedules(before.value, after.value),
    },
  };
}
