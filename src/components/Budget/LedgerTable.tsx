'use client';

import React from 'react';
import type { BudgetLine } from '../../lib/budget/engine';
import { BudgetTableRow } from './BudgetTableRow';

export interface LedgerTableProps {
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly onRateChange: (id: string, rate: number) => void;
  readonly onToggleLock: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

/**
 * Renders the table container and line item rows for the Celebration Budget Ledger.
 */
export function LedgerTable({
  lines,
  guests,
  onRateChange,
  onToggleLock,
  onDelete,
}: LedgerTableProps): React.JSX.Element {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">Celebration Budget Ledger Line Items</caption>
        <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
          <tr>
            <th scope="col" className="p-2.5">Category</th>
            <th scope="col" className="p-2.5">Item</th>
            <th scope="col" className="p-2.5">Unit</th>
            <th scope="col" className="p-2.5 text-right">Rate (₹)</th>
            <th scope="col" className="p-2.5 text-right">Total (₹)</th>
            <th scope="col" className="p-2.5 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 font-medium">
          {lines.map((l) => (
            <BudgetTableRow
              key={l.id}
              line={l}
              guests={guests}
              onRateChange={onRateChange}
              onToggleLock={onToggleLock}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
