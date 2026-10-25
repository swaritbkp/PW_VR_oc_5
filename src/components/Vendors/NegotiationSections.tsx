'use client';

import React from 'react';
import type { NegotiationLanguage, NegotiationTactic } from '@/lib/vendors/negotiate';

export const TACTICS: readonly { readonly id: NegotiationTactic; readonly label: string }[] = [
  { id: 'off_peak', label: 'Off-Peak Leverage (-18%)' },
  { id: 'milestone_stagger', label: 'Milestone Stagger (-8%)' },
  { id: 'value_add', label: 'Complimentary Add-Ons' },
  { id: 'volume_guarantee', label: 'Volume Headcount (-12%)' },
];

export const LANGUAGES: readonly { readonly id: NegotiationLanguage; readonly label: string }[] = [
  { id: 'en', label: 'English (Formal)' },
  { id: 'hi', label: 'हिन्दी (Warm & Respectful)' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ (Culturally Nuanced)' },
];

/**
 * Metric summary cards showing target discount savings and counter offer.
 */
export function RenderMetrics({
  savings,
  targetOffer,
  discountPct,
}: {
  readonly savings: number;
  readonly targetOffer: number;
  readonly discountPct: number;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
        <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">
          Target Savings ({discountPct}%)
        </p>
        <p className="text-lg font-bold text-emerald-700">₹{savings.toLocaleString('en-IN')}</p>
      </div>
      <div className="p-3 bg-stone-100 rounded-xl text-center border border-stone-200">
        <p className="text-[11px] font-medium text-stone-600 uppercase tracking-wider">
          Proposed Counter-Offer
        </p>
        <p className="text-lg font-bold text-stone-900">₹{targetOffer.toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
}

function QuoteInputRow({
  quoteInr,
  setQuoteInr,
}: {
  readonly quoteInr: number;
  readonly setQuoteInr: (q: number) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="quote-inr-input" className="text-xs font-semibold text-stone-700 whitespace-nowrap">
        Vendor Quote (₹):
      </label>
      <input
        id="quote-inr-input"
        type="number"
        step="10000"
        value={quoteInr}
        onChange={(e) => setQuoteInr(Math.max(0, Number(e.target.value) || 0))}
        className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 focus:ring-amber-500"
      />
    </div>
  );
}

function TacticsButtonGrid({
  tactic,
  setTactic,
}: {
  readonly tactic: NegotiationTactic;
  readonly setTactic: (t: NegotiationTactic) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-stone-700">Strategic Tactic:</span>
      <div className="grid grid-cols-2 gap-1.5">
        {TACTICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTactic(t.id)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors text-left ${
              tactic === t.id
                ? 'bg-amber-500/10 border-amber-500 text-stone-900 font-bold'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguagePills({
  language,
  setLanguage,
}: {
  readonly language: NegotiationLanguage;
  readonly setLanguage: (l: NegotiationLanguage) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-stone-700">Pitch Language:</span>
      <div className="flex gap-1.5">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLanguage(l.id)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex-1 text-center transition-colors ${
              language === l.id
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Strategy levers, quote inputs, and language selection buttons for negotiation.
 */
export function NegotiationFormControls({
  quoteInr,
  setQuoteInr,
  tactic,
  setTactic,
  language,
  setLanguage,
}: {
  readonly quoteInr: number;
  readonly setQuoteInr: (q: number) => void;
  readonly tactic: NegotiationTactic;
  readonly setTactic: (t: NegotiationTactic) => void;
  readonly language: NegotiationLanguage;
  readonly setLanguage: (l: NegotiationLanguage) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <QuoteInputRow quoteInr={quoteInr} setQuoteInr={setQuoteInr} />
      <TacticsButtonGrid tactic={tactic} setTactic={setTactic} />
      <LanguagePills language={language} setLanguage={setLanguage} />
    </div>
  );
}

/**
 * Copyable pitch script and contract counter-clause recommendations card.
 */
export function NegotiationPitchCard({
  pitchScript,
  counterClause,
  copied,
  onCopy,
}: {
  readonly pitchScript: string;
  readonly counterClause: string;
  readonly copied: boolean;
  readonly onCopy: () => void;
}): React.JSX.Element {
  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-800">Generated WhatsApp / Call Pitch:</span>
          <button
            type="button"
            onClick={onCopy}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-0.5 rounded-md transition-colors"
          >
            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Pitch Script'}
          </button>
        </div>
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 font-sans leading-relaxed">
          {pitchScript}
        </div>
      </div>
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
        <p className="font-semibold text-amber-900">Recommended Contract Counter-Clause:</p>
        <p className="text-amber-800">{counterClause}</p>
      </div>
    </>
  );
}

/**
 * Agreed quote input field in Indian Rupees.
 */
export function QuoteInputField({
  quoteInput,
  setQuoteInput,
}: {
  readonly quoteInput: string;
  readonly setQuoteInput: (q: string) => void;
}): React.JSX.Element {
  return (
    <div>
      <label htmlFor="quote-input" className="block text-xs font-semibold text-stone-700 mb-1">
        Agreed Quote (₹ INR)
      </label>
      <input
        id="quote-input"
        type="number"
        min="0"
        value={quoteInput}
        onChange={(e) => setQuoteInput(e.target.value)}
        placeholder="e.g. 85000"
        className="w-full text-xs p-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
      />
    </div>
  );
}
