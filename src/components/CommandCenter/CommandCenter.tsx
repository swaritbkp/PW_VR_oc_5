'use client';

import React from 'react';
import type { ScheduledTask } from '../../lib/schedule/types';
import type { Alert } from '../../lib/schedule/sentinel';
import type { AllocationResult, ReconcileResult } from '../../lib/budget/engine';
import { formatInr } from '../../lib/format';

export interface CommandCenterProps {
  readonly daysLeft: number;
  readonly probabilityOnTime: number;
  readonly budgetSummary: AllocationResult;
  readonly budgetReconciliation: ReconcileResult;
  readonly nextAction?: ScheduledTask;
  readonly alerts: readonly Alert[];
  readonly onSelectTask?: (taskId: string) => void;
}

function renderGauge(probability: number) {
  const pct = Math.round(probability * 100);
  const color = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-50 border border-neutral-100">
      <span className="text-xs text-neutral-500 font-medium">P(ready on time)</span>
      <span className={`text-2xl font-bold ${color}`}>{pct}%</span>
      <span className="text-[10px] text-neutral-400 mt-0.5">PERT Normal Approx. (P80 target)</span>
    </div>
  );
}

function renderNextAction(task: ScheduledTask | undefined, onSelectTask?: (id: string) => void) {
  if (!task) {
    return (
      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <span className="text-xs font-semibold text-emerald-800">Next Action</span>
        <p className="text-xs text-emerald-700 mt-1">
          All ready tasks are completed! Celebration is prepared.
        </p>
      </div>
    );
  }
  return (
    <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-900">Next Best Action</span>
        <span className="text-[11px] text-amber-700 font-medium">
          {task.totalFloat <= 0 ? 'Critical' : `Slack: +${Math.round(task.totalFloat)}d`}
        </span>
      </div>
      <p className="text-sm font-semibold text-neutral-900 mt-1">{task.name}</p>
      <button
        type="button"
        onClick={() => onSelectTask?.(task.id)}
        className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
      >
        Focus task on graph &rarr;
      </button>
    </div>
  );
}

function renderAlerts(alerts: readonly Alert[]) {
  if (alerts.length === 0) {
    return <p className="text-xs text-neutral-400">No active Sentinel alerts. Plan is healthy.</p>;
  }
  return (
    <ul className="space-y-1.5 max-h-36 overflow-y-auto" role="list">
      {alerts.slice(0, 5).map((a, i) => {
        const isCrit = a.severity === 'critical';
        const badgeColor = isCrit
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-amber-100 text-amber-800 border-amber-200';
        return (
          <li
            key={`${a.ruleId}-${i}`}
            className="text-xs p-2 rounded border border-neutral-100 bg-neutral-50 flex items-start justify-between gap-2"
          >
            <div>
              <span
                className={`inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border mr-1.5 ${badgeColor}`}
              >
                {a.ruleId}
              </span>
              <span className="text-neutral-700">
                {a.taskId ? `Task ${a.taskId}` : 'Plan buffer'}
              </span>
            </div>
            <span className="text-[10px] font-medium text-neutral-500 capitalize">
              {a.severity}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Command Center panel displaying countdown, P(ready), Next Action, and Sentinel Alerts (AC10, AC12, AC13). */
export function CommandCenter({
  daysLeft,
  probabilityOnTime: prob,
  budgetSummary: budget,
  budgetReconciliation: recon,
  nextAction,
  alerts,
  onSelectTask,
}: CommandCenterProps) {
  return (
    <div className="w-full bg-white border border-neutral-200 rounded-xl p-4 shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-50 border border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium">Countdown</span>
          <span className="text-2xl font-bold text-neutral-900">
            {daysLeft > 0 ? `${daysLeft}d` : 'Today'}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">Days to Celebration</span>
        </div>

        {renderGauge(prob)}

        <div className="flex flex-col justify-center p-3 rounded-lg bg-neutral-50 border border-neutral-100">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-neutral-500 font-medium">Allocated Budget</span>
            <span
              className={`font-semibold capitalize text-xs ${recon.status === 'fits' ? 'text-emerald-700' : 'text-amber-700'}`}
            >
              {recon.status}
            </span>
          </div>
          <span className="text-lg font-bold text-neutral-900">{formatInr(budget.grandTotal)}</span>
          <span className="text-[10px] text-neutral-500 mt-0.5">
            Contingency: {formatInr(budget.contingencyInr)} (10%)
          </span>
        </div>

        <div>{renderNextAction(nextAction, onSelectTask)}</div>
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-semibold text-neutral-800">
            Sentinel Risk Radar ({alerts.length})
          </h4>
          <span className="text-[10px] text-neutral-400">Rules R1–R7 ranked</span>
        </div>
        {renderAlerts(alerts)}
      </div>
    </div>
  );
}
