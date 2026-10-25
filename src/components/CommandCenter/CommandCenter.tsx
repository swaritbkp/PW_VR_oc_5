'use client';

import React from 'react';
import type { ScheduledTask } from '../../lib/schedule/types';
import type { Alert } from '../../lib/schedule/sentinel';
import type { AllocationResult, ReconcileResult } from '../../lib/budget/engine';
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
      <div className="text-[10px] font-medium text-stone-500 flex items-center justify-between pt-1 border-t border-stone-100">
        <span>Timeline Target: 75 days</span>
        <span className="text-amber-700 font-semibold">Seasonal Buffer Active</span>
      </div>
    </div>
  );
}

function NextActionCard({
  task,
  onSelectTask,
}: {
  readonly task: ScheduledTask | undefined;
  readonly onSelectTask?: (id: string) => void;
}): React.JSX.Element {
  if (!task) {
    return (
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs flex flex-col justify-center">
        <span className="text-xs font-bold text-emerald-900">Next Action</span>
        <p className="text-xs text-emerald-800 mt-1">
          All ready tasks are completed! Celebration is prepared.
        </p>
      </div>
    );
  }
  const isCrit = task.totalFloat <= 0;
  return (
    <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-600">Next Best Action</span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isCrit
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {isCrit ? 'Needs Decision' : `Flexible: +${Math.round(task.totalFloat)}d`}
        </span>
      </div>
      <p className="text-sm font-bold text-stone-900 truncate my-1">{task.name}</p>
      <button
        type="button"
        onClick={() => onSelectTask?.(task.id)}
        className="w-full py-1.5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
      >
        <IconTimeline className="w-3.5 h-3.5" />
        <span>Focus task on graph &rarr;</span>
      </button>
    </div>
  );
}

function AlertList({ alerts }: { readonly alerts: readonly Alert[] }): React.JSX.Element {
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
        const isCrit = a.severity === 'critical';
        const badgeColor = isCrit
          ? 'bg-red-50 text-red-800 border-red-200'
          : 'bg-amber-50 text-amber-800 border-amber-200';
        return (
          <li
            key={`${a.ruleId}-${i}`}
            className="text-xs p-2 rounded-xl border border-stone-100 bg-stone-50/60 flex items-start justify-between gap-2"
          >
            <div>
              <span
                className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border mr-1.5 ${badgeColor}`}
              >
                {a.ruleId}
              </span>
              <span className="text-stone-700 font-medium">
                {a.taskId ? `Check status for ${a.taskId}` : 'Seasonal timeline buffer notice'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-stone-500 capitalize">{a.severity}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function CommandCenter({
  daysLeft,
  probabilityOnTime: prob,
  budgetSummary: budget,
  budgetReconciliation: recon,
  nextAction,
  alerts,
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
        <AlertList alerts={alerts} />
      </div>
    </section>
  );
}
