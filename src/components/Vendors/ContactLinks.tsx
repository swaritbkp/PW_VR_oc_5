'use client';

import React from 'react';
import { mapsDirectionsUrl, normalisePhoneIN, telLink } from '@/lib/vendors/contact';
import type { Vendor } from '@/lib/vendors/types';
import { IconAlertShield, IconScale } from '../UI/JashnIcons';

interface ContactLinksProps {
  readonly vendor: Vendor;
  readonly phoneObj: ReturnType<typeof normalisePhoneIN>;
  readonly waUrl: string | null;
}

function DirectCalls({
  phoneObj,
  waUrl,
}: {
  readonly phoneObj: ReturnType<typeof normalisePhoneIN>;
  readonly waUrl: string | null;
}): React.JSX.Element {
  const dis = 'py-2 px-3 text-xs rounded-lg bg-stone-100 text-stone-400 text-center';
  return (
    <>
      {phoneObj ? (
        <a
          href={telLink(phoneObj)}
          className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
        >
          Call ({phoneObj.kind})
        </a>
      ) : (
        <button disabled className={dis}>
          No Phone
        </button>
      )}
      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          WhatsApp (wa.me)
        </a>
      ) : (
        <button disabled className={dis}>
          No Mobile
        </button>
      )}
    </>
  );
}

function WebLinks({ vendor }: { readonly vendor: Vendor }): React.JSX.Element {
  const directionsUrl = mapsDirectionsUrl(vendor.name, vendor.placeId);
  return (
    <>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="py-2 px-3 text-center text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
      >
        Directions
      </a>
      {vendor.website ? (
        <a
          href={vendor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3 text-center text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Website
        </a>
      ) : (
        <button disabled className="py-2 px-3 text-xs rounded-lg bg-stone-100 text-stone-400">
          No Website
        </button>
      )}
    </>
  );
}

/**
 * Direct telephone, WhatsApp, Google Maps, and website action buttons for a selected vendor.
 */
export function ContactLinks({ vendor, phoneObj, waUrl }: ContactLinksProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2">
      <DirectCalls phoneObj={phoneObj} waUrl={waUrl} />
      <WebLinks vendor={vendor} />
    </div>
  );
}

function ToolButtons({
  vendor,
  onOpenNegotiation,
  onOpenRedFlags,
}: {
  readonly vendor: Vendor;
  readonly onOpenNegotiation?: (vendor: Vendor) => void;
  readonly onOpenRedFlags?: () => void;
}): React.JSX.Element | null {
  if (!onOpenNegotiation && !onOpenRedFlags) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {onOpenNegotiation && (
        <button
          type="button"
          onClick={() => onOpenNegotiation(vendor)}
          className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
        >
          <IconScale className="w-3.5 h-3.5 text-amber-800" />
          <span>Negotiation Coach</span>
        </button>
      )}
      {onOpenRedFlags && (
        <button
          type="button"
          onClick={onOpenRedFlags}
          className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
        >
          <IconAlertShield className="w-3.5 h-3.5 text-rose-700" />
          <span>Scan Red-Flags</span>
        </button>
      )}
    </div>
  );
}

/**
 * Direct contact action buttons including telephone, WhatsApp, map links, and optional negotiation/red-flags tools.
 */
export function ContactDirectActions({
  vendor,
  phoneObj,
  waUrl,
  onOpenNegotiation,
  onOpenRedFlags,
}: {
  readonly vendor: Vendor;
  readonly phoneObj: ReturnType<typeof normalisePhoneIN>;
  readonly waUrl: string | null;
  readonly onOpenNegotiation?: (vendor: Vendor) => void;
  readonly onOpenRedFlags?: () => void;
}): React.JSX.Element {
  return (
    <div>
      <h4 className="text-xs font-semibold text-stone-700 mb-2">Direct Actions</h4>
      <ContactLinks vendor={vendor} phoneObj={phoneObj} waUrl={waUrl} />
      <ToolButtons vendor={vendor} onOpenNegotiation={onOpenNegotiation} onOpenRedFlags={onOpenRedFlags} />
    </div>
  );
}
