import type { Alert } from '../schedule/sentinel';
import type { Schedule } from '../schedule/types';
import type { EventType, PlanTask, VendorNeedId } from '../plan/types';
import { DISRUPTIONS, isCovered } from './disruptions';
import type { DisruptionScenario } from './disruptions';
import type { SeasonProfile } from './seasonality';

const FULL_SCORE = 100;

export interface RiskContext {
  readonly eventType: EventType;
  readonly outdoor: boolean;
  /** Calendar month 1-12 of the event. */
  readonly month: number;
  readonly backedUp: ReadonlySet<VendorNeedId>;
}

export interface RankedRisk {
  readonly scenario: DisruptionScenario;
  readonly likelihood: number;
  readonly exposure: number;
  readonly covered: boolean;
  readonly coverable: boolean;
}

function likelihoodFor(scenario: DisruptionScenario, month: number): number {
  const match = scenario.seasonal?.find((s) => s.months.includes(month));
  return match ? match.likelihood : scenario.likelihood;
}

function applies(scenario: DisruptionScenario, context: RiskContext): boolean {
  if (scenario.outdoorOnly && !context.outdoor) return false;
  return !scenario.eventTypes || scenario.eventTypes.includes(context.eventType);
}

/** Risks that apply to this event, ranked by exposure (likelihood times impact), highest first. */
export function rankRisks(
  context: RiskContext,
  scenarios: readonly DisruptionScenario[] = DISRUPTIONS,
): RankedRisk[] {
  return scenarios
    .filter((s) => applies(s, context))
    .map((scenario) => {
      const likelihood = likelihoodFor(scenario, context.month);
      return {
        scenario,
        likelihood,
        exposure: likelihood * scenario.impact,
        covered: isCovered(scenario, context.backedUp),
        coverable: scenario.needs.length > 0,
      };
    })
    .sort((a, b) => b.exposure - a.exposure || a.scenario.id.localeCompare(b.scenario.id));
}

/** Share (0-100) of coverable risk exposure that already has a Plan B. 100 when nothing is coverable. */
export function resilienceScore(risks: readonly RankedRisk[]): number {
  const coverable = risks.filter((r) => r.coverable);
  const total = coverable.reduce((sum, r) => sum + r.exposure, 0);
  if (total === 0) return FULL_SCORE;
  const covered = coverable.filter((r) => r.covered).reduce((sum, r) => sum + r.exposure, 0);
  return Math.round((covered / total) * FULL_SCORE);
}

/** R6: critical booking tasks that still have no backup vendor. */
export function backupAlerts(
  schedule: Schedule,
  tasks: readonly PlanTask[],
  backedUp: ReadonlySet<VendorNeedId>,
): Alert[] {
  const need = new Map(tasks.map((t) => [t.id, t.bookingFor]));
  return schedule.tasks
    .filter((t) => t.critical && !t.done && need.get(t.id) !== undefined && !backedUp.has(need.get(t.id) as VendorNeedId))
    .map((t) => ({
      ruleId: 'R6_NO_BACKUP' as const,
      severity: 'warning' as const,
      taskId: t.id,
      params: { need: need.get(t.id) as string },
    }));
}

/** R7: seasonal risks for the event date (weather for outdoor events, peak-season crowding). */
export function seasonAlerts(profile: SeasonProfile, outdoor: boolean): Alert[] {
  const alerts: Alert[] = [];
  const add = (risk: string, severity: Alert['severity']): void => {
    alerts.push({ ruleId: 'R7_SEASON_RISK', severity, params: { risk } });
  };
  if (outdoor && profile.monsoon) add('monsoon', 'warning');
  if (outdoor && profile.heatWave) add('heat', 'warning');
  if (profile.fog) add('fog', 'info');
  if (profile.weddingPeak) add('peak_season', 'info');
  return alerts;
}
