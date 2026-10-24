'use client';

import React from 'react';
import type { GraphNode } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';

export interface EventGraphListProps {
  readonly nodes: readonly GraphNode[];
  readonly tasks: readonly PlanTask[];
  readonly selectedNodeId?: string;
  readonly onSelectNode: (id: string) => void;
}

function getTaskDetails(tasks: readonly PlanTask[], id: string) {
  return tasks.find((t) => t.id === id);
}

function renderNodeItem(
  node: GraphNode,
  task: PlanTask | undefined,
  isSelected: boolean,
  onSelectNode: (id: string) => void,
) {
  const isCritical = node.critical;
  const statusLabel = node.done ? 'Done' : node.started ? 'In Progress' : 'Pending';

  return (
    <li
      key={node.id}
      className={`p-4 rounded-lg border transition-all ${
        isSelected
          ? 'border-amber-600 bg-amber-50/50 shadow-sm'
          : 'border-neutral-200 bg-white hover:border-neutral-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
              {node.lane}
            </span>
            {isCritical && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                Critical Path
              </span>
            )}
            {node.hasBackup && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-dashed border-indigo-300">
                Plan B
              </span>
            )}
            <span className="text-xs text-neutral-500">{statusLabel}</span>
          </div>
          <h4 className="font-medium text-neutral-900 text-base">{node.name}</h4>
          <p className="text-xs text-neutral-600 mt-1">
            {node.startDate ? `Starts: ${node.startDate}` : ''}
            {node.mustStartBy ? ` • Must start by: ${node.mustStartBy}` : ''}
            {node.floatDays > 0 ? ` • Slack: +${Math.round(node.floatDays)}d` : ' • Zero slack'}
          </p>
          {task?.why && <p className="text-xs text-neutral-500 mt-0.5 italic">{task.why}</p>}
        </div>

        <button
          type="button"
          onClick={() => onSelectNode(node.id)}
          aria-label={`Inspect ${node.name}`}
          className={`self-start sm:self-center px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isSelected
              ? 'bg-amber-600 text-white focus:ring-amber-500'
              : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-neutral-400'
          }`}
        >
          {isSelected ? 'Inspecting' : 'Inspect'}
        </button>
      </div>
    </li>
  );
}

/** Accessible vertical timeline list view for the event graph (AC7, AC16, AC19). */
export function EventGraphList({
  nodes,
  tasks,
  selectedNodeId,
  onSelectNode,
}: EventGraphListProps) {
  if (nodes.length === 0) {
    return <div className="p-8 text-center text-neutral-500 text-sm">No tasks in graph.</div>;
  }

  return (
    <div className="w-full">
      <ul className="space-y-3" role="list" aria-label="Event tasks timeline list">
        {nodes.map((node) => {
          const task = getTaskDetails(tasks, node.id);
          const isSelected = node.id === selectedNodeId;
          return renderNodeItem(node, task, isSelected, onSelectNode);
        })}
      </ul>
    </div>
  );
}
