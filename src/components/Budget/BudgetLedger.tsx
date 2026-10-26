'use client';

import React, { useMemo, useState } from 'react';
import { allocate, reconcile, type BudgetLine } from '../../lib/budget/engine';
import { downloadBudgetXls } from '../../lib/portability/xlsPortability';
import { AddCustomItemForm } from './AddCustomItemForm';
import { LedgerTable } from './LedgerTable';
import { SummaryHeader, LedgerDialogHeader } from './LedgerHeaderSections';
import { BudgetXlsModal } from './BudgetXlsModal';

export interface BudgetLedgerProps {
  readonly budgetLines: readonly BudgetLine[];
  readonly budgetInr: number;
  readonly guests: number;
  readonly onClose: () => void;
  readonly onUpdateBudgetLines?: (newLines: readonly BudgetLine[], reason: string) => void;
}

function XlsActionBar({ onOpenXls, onExportXls }: { readonly onOpenXls: () => void; readonly onExportXls: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-stone-100/90 rounded-2xl border border-stone-200 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-stone-700">
        <span>🛡️</span>
        <span className="text-[11px] text-stone-600">XLS Guardrails: Macro-Safe • XXE • Injection • PII • Bounds</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportXls}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs"
        >
          📥 Export Excel (.xls)
        </button>
        <button
          type="button"
          onClick={onOpenXls}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
        >
          📤 Import Edited Excel (.xls)
        </button>
      </div>
    </div>
  );
}

function ModalFooter({ onSave, onClose }: { readonly onSave: () => void; readonly onClose: () => void }) {
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

  const handleRateChange = (id: string, rate: number) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, rateInr: rate } : l)));
  };
  const handleToggleLock = (id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
  };
  const handleDelete = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };
  const handleAddItem = (item: BudgetLine) => {
    setLines((prev) => [...prev, item]);
  };
  const handleImportLines = (imported: readonly BudgetLine[]) => {
    setLines([...imported]);
  };
  const handleSave = () => {
    onUpdate?.(lines, 'Customized budget line items');
    onClose?.();
  };

  return { lines, handleRateChange, handleToggleLock, handleDelete, handleAddItem, handleImportLines, handleSave };
}

interface LedgerBodyProps {
  readonly budgetInr: number;
  readonly grandTotal: number;
  readonly contingency: number;
  readonly status: string;
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly onOpenXls: () => void;
  readonly onExportXls: () => void;
  readonly onAddItem: (item: BudgetLine) => void;
  readonly onRateChange: (id: string, rate: number) => void;
  readonly onToggleLock: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function LedgerDialogBody(p: LedgerBodyProps) {
  return (
    <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5">
      <SummaryHeader
        budgetInr={p.budgetInr}
        grandTotal={p.grandTotal}
        contingency={p.contingency}
        status={p.status}
      />
      <XlsActionBar onOpenXls={p.onOpenXls} onExportXls={p.onExportXls} />
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

function LedgerDialogContainer({
  onClose,
  alloc,
  recon,
  budgetInr,
  ledger,
  guests,
  onOpenXls,
  onSave,
}: {
  readonly onClose: () => void;
  readonly alloc: ReturnType<typeof allocate>;
  readonly recon: ReturnType<typeof reconcile>;
  readonly budgetInr: number;
  readonly ledger: ReturnType<typeof useBudgetLedger>;
  readonly guests: number;
  readonly onOpenXls: () => void;
  readonly onSave: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      <LedgerDialogHeader onClose={onClose} />
      <LedgerDialogBody
        budgetInr={budgetInr}
        grandTotal={alloc.grandTotal}
        contingency={alloc.contingencyInr}
        status={recon.status}
        lines={ledger.lines}
        guests={guests}
        onOpenXls={onOpenXls}
        onExportXls={() => downloadBudgetXls({ lines: ledger.lines, guests })}
        onAddItem={ledger.handleAddItem}
        onRateChange={ledger.handleRateChange}
        onToggleLock={ledger.handleToggleLock}
        onDelete={ledger.handleDelete}
      />
      <ModalFooter onSave={onSave} onClose={onClose} />
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
  const [showXlsModal, setShowXlsModal] = useState(false);
  const alloc = useMemo(() => allocate(ledger.lines, budgetInr, guests), [ledger.lines, budgetInr, guests]);
  const recon = useMemo(() => reconcile(alloc), [alloc]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Celebration Budget Ledger"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs"
    >
      <LedgerDialogContainer
        onClose={onClose}
        alloc={alloc}
        recon={recon}
        budgetInr={budgetInr}
        ledger={ledger}
        guests={guests}
        onOpenXls={() => setShowXlsModal(true)}
        onSave={ledger.handleSave}
      />
      {showXlsModal && (
        <BudgetXlsModal
          lines={ledger.lines}
          guests={guests}
          onClose={() => setShowXlsModal(false)}
          onImportLines={ledger.handleImportLines}
        />
      )}
    </div>
  );
}
