'use client';

import React from 'react';
import type { PlanTask } from '../../lib/plan/types';

export interface CelebrationRoadmapProps {
  readonly tasks: readonly PlanTask[];
  readonly selectedTaskId?: string;
  readonly onSelectTask: (id: string) => void;
  readonly onOpenVendorSearch?: (need: string) => void;
}

interface PhaseGroup {
  readonly title: string;
  readonly description: string;
  readonly badge: string;
  readonly categories: readonly string[];
}

const PHASES: readonly PhaseGroup[] = [
  {
    title: 'Phase 1: Foundations & Planning',
    description: 'Set your budget and guest expectations before making commitments.',
    badge: 'Step 1 of 4',
    categories: ['planning', 'permits'],
  },
  {
    title: 'Phase 2: Core Vendors & Venue',
    description: 'Lock in date-sensitive anchors early to secure your celebration date.',
    badge: 'Step 2 of 4 (Critical)',
    categories: ['venue', 'food', 'media'],
  },
  {
    title: 'Phase 3: Experiences, Decor & Music',
    description: 'Bring the festive atmosphere to life with sound, styling, and outfits.',
    badge: 'Step 3 of 4',
    categories: ['decor', 'entertainment', 'attire'],
  },
  {
    title: 'Phase 4: Invites & Celebration Countdown',
    description: 'Final rehearsal, guest transport, and enjoying your unforgettable celebration.',
    badge: 'Step 4 of 4',
    categories: ['invites', 'logistics', 'milestone'],
  },
];

function TaskCard({
  task,
  isSelected,
  onSelect,
  onFindVendor,
}: {
  readonly task: PlanTask;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
  readonly onFindVendor?: (need: string) => void;
}): React.JSX.Element {
  const isDone = Boolean(task.done);
  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${
        isSelected
          ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-300'
          : isDone
            ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300'
            : 'border-stone-200/90 bg-white hover:border-stone-400 hover:shadow-xs'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="text-left w-full group focus:outline-none"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {task.category}
          </span>
          {isDone && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              ✓ Ready
            </span>
          )}
        </div>
        <h4 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-amber-800 transition-colors">
          {task.name}
        </h4>
        <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{task.why}</p>
      </button>

      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
        <span className="text-stone-500 font-medium">Est. {task.mostLikely} days</span>
        {task.vendorNeed && !isDone && (
          <button
            type="button"
            onClick={() => onFindVendor?.(task.vendorNeed as string)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Find Vendors &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

function PhaseSection({
  phase,
  tasks,
  selectedTaskId,
  onSelectTask,
  onFindVendor,
}: {
  readonly phase: PhaseGroup;
  readonly tasks: readonly PlanTask[];
  readonly selectedTaskId?: string;
  readonly onSelectTask: (id: string) => void;
  readonly onFindVendor?: (need: string) => void;
}): React.JSX.Element {
  const phaseTasks = tasks.filter((t) => phase.categories.includes(t.category));
  if (phaseTasks.length === 0) return <></>;
  const doneCount = phaseTasks.filter((t) => t.done).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-800">
              {phase.badge}
            </span>
            <h3 className="font-bold text-stone-900 text-base">{phase.title}</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">{phase.description}</p>
        </div>
        <span className="text-xs font-semibold text-stone-600">
          {doneCount}/{phaseTasks.length} Done
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {phaseTasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            isSelected={t.id === selectedTaskId}
            onSelect={() => onSelectTask(t.id)}
            onFindVendor={onFindVendor}
          />
        ))}
      </div>
    </div>
  );
}

export function CelebrationRoadmap({
  tasks,
  selectedTaskId,
  onSelectTask,
  onOpenVendorSearch,
}: CelebrationRoadmapProps): React.JSX.Element {
  return (
    <div className="space-y-8 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
      {PHASES.map((p) => (
        <PhaseSection
          key={p.title}
          phase={p}
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onFindVendor={onOpenVendorSearch}
        />
      ))}
    </div>
  );
}
