'use client';

import React, { useMemo, useState } from 'react';
import type { EventType } from '@/lib/plan/types';
import {
  buildEnquiry,
  mapsDirectionsUrl,
  normalisePhoneIN,
  telLink,
  whatsAppLink,
  type EnquiryLanguage,
} from '@/lib/vendors/contact';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';

export interface ContactSheetProps {
  readonly vendor: Vendor;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly city: string;
  readonly guests: number;
  readonly currentStatus?: VendorStatus;
  readonly onClose: () => void;
  readonly onUpdateStatus: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
}

const LANGS: readonly { code: EnquiryLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

function renderLanguages(current: EnquiryLanguage, onChange: (lang: EnquiryLanguage) => void) {
  return (
    <div className="flex gap-2">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
            current === l.code
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

function renderCommunicationLinks(
  phoneObj: ReturnType<typeof normalisePhoneIN>,
  waUrl: string | null,
) {
  const disabledCls = 'py-2 px-3 text-xs rounded-lg bg-stone-100 text-stone-400';
  return (
    <>
      {phoneObj ? (
        <a href={telLink(phoneObj)} className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors">
          Call ({phoneObj.kind})
        </a>
      ) : (
        <button disabled className={disabledCls}>No Phone Listed</button>
      )}
      {waUrl ? (
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
          WhatsApp (wa.me)
        </a>
      ) : (
        <button disabled className={disabledCls}>No Mobile for WA</button>
      )}
    </>
  );
}

function renderNavigationLinks(vendor: Vendor) {
  const directionsUrl = mapsDirectionsUrl(vendor.name, vendor.placeId);
  return (
    <>
      <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="py-2 px-3 text-center text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors">
        Directions
      </a>
      {vendor.website ? (
        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="py-2 px-3 text-center text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors">
          Website
        </a>
      ) : (
        <button disabled className="py-2 px-3 text-xs rounded-lg bg-stone-100 text-stone-400">No Website</button>
      )}
    </>
  );
}

function renderFooterButtons(
  status: VendorStatus | undefined,
  quote: number | undefined,
  vendor: Vendor,
  onUpdate: (v: Vendor, s: VendorStatus, q?: number) => void,
) {
  return (
    <div className="pt-4 border-t border-stone-200 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onUpdate(vendor, 'contacted')}
          className={`py-2 px-3 text-xs font-semibold rounded-lg border ${
            status === 'contacted'
              ? 'bg-blue-50 text-blue-800 border-blue-400'
              : 'border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Mark Contacted
        </button>
        <button
          type="button"
          onClick={() => onUpdate(vendor, 'backup')}
          className={`py-2 px-3 text-xs font-semibold rounded-lg border ${
            status === 'backup'
              ? 'bg-teal-50 text-teal-800 border-teal-400'
              : 'border-teal-200 text-teal-800 bg-teal-50/50 hover:bg-teal-100'
          }`}
        >
          Hold as Backup
        </button>
      </div>
      <button
        type="button"
        onClick={() => onUpdate(vendor, 'booked', quote)}
        className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
      >
        Confirm Booking
      </button>
    </div>
  );
}

export function ContactSheet({
  vendor,
  eventType,
  eventDate,
  city,
  guests,
  currentStatus,
  onClose,
  onUpdateStatus,
}: ContactSheetProps): React.JSX.Element {
  const [lang, setLang] = useState<EnquiryLanguage>('en');
  const [quoteInput, setQuoteInput] = useState<string>('');

  const phoneObj = useMemo(
    () => (vendor.phone ? normalisePhoneIN(vendor.phone) : null),
    [vendor.phone],
  );
  const enquiry = useMemo(
    () => buildEnquiry({ eventType, date: eventDate, city, guests, language: lang }),
    [eventType, eventDate, city, guests, lang],
  );
  const waUrl = useMemo(
    () => (phoneObj ? whatsAppLink(phoneObj, enquiry) : null),
    [phoneObj, enquiry],
  );

  return (
    <div
      role="dialog"
      aria-label={`Contact ${vendor.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between z-50 overflow-y-auto"
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-base">{vendor.name}</h3>
            <p className="text-xs text-stone-500">{vendor.address}</p>
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

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Initial Message Language
          </label>
          {renderLanguages(lang, setLang)}
          <div className="mt-2 p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-700 italic">
            &ldquo;{enquiry}&rdquo;
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-stone-700 mb-2">Direct Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {renderCommunicationLinks(phoneObj, waUrl)}
            {renderNavigationLinks(vendor)}
          </div>
        </div>

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
      </div>

      {renderFooterButtons(
        currentStatus,
        quoteInput ? parseInt(quoteInput, 10) : undefined,
        vendor,
        onUpdateStatus,
      )}
    </div>
  );
}
