'use client';

import React, { useMemo, useState } from 'react';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import type { VersionStore } from '@/lib/plan/versions';
import { DiffChips } from './DiffChips';
import { VersionsPanel } from './VersionsPanel';
import { WhatIfControls } from './WhatIfControls';

export interface WhatIfDrawerProps {
  readonly currentPlan: PlanState;
  readonly versionStore: VersionStore;
  readonly onClose: () => void;
  readonly onCommit: (newPlan: PlanState, summary: string) => void;
  readonly onRestore: (versionId: string) => void;
  readonly onUndo: () => void;
}

function useWhatIfSimulation(currentPlan: PlanState, guests: number, budget: number) {
  return useMemo(() => {
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
}

function WhatIfTitleClose({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-bold text-stone-900 text-base">Living Plan Dynamics</h3>
        <p className="text-xs text-stone-500">Explore what-if scenarios with dirty-set propagation.</p>
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
  );
}

function WhatIfTabButtons({
  activeTab,
  setActiveTab,
}: {
  readonly activeTab: 'whatif' | 'history';
  readonly setActiveTab: (tab: 'whatif' | 'history') => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-2 border-b border-stone-200 pb-2">
      <button
        type="button"
        onClick={() => setActiveTab('whatif')}
        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
          activeTab === 'whatif' ? 'bg-amber-800 text-white' : 'text-stone-600 hover:bg-stone-100'
        }`}
      >
        What-If Simulator
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('history')}
        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
          activeTab === 'history' ? 'bg-amber-800 text-white' : 'text-stone-600 hover:bg-stone-100'
        }`}
      >
        Revision History
      </button>
    </div>
  );
}

function WhatIfDrawerHeader({
  activeTab,
  onClose,
  setActiveTab,
}: {
  readonly activeTab: 'whatif' | 'history';
  readonly onClose: () => void;
  readonly setActiveTab: (tab: 'whatif' | 'history') => void;
}): React.JSX.Element {
  return (
    <>
      <WhatIfTitleClose onClose={onClose} />
      <WhatIfTabButtons activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}

function WhatIfActiveContent({
  activeTab,
  guests,
  setGuests,
  budget,
  setBudget,
  simulated,
  versionStore,
  onRestore,
  onUndo,
}: {
  readonly activeTab: 'whatif' | 'history';
  readonly guests: number;
  readonly setGuests: (g: number) => void;
  readonly budget: number;
  readonly setBudget: (b: number) => void;
  readonly simulated: { readonly diffs: readonly string[]; readonly dirtyIds: readonly string[] };
  readonly versionStore: VersionStore;
  readonly onRestore: (versionId: string) => void;
  readonly onUndo: () => void;
}): React.JSX.Element {
  if (activeTab === 'history') {
    return <VersionsPanel store={versionStore} onRestore={onRestore} onUndo={onUndo} />;
  }
  return (
    <div className="space-y-4">
      <WhatIfControls guests={guests} setGuests={setGuests} budget={budget} setBudget={setBudget} />
      <div>
        <h4 className="font-bold text-stone-800 text-xs mb-2">Live Propagation Diffs</h4>
        <DiffChips diffs={simulated.diffs} dirtyIds={simulated.dirtyIds} />
      </div>
    </div>
  );
}

function WhatIfFooterActions({
  hasModifications,
  onCommit,
  onReset,
}: {
  readonly hasModifications: boolean;
  readonly onCommit: () => void;
  readonly onReset: () => void;
}): React.JSX.Element {
  return (
    <div className="pt-4 border-t border-stone-200 flex gap-2">
      <button
        type="button"
        onClick={onCommit}
        disabled={!hasModifications}
        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-40 shadow-sm"
      >
        Commit Revision
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={!hasModifications}
        className="py-2 px-3 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40"
      >
        Reset
      </button>
    </div>
  );
}

function useWhatIfInputs(currentPlan: PlanState) {
  const [guests, setGuests] = useState(currentPlan.intake.guests);
  const [budget, setBudget] = useState(currentPlan.intake.budgetInr);
  const [activeTab, setActiveTab] = useState<'whatif' | 'history'>('whatif');
  const reset = () => {
    setGuests(currentPlan.intake.guests);
    setBudget(currentPlan.intake.budgetInr);
  };
  return { guests, setGuests, budget, setBudget, activeTab, setActiveTab, reset };
}

/**
 * Slide-over drawer providing interactive what-if exploration with real-time change propagation.
 */
export function WhatIfDrawer(props: WhatIfDrawerProps): React.JSX.Element {
  const { currentPlan, versionStore, onClose, onCommit, onRestore, onUndo } = props;
  const { guests, setGuests, budget, setBudget, activeTab, setActiveTab, reset } =
    useWhatIfInputs(currentPlan);
  const sim = useWhatIfSimulation(currentPlan, guests, budget);
  const hasMod = sim.diffs.length > 0;
  const commit = () => {
    if (hasMod) onCommit(sim.plan, sim.diffs.join('; '));
  };

  return (
    <div
      role="dialog"
      aria-label="What-If Planning and Versions"
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between z-50 overflow-y-auto"
    >
      <div className="space-y-4">
        <WhatIfDrawerHeader activeTab={activeTab} onClose={onClose} setActiveTab={setActiveTab} />
        <WhatIfActiveContent
          activeTab={activeTab}
          guests={guests}
          setGuests={setGuests}
          budget={budget}
          setBudget={setBudget}
          simulated={sim}
          versionStore={versionStore}
          onRestore={onRestore}
          onUndo={onUndo}
        />
      </div>
      {activeTab === 'whatif' && <WhatIfFooterActions hasModifications={hasMod} onCommit={commit} onReset={reset} />}
    </div>
  );
}
