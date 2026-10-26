'use client';

import React from 'react';
import { formatInr } from '@/lib/format';
import type { EventType } from '@/lib/plan/types';

export const EVENT_TYPES: readonly EventType[] = ['wedding', 'birthday', 'community'];
export const LANGS = [
  { code: 'en' as const, label: 'English' },
  { code: 'hi' as const, label: 'हिंदी' },
  { code: 'pa' as const, label: 'ਪੰਜਾਬੀ' },
];

/**
 * Event type radio-button pill selector.
 */
export function EventTypeSelector({
  eventType,
  onChange,
}: {
  readonly eventType: EventType;
  readonly onChange: (t: EventType) => void;
}): React.JSX.Element {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Celebration Type</label>
      <div className="grid grid-cols-3 gap-2">
        {EVENT_TYPES.map((t) => {
          const active = eventType === t;
          const cls = active
            ? 'bg-amber-800 text-white border-amber-800'
            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize border transition-colors ${cls}`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CityInputField({ city, onCityChange }: { readonly city: string; readonly onCityChange: (v: string) => void }): React.JSX.Element {
  return (
    <div>
      <label htmlFor="city-input" className="block text-xs font-semibold text-stone-700 mb-1">City</label>
      <input id="city-input" value={city} onChange={(e) => onCityChange(e.target.value)} required className="w-full p-2 text-xs border border-stone-200 rounded-lg" />
    </div>
  );
}

function DateInputField({ date, onDateChange }: { readonly date: string; readonly onDateChange: (v: string) => void }): React.JSX.Element {
  return (
    <div>
      <label htmlFor="date-input" className="block text-xs font-semibold text-stone-700 mb-1">Event Date</label>
      <input id="date-input" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required className="w-full p-2 text-xs border border-stone-200 rounded-lg" />
    </div>
  );
}

/**
 * City and event date inputs.
 */
export function CityDateInputs({
  city,
  date,
  onCityChange,
  onDateChange,
}: {
  readonly city: string;
  readonly date: string;
  readonly onCityChange: (v: string) => void;
  readonly onDateChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3">
      <CityInputField city={city} onCityChange={onCityChange} />
      <DateInputField date={date} onDateChange={onDateChange} />
    </div>
  );
}

function GuestsInputField({ guests, onGuestsChange }: { readonly guests: string; readonly onGuestsChange: (v: string) => void }): React.JSX.Element {
  return (
    <div>
      <label htmlFor="guests-input" className="block text-xs font-semibold text-stone-700 mb-1">Guest Count</label>
      <input id="guests-input" type="number" value={guests} onChange={(e) => onGuestsChange(e.target.value)} required className="w-full p-2 text-xs border border-stone-200 rounded-lg" />
    </div>
  );
}

function BudgetInputField({ budgetInr, onBudgetChange }: { readonly budgetInr: string; readonly onBudgetChange: (v: string) => void }): React.JSX.Element {
  return (
    <div>
      <label htmlFor="budget-input" className="block text-xs font-semibold text-stone-700 mb-1">Budget (₹ INR)</label>
      <input id="budget-input" type="number" value={budgetInr} onChange={(e) => onBudgetChange(e.target.value)} required className="w-full p-2 text-xs border border-stone-200 rounded-lg" />
      <p className="text-[10px] text-amber-800 font-mono mt-0.5">{formatInr(parseInt(budgetInr, 10) || 0)}</p>
    </div>
  );
}

/**
 * Guest count and target budget in INR inputs.
 */
export function GuestBudgetInputs({
  guests,
  budgetInr,
  onGuestsChange,
  onBudgetChange,
}: {
  readonly guests: string;
  readonly budgetInr: string;
  readonly onGuestsChange: (v: string) => void;
  readonly onBudgetChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3">
      <GuestsInputField guests={guests} onGuestsChange={onGuestsChange} />
      <BudgetInputField budgetInr={budgetInr} onBudgetChange={onBudgetChange} />
    </div>
  );
}

/**
 * Theme style notes and comma-separated non-negotiables inputs.
 */
export function StyleNonNegotiablesInputs({
  style,
  rawNn,
  onStyleChange,
  onNnChange,
}: {
  readonly style: string;
  readonly rawNn: string;
  readonly onStyleChange: (v: string) => void;
  readonly onNnChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <>
      <div>
        <label htmlFor="style-input" className="block text-xs font-semibold text-stone-700 mb-1">
          Theme & Style Notes
        </label>
        <input
          id="style-input"
          value={style}
          onChange={(e) => onStyleChange(e.target.value)}
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
          onChange={(e) => onNnChange(e.target.value)}
          placeholder="e.g. Pure vegetarian menu, Live dhol at entry, Drone photography"
          className="w-full p-2 text-xs border border-stone-200 rounded-lg"
        />
      </div>
    </>
  );
}

/**
 * Multilingual planning language selector.
 */
export function LanguageSelector({
  language,
  onChange,
}: {
  readonly language: 'en' | 'hi' | 'pa';
  readonly onChange: (l: 'en' | 'hi' | 'pa') => void;
}): React.JSX.Element {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Planning Language</label>
      <div className="flex gap-2">
        {LANGS.map((l) => {
          const active = language === l.code;
          const cls = active
            ? 'bg-amber-800 text-white border-amber-800'
            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onChange(l.code)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${cls}`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
