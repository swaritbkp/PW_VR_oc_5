'use client';

import React, { useMemo, useState } from 'react';
import { IntakeSchema, type IntakeInput } from '@/lib/plan/schemas';
import type { EventType } from '@/lib/plan/types';
import { detectPromptInjection } from '@/lib/security/guardrails';
import {
  CityDateInputs,
  EventTypeSelector,
  GuestBudgetInputs,
  LanguageSelector,
  StyleNonNegotiablesInputs,
} from './IntakeFormSections';

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

function FormActionButtons({
  isSubmitting,
  onCancel,
}: {
  readonly isSubmitting?: boolean;
  readonly onCancel?: () => void;
}): React.JSX.Element {
  return (
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
  );
}

function getDefaultLogistics(init?: Partial<IntakeInput>) {
  return {
    eventType: init?.eventType ?? 'wedding',
    city: init?.city ?? 'Chandigarh',
    date: init?.date ?? '2027-02-14',
  };
}

function getDefaultFinancials(init?: Partial<IntakeInput>) {
  return {
    guests: String(init?.guests ?? 250),
    budgetInr: String(init?.budgetInr ?? 2500000),
    style: init?.style ?? '',
  };
}

function getDefaultCultural(init?: Partial<IntakeInput>) {
  return {
    rawNn: init?.nonNegotiables ? init.nonNegotiables.join(', ') : '',
    language: init?.language ?? 'en',
  };
}

function getInitialIntakeValues(init?: Partial<IntakeInput>) {
  return {
    ...getDefaultLogistics(init),
    ...getDefaultFinancials(init),
    ...getDefaultCultural(init),
  };
}

function buildIntakeCandidate(
  state: ReturnType<typeof getInitialIntakeValues>,
  templateId?: string,
) {
  return {
    eventType: state.eventType,
    templateId,
    city: state.city.trim(),
    date: state.date,
    guests: Number.parseInt(state.guests, 10) || 0,
    budgetInr: Number.parseInt(state.budgetInr, 10) || 0,
    style: state.style.trim() || undefined,
    nonNegotiables: parseNonNegotiables(state.rawNn),
    language: state.language,
  };
}

function validateAndSubmitIntake(
  candidate: Record<string, unknown>,
  setErrorMsg: (msg: string | null) => void,
  onSubmit: (data: IntakeInput) => void,
) {
  setErrorMsg(null);
  const textToCheck = `${String(candidate.city ?? '')} ${String(candidate.style ?? '')}`;
  const injection = detectPromptInjection(textToCheck);
  if (injection.isInjection) {
    setErrorMsg('Security Guardrail Violation: Adversarial prompt injection or script tags are prohibited.');
    return;
  }
  const parsed = IntakeSchema.safeParse(candidate);
  if (!parsed.success) {
    setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid intake data');
    return;
  }
  onSubmit(parsed.data);
}

function useIntakeForm(
  initialValues: Partial<IntakeInput> | undefined,
  onSubmit: (data: IntakeInput) => void,
) {
  const defaults = useMemo(() => getInitialIntakeValues(initialValues), [initialValues]);
  const [eventType, setEventType] = useState<EventType>(defaults.eventType);
  const [city, setCity] = useState(defaults.city);
  const [date, setDate] = useState(defaults.date);
  const [guests, setGuests] = useState(defaults.guests);
  const [budgetInr, setBudgetInr] = useState(defaults.budgetInr);
  const [style, setStyle] = useState(defaults.style);
  const [rawNn, setRawNn] = useState(defaults.rawNn);
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>(defaults.language);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = buildIntakeCandidate(
      { eventType, city, date, guests, budgetInr, style, rawNn, language },
      initialValues?.templateId,
    );
    validateAndSubmitIntake(candidate, setErrorMsg, onSubmit);
  };

  return {
    eventType, setEventType,
    city, setCity,
    date, setDate,
    guests, setGuests,
    budgetInr, setBudgetInr,
    style, setStyle,
    rawNn, setRawNn,
    language, setLanguage,
    errorMsg,
    handleSubmit,
  };
}

function IntakeHeader() {
  return (
    <div>
      <h3 className="font-bold text-stone-900 text-base">Celebration Details</h3>
      <p className="text-xs text-stone-500">Provide the non-negotiables for your living event plan.</p>
    </div>
  );
}

/**
 * Interactive intake form capturing event parameters, budget, date, city, and cultural non-negotiables.
 */
export function IntakeSheet({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: IntakeSheetProps): React.JSX.Element {
  const form = useIntakeForm(initialValues, onSubmit);

  return (
    <form
      onSubmit={form.handleSubmit}
      noValidate
      className="space-y-4 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-xl mx-auto"
    >
      <IntakeHeader />
      {form.errorMsg && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
          {form.errorMsg}
        </div>
      )}
      <EventTypeSelector eventType={form.eventType} onChange={form.setEventType} />
      <CityDateInputs city={form.city} date={form.date} onCityChange={form.setCity} onDateChange={form.setDate} />
      <GuestBudgetInputs
        guests={form.guests}
        budgetInr={form.budgetInr}
        onGuestsChange={form.setGuests}
        onBudgetChange={form.setBudgetInr}
      />
      <StyleNonNegotiablesInputs
        style={form.style}
        rawNn={form.rawNn}
        onStyleChange={form.setStyle}
        onNnChange={form.setRawNn}
      />
      <LanguageSelector language={form.language} onChange={form.setLanguage} />
      <FormActionButtons isSubmitting={isSubmitting} onCancel={onCancel} />
    </form>
  );
}
