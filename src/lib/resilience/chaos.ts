import { computeSchedule } from '../schedule/cpm';
import { probabilityOnTime } from '../schedule/pert';
import type { GraphError, Result, Schedule } from '../schedule/types';
import type { PlanTask, VendorNeedId } from '../plan/types';
import { DISRUPTIONS, isCovered } from './disruptions';
import type { DisruptionEffect, DisruptionScenario, SimulationContext } from './disruptions';

export interface ChaosScenarioSummary {
  readonly scenarioId: string;
  readonly title: string;
  readonly covered: boolean;
  readonly slipDays: number;
}

export interface CompoundDisruptionResult {
  readonly scenariosApplied: readonly ChaosScenarioSummary[];
  readonly originalDurationDays: number;
  readonly disruptedDurationDays: number;
  readonly netSlippageDays: number;
  readonly originalBufferDays: number;
  readonly remainingBufferDays: number;
  readonly originalProbability: number;
  readonly disruptedProbability: number;
  readonly totalBudgetImpactPct: number;
  readonly criticalPathShifted: boolean;
  readonly newlyCriticalTaskIds: readonly string[];
  readonly recoveryActions: readonly string[];
  readonly catastrophicFailure: boolean;
}

function findMatchingEffect(
  task: PlanTask,
  effects: readonly DisruptionEffect[],
): DisruptionEffect | undefined {
  return effects.find(
    (e) =>
      (e.need !== undefined && task.bookingFor === e.need) ||
      (e.category !== undefined && task.category === e.category),
  );
}

function applyCompoundEffects(
  tasks: readonly PlanTask[],
  scenarios: readonly DisruptionScenario[],
  backedUp: ReadonlySet<VendorNeedId>,
): PlanTask[] {
  return tasks.map((task) => {
    let extraDays = 0;
    for (const sc of scenarios) {
      const effect = findMatchingEffect(task, sc.effects);
      if (effect) {
        extraDays += isCovered(sc, backedUp) ? effect.slipDaysWithBackup : effect.slipDays;
      }
    }
    if (extraDays === 0) return task;
    return {
      ...task,
      done: false,
      started: false,
      optimistic: task.optimistic + extraDays,
      mostLikely: task.mostLikely + extraDays,
      pessimistic: task.pessimistic + extraDays,
    };
  });
}

function buildRecoveryProtocols(scenarios: readonly DisruptionScenario[]): readonly string[] {
  const actions: string[] = [];
  for (const sc of scenarios) {
    if (sc.backupPlan) actions.push(`[${sc.title}]: ${sc.backupPlan}`);
  }
  if (actions.length === 0) {
    actions.push('No disruptions active. Schedule buffer is healthy.');
  }
  return actions;
}

function calculateCompoundMetrics(
  scenarios: readonly DisruptionScenario[],
  context: SimulationContext,
) {
  let netAvailableDelta = 0;
  let budgetPct = 0;
  for (const sc of scenarios) {
    netAvailableDelta += sc.availableDaysDelta ?? 0;
    budgetPct += sc.budgetImpactPct ?? 0;
  }
  return { netAvailable: context.availableDays + netAvailableDelta, budgetPct };
}

function buildChaosSummaries(
  scenarios: readonly DisruptionScenario[],
  backedUp: ReadonlySet<VendorNeedId>,
): readonly ChaosScenarioSummary[] {
  return scenarios.map((sc) => ({
    scenarioId: sc.id,
    title: sc.title,
    covered: isCovered(sc, backedUp),
    slipDays: sc.effects.reduce(
      (acc, e) => acc + (isCovered(sc, backedUp) ? e.slipDaysWithBackup : e.slipDays),
      0,
    ),
  }));
}

interface ChaosMetrics {
  readonly origDur: number;
  readonly dispDur: number;
  readonly netAvailable: number;
  readonly remBuffer: number;
  readonly origProb: number;
  readonly dispProb: number;
  readonly budgetPct: number;
  readonly newlyCrit: readonly string[];
}

function assembleChaosResult(
  metrics: ChaosMetrics,
  availableDays: number,
  scenarios: readonly DisruptionScenario[],
  backedUp: ReadonlySet<VendorNeedId>,
): CompoundDisruptionResult {
  return {
    scenariosApplied: buildChaosSummaries(scenarios, backedUp),
    originalDurationDays: Math.round(metrics.origDur),
    disruptedDurationDays: Math.round(metrics.dispDur),
    netSlippageDays: Math.round(metrics.dispDur - metrics.origDur),
    originalBufferDays: Math.round(availableDays - metrics.origDur),
    remainingBufferDays: Math.round(metrics.remBuffer),
    originalProbability: metrics.origProb,
    disruptedProbability: metrics.dispProb,
    totalBudgetImpactPct: Math.round(metrics.budgetPct * 10) / 10,
    criticalPathShifted: metrics.newlyCrit.length > 0,
    newlyCriticalTaskIds: metrics.newlyCrit,
    recoveryActions: buildRecoveryProtocols(scenarios),
    catastrophicFailure: metrics.remBuffer < 0 || metrics.dispProb < 0.2,
  };
}

function computeChaosMetrics(
  before: Schedule,
  after: Schedule,
  scenarios: readonly DisruptionScenario[],
  context: SimulationContext,
): ChaosMetrics {
  const { netAvailable, budgetPct } = calculateCompoundMetrics(scenarios, context);
  const origDur = before.projectDuration;
  const dispDur = after.projectDuration;
  const remBuffer = netAvailable - dispDur;
  const origProb = probabilityOnTime(before, context.availableDays);
  const dispProb = probabilityOnTime(after, netAvailable);

  const prevCritical = new Set(before.criticalPath);
  const newlyCrit = after.criticalPath.filter((id: string) => !prevCritical.has(id));

  return { origDur, dispDur, netAvailable, remBuffer, origProb, dispProb, budgetPct, newlyCrit };
}

/**
 * Simulates compound simultaneous disruptions on the Event Graph schedule,
 * recalculating CPM critical path and dynamic buffer burn.
 */
export function simulateChaosCascade(
  tasks: readonly PlanTask[],
  scenarioIds: readonly string[],
  context: SimulationContext,
): Result<CompoundDisruptionResult, GraphError> {
  const before = computeSchedule(tasks);
  if (!before.ok) return before;

  const scenarios = scenarioIds
    .map((id) => DISRUPTIONS.find((d) => d.id === id))
    .filter((d): d is DisruptionScenario => Boolean(d));

  const disruptedTasks = applyCompoundEffects(tasks, scenarios, context.backedUp);
  const after = computeSchedule(disruptedTasks);
  if (!after.ok) return after;

  const metrics = computeChaosMetrics(before.value, after.value, scenarios, context);
  return {
    ok: true,
    value: assembleChaosResult(metrics, context.availableDays, scenarios, context.backedUp),
  };
}
