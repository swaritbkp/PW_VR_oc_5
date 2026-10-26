'use client';

import React, { useMemo, useState } from 'react';
import { allocate, reconcile, type BudgetLine } from '../../lib/budget/engine';
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

function XlsActionBar({ onOpenXls }: { readonly onOpenXls: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-stone-100/90 rounded-2xl border border-stone-200 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-stone-700">
        <span>🛡️</span>
        <span className="text-[11px] text-stone-600">XLS Guardrails: Macro-Safe • XXE • Injection • PII • Bounds</span>
      </div>
      <button
        type="button"
        id="open-xls-roundtrip-btn"
        onClick={onOpenXls}
        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white hover:from-emerald-800 hover:to-teal-900 transition-all shadow-xs flex items-center gap-1.5"
      >
        <span>📊</span>
        <span>Excel (.xls) Round-Trip &amp; Guardrails</span>
      </button>
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
      <XlsActionBar onOpenXls={p.onOpenXls} />
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
        onAddItem={ledger.handleAddItem}
        onRateChange={ledger.handleRateChange}
        onToggleLock={ledger.handleToggleLock}
        onDelete={ledger.handleDelete}
      />
      <ModalFooter onSave={onSave} onClose={onClose} />
    </div>
  );
}

interface XlsModalRenderOptions {
  readonly show: boolean;
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly onCloseModal: () => void;
  readonly onCloseAll: () => void;
  readonly onImport: (newLines: readonly BudgetLine[]) => void;
}

function renderXlsModal(options: XlsModalRenderOptions): React.JSX.Element | null {
  if (!options.show) return null;
  return (
    <BudgetXlsModal
      lines={options.lines}
      guests={options.guests}
      onClose={options.onCloseModal}
      onCloseAll={options.onCloseAll}
      onImportLines={options.onImport}
    />
  );
}

/**
 * Comprehensive financial ledger enabling line item rate editing, contingency calculation, and custom additions.
 */
export function BudgetLedger(props: BudgetLedgerProps): React.JSX.Element {
  const { budgetLines: initialLines, budgetInr, guests, onClose, onUpdateBudgetLines } = props;
  const ledger = useBudgetLedger(initialLines, onUpdateBudgetLines, onClose);
  const [showXlsModal, setShowXlsModal] = useState(false);
  const alloc = useMemo(() => allocate(ledger.lines, budgetInr, guests), [ledger.lines, budgetInr, guests]);
  const recon = useMemo(() => reconcile(alloc), [alloc]);

  const onImport = (newLines: readonly BudgetLine[]) => {
    ledger.handleImportLines(newLines);
    onUpdateBudgetLines?.(newLines, 'Imported from verified Excel spreadsheet');
  };

  const closeXls = () => setShowXlsModal(false);
  const closeAll = () => { setShowXlsModal(false); onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-label="Celebration Budget Ledger" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
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
      {renderXlsModal({ show: showXlsModal, lines: ledger.lines, guests, onCloseModal: closeXls, onCloseAll: closeAll, onImport })}
    </div>
  );
}
