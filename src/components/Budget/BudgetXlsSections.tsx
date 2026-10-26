'use client';

import React from 'react';
import type { BudgetLine } from '@/lib/budget/engine';
import type { XlsParseResult } from '@/lib/portability/xlsPortability';

/** Header component for the XLS round-trip modal. */
export function XlsModalHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-start justify-between border-b border-stone-200 pb-3">
      <div>
        <h3 id="xls-modal-title" className="text-base font-bold text-stone-900 flex items-center gap-2">
          <span>📊</span>
          <span>Excel (.xls) Round-Trip Portability</span>
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Export and import native Excel spreadsheets with zero external dependencies.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close XLS dialog"
        className="text-stone-400 hover:text-stone-700 p-1 text-sm font-bold rounded-lg"
      >
        ✕
      </button>
    </div>
  );
}

/** 5-layer XLS guardrail badge indicator. */
export function XlsGuardrailBadge(): React.JSX.Element {
  return (
    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-950 font-medium">
      <span className="text-sm">🛡️</span>
      <span>
        <strong>XLS Guardrails Active:</strong> Macro-Safe • XXE • Injection • PII • Bounds
      </span>
    </div>
  );
}

/** Table preview component displaying spreadsheet line items. */
export function XlsTablePreview({
  lines,
  guests,
}: {
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
}): React.JSX.Element {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px] sticky top-0">
          <tr>
            <th className="p-2">Category</th>
            <th className="p-2">Item</th>
            <th className="p-2">Mode</th>
            <th className="p-2 text-right">Rate (₹)</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Total (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 font-medium">
          {lines.map((l) => {
            const qty = l.unit === 'per_head' ? guests : 1;
            const total = l.unit === 'per_head' ? l.rateInr * guests : l.rateInr;
            return (
              <tr key={l.id} className="hover:bg-stone-50/50">
                <td className="p-2 capitalize text-stone-600">{l.category}</td>
                <td className="p-2 font-bold text-stone-800">{l.name}</td>
                <td className="p-2 text-stone-500 text-[11px]">{l.unit}</td>
                <td className="p-2 text-right">{l.rateInr.toLocaleString('en-IN')}</td>
                <td className="p-2 text-right">{qty}</td>
                <td className="p-2 text-right font-bold text-stone-900">{total.toLocaleString('en-IN')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Security bar with download, formula test, and reset buttons. */
export function XlsSecurityBar(p: {
  readonly onTestMalicious: () => void;
  readonly onResetValid: () => void;
  readonly onDownload: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
      <button
        type="button"
        onClick={p.onDownload}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
      >
        📥 Download jashn-budget.xls
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="test-malicious-formula-btn"
          onClick={p.onTestMalicious}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
        >
          🧪 Test Malicious Formula (=CMD|)
        </button>
        <button
          type="button"
          id="load-valid-spreadsheet-btn"
          onClick={p.onResetValid}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200 transition-colors shadow-2xs"
        >
          📄 Valid Data
        </button>
      </div>
    </div>
  );
}

/** Textarea section for raw spreadsheet data editing. */
export function XlsDataInputSection(p: {
  readonly rawInput: string;
  readonly setRawInput: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <label htmlFor="xls-data-textarea" className="text-xs font-bold text-stone-700 block">
        Spreadsheet Source Data (CSV / XML / TSV):
      </label>
      <textarea
        id="xls-data-textarea"
        aria-label="XLS data input or paste area"
        value={p.rawInput}
        onChange={(e) => p.setRawInput(e.target.value)}
        rows={3}
        placeholder="SpreadsheetML XML or CSV data here for instant verification..."
        className="w-full p-2 text-xs font-mono border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}

/** Result banner showing guardrail pass or failure. */
export function XlsResultBanner({ parseResult }: { readonly parseResult: XlsParseResult | null }): React.JSX.Element | null {
  if (!parseResult) return null;
  if (!parseResult.ok) {
    return (
      <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold shadow-2xs">
        {parseResult.error}
      </div>
    );
  }
  if (!parseResult.lines) return null;
  return (
    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-medium space-y-1">
      <span className="font-bold block text-emerald-900">
        ✓ Successfully validated {parseResult.lines.length} line items from spreadsheet
      </span>
      {parseResult.guardrailLog?.map((log, idx) => (
        <span key={idx} className="block text-[11px] font-bold text-amber-900">{log}</span>
      ))}
    </div>
  );
}

/** Modal action buttons container. */
export function XlsModalActions(p: {
  readonly onVerify: () => void;
  readonly onClose: () => void;
  readonly onApply: () => void;
  readonly canApply: boolean;
}): React.JSX.Element {
  const btnCls = p.canApply ? 'bg-amber-800 hover:bg-amber-900' : 'bg-stone-300 cursor-not-allowed';
  return (
    <div className="flex justify-between items-center pt-2 border-t border-stone-200">
      <button
        type="button"
        id="parse-verify-xls-btn"
        onClick={p.onVerify}
        className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs"
      >
        🔍 Parse &amp; Verify XLS Guardrails
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={p.onClose}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!p.canApply}
          onClick={p.onApply}
          className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs ${btnCls}`}
        >
          Apply to Budget
        </button>
      </div>
    </div>
  );
}
