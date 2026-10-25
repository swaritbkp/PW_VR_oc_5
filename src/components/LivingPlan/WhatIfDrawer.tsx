'use client';

import React, { useMemo, useState } from 'react';
import { formatInr } from '@/lib/format';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import type { VersionStore } from '@/lib/plan/versions';
import { DiffChips } from './DiffChips';
import { VersionsPanel } from './VersionsPanel';

export interface WhatIfDrawerProps {
  readonly currentPlan: PlanState;
  readonly versionStore: VersionStore;
  readonly onClose: () => void;
  readonly onCommit: (newPlan: PlanState, summary: string) => void;
  readonly onRestore: (versionId: string) => void;
  readonly onUndo: () => void;
}

function renderGuestControl(guests: number, setGuests: (g: number) => void) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
        <label htmlFor="whatif-guests">Guest Count</label>
        <div className="flex items-center gap-1.5">
          <input
            id="whatif-guests-input"
            aria-label="Exact guests"
            type="number"
            min="1"
            max="10000"
            value={guests}
            onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-18 p-1 text-xs font-bold text-center border border-stone-300 rounded-md bg-white focus:ring-1 focus:ring-amber-500"
          />
          <span className="font-mono text-amber-800 text-xs">guests</span>
        </div>
      </div>
      <input
        id="whatif-guests"
        type="range"
        min="10"
        max="1000"
        step="10"
        value={Math.min(1000, Math.max(10, guests))}
        onChange={(e) => setGuests(parseInt(e.target.value, 10))}
        className="w-full accent-amber-700"
      />
    </div>
  );
}

function renderBudgetControl(budget: number, setBudget: (b: number) => void) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
        <label htmlFor="whatif-budget">Target Budget</label>
        <div className="flex items-center gap-1.5">
          <input
            id="whatif-budget-input"
            aria-label="Exact INR budget"
            type="number"
            min="1000"
            step="10000"
            value={budget}
            onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value, 10) || 1000))}
            className="w-24 p-1 text-xs font-bold text-right border border-stone-300 rounded-md bg-white focus:ring-1 focus:ring-amber-500"
          />
          <span className="font-mono text-amber-800 text-xs font-bold">{formatInr(budget)}</span>
        </div>
      </div>
      <input
        id="whatif-budget"
        type="range"
        min="100000"
        max="10000000"
        step="50000"
        value={Math.min(10000000, Math.max(100000, budget))}
        onChange={(e) => setBudget(parseInt(e.target.value, 10))}
        className="w-full accent-amber-700"
      />
    </div>
  );
}

function renderSliders(
  guests: number,
  setGuests: (g: number) => void,
  budget: number,
  setBudget: (b: number) => void,
) {
  return (
    <div className="space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
      {renderGuestControl(guests, setGuests)}
      {renderBudgetControl(budget, setBudget)}
    </div>
  );
}

export function WhatIfDrawer({
  currentPlan,
  versionStore,
  onClose,
  onCommit,
  onRestore,
  onUndo,
}: WhatIfDrawerProps): React.JSX.Element {
  const [guests, setGuests] = useState(currentPlan.intake.guests);
  const [budget, setBudget] = useState(currentPlan.intake.budgetInr);
  const [activeTab, setActiveTab] = useState<'whatif' | 'history'>('whatif');

  const simulated = useMemo(() => {
    let p = currentPlan;
    const diffs: string[] = [];
    const dirty = new Set<string>();

    if (guests !== currentPlan.intake.guests) {
      const gRes = propagate(p, { kind: 'guests', guests });
      p = gRes.plan;
      diffs.push(...gRes.diff);
      for (const id of gRes.dirtyIds) dirty.add(id);
    }
    if (budget !== currentPlan.intake.budgetInr) {
      const bRes = propagate(p, { kind: 'budget', budgetInr: budget });
      p = bRes.plan;
      diffs.push(...bRes.diff);
      for (const id of bRes.dirtyIds) dirty.add(id);
    }
    return { plan: p, diffs, dirtyIds: Array.from(dirty) };
  }, [currentPlan, guests, budget]);

  const hasModifications = simulated.diffs.length > 0;

  return (
    <div
      role="dialog"
      aria-label="What-If Planning and Versions"
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between z-50 overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Living Plan Dynamics</h3>
            <p className="text-xs text-stone-500">
              Explore what-if scenarios with dirty-set propagation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 text-stone-400 hover:text-stone-700 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('whatif')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === 'whatif'
                ? 'bg-amber-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            What-If Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === 'history'
                ? 'bg-amber-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Revision History
          </button>
        </div>

        {activeTab === 'whatif' ? (
          <div className="space-y-4">
            {renderSliders(guests, setGuests, budget, setBudget)}
            <div>
              <h4 className="font-bold text-stone-800 text-xs mb-2">Live Propagation Diffs</h4>
              <DiffChips diffs={simulated.diffs} dirtyIds={simulated.dirtyIds} />
            </div>
          </div>
        ) : (
          <VersionsPanel store={versionStore} onRestore={onRestore} onUndo={onUndo} />
        )}
      </div>

      {activeTab === 'whatif' && (
        <div className="pt-4 border-t border-stone-200 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!hasModifications) return;
              const summary = simulated.diffs.join('; ');
              onCommit(simulated.plan, summary);
            }}
            disabled={!hasModifications}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-40 shadow-sm"
          >
            Commit Revision
          </button>
          <button
            type="button"
            onClick={() => {
              setGuests(currentPlan.intake.guests);
              setBudget(currentPlan.intake.budgetInr);
            }}
            disabled={!hasModifications}
            className="py-2 px-3 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
