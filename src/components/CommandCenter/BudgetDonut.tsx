'use client';

import React from 'react';
import type { AllocationResult, ReconcileResult } from '@/lib/budget/engine';
import { formatInr } from '@/lib/format';

export interface BudgetDonutProps {
  readonly budget: AllocationResult;
  readonly reconciliation: ReconcileResult;
  readonly onOpenBudget?: () => void;
}

export function BudgetDonut({
  budget,
  reconciliation,
  onOpenBudget,
}: BudgetDonutProps): React.JSX.Element {
  return (
    <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-600">Budget Allocation</span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
            reconciliation.status === 'fits'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {reconciliation.status}
        </span>
      </div>

      <div className="flex items-center gap-3 my-1.5">
        <svg className="w-16 h-16 shrink-0 -rotate-90" viewBox="0 0 42 42" aria-hidden="true">
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="5" />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#9A3412"
            strokeWidth="5"
            strokeDasharray="40 60"
            strokeDashoffset="0"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#D97706"
            strokeWidth="5"
            strokeDasharray="25 75"
            strokeDashoffset="-40"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#2563EB"
            strokeWidth="5"
            strokeDasharray="20 80"
            strokeDashoffset="-65"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#059669"
            strokeWidth="5"
            strokeDasharray="15 85"
            strokeDashoffset="-85"
          />
        </svg>

        <div>
          <span className="text-lg font-black tabular-nums tracking-tight text-stone-900 block">
            {formatInr(budget.grandTotal)}
          </span>
          <span className="text-[11px] font-medium text-stone-500 block">
            Contingency:{' '}
            <span className="font-semibold text-stone-700">{formatInr(budget.contingencyInr)}</span>{' '}
            (10%)
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
        <div className="flex items-center gap-2 text-[10px] font-medium text-stone-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#9A3412]" /> Venue
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Food
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Decor
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#059669]" /> Buffer
          </span>
        </div>
        {onOpenBudget && (
          <button
            type="button"
            onClick={onOpenBudget}
            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
            aria-label="Manage budget ledger"
          >
            Ledger &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
