'use client';

import React from 'react';
import type { ScheduledTask } from '../../lib/schedule/types';
import type { Alert } from '../../lib/schedule/sentinel';
import type { AllocationResult, ReconcileResult } from '../../lib/budget/engine';
import type { PlanTask } from '../../lib/plan/types';
import { ReadinessGauge } from './ReadinessGauge';
import { BudgetDonut } from './BudgetDonut';
import { IconTimeline } from '../UI/JashnIcons';

export interface CommandCenterProps {
  readonly daysLeft: number;
  readonly probabilityOnTime: number;
  readonly budgetSummary: AllocationResult;
  readonly budgetReconciliation: ReconcileResult;
  readonly nextAction?: ScheduledTask;
  readonly alerts: readonly Alert[];
  readonly tasks?: readonly PlanTask[];
  readonly onSelectTask?: (taskId: string) => void;
  readonly onOpenBudget?: () => void;
}

function CountdownCard({ daysLeft }: { readonly daysLeft: number }): React.JSX.Element {
  const progressPct = Math.min(100, Math.max(10, 100 - (daysLeft / 90) * 100));
  return (
    <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-600">Event Countdown</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          Peak Season
        </span>
      </div>
      <div className="my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black tabular-nums tracking-tight text-stone-900">
            {daysLeft > 0 ? `${daysLeft}d` : 'Today'}
          </span>
          <span className="text-xs font-semibold text-stone-500">remaining</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] text-stone-500">Target locked for celebration day</span>
    </div>
  );
}

function NextActionCard({
  task,
  onSelectTask,
}: {
  readonly task?: ScheduledTask;
  readonly onSelectTask?: (taskId: string) => void;
}): React.JSX.Element {
  if (!task) {
    return (
      <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-stone-600">Next Best Action</span>
        <p className="text-xs text-stone-500 my-2">All tasks completed or plan is awaiting start.</p>
        <span className="text-[10px] text-stone-500">Plan on track</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-950">Next Best Action</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
          Critical Path
        </span>
      </div>
      <div className="my-1">
        <p className="text-sm font-bold text-stone-900 line-clamp-1">{task.name}</p>
        <p className="text-xs text-stone-600">Expected duration: {Math.round(task.expected)} days</p>
      </div>
      <button
        type="button"
        onClick={() => onSelectTask?.(task.id)}
        className="w-full mt-1 py-1.5 px-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
      >
        <IconTimeline className="w-3.5 h-3.5" />
        <span>Focus task on graph</span>
      </button>
    </div>
  );
}

function resolveAlertGuidance(ruleId: string): string {
  if (ruleId === 'R1_START_SOON') return 'Critical Path Milestone — Scheduled to start soon';
  if (ruleId === 'R2_OVERDUE') return 'Action overdue — Immediate focus required';
  if (ruleId === 'R3_NO_BUFFER') return 'Zero float — Critical path item';
  if (ruleId === 'R5_NEAR_CRITICAL') return 'Near critical — Buffer < 2 days';
  if (ruleId === 'R6_NO_BACKUP') return 'Missing Plan B backup vendor';
  return 'Actionable milestone review';
}

function getAlertBadge(severity: string) {
  if (severity === 'critical') return { badge: 'Critical', badgeColor: 'bg-red-50 text-red-800 border-red-200' };
  if (severity === 'warning') return { badge: '⚠ At Risk', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' };
  return { badge: '✓ On Track', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

function resolveTaskTitle(taskId: string, tasks?: readonly PlanTask[]): string {
  const task = tasks?.find((t) => t.id === taskId);
  if (task) return task.name;
  if (taskId === 'W01') return 'Lock Venue & Grounds Deposit';
  if (taskId === 'W02') return 'Finalize Feast & Catering Menu';
  return `Task ${taskId}`;
}

function formatAlertItem(a: Alert, tasks?: readonly PlanTask[]) {
  const { badge, badgeColor } = getAlertBadge(a.severity);
  if (!a.taskId) {
    return { badge, text: 'Seasonal timeline buffer notice — Monitor venue availability', badgeColor };
  }
  const taskName = resolveTaskTitle(a.taskId, tasks);
  const guidance = resolveAlertGuidance(a.ruleId);
  return { badge, text: `${taskName} — ${guidance}`, badgeColor };
}

function AlertList({
  alerts,
  tasks,
}: {
  readonly alerts: readonly Alert[];
  readonly tasks?: readonly PlanTask[];
}): React.JSX.Element {
  if (alerts.length === 0) {
    return (
      <p className="text-xs text-stone-500 py-1">
        ✓ Everything is running smoothly! No timeline or budget risks detected.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5 max-h-36 overflow-y-auto" role="list">
      {alerts.slice(0, 5).map((a, i) => {
        const item = formatAlertItem(a, tasks);
        return (
          <li
            key={`${a.ruleId}-${i}`}
            className="text-xs p-2 rounded-xl border border-stone-100 bg-stone-50/60 flex items-start justify-between gap-2"
          >
            <div>
              <span
                className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border mr-1.5 ${item.badgeColor}`}
              >
                {item.badge}
              </span>
              <span className="text-stone-700 font-medium">{item.text}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-stone-400 capitalize">{a.ruleId}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Executive Command Center displaying the readiness gauge, budget allocation donut, next critical action, and live alerts.
 */
export function CommandCenter({
  daysLeft,
  probabilityOnTime: prob,
  budgetSummary: budget,
  budgetReconciliation: recon,
  nextAction,
  alerts,
  tasks,
  onSelectTask,
  onOpenBudget,
}: CommandCenterProps): React.JSX.Element {
  return (
    <section aria-label="Command Center" className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
        <CountdownCard daysLeft={daysLeft} />
        <ReadinessGauge probability={prob} />
        <BudgetDonut budget={budget} reconciliation={recon} onOpenBudget={onOpenBudget} />
        <NextActionCard task={nextAction} onSelectTask={onSelectTask} />
      </div>

      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Plan Health & Proactive Checklist ({alerts.length})
          </h4>
          <span className="text-[11px] font-semibold text-stone-500">
            Automated Readiness Checks
          </span>
        </div>
        <AlertList alerts={alerts} tasks={tasks} />
      </div>
    </section>
  );
}
