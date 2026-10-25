'use client';

import React, { useMemo, useState } from 'react';
import { allocate, reconcile, type BudgetLine } from '../../lib/budget/engine';
import { formatInr } from '../../lib/format';
import { AddCustomItemForm } from './AddCustomItemForm';
import { LedgerTable } from './LedgerTable';

export interface BudgetLedgerProps {
  readonly budgetLines: readonly BudgetLine[];
  readonly budgetInr: number;
  readonly guests: number;
  readonly onClose: () => void;
  readonly onUpdateBudgetLines?: (newLines: readonly BudgetLine[], reason: string) => void;
}

interface SummaryProps {
  readonly budgetInr: number;
  readonly grandTotal: number;
  readonly contingency: number;
  readonly status: string;
}

function SummaryHeader({ budgetInr, grandTotal, contingency, status }: SummaryProps) {
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

function LedgerDialogHeader({ onClose }: { readonly onClose: () => void }) {
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

interface ModalFooterProps {
  readonly onSave: () => void;
  readonly onClose: () => void;
}

function ModalFooter({ onSave, onClose }: ModalFooterProps) {
  return (
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
        onClick={onSave}
        className="py-2 px-4 text-xs font-bold rounded-xl bg-amber-800 text-white hover:bg-amber-900 shadow-sm"
      >
        Save &amp; Apply Changes
      </button>
    </div>
  );
}

function useBudgetLedger(
  initialLines: readonly BudgetLine[],
  onUpdate?: (lines: readonly BudgetLine[], reason: string) => void,
  onClose?: () => void,
) {
  const [lines, setLines] = useState<BudgetLine[]>([...initialLines]);
  const [isModified, setIsModified] = useState(false);

  const handleRateChange = (id: string, rate: number) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, rateInr: rate } : l)));
    setIsModified(true);
  };
  const handleToggleLock = (id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
    setIsModified(true);
  };
  const handleDelete = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setIsModified(true);
  };
  const handleAddItem = (item: BudgetLine) => {
    setLines((prev) => [...prev, item]);
    setIsModified(true);
  };
  const handleSave = () => {
    onUpdate?.(lines, 'Customized budget line items');
    onClose?.();
  };

  return { lines, isModified, handleRateChange, handleToggleLock, handleDelete, handleAddItem, handleSave };
}

interface LedgerBodyProps {
  readonly budgetInr: number;
  readonly grandTotal: number;
  readonly contingency: number;
  readonly status: string;
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly onAddItem: (item: BudgetLine) => void;
  readonly onRateChange: (id: string, rate: number) => void;
  readonly onToggleLock: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function LedgerDialogBody(p: LedgerBodyProps) {
  return (
    <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
      <SummaryHeader
        budgetInr={p.budgetInr}
        grandTotal={p.grandTotal}
        contingency={p.contingency}
        status={p.status}
      />
      <AddCustomItemForm onAddItem={p.onAddItem} />
      <LedgerTable
        lines={p.lines}
        guests={p.guests}
        onRateChange={p.onRateChange}
        onToggleLock={p.onToggleLock}
        onDelete={p.onDelete}
      />
    </div>
  );
}

/**
 * Comprehensive financial ledger enabling line item rate editing, contingency calculation, and custom additions.
 */
export function BudgetLedger({
  budgetLines: initialLines,
  budgetInr,
  guests,
  onClose,
  onUpdateBudgetLines,
}: BudgetLedgerProps): React.JSX.Element {
  const ledger = useBudgetLedger(initialLines, onUpdateBudgetLines, onClose);
  const alloc = useMemo(() => allocate(ledger.lines, budgetInr, guests), [ledger.lines, budgetInr, guests]);
  const recon = useMemo(() => reconcile(alloc), [alloc]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Celebration Budget Ledger"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <LedgerDialogHeader onClose={onClose} />
        <LedgerDialogBody
          budgetInr={budgetInr}
          grandTotal={alloc.grandTotal}
          contingency={alloc.contingencyInr}
          status={recon.status}
          lines={ledger.lines}
          guests={guests}
          onAddItem={ledger.handleAddItem}
          onRateChange={ledger.handleRateChange}
          onToggleLock={ledger.handleToggleLock}
          onDelete={ledger.handleDelete}
        />
        <ModalFooter onSave={ledger.handleSave} onClose={onClose} />
      </div>
    </div>
  );
}
