'use client';

import React from 'react';
import { formatInr } from '../../lib/format';

export interface SummaryHeaderProps {
  readonly budgetInr: number;
  readonly grandTotal: number;
  readonly contingency: number;
  readonly status: string;
}

/**
 * Summary cards header displaying target budget, total projected spend, contingency, and status.
 */
export function SummaryHeader({ budgetInr, grandTotal, contingency, status }: SummaryHeaderProps): React.JSX.Element {
  const isFits = status === 'fits' || status === 'under';
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
      <div>
        <span className="text-[10px] text-stone-500 uppercase font-bold block">Target Budget</span>
        <span className="text-sm font-black text-stone-900">{formatInr(budgetInr)}</span>
      </div>
      <div>
        <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Projected</span>
        <span className={`text-sm font-black ${isFits ? 'text-emerald-700' : 'text-rose-600'}`}>
          {formatInr(grandTotal)}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-stone-500 uppercase font-bold block">Contingency Reserve</span>
        <span className="text-sm font-black text-amber-900">{formatInr(contingency)}</span>
      </div>
      <div>
        <span className="text-[10px] text-stone-500 uppercase font-bold block">Reconciliation</span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase ${
            isFits ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

/**
 * Modal title banner with close trigger.
 */
export function LedgerDialogHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
      <div>
        <h3 className="text-base font-bold text-stone-900">Celebration Budget Ledger</h3>
        <p className="text-xs text-stone-500">
          Customize line items, toggle locks, or add custom budget entries.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close ledger"
        className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 text-sm"
      >
        ✕
      </button>
    </div>
  );
}
