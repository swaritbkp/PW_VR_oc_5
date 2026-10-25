'use client';

import React from 'react';
import { formatInr } from '@/lib/format';

interface WhatIfControlsProps {
  readonly guests: number;
  readonly setGuests: (g: number) => void;
  readonly budget: number;
  readonly setBudget: (b: number) => void;
}

function GuestControl({
  guests,
  setGuests,
}: {
  readonly guests: number;
  readonly setGuests: (g: number) => void;
}): React.JSX.Element {
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

function BudgetControl({
  budget,
  setBudget,
}: {
  readonly budget: number;
  readonly setBudget: (b: number) => void;
}): React.JSX.Element {
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

/**
 * Sliders and numeric inputs for interactive what-if simulation parameters.
 */
export function WhatIfControls({
  guests,
  setGuests,
  budget,
  setBudget,
}: WhatIfControlsProps): React.JSX.Element {
  return (
    <div className="space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
      <GuestControl guests={guests} setGuests={setGuests} />
      <BudgetControl budget={budget} setBudget={setBudget} />
    </div>
  );
}
