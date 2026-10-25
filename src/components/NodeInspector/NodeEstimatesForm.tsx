'use client';

import React, { useEffect, useState } from 'react';
import type { GraphNode } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';
import { EstimateInputs } from './EstimateInputs';

export interface NodeEstimatesFormProps {
  readonly node: GraphNode;
  readonly task?: PlanTask;
  readonly onUpdateTask?: (taskId: string, updates: Partial<PlanTask>) => void;
}

function adjustEstimates(
  field: 'optimistic' | 'mostLikely' | 'pessimistic',
  val: number,
  current: { optimistic: number; mostLikely: number; pessimistic: number },
) {
  const clean = Math.max(0, val);
  let { optimistic, mostLikely, pessimistic } = current;
  if (field === 'optimistic') {
    optimistic = clean;
    mostLikely = Math.max(mostLikely, optimistic);
    pessimistic = Math.max(pessimistic, mostLikely);
  } else if (field === 'mostLikely') {
    mostLikely = clean;
    optimistic = Math.min(optimistic, mostLikely);
    pessimistic = Math.max(pessimistic, mostLikely);
  } else {
    pessimistic = clean;
    mostLikely = Math.min(mostLikely, pessimistic);
    optimistic = Math.min(optimistic, mostLikely);
  }
  return { optimistic, mostLikely, pessimistic };
}

function RenderDateGrid({
  node,
  optimistic,
  mostLikely,
  pessimistic,
}: {
  readonly node: GraphNode;
  readonly optimistic: number;
  readonly mostLikely: number;
  readonly pessimistic: number;
}): React.JSX.Element {
  const dur = `${optimistic}d / ${mostLikely}d / ${pessimistic}d`;
  const floatStr =
    node.floatDays > 0 ? `+${Math.round(node.floatDays)} days` : '0 days (Critical Chain)';
  return (
    <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-xs">
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

function TaskTitleField({
  name,
  onNameChange,
}: {
  readonly name: string;
  readonly onNameChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div>
      <label htmlFor="task-name-input" className="font-semibold text-neutral-500 block mb-1">
        Task Title:
      </label>
      <input
        id="task-name-input"
        aria-label="Task Name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-full p-2 text-xs font-semibold text-stone-900 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white"
      />
    </div>
  );
}

function TaskWhyField({
  why,
  taskWhy,
  onWhyChange,
}: {
  readonly why: string;
  readonly taskWhy?: string;
  readonly onWhyChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div>
      <span className="font-semibold text-neutral-500">Why this task:</span>
      <p className="text-neutral-800 mt-0.5">{taskWhy || 'Essential celebration timeline step.'}</p>
      <input
        id="task-why-input"
        aria-label="Edit task rationale"
        type="text"
        value={why}
        onChange={(e) => onWhyChange(e.target.value)}
        className="mt-1 w-full p-1.5 text-xs text-neutral-800 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white"
        placeholder="Custom rationale..."
      />
    </div>
  );
}

function TaskDriversView({
  drivers,
}: {
  readonly drivers?: readonly string[];
}): React.JSX.Element {
  if (!drivers || drivers.length === 0) return <></>;
  return (
    <div>
      <span className="font-semibold text-neutral-500">Sensitive Drivers:</span>
      <div className="flex gap-1.5 mt-1">
        {drivers.map((d) => (
          <span
            key={d}
            className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium capitalize"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Form for editing optimistic, most likely, and pessimistic PERT duration estimates with input-slider synchronization.
 */
export function NodeEstimatesForm({
  node,
  task,
  onUpdateTask,
}: NodeEstimatesFormProps): React.JSX.Element {
  const [opt, setOpt] = useState(task?.optimistic ?? 1);
  const [ml, setMl] = useState(task?.mostLikely ?? 2);
  const [pess, setPess] = useState(task?.pessimistic ?? 4);
  const [name, setName] = useState(task?.name ?? node.name);
  const [why, setWhy] = useState(task?.why ?? '');

  useEffect(() => {
    if (task) {
      setOpt(task.optimistic);
      setMl(task.mostLikely);
      setPess(task.pessimistic);
      setName(task.name);
      setWhy(task.why);
    }
  }, [task]);

  const handleEstimateChange = (field: 'optimistic' | 'mostLikely' | 'pessimistic', v: number) => {
    const updated = adjustEstimates(field, v, { optimistic: opt, mostLikely: ml, pessimistic: pess });
    setOpt(updated.optimistic);
    setMl(updated.mostLikely);
    setPess(updated.pessimistic);
    onUpdateTask?.(node.id, updated);
  };

  return (
    <div className="space-y-3 text-xs">
      <TaskTitleField name={name} onNameChange={(v) => { setName(v); onUpdateTask?.(node.id, { name: v }); }} />
      <TaskWhyField why={why} taskWhy={task?.why} onWhyChange={(v) => { setWhy(v); onUpdateTask?.(node.id, { why: v }); }} />
      <EstimateInputs opt={opt} ml={ml} pess={pess} onChange={handleEstimateChange} />
      <RenderDateGrid node={node} optimistic={opt} mostLikely={ml} pessimistic={pess} />
      <TaskDriversView drivers={task?.drivers} />
    </div>
  );
}
