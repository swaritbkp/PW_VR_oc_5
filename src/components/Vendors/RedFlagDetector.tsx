'use client';

import React, { useMemo, useState } from 'react';
import { analyzeVendorQuote, type DetectedRedFlag } from '@/lib/vendors/redflags';

export interface RedFlagDetectorProps {
  readonly initialText?: string;
  readonly onClose: () => void;
}

const PRESETS: readonly { readonly label: string; readonly text: string }[] = [
  {
    label: 'Predatory Caterer (Advance & Fuel)',
    text: 'Payment terms: 100% advance required 14 days before the event. Diesel for generator billed at actuals with no cap.',
  },
  {
    label: 'Strict Farmhouse (Curfew & Cash)',
    text: 'No written agreement needed, raw cash only on venue entry. Curfew at 10 PM sharp with heavy hourly fine.',
  },
  {
    label: 'Standard Fair Contract',
    text: '25% booking token, 50% on-site setup, 25% post-completion signoff. Standard force majeure weather postponement included.',
  },
];

function renderRiskBadge(score: number, level: string) {
  if (level === 'safe') {
    return (
      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
        <p className="text-[11px] font-bold text-emerald-800 uppercase">Safety Score</p>
        <p className="text-xl font-bold text-emerald-700">{score}/100 • Safe</p>
      </div>
    );
  }
  if (level === 'caution') {
    return (
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
        <p className="text-[11px] font-bold text-amber-800 uppercase">Safety Score</p>
        <p className="text-xl font-bold text-amber-700">{score}/100 • Caution</p>
      </div>
    );
  }
  return (
    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
      <p className="text-[11px] font-bold text-rose-800 uppercase">Safety Score</p>
      <p className="text-xl font-bold text-rose-700">{score}/100 • High Risk</p>
    </div>
  );
}

function renderFlagItem(flag: DetectedRedFlag, index: number) {
  return (
    <div
      key={`flag-${index}`}
      className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs"
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-stone-900 flex items-center gap-1.5">
          <span className="text-rose-600">⚠️</span>
          <span>{flag.riskTitle}</span>
        </p>
        <span
          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
            flag.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {flag.severity}
        </span>
      </div>
      <p className="text-stone-600 italic">&ldquo;{flag.phraseMatched}&rdquo;</p>
      <p className="text-stone-700">{flag.explanation}</p>
      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
        <span className="font-semibold">Counter-Clause: </span>
        <span>{flag.counterClause}</span>
      </div>
    </div>
  );
}

function RedFlagHeader({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
      <div>
        <h2 id="red-flag-title" className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <span>🛡️</span> Vendor Contract Red-Flag Detector
        </h2>
        <p className="text-xs text-stone-500">Automated predatory clause parser & consumer protection</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded-lg"
      >
        ✕
      </button>
    </div>
  );
}

function RedFlagPresets({ onSelectText }: { readonly onSelectText: (text: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-700">Quick Test Scenarios:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset, idx) => (
          <button
            key={`preset-${idx}`}
            type="button"
            onClick={() => onSelectText(preset.text)}
            className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium px-2 py-1 rounded-lg border border-stone-200 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContractTextInput({
  text,
  onChange,
}: {
  readonly text: string;
  readonly onChange: (t: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor="vendor-quote-textarea" className="text-xs font-semibold text-stone-700">
        Paste Vendor Quotation / Contract Terms:
      </label>
      <textarea
        id="vendor-quote-textarea"
        rows={3}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste vendor payment terms, advance conditions, cancellation clauses..."
        className="w-full text-xs border border-stone-300 rounded-xl p-2.5 focus:ring-amber-500 font-mono"
      />
    </div>
  );
}

function RedFlagAnalysisResults({ analysis }: { readonly analysis: ReturnType<typeof analyzeVendorQuote> }) {
  return (
    <>
      {renderRiskBadge(analysis.safetyScore, analysis.riskLevel)}
      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800">
        <p className="font-semibold">Inspection Summary:</p>
        <p>{analysis.summaryRecommendation}</p>
      </div>
      {analysis.flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-stone-800">
            Detected Predatory Clauses ({analysis.flags.length})
          </h3>
          <div className="space-y-2">{analysis.flags.map((flag, i) => renderFlagItem(flag, i))}</div>
        </div>
      )}
    </>
  );
}

function ScannerCloseButton({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onClose}
        className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
      >
        Close Scanner
      </button>
    </div>
  );
}

/**
 * Predatory contract clause scanner analyzing vendor quotes against consumer protection rules.
 */
export function RedFlagDetector({
  initialText = PRESETS[0].text,
  onClose,
}: RedFlagDetectorProps): React.JSX.Element {
  const [contractText, setContractText] = useState(initialText);
  const analysis = useMemo(() => analyzeVendorQuote(contractText), [contractText]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="red-flag-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
        <RedFlagHeader onClose={onClose} />
        <RedFlagPresets onSelectText={setContractText} />
        <ContractTextInput text={contractText} onChange={setContractText} />
        <RedFlagAnalysisResults analysis={analysis} />
        <ScannerCloseButton onClose={onClose} />
      </div>
    </div>
  );
}
