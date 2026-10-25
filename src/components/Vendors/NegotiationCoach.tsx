'use client';

import React, { useMemo, useState } from 'react';
import {
  formulateNegotiation,
  type NegotiationLanguage,
  type NegotiationTactic,
} from '@/lib/vendors/negotiate';

export interface NegotiationCoachProps {
  readonly initialVendorName?: string;
  readonly initialCategory?: string;
  readonly initialCity?: string;
  readonly initialQuoteInr?: number;
  readonly guestCount?: number;
  readonly eventDate?: string;
  readonly onClose: () => void;
}

const TACTICS: readonly { readonly id: NegotiationTactic; readonly label: string }[] = [
  { id: 'off_peak', label: 'Off-Peak Leverage (-18%)' },
  { id: 'milestone_stagger', label: 'Milestone Stagger (-8%)' },
  { id: 'value_add', label: 'Complimentary Add-Ons' },
  { id: 'volume_guarantee', label: 'Volume Headcount (-12%)' },
];

const LANGUAGES: readonly { readonly id: NegotiationLanguage; readonly label: string }[] = [
  { id: 'en', label: 'English (Formal)' },
  { id: 'hi', label: 'हिन्दी (Warm & Respectful)' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ (Culturally Nuanced)' },
];

function renderMetrics(savings: number, targetOffer: number, discountPct: number) {
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

export function NegotiationCoach({
  initialVendorName = 'Premier Event Vendor',
  initialCategory = 'venue',
  initialCity = 'Chandigarh',
  initialQuoteInr = 350000,
  guestCount = 250,
  eventDate = '2026-12-14',
  onClose,
}: NegotiationCoachProps): React.JSX.Element {
  const [tactic, setTactic] = useState<NegotiationTactic>('off_peak');
  const [language, setLanguage] = useState<NegotiationLanguage>('en');
  const [quoteInr, setQuoteInr] = useState(initialQuoteInr);
  const [copied, setCopied] = useState(false);

  const strategy = useMemo(
    () =>
      formulateNegotiation({
        vendorName: initialVendorName,
        category: initialCategory,
        city: initialCity,
        originalQuoteInr: quoteInr,
        guestCount,
        eventDate,
        tactic,
        language,
      }),
    [
      initialVendorName,
      initialCategory,
      initialCity,
      quoteInr,
      guestCount,
      eventDate,
      tactic,
      language,
    ],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(strategy.pitchScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="negotiation-coach-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2
              id="negotiation-coach-title"
              className="text-lg font-bold text-stone-900 flex items-center gap-2"
            >
              <span>🤝</span> AI Vendor Negotiation Coach
            </h2>
            <p className="text-xs text-stone-500">
              Cultural bargaining intelligence for {initialVendorName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="quote-inr-input"
              className="text-xs font-semibold text-stone-700 whitespace-nowrap"
            >
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
        </div>

        {renderMetrics(
          strategy.estimatedSavingsInr,
          strategy.targetOfferInr,
          strategy.targetDiscountPct,
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Generated WhatsApp / Call Pitch:
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-0.5 rounded-md transition-colors"
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy Pitch Script'}
            </button>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 font-sans leading-relaxed">
            {strategy.pitchScript}
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
          <p className="font-semibold text-amber-900">Recommended Contract Counter-Clause:</p>
          <p className="text-amber-800">{strategy.counterClauseRecommendation}</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
