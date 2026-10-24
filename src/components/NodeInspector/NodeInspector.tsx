'use client';

import React, { useState } from 'react';
import type { GraphNode } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';

export interface NodeInspectorProps {
  readonly node: GraphNode;
  readonly task?: PlanTask;
  readonly onClose: () => void;
  readonly onUpdateStatus?: (taskId: string, status: { started?: boolean; done?: boolean }) => void;
}

function renderDateGrid(node: GraphNode, task: PlanTask | undefined) {
  const dur = task ? `${task.optimistic}d / ${task.mostLikely}d / ${task.pessimistic}d` : '1d';
  const floatStr =
    node.floatDays > 0 ? `+${Math.round(node.floatDays)} days` : '0 days (Critical Chain)';
  return (
    <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
      <div>
        <span className="text-neutral-400">Earliest Start:</span>
        <p className="font-medium text-neutral-800">{node.startDate || 'Day 0'}</p>
      </div>
      <div>
        <span className="text-neutral-400">Must Start By:</span>
        <p className="font-medium text-neutral-800">{node.mustStartBy || 'On Schedule'}</p>
      </div>
      <div>
        <span className="text-neutral-400">Duration (o/m/p):</span>
        <p className="font-medium text-neutral-800">{dur}</p>
      </div>
      <div>
        <span className="text-neutral-400">Float Slack:</span>
        <p className="font-medium text-neutral-800">{floatStr}</p>
      </div>
    </div>
  );
}

function renderPlanTab(node: GraphNode, task: PlanTask | undefined) {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <span className="font-semibold text-neutral-500">Why this task:</span>
        <p className="text-neutral-800 mt-0.5">
          {task?.why || 'Essential celebration timeline step.'}
        </p>
      </div>
      {renderDateGrid(node, task)}
      {task?.drivers && task.drivers.length > 0 && (
        <div>
          <span className="font-semibold text-neutral-500">Sensitive Drivers:</span>
          <div className="flex gap-1.5 mt-1">
            {task.drivers.map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium capitalize"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderVendorsTab(task: PlanTask | undefined, hasBackup: boolean) {
  if (!task?.vendorNeed) {
    return (
      <p className="text-xs text-neutral-500">This task does not require an external vendor.</p>
    );
  }
  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
        <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
          Required Vendor Need
        </span>
        <p className="text-sm font-semibold text-neutral-900 mt-0.5 capitalize">
          {task.vendorNeed.replace('_', ' ')}
        </p>
        <p className="text-[11px] text-neutral-600 mt-1">
          {hasBackup
            ? 'Primary vendor selected with active Plan B backup held.'
            : 'Search nearby vendors and hold a Plan B backup.'}
        </p>
      </div>
    </div>
  );
}

function renderHeader(node: GraphNode, onClose: () => void) {
  return (
    <div className="p-4 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
            {node.lane}
          </span>
          {node.critical && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">
              Critical
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-neutral-900">{node.name}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close inspector"
        className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
      >
        &times;
      </button>
    </div>
  );
}

function renderTabs(tab: string, setTab: (t: 'plan' | 'vendors') => void, hasVendor: boolean) {
  return (
    <div className="flex border-b border-neutral-100 text-xs px-4">
      <button
        type="button"
        onClick={() => setTab('plan')}
        className={`py-2 px-3 font-medium border-b-2 ${
          tab === 'plan' ? 'border-amber-600 text-amber-900' : 'border-transparent text-neutral-500'
        }`}
      >
        Plan & Dates
      </button>
      {hasVendor && (
        <button
          type="button"
          onClick={() => setTab('vendors')}
          className={`py-2 px-3 font-medium border-b-2 ${
            tab === 'vendors'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-neutral-500'
          }`}
        >
          Vendors & Plan B
        </button>
      )}
    </div>
  );
}

function renderFooter(
  nodeId: string,
  onUpdate?: (id: string, s: { started?: boolean; done?: boolean }) => void,
) {
  return (
    <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-2">
      <button
        type="button"
        onClick={() => onUpdate?.(nodeId, { started: true, done: false })}
        className="flex-1 py-2 text-xs font-medium rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
      >
        Mark Started
      </button>
      <button
        type="button"
        onClick={() => onUpdate?.(nodeId, { started: true, done: true })}
        className="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
      >
        Mark Done
      </button>
    </div>
  );
}

/** Inspector drawer displaying task parameters, dates, vendor details, and status actions (AC7, AC19, AC29). */
export function NodeInspector({ node, task, onClose, onUpdateStatus }: NodeInspectorProps) {
  const [tab, setTab] = useState<'plan' | 'vendors'>('plan');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Task inspector for ${node.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-neutral-200 z-50 flex flex-col"
    >
      {renderHeader(node, onClose)}
      {renderTabs(tab, setTab, Boolean(task?.vendorNeed))}
      <div className="p-4 flex-1 overflow-y-auto">
        {tab === 'plan' ? renderPlanTab(node, task) : renderVendorsTab(task, node.hasBackup)}
      </div>
      {renderFooter(node.id, onUpdateStatus)}
    </div>
  );
}
