'use client';

import React, { useState } from 'react';
import type { BudgetLine } from '@/lib/budget/engine';
import {
  downloadBudgetXls,
  exportPlanBudgetToXls,
  parseAndValidateBudgetXls,
  type XlsParseResult,
} from '@/lib/portability/xlsPortability';

export interface BudgetXlsModalProps {
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly city?: string;
  readonly onClose: () => void;
  readonly onImportLines: (newLines: readonly BudgetLine[]) => void;
}

function readFileContent(file: File | undefined, onLoaded: (text: string) => void) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onLoaded(reader.result);
  };
  reader.readAsText(file);
}

function XlsModalHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
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

function XlsGuardrailBadge(): React.JSX.Element {
  return (
    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-950 font-medium">
      <span className="text-sm">🛡️</span>
      <span>
        <strong>XLS Guardrails Active:</strong> Macro-Safe • XXE • Injection • PII • Bounds
      </span>
    </div>
  );
}

function XlsExportSection(p: {
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly city?: string;
}): React.JSX.Element {
  return (
    <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
      <span className="text-xs font-bold text-stone-800 block">Export Budget to Excel</span>
      <p className="text-xs text-stone-500">
        Downloads a SpreadsheetML .xls workbook compatible with Microsoft Excel, Google Sheets, and Numbers.
      </p>
      <button
        type="button"
        onClick={() => downloadBudgetXls({ lines: p.lines, guests: p.guests, city: p.city })}
        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
      >
        📥 Download jashn-budget.xls
      </button>
    </div>
  );
}

function XlsImportSection(p: {
  readonly rawInput: string;
  readonly setRawInput: (v: string) => void;
  readonly onFileSelect: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-800">Import or Live-Edit XLS Data</span>
        <label className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer transition-colors shadow-xs">
          Browse .xls File
          <input
            type="file"
            accept=".xls,.csv,.tsv,.xml"
            onChange={(e) => readFileContent(e.target.files?.[0], p.onFileSelect)}
            className="hidden"
          />
        </label>
      </div>
      <textarea
        aria-label="XLS data input or paste area"
        value={p.rawInput}
        onChange={(e) => p.setRawInput(e.target.value)}
        rows={4}
        placeholder="Paste edited .xls XML, TSV, or CSV data here for instant verification..."
        className="w-full p-2.5 text-xs font-mono border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}

function useXlsImport(lines: readonly BudgetLine[], guests: number, city?: string) {
  const [rawInput, setRawInput] = useState<string>(() => exportPlanBudgetToXls({ lines, guests, city }));
  const [parseResult, setParseResult] = useState<XlsParseResult | null>(null);

  const handleVerifyAndParse = () => {
    const res = parseAndValidateBudgetXls(rawInput);
    setParseResult(res);
  };

  const handleLoadSample = (sample: string) => {
    setRawInput(sample);
    setParseResult(parseAndValidateBudgetXls(sample));
  };

  return { rawInput, setRawInput, parseResult, handleVerifyAndParse, handleLoadSample };
}

function XlsResultBanner({ parseResult }: { readonly parseResult: XlsParseResult | null }): React.JSX.Element | null {
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

interface XlsActionsProps {
  readonly onVerify: () => void;
  readonly onClose: () => void;
  readonly onApply: () => void;
  readonly canApply: boolean;
}

function XlsModalActions(p: XlsActionsProps): React.JSX.Element {
  const btnCls = p.canApply ? 'bg-amber-800 hover:bg-amber-900' : 'bg-stone-300 cursor-not-allowed';
  return (
    <div className="flex justify-between items-center pt-2 border-t border-stone-200">
      <button
        type="button"
        onClick={p.onVerify}
        className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors"
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

/**
 * Dialog enabling bidirectional .xls export, upload, live text validation, and 5-layer guardrail inspection.
 */
export function BudgetXlsModal(props: BudgetXlsModalProps): React.JSX.Element {
  const { lines, guests, city, onClose, onImportLines } = props;
  const { rawInput, setRawInput, parseResult, handleVerifyAndParse, handleLoadSample } = useXlsImport(lines, guests, city);

  const handleApply = () => {
    if (parseResult?.ok && parseResult.lines) {
      onImportLines(parseResult.lines);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="xls-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
        <XlsModalHeader onClose={onClose} />
        <XlsGuardrailBadge />
        <XlsExportSection lines={lines} guests={guests} city={city} />
        <XlsImportSection rawInput={rawInput} setRawInput={setRawInput} onFileSelect={handleLoadSample} />
        <XlsResultBanner parseResult={parseResult} />
        <XlsModalActions
          onVerify={handleVerifyAndParse}
          onClose={onClose}
          onApply={handleApply}
          canApply={Boolean(parseResult?.ok)}
        />
      </div>
    </div>
  );
}
