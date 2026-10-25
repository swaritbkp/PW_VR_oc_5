'use client';

import React, { useMemo, useState } from 'react';
import { allocate, reconcile, type BudgetLine } from '../../lib/budget/engine';
import { formatInr } from '../../lib/format';
import type { TaskCategory } from '../../lib/plan/types';
import { BudgetTableRow } from './BudgetTableRow';

export interface BudgetLedgerProps {
  readonly budgetLines: readonly BudgetLine[];
  readonly budgetInr: number;
  readonly guests: number;
  readonly onClose: () => void;
  readonly onUpdateBudgetLines?: (newLines: readonly BudgetLine[], reason: string) => void;
}

const CATEGORIES: readonly TaskCategory[] = [
  'venue',
  'food',
  'decor',
  'media',
  'entertainment',
  'logistics',
  'planning',
];

interface SummaryProps {
  readonly budgetInr: number;
  readonly grandTotal: number;
  readonly contingency: number;
  readonly status: string;
}

function SummaryHeader({ budgetInr, grandTotal, contingency, status }: SummaryProps) {
  const isFits = status === 'fits' || status === 'under';
  const badge = isFits ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
      <div>
        <span className="text-stone-500 block text-[10px] font-bold uppercase">Target Budget</span>
        <span className="font-bold text-stone-900">{formatInr(budgetInr)}</span>
      </div>
      <div>
        <span className="text-stone-500 block text-[10px] font-bold uppercase">
          Allocated Total
        </span>
        <span className="font-bold text-stone-900">{formatInr(grandTotal)}</span>
      </div>
      <div>
        <span className="text-stone-500 block text-[10px] font-bold uppercase">Contingency</span>
        <span className="font-bold text-amber-900">{formatInr(contingency)}</span>
      </div>
      <div>
        <span className="text-stone-500 block text-[10px] font-bold uppercase">Budget Status</span>
        <span
          className={`font-bold capitalize inline-block px-2 py-0.5 rounded-full text-[10px] ${badge}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

export function BudgetLedger({
  budgetLines: initialLines,
  budgetInr,
  guests,
  onClose,
  onUpdateBudgetLines,
}: BudgetLedgerProps): React.JSX.Element {
  const [lines, setLines] = useState<BudgetLine[]>([...initialLines]);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<TaskCategory>('entertainment');
  const [newUnit, setNewUnit] = useState<'fixed' | 'per_head'>('fixed');
  const [newRate, setNewRate] = useState('');

  const alloc = useMemo(() => allocate(lines, budgetInr, guests), [lines, budgetInr, guests]);
  const recon = useMemo(() => reconcile(alloc), [alloc]);

  const handleRateChange = (id: string, val: number) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, rateInr: Math.max(0, val) } : l)));
  };

  const handleToggleLock = (id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
  };

  const handleDelete = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddLine = () => {
    if (!newName.trim()) return;
    const rateVal = Math.max(0, parseInt(newRate, 10) || 0);
    const item: BudgetLine = {
      id: `bl_custom_${Date.now()}`,
      category: newCat,
      name: newName.trim(),
      unit: newUnit,
      rateInr: rateVal,
      drivers: newUnit === 'per_head' ? ['guests'] : ['budget'],
    };
    setLines((prev) => [...prev, item]);
    setNewName('');
    setNewRate('');
  };

  const handleSave = () => {
    onUpdateBudgetLines?.(lines, 'Updated budget ledger lines');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Celebration Budget Ledger"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
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

        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <SummaryHeader
            budgetInr={budgetInr}
            grandTotal={alloc.grandTotal}
            contingency={alloc.contingencyInr}
            status={recon.status}
          />

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <span className="text-xs font-bold text-stone-800 block">Add Custom Budget Item</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                aria-label="New item name"
                placeholder="Item name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
              />
              <select
                aria-label="New item category"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as TaskCategory)}
                className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                aria-label="New item unit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value as 'fixed' | 'per_head')}
                className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
              >
                <option value="fixed">Fixed Cost</option>
                <option value="per_head">Per Guest</option>
              </select>
              <div className="flex gap-1.5">
                <input
                  aria-label="New item rate in INR"
                  type="number"
                  min="0"
                  placeholder="₹ Rate"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="flex-1 p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-800 text-white hover:bg-amber-900 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5 text-right">Rate (₹)</th>
                  <th className="p-2.5 text-right">Total (₹)</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {lines.map((l) => (
                  <BudgetTableRow
                    key={l.id}
                    line={l}
                    guests={guests}
                    onRateChange={handleRateChange}
                    onToggleLock={handleToggleLock}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 flex justify-end gap-2 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 text-xs font-semibold rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2 px-4 text-xs font-bold rounded-xl bg-amber-800 text-white hover:bg-amber-900 shadow-sm"
          >
            Save &amp; Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
