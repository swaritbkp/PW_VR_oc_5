'use client';

import React, { useMemo } from 'react';
import type { PlanState } from '@/lib/plan/propagate';
import { generateExecutiveDossier, type DossierSection } from '@/lib/plan/dossier';

export interface DossierModalProps {
  readonly plan: PlanState;
  readonly onClose: () => void;
}

function renderSection(section: DossierSection, index: number) {
  return (
    <div
      key={`section-${index}`}
      className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2"
    >
      <div>
        <h3 className="font-bold text-stone-900 text-sm">{section.title}</h3>
        <p className="text-xs text-stone-500">{section.summary}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {section.keyMetrics.map((km, i) => (
          <div
            key={`km-${i}`}
            className="p-2 bg-white rounded-lg border border-stone-200 text-center"
          >
            <p className="text-[10px] text-stone-500 uppercase font-semibold">{km.label}</p>
            <p className="text-xs font-bold text-stone-800">{km.value}</p>
          </div>
        ))}
      </div>

      <ul className="text-xs space-y-1 text-stone-700 bg-white p-2.5 rounded-lg border border-stone-100">
        {section.items.map((item, i) => (
          <li key={`item-${i}`} className="flex items-start gap-1.5">
            <span className="text-amber-600 font-bold">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderTopMetrics(totalBudget: string, onTimeProb: string, contingency: string) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <div className="p-3 bg-amber-500/10 rounded-xl text-center border border-amber-500/30">
        <p className="text-[10px] font-semibold text-amber-800 uppercase">Total Budget</p>
        <p className="text-base font-bold text-stone-900">{totalBudget}</p>
      </div>
      <div className="p-3 bg-emerald-500/10 rounded-xl text-center border border-emerald-500/30">
        <p className="text-[10px] font-semibold text-emerald-800 uppercase">On-Time Probability</p>
        <p className="text-base font-bold text-emerald-800">{onTimeProb}</p>
      </div>
      <div className="p-3 bg-stone-100 rounded-xl text-center border border-stone-200">
        <p className="text-[10px] font-semibold text-stone-600 uppercase">Contingency Reserve</p>
        <p className="text-base font-bold text-stone-800">{contingency}</p>
      </div>
    </div>
  );
}

function renderModalHeader(onPrint: () => void, onClose: () => void) {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 pb-3 print:hidden">
      <div>
        <h2
          id="dossier-modal-title"
          className="text-lg font-bold text-stone-900 flex items-center gap-2"
        >
          <span>📜</span> Executive Celebration Dossier
        </h2>
        <p className="text-xs text-stone-500">
          Official Master Brief for Family Elders & Stakeholders
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span>🖨️</span>
          <span>Print / PDF</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function renderDossierContent(dossier: ReturnType<typeof generateExecutiveDossier>) {
  return (
    <div className="space-y-3">
      <div className="border-b border-stone-100 pb-2">
        <p className="text-xl font-serif font-bold text-stone-900">{dossier.title}</p>
        <p className="text-xs text-stone-500">
          {dossier.subtitle} • {dossier.generatedDate}
        </p>
      </div>
      {renderTopMetrics(
        dossier.totalBudgetFormatted,
        dossier.onTimeProbabilityFormatted,
        dossier.contingencyReserveFormatted,
      )}
      <div className="space-y-3">
        {dossier.sections.map((section, idx) => renderSection(section, idx))}
      </div>
    </div>
  );
}

function renderModalFooter(onClose: () => void) {
  return (
    <div className="flex justify-between items-center pt-2 border-t border-stone-200 print:hidden">
      <p className="text-[11px] text-stone-400 italic">
        Jashn Event Graph Engine • Deterministic Scheduling
      </p>
      <button
        type="button"
        onClick={onClose}
        className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
      >
        Close Dossier
      </button>
    </div>
  );
}

/**
 * Executive Celebration Dossier modal formatted with print styles for family elders and stakeholders.
 */
export function DossierModal({ plan, onClose }: DossierModalProps): React.JSX.Element {
  const dossier = useMemo(() => generateExecutiveDossier(plan), [plan]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-stone-200 print:max-w-none print:shadow-none print:p-0">
        {renderModalHeader(handlePrint, onClose)}
        {renderDossierContent(dossier)}
        {renderModalFooter(onClose)}
      </div>
    </div>
  );
}
