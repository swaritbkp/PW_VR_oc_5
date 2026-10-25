'use client';

import React, { useEffect, useState } from 'react';
import type { GraphNode } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';

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
    if (mostLikely < optimistic) mostLikely = optimistic;
    if (pessimistic < mostLikely) pessimistic = mostLikely;
  } else if (field === 'mostLikely') {
    mostLikely = clean;
    if (optimistic > mostLikely) optimistic = mostLikely;
    if (pessimistic < mostLikely) pessimistic = mostLikely;
  } else {
    pessimistic = clean;
    if (mostLikely > pessimistic) mostLikely = pessimistic;
    if (optimistic > mostLikely) optimistic = mostLikely;
  }
  return { optimistic, mostLikely, pessimistic };
}

function renderDateGrid(
  node: GraphNode,
  optimistic: number,
  mostLikely: number,
  pessimistic: number,
) {
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

function renderEstimateInputs(
  opt: number,
  ml: number,
  pess: number,
  onChange: (field: 'optimistic' | 'mostLikely' | 'pessimistic', v: number) => void,
) {
  const expected = Math.round(((opt + 4 * ml + pess) / 6) * 10) / 10;
  return (
    <div className="space-y-1.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-stone-800">Duration Estimates (PERT Days)</span>
        <span className="font-bold text-amber-900 tabular-nums">Expected: {expected}d</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div>
          <label
            htmlFor="input-opt"
            className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5"
          >
            Optimistic
          </label>
          <input
            id="input-opt"
            aria-label="Optimistic duration days"
            type="number"
            min="0"
            value={opt}
            onChange={(e) => onChange('optimistic', parseInt(e.target.value, 10) || 0)}
            className="w-full p-1.5 text-xs font-bold text-center border border-stone-200 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label
            htmlFor="input-ml"
            className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5"
          >
            Most Likely
          </label>
          <input
            id="input-ml"
            aria-label="Most likely duration days"
            type="number"
            min="0"
            value={ml}
            onChange={(e) => onChange('mostLikely', parseInt(e.target.value, 10) || 0)}
            className="w-full p-1.5 text-xs font-bold text-center border border-stone-200 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label
            htmlFor="input-pess"
            className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5"
          >
            Pessimistic
          </label>
          <input
            id="input-pess"
            aria-label="Pessimistic duration days"
            type="number"
            min="0"
            value={pess}
            onChange={(e) => onChange('pessimistic', parseInt(e.target.value, 10) || 0)}
            className="w-full p-1.5 text-xs font-bold text-center border border-stone-200 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
    </div>
  );
}

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
    const updated = adjustEstimates(field, v, {
      optimistic: opt,
      mostLikely: ml,
      pessimistic: pess,
    });
    setOpt(updated.optimistic);
    setMl(updated.mostLikely);
    setPess(updated.pessimistic);
    onUpdateTask?.(node.id, updated);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    onUpdateTask?.(node.id, { name: val });
  };

  const handleWhyChange = (val: string) => {
    setWhy(val);
    onUpdateTask?.(node.id, { why: val });
  };

  return (
    <div className="space-y-3 text-xs">
      <div>
        <label htmlFor="task-name-input" className="font-semibold text-neutral-500 block mb-1">
          Task Title:
        </label>
        <input
          id="task-name-input"
          aria-label="Task Name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full p-2 text-xs font-semibold text-stone-900 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white"
        />
      </div>

      <div>
        <span className="font-semibold text-neutral-500">Why this task:</span>
        <p className="text-neutral-800 mt-0.5">
          {task?.why || 'Essential celebration timeline step.'}
        </p>
        <input
          id="task-why-input"
          aria-label="Edit task rationale"
          type="text"
          value={why}
          onChange={(e) => handleWhyChange(e.target.value)}
          className="mt-1 w-full p-1.5 text-xs text-neutral-800 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white"
          placeholder="Custom rationale..."
        />
      </div>

      {renderEstimateInputs(opt, ml, pess, handleEstimateChange)}
      {renderDateGrid(node, opt, ml, pess)}

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
