'use client';

import React, { useState } from 'react';
import { formatInr } from '@/lib/format';
import { IntakeSchema, type IntakeInput } from '@/lib/plan/schemas';
import type { EventType } from '@/lib/plan/types';

export interface IntakeSheetProps {
  readonly initialValues?: Partial<IntakeInput>;
  readonly onSubmit: (data: IntakeInput) => void;
  readonly onCancel?: () => void;
  readonly isSubmitting?: boolean;
}

function parseNonNegotiables(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 5);
}

const EVENT_TYPES: readonly EventType[] = ['wedding', 'birthday', 'community'];
const LANGS = [
  { code: 'en' as const, label: 'English' },
  { code: 'hi' as const, label: 'हिंदी' },
  { code: 'pa' as const, label: 'ਪੰਜਾਬੀ' },
];

function renderTypeBtn(t: EventType, active: boolean, onClick: () => void) {
  const cls = active
    ? 'bg-amber-800 text-white border-amber-800'
    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
  return (
    <button
      key={t}
      type="button"
      onClick={onClick}
      className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize border transition-colors ${cls}`}
    >
      {t}
    </button>
  );
}

function renderLangBtn(l: (typeof LANGS)[number], active: boolean, onClick: () => void) {
  const cls = active
    ? 'bg-amber-800 text-white border-amber-800'
    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
  return (
    <button
      key={l.code}
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${cls}`}
    >
      {l.label}
    </button>
  );
}

export function IntakeSheet({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: IntakeSheetProps): React.JSX.Element {
  const [eventType, setEventType] = useState<EventType>(initialValues?.eventType ?? 'wedding');
  const [city, setCity] = useState(initialValues?.city ?? 'Chandigarh');
  const [date, setDate] = useState(initialValues?.date ?? '2026-12-15');
  const [guests, setGuests] = useState(String(initialValues?.guests ?? 250));
  const [budgetInr, setBudgetInr] = useState(String(initialValues?.budgetInr ?? 2500000));
  const [style, setStyle] = useState(initialValues?.style ?? '');
  const [rawNn, setRawNn] = useState(initialValues?.nonNegotiables?.join(', ') ?? '');
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>(initialValues?.language ?? 'en');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const candidate = {
      eventType,
      templateId: initialValues?.templateId,
      city: city.trim(),
      date,
      guests: parseInt(guests, 10) || 0,
      budgetInr: parseInt(budgetInr, 10) || 0,
      style: style.trim() || undefined,
      nonNegotiables: parseNonNegotiables(rawNn),
      language,
    };
    const parsed = IntakeSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid intake data');
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-xl mx-auto"
    >
      <div>
        <h3 className="font-bold text-stone-900 text-base">Celebration Details</h3>
        <p className="text-xs text-stone-500">
          Provide the non-negotiables for your living event plan.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl"
        >
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          Celebration Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EVENT_TYPES.map((t) => renderTypeBtn(t, eventType === t, () => setEventType(t)))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city-input" className="block text-xs font-semibold text-stone-700 mb-1">
            City
          </label>
          <input
            id="city-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full p-2 text-xs border border-stone-200 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="date-input" className="block text-xs font-semibold text-stone-700 mb-1">
            Event Date
          </label>
          <input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full p-2 text-xs border border-stone-200 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="guests-input" className="block text-xs font-semibold text-stone-700 mb-1">
            Guest Count
          </label>
          <input
            id="guests-input"
            type="number"
            min="1"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            required
            className="w-full p-2 text-xs border border-stone-200 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="budget-input" className="block text-xs font-semibold text-stone-700 mb-1">
            Budget (₹ INR)
          </label>
          <input
            id="budget-input"
            type="number"
            min="1000"
            value={budgetInr}
            onChange={(e) => setBudgetInr(e.target.value)}
            required
            className="w-full p-2 text-xs border border-stone-200 rounded-lg"
          />
          <p className="text-[10px] text-amber-800 font-mono mt-0.5">
            {formatInr(parseInt(budgetInr, 10) || 0)}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="style-input" className="block text-xs font-semibold text-stone-700 mb-1">
          Theme & Style Notes
        </label>
        <input
          id="style-input"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="e.g. Traditional rustic courtyard with marigold"
          className="w-full p-2 text-xs border border-stone-200 rounded-lg"
        />
      </div>

      <div>
        <label htmlFor="nn-input" className="block text-xs font-semibold text-stone-700 mb-1">
          Non-Negotiables (comma separated, max 5)
        </label>
        <input
          id="nn-input"
          value={rawNn}
          onChange={(e) => setRawNn(e.target.value)}
          placeholder="e.g. Pure vegetarian menu, Live dhol at entry, Drone photography"
          className="w-full p-2 text-xs border border-stone-200 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          Planning Language
        </label>
        <div className="flex gap-2">
          {LANGS.map((l) => renderLangBtn(l, language === l.code, () => setLanguage(l.code)))}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-stone-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-4 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Generating Adapted Living Plan...' : 'Generate Living Event Graph'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
