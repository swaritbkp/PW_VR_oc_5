'use client';

import React from 'react';
import { mapsDirectionsUrl, normalisePhoneIN, telLink } from '@/lib/vendors/contact';
import type { Vendor } from '@/lib/vendors/types';

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

export function ContactLinks({ vendor, phoneObj, waUrl }: ContactLinksProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2">
      <DirectCalls phoneObj={phoneObj} waUrl={waUrl} />
      <WebLinks vendor={vendor} />
    </div>
  );
}
