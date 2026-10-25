'use client';

import React, { useMemo, useState } from 'react';
import { buildPlanIcs } from '@/lib/ics';
import type { PlanState } from '@/lib/plan/propagate';
import { buildWhatsAppSummary, type SupportedLanguage } from '@/lib/plan/whatsapp';

export interface ShareSheetProps {
  readonly plan: PlanState;
  readonly onClose: () => void;
  readonly onOpenDossier?: () => void;
  readonly onOpenPortable?: () => void;
}

const SUPPORTED_LANGUAGES: readonly { readonly code: SupportedLanguage; readonly label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

function triggerIcsDownload(plan: PlanState) {
  const icsString = buildPlanIcs(plan.intake.eventType, plan.intake.date, plan.tasks);
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `jashn-plan-${plan.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function RenderLanguages({
  lang,
  setLang,
}: {
  readonly lang: SupportedLanguage;
  readonly setLang: (l: SupportedLanguage) => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {SUPPORTED_LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLang(item.code)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            lang === item.code ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ShareSheetHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-bold text-stone-900 text-base">Share Living Plan</h3>
        <p className="text-xs text-stone-500">Export schedule to WhatsApp, iCalendar, or PDF.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close share sheet"
        className="p-1 text-stone-400 hover:text-stone-700 text-sm"
      >
        ✕
      </button>
    </div>
  );
}

function WhatsAppActionButtons({
  copied,
  summary,
  onCopy,
}: {
  readonly copied: boolean;
  readonly summary: string;
  readonly onCopy: () => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200"
      >
        {copied ? '✓ Copied' : 'Copy Text'}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(summary)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 py-2 px-3 text-center text-xs font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-sm"
      >
        Share WhatsApp
      </a>
    </div>
  );
}

function WhatsAppShareSection({
  summary,
  lang,
  setLang,
  copied,
  onCopy,
}: {
  readonly summary: string;
  readonly lang: SupportedLanguage;
  readonly setLang: (l: SupportedLanguage) => void;
  readonly copied: boolean;
  readonly onCopy: () => void;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          WhatsApp Summary Language
        </label>
        <RenderLanguages lang={lang} setLang={setLang} />
        <pre className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 whitespace-pre-wrap">
          {summary}
        </pre>
      </div>
      <WhatsAppActionButtons copied={copied} summary={summary} onCopy={onCopy} />
    </div>
  );
}

function CalendarPrintButtons({ onDownloadIcs }: { readonly onDownloadIcs: () => void }): React.JSX.Element {
  return (
    <>
      <button
        type="button"
        onClick={onDownloadIcs}
        className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-50 flex items-center justify-center gap-2"
      >
        <span>📅</span> Export iCalendar (.ics)
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="w-full py-2 px-3 text-xs font-medium rounded-xl text-stone-600 hover:bg-stone-100"
      >
        Print / Save to PDF
      </button>
    </>
  );
}

function ExportActionsSection({
  onOpenPortable,
  onOpenDossier,
  onDownloadIcs,
}: {
  readonly onOpenPortable?: () => void;
  readonly onOpenDossier?: () => void;
  readonly onDownloadIcs: () => void;
}): React.JSX.Element {
  return (
    <div className="pt-3 border-t border-stone-200 space-y-2">
      <h4 className="font-bold text-stone-800 text-xs">Calendar & Print Exports</h4>
      {onOpenPortable && (
        <button
          type="button"
          onClick={onOpenPortable}
          className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center gap-2 shadow-xs"
        >
          <span>📦</span> Save / Load .jashn File
        </button>
      )}
      {onOpenDossier && (
        <button
          type="button"
          onClick={onOpenDossier}
          className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-amber-500/10 border border-amber-500 text-amber-900 hover:bg-amber-500/20 flex items-center justify-center gap-2"
        >
          <span>📜</span> View Executive Celebration Dossier
        </button>
      )}
      <CalendarPrintButtons onDownloadIcs={onDownloadIcs} />
    </div>
  );
}

function useShareSummary(plan: PlanState) {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [copied, setCopied] = useState(false);
  const summary = useMemo(() => buildWhatsAppSummary(plan, lang), [plan, lang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { lang, setLang, copied, summary, handleCopy };
}

/**
 * Modal for sharing the celebration plan via localized WhatsApp messages, ICS calendar download, or dossier brief.
 */
export function ShareSheet({
  plan,
  onClose,
  onOpenDossier,
  onOpenPortable,
}: ShareSheetProps): React.JSX.Element {
  const { lang, setLang, copied, summary, handleCopy } = useShareSummary(plan);

  return (
    <div
      role="dialog"
      aria-label="Share & Export Plan"
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between z-50 overflow-y-auto"
    >
      <div className="space-y-4">
        <ShareSheetHeader onClose={onClose} />
        <WhatsAppShareSection
          summary={summary}
          lang={lang}
          setLang={setLang}
          copied={copied}
          onCopy={handleCopy}
        />
        <ExportActionsSection
          onOpenPortable={onOpenPortable}
          onOpenDossier={onOpenDossier}
          onDownloadIcs={() => triggerIcsDownload(plan)}
        />
      </div>
    </div>
  );
}
