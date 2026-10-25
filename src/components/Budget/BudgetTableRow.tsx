'use client';

import React from 'react';
import type { BudgetLine } from '../../lib/budget/engine';
import { formatInr } from '../../lib/format';

export interface BudgetTableRowProps {
  readonly line: BudgetLine;
  readonly guests: number;
  readonly onRateChange: (id: string, rate: number) => void;
  readonly onToggleLock: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function BudgetTableRow({
  line: l,
  guests,
  onRateChange,
  onToggleLock,
  onDelete,
}: BudgetTableRowProps): React.JSX.Element {
  const lineTotal = l.unit === 'per_head' ? l.rateInr * guests : l.rateInr;
  return (
    <tr className="hover:bg-stone-50/50">
      <td className="p-2.5 capitalize text-stone-600">{l.category}</td>
      <td className="p-2.5 font-bold text-stone-800">{l.name}</td>
      <td className="p-2.5 text-stone-500 text-[11px]">
        {l.unit === 'per_head' ? 'Per Guest' : 'Fixed'}
      </td>
      <td className="p-2.5 text-right">
        <input
          aria-label={`Rate for ${l.name}`}
          type="number"
          min="0"
          value={l.rateInr}
          onChange={(e) => onRateChange(l.id, parseInt(e.target.value, 10) || 0)}
          className="w-24 p-1 text-xs text-right font-bold border border-stone-200 rounded-md bg-white focus:ring-1 focus:ring-amber-500"
        />
      </td>
      <td className="p-2.5 text-right font-bold text-stone-900">{formatInr(lineTotal)}</td>
      <td className="p-2.5 text-center space-x-1">
        <button
          type="button"
          onClick={() => onToggleLock(l.id)}
          aria-label={l.locked ? `Unlock ${l.name}` : `Lock ${l.name}`}
          className={`p-1 rounded-md text-xs ${l.locked ? 'bg-amber-100 text-amber-900' : 'text-stone-400 hover:text-stone-700'}`}
        >
          {l.locked ? '🔒' : '🔓'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(l.id)}
          aria-label={`Delete ${l.name}`}
          className="p-1 rounded-md text-stone-400 hover:text-red-600 text-xs"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
