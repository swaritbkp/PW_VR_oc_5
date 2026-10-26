'use client';

import React, { useState } from 'react';
import type { BudgetLine } from '@/lib/budget/engine';
import {
  downloadBudgetXls,
  parseAndValidateBudgetXls,
  type XlsParseResult,
} from '@/lib/portability/xlsPortability';
import {
  XlsDataInputSection,
  XlsGuardrailBadge,
  XlsModalActions,
  XlsModalHeader,
  XlsResultBanner,
  XlsSecurityBar,
  XlsTablePreview,
} from './BudgetXlsSections';

export interface BudgetXlsModalProps {
  readonly lines: readonly BudgetLine[];
  readonly guests: number;
  readonly city?: string;
  readonly onClose: () => void;
  readonly onCloseAll?: () => void;
  readonly onImportLines: (newLines: readonly BudgetLine[]) => void;
}

const MALICIOUS_PAYLOAD =
  'Category,Item,PricingMode,UnitRateInr,Quantity,TotalInr\nvenue,=CMD|\' /C calc\'!A0,fixed,500000,1,500000';

function buildCsvRows(lines: readonly BudgetLine[], guests: number): string {
  const header = 'Category,Item,PricingMode,UnitRateInr,Quantity,TotalInr';
  const rows = lines.map((l) => {
    const qty = l.unit === 'per_head' ? guests : 1;
    const total = l.unit === 'per_head' ? l.rateInr * guests : l.rateInr;
    return `${l.category},${l.name},${l.unit},${l.rateInr},${qty},${total}`;
  });
  return [header, ...rows].join('\n');
}

function useXlsImport(lines: readonly BudgetLine[], guests: number) {
  const defaultValid = buildCsvRows(lines, guests);
  const [rawInput, setRawInput] = useState<string>(defaultValid);
  const [parseResult, setParseResult] = useState<XlsParseResult | null>(null);

  const handleVerify = () => setParseResult(parseAndValidateBudgetXls(rawInput));
  const handleTestMalicious = () => {
    setRawInput(MALICIOUS_PAYLOAD);
    setParseResult(parseAndValidateBudgetXls(MALICIOUS_PAYLOAD));
  };
  const handleResetValid = () => {
    setRawInput(defaultValid);
    setParseResult(parseAndValidateBudgetXls(defaultValid));
  };

  return { rawInput, setRawInput, parseResult, handleVerify, handleTestMalicious, handleResetValid };
}

/**
 * Dialog enabling bidirectional .xls export, upload, live text validation, and 5-layer guardrail inspection.
 */
export function BudgetXlsModal(props: BudgetXlsModalProps): React.JSX.Element {
  const { lines, guests, city, onClose, onCloseAll, onImportLines } = props;
  const f = useXlsImport(lines, guests);

  const handleApply = () => {
    if (f.parseResult?.ok && f.parseResult.lines) {
      onImportLines(f.parseResult.lines);
      if (onCloseAll) onCloseAll();
      else onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="xls-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto border border-stone-200">
        <XlsModalHeader onClose={onClose} />
        <XlsGuardrailBadge />
        <XlsTablePreview lines={lines} guests={guests} />
        <XlsSecurityBar
          onTestMalicious={f.handleTestMalicious}
          onResetValid={f.handleResetValid}
          onDownload={() => downloadBudgetXls({ lines, guests, city })}
        />
        <XlsDataInputSection rawInput={f.rawInput} setRawInput={f.setRawInput} />
        <XlsResultBanner parseResult={f.parseResult} />
        <XlsModalActions
          onVerify={f.handleVerify}
          onClose={onClose}
          onApply={handleApply}
          canApply={Boolean(f.parseResult?.ok)}
        />
      </div>
    </div>
  );
}
