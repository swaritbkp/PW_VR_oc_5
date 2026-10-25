'use client';

import React, { useState } from 'react';
import type { GraphNode } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';
import { IconCheckCircle } from '../UI/JashnIcons';
import { NodeEstimatesForm } from './NodeEstimatesForm';

export interface NodeInspectorProps {
  readonly node: GraphNode;
  readonly task?: PlanTask;
  readonly onClose: () => void;
  readonly onUpdateStatus?: (taskId: string, status: { started?: boolean; done?: boolean }) => void;
  readonly onUpdateTask?: (taskId: string, updates: Partial<PlanTask>) => void;
}

const VALID_LANES = new Set(['venue', 'food', 'decor', 'media', 'music', 'logistics']);

const LANE_ICONS: Record<string, string> = {
  planning: '📋',
  venue: '🏛️',
  food: '🍲',
  decor: '🌺',
  media: '📸',
  entertainment: '🎵',
  attire: '👗',
  invites: '💌',
  logistics: '🚚',
  milestone: '💎',
};

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

function renderBanner(lane: string) {
  const artLane = VALID_LANES.has(lane) ? lane : 'venue';
  return (
    <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-stone-100 shrink-0 border-b border-stone-200/60">
      <img
        src={`/art/cat-${artLane}.png`}
        alt={`Category banner for ${lane}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-stone-900/60 via-transparent to-transparent" />
      <span className="absolute bottom-2 left-4 text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">
        {lane}
      </span>
    </div>
  );
}

function renderHeader(node: GraphNode, task: PlanTask | undefined, onClose: () => void) {
  const icon = LANE_ICONS[node.lane] ?? '✨';
  return (
    <div className="p-4 border-b border-stone-200/80 flex items-start justify-between bg-stone-50/80">
      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-sm shrink-0 select-none">
          {icon}
        </span>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-800">
              {node.lane}
            </span>
            {node.critical && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                Critical
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-stone-900 leading-snug">
            {task?.name ?? node.name}
          </h3>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close inspector"
        className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
      >
        ✕
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
        className="flex-1 py-2 text-xs font-medium rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
      >
        Mark Started
      </button>
      <button
        type="button"
        onClick={() => onUpdate?.(nodeId, { started: true, done: true })}
        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
      >
        <IconCheckCircle className="w-3.5 h-3.5" />
        <span>Mark Done</span>
      </button>
    </div>
  );
}

/** Inspector drawer displaying task parameters, dates, vendor details, and status actions (AC7, AC19, AC29). */
export function NodeInspector({
  node,
  task,
  onClose,
  onUpdateStatus,
  onUpdateTask,
}: NodeInspectorProps): React.JSX.Element {
  const [tab, setTab] = useState<'plan' | 'vendors'>('plan');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Task inspector for ${node.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-104 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-stone-200 z-50 flex flex-col transition-all duration-300"
    >
      {renderBanner(node.lane)}
      {renderHeader(node, task, onClose)}
      {renderTabs(tab, setTab, Boolean(task?.vendorNeed))}
      <div className="p-4 flex-1 overflow-y-auto">
        {tab === 'plan' ? (
          <NodeEstimatesForm node={node} task={task} onUpdateTask={onUpdateTask} />
        ) : (
          renderVendorsTab(task, node.hasBackup)
        )}
      </div>
      {renderFooter(node.id, onUpdateStatus)}
    </div>
  );
}
