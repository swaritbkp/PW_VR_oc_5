'use client';

import React, { useMemo, useState } from 'react';
import type { EventType } from '@/lib/plan/types';
import {
  buildEnquiry,
  normalisePhoneIN,
  whatsAppLink,
  type EnquiryLanguage,
} from '@/lib/vendors/contact';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';
import { IconCheckCircle } from '../UI/JashnIcons';
import { ContactDirectActions } from './ContactLinks';
import { QuoteInputField } from './NegotiationSections';

export interface ContactSheetProps {
  readonly vendor: Vendor;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly city: string;
  readonly guests: number;
  readonly currentStatus?: VendorStatus;
  readonly onClose: () => void;
  readonly onUpdateStatus: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
  readonly onOpenNegotiation?: (vendor: Vendor) => void;
  readonly onOpenRedFlags?: () => void;
}

const ENQUIRY_LANGS: readonly { readonly code: EnquiryLanguage; readonly label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

function RenderLanguages({
  lang,
  setLang,
}: {
  readonly lang: EnquiryLanguage;
  readonly setLang: (l: EnquiryLanguage) => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-1.5">
      {ENQUIRY_LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
            lang === l.code
              ? 'bg-amber-800 text-white border-amber-800'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function StatusActionButtons({
  status,
  vendor,
  onUpdate,
}: {
  readonly status: VendorStatus | undefined;
  readonly vendor: Vendor;
  readonly onUpdate: (v: Vendor, s: VendorStatus, q?: number) => void;
}): React.JSX.Element {
  const contactCls =
    status === 'contacted'
      ? 'bg-blue-50 text-blue-800 border-blue-400'
      : 'border-stone-200 text-stone-700 hover:bg-stone-50';
  const backupCls =
    status === 'backup'
      ? 'bg-teal-50 text-teal-800 border-teal-400'
      : 'border-teal-200 text-teal-800 bg-teal-50/50 hover:bg-teal-100';

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onUpdate(vendor, 'contacted')}
        className={`py-2 px-3 text-xs font-semibold rounded-lg border hover:-translate-y-0.5 transition-all duration-200 shadow-2xs ${contactCls}`}
      >
        Mark Contacted
      </button>
      <button
        type="button"
        onClick={() => onUpdate(vendor, 'backup')}
        className={`py-2 px-3 text-xs font-semibold rounded-lg border hover:-translate-y-0.5 transition-all duration-200 shadow-2xs ${backupCls}`}
      >
        Hold as Backup
      </button>
    </div>
  );
}

function RenderFooterButtons({
  status,
  quote,
  vendor,
  onUpdate,
}: {
  readonly status: VendorStatus | undefined;
  readonly quote: number | undefined;
  readonly vendor: Vendor;
  readonly onUpdate: (v: Vendor, s: VendorStatus, q?: number) => void;
}): React.JSX.Element {
  return (
    <div className="pt-4 border-t border-stone-200 space-y-2">
      <StatusActionButtons status={status} vendor={vendor} onUpdate={onUpdate} />
      <button
        type="button"
        onClick={() => onUpdate(vendor, 'booked', quote)}
        className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
      >
        <IconCheckCircle className="w-3.5 h-3.5" />
        <span>Confirm Booking</span>
      </button>
    </div>
  );
}

function ContactHeader({
  name,
  address,
  onClose,
}: {
  readonly name: string;
  readonly address: string;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-bold text-stone-900 text-base">{name}</h3>
        <p className="text-xs text-stone-500">{address}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close contact drawer"
        className="p-1 text-stone-400 hover:text-stone-700 rounded-lg text-sm"
      >
        ✕
      </button>
    </div>
  );
}

function InitialMessageField({
  lang,
  setLang,
  enquiry,
}: {
  readonly lang: EnquiryLanguage;
  readonly setLang: (l: EnquiryLanguage) => void;
  readonly enquiry: string;
}): React.JSX.Element {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Initial Message Language</label>
      <RenderLanguages lang={lang} setLang={setLang} />
      <div className="mt-2 p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-700 italic">
        &ldquo;{enquiry}&rdquo;
      </div>
    </div>
  );
}

function useContactDetails(options: {
  readonly vendor: Vendor;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly city: string;
  readonly guests: number;
}) {
  const [lang, setLang] = useState<EnquiryLanguage>('en');
  const [quoteInput, setQuoteInput] = useState<string>('');

  const phoneObj = useMemo(
    () => (options.vendor.phone ? normalisePhoneIN(options.vendor.phone) : null),
    [options.vendor.phone],
  );
  const enquiry = useMemo(
    () =>
      buildEnquiry({
        eventType: options.eventType,
        date: options.eventDate,
        city: options.city,
        guests: options.guests,
        language: lang,
      }),
    [options.eventType, options.eventDate, options.city, options.guests, lang],
  );
  const waUrl = useMemo(() => (phoneObj ? whatsAppLink(phoneObj, enquiry) : null), [phoneObj, enquiry]);
  const parsedQuote = quoteInput ? parseInt(quoteInput, 10) : undefined;

  return { lang, setLang, quoteInput, setQuoteInput, phoneObj, enquiry, waUrl, parsedQuote };
}

/**
 * Modal dialog for initiating contact, inspecting details, and updating booking status for a selected vendor.
 */
export function ContactSheet(props: ContactSheetProps): React.JSX.Element {
  const { vendor, eventType, eventDate, city, guests, currentStatus, onClose, onUpdateStatus, onOpenNegotiation, onOpenRedFlags } = props;
  const { lang, setLang, quoteInput, setQuoteInput, phoneObj, enquiry, waUrl, parsedQuote } =
    useContactDetails({ vendor, eventType, eventDate, city, guests });

  return (
    <div
      role="dialog"
      aria-label={`Contact ${vendor.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between z-50 overflow-y-auto"
    >
      <div className="space-y-5">
        <ContactHeader name={vendor.name} address={vendor.address} onClose={onClose} />
        <InitialMessageField lang={lang} setLang={setLang} enquiry={enquiry} />
        <ContactDirectActions
          vendor={vendor}
          phoneObj={phoneObj}
          waUrl={waUrl}
          onOpenNegotiation={onOpenNegotiation}
          onOpenRedFlags={onOpenRedFlags}
        />
        <QuoteInputField quoteInput={quoteInput} setQuoteInput={setQuoteInput} />
      </div>
      <RenderFooterButtons status={currentStatus} quote={parsedQuote} vendor={vendor} onUpdate={onUpdateStatus} />
    </div>
  );
}
