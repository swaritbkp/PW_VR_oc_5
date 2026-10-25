'use client';

import React, { useMemo, useState } from 'react';
import {
  formulateNegotiation,
  type NegotiationLanguage,
  type NegotiationTactic,
} from '@/lib/vendors/negotiate';
import {
  NegotiationFormControls,
  NegotiationPitchCard,
  RenderMetrics,
} from './NegotiationSections';

export interface NegotiationCoachProps {
  readonly initialVendorName?: string;
  readonly initialCategory?: string;
  readonly initialCity?: string;
  readonly initialQuoteInr?: number;
  readonly guestCount?: number;
  readonly eventDate?: string;
  readonly onClose: () => void;
}

function NegotiationHeader({
  vendorName,
  onClose,
}: {
  readonly vendorName: string;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
      <div>
        <h2 id="negotiation-coach-title" className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <span>🤝</span> AI Vendor Negotiation Coach
        </h2>
        <p className="text-xs text-stone-500">Cultural bargaining intelligence for {vendorName}</p>
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

function useClipboardCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };
  return { copied, handleCopy };
}

function useNegotiationStrategy(opts: NegotiationCoachProps) {
  const {
    initialVendorName = 'Premier Event Vendor',
    initialCategory = 'venue',
    initialCity = 'Chandigarh',
    initialQuoteInr = 350000,
    guestCount = 250,
    eventDate = '2026-12-14',
  } = opts;
  const [tactic, setTactic] = useState<NegotiationTactic>('off_peak');
  const [language, setLanguage] = useState<NegotiationLanguage>('en');
  const [quoteInr, setQuoteInr] = useState(initialQuoteInr);

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
    [initialVendorName, initialCategory, initialCity, quoteInr, guestCount, eventDate, tactic, language],
  );

  const { copied, handleCopy } = useClipboardCopy(strategy.pitchScript);

  return { tactic, setTactic, language, setLanguage, quoteInr, setQuoteInr, copied, strategy, handleCopy };
}

function NegotiationDoneButton({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onClose}
        className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

/**
 * Cultural AI negotiation assistant generating culturally authentic bargaining scripts across 4 strategic levers.
 */
export function NegotiationCoach(props: NegotiationCoachProps): React.JSX.Element {
  const { initialVendorName = 'Premier Event Vendor', onClose } = props;
  const s = useNegotiationStrategy(props);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="negotiation-coach-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
        <NegotiationHeader vendorName={initialVendorName} onClose={onClose} />
        <NegotiationFormControls
          quoteInr={s.quoteInr}
          setQuoteInr={s.setQuoteInr}
          tactic={s.tactic}
          setTactic={s.setTactic}
          language={s.language}
          setLanguage={s.setLanguage}
        />
        <RenderMetrics
          savings={s.strategy.estimatedSavingsInr}
          targetOffer={s.strategy.targetOfferInr}
          discountPct={s.strategy.targetDiscountPct}
        />
        <NegotiationPitchCard
          pitchScript={s.strategy.pitchScript}
          counterClause={s.strategy.counterClauseRecommendation}
          copied={s.copied}
          onCopy={s.handleCopy}
        />
        <NegotiationDoneButton onClose={onClose} />
      </div>
    </div>
  );
}
