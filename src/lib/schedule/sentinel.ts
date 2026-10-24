import { bufferDays } from './cpm';
import type { Schedule, ScheduledTask } from './types';

export type Severity = 'critical' | 'warning' | 'info';
export type RuleId =
  | 'R1_START_SOON'
  | 'R2_OVERDUE'
  | 'R3_NO_BUFFER'
  | 'R4_LOW_CONFIDENCE'
  | 'R5_NEAR_CRITICAL'
  | 'R6_NO_BACKUP'
  | 'R7_SEASON_RISK';

/** A deterministic alert. Wording is produced by the UI from ruleId + params. */
export interface Alert {
  readonly ruleId: RuleId;
  readonly severity: Severity;
  readonly taskId?: string;
  readonly params: Readonly<Record<string, number | string>>;
}

export interface SentinelContext {
  readonly schedule: Schedule;
  /** Current day offset from plan start. */
  readonly today: number;
  readonly availableDays: number;
  readonly probabilityOnTime: number;
}

const START_SOON_DAYS = 3;
const NEAR_CRITICAL_FLOAT_DAYS = 2;
const LOW_CONFIDENCE = 0.8;
const VERY_LOW_CONFIDENCE = 0.5;
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

function pending(task: ScheduledTask): boolean {
  return !task.started && !task.done;
}

function taskAlerts(task: ScheduledTask, buffer: number, today: number): Alert[] {
  if (!pending(task)) return [];
  const mustStartBy = task.latestStart + buffer;
  const daysLeft = mustStartBy - today;
  if (daysLeft < 0) {
    return [
      {
        ruleId: 'R2_OVERDUE',
        severity: 'critical',
        taskId: task.id,
        params: { daysLate: -daysLeft },
      },
    ];
  }
  if (task.critical && daysLeft <= START_SOON_DAYS) {
    return [
      { ruleId: 'R1_START_SOON', severity: 'critical', taskId: task.id, params: { daysLeft } },
    ];
  }
  return [];
}

function planAlerts(ctx: SentinelContext, buffer: number): Alert[] {
  const alerts: Alert[] = [];
  if (buffer < 0) {
    alerts.push({
      ruleId: 'R3_NO_BUFFER',
      severity: 'critical',
      params: { shortfallDays: -buffer },
    });
  }
  if (ctx.probabilityOnTime < LOW_CONFIDENCE) {
    const severity: Severity = ctx.probabilityOnTime < VERY_LOW_CONFIDENCE ? 'critical' : 'warning';
    alerts.push({
      ruleId: 'R4_LOW_CONFIDENCE',
      severity,
      params: { probability: ctx.probabilityOnTime },
    });
  }
  const near = ctx.schedule.tasks.filter(
    (t) => pending(t) && !t.critical && t.totalFloat + buffer <= NEAR_CRITICAL_FLOAT_DAYS,
  );
  if (near.length > 0) {
    alerts.push({ ruleId: 'R5_NEAR_CRITICAL', severity: 'info', params: { count: near.length } });
  }
  return alerts;
}

/** Runs every rule and returns alerts ranked by severity, then rule, then task. */
export function evaluate(ctx: SentinelContext): readonly Alert[] {
  const buffer = bufferDays(ctx.schedule, ctx.availableDays);
  const alerts = [
    ...ctx.schedule.tasks.flatMap((t) => taskAlerts(t, buffer, ctx.today)),
    ...planAlerts(ctx, buffer),
  ];
  return alerts.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.ruleId.localeCompare(b.ruleId) ||
      (a.taskId ?? '').localeCompare(b.taskId ?? ''),
  );
}

/** The one task to do next: ready, not started, with the least slack. */
export function nextBestAction(
  schedule: Schedule,
  availableDays: number,
): ScheduledTask | undefined {
  const buffer = bufferDays(schedule, availableDays);
  const done = new Set(schedule.tasks.filter((t) => t.done).map((t) => t.id));
  const ready = schedule.tasks.filter((t) => pending(t) && t.dependsOn.every((d) => done.has(d)));
  return [...ready].sort(
    (a, b) => a.totalFloat + buffer - (b.totalFloat + buffer) || a.earliestStart - b.earliestStart,
  )[0];
}
