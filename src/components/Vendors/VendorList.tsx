'use client';

import React, { useMemo, useState } from 'react';
import type { VendorNeedId } from '@/lib/plan/types';
import type { Vendor, VendorSelection } from '@/lib/vendors/types';
import { VendorCard } from './VendorCard';

export interface VendorListProps {
  readonly vendors: readonly Vendor[];
  readonly rankedVendors?: readonly { vendor: Vendor; score: number }[];
  readonly selectedNeed: VendorNeedId;
  readonly city: string;
  readonly selections?: readonly VendorSelection[];
  readonly isLoading?: boolean;
  readonly fallback?: { reason: string; mapsSearchUrl: string; query: string };
  readonly onSelectVendor?: (vendor: Vendor) => void;
  readonly onManualAdd?: (vendor: Vendor) => void;
}

function handleManualSubmit(
  e: React.FormEvent<HTMLFormElement>,
  onAdd: (vendor: Vendor) => void,
) {
  e.preventDefault();
  const form = e.currentTarget;
  const name = (form.elements.namedItem('vName') as HTMLInputElement).value;
  const phone = (form.elements.namedItem('vPhone') as HTMLInputElement).value;
  const address = (form.elements.namedItem('vAddr') as HTMLInputElement).value;
  if (!name) return;
  onAdd({
    placeId: `manual_${Date.now()}`,
    name,
    address: address || 'Manual Entry',
    location: { lat: 0, lng: 0 },
    phone: phone || undefined,
  });
}

function renderManualAddForm(onAdd: (vendor: Vendor) => void, onCancel: () => void) {
  return (
    <form
      onSubmit={(e) => handleManualSubmit(e, onAdd)}
      className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 text-xs"
    >
      <h5 className="font-semibold text-stone-800">Add Custom Vendor</h5>
      <input
        name="vName"
        placeholder="Vendor or Business Name *"
        required
        className="w-full p-2 border border-stone-200 rounded"
      />
      <input
        name="vPhone"
        placeholder="Phone Number (e.g. 9876543210)"
        className="w-full p-2 border border-stone-200 rounded"
      />
      <input
        name="vAddr"
        placeholder="Address or Area"
        className="w-full p-2 border border-stone-200 rounded"
      />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 py-1.5 bg-amber-800 text-white font-semibold rounded">
          Save Vendor
        </button>
        <button type="button" onClick={onCancel} className="py-1.5 px-3 bg-stone-200 text-stone-700 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function renderFallbackBanner(
  fallback: { reason: string; mapsSearchUrl: string; query: string },
  showForm: boolean,
  setShowForm: (show: boolean) => void,
  onManualAdd?: (v: Vendor) => void,
) {
  return (
    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
      <div className="space-y-1">
        <h4 className="font-bold text-amber-900 text-xs">
          {fallback.reason === 'NO_KEY' ? 'Live API Offline' : 'Places Quota Reached'}
        </h4>
        <p className="text-xs text-amber-800">
          Search directly on Google Maps or manually add your trusted local vendor below.
        </p>
      </div>
      <div className="flex gap-2">
        <a
          href={fallback.mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 shadow-sm"
        >
          Search on Google Maps ↗
        </a>
        {onManualAdd && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900"
          >
            + Add Manually
          </button>
        )}
      </div>
      {showForm && onManualAdd && renderManualAddForm(onManualAdd, () => setShowForm(false))}
    </div>
  );
}

export function VendorList({
  vendors,
  rankedVendors,
  selectedNeed,
  city,
  selections,
  isLoading,
  fallback,
  onSelectVendor,
  onManualAdd,
}: VendorListProps): React.JSX.Element {
  const [showManualForm, setShowManualForm] = useState(false);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    if (rankedVendors) {
      for (const item of rankedVendors) map.set(item.vendor.placeId, item.score);
    }
    return map;
  }, [rankedVendors]);

  const statusMap = useMemo(() => {
    const map = new Map<string, VendorSelection['status']>();
    if (selections) {
      for (const s of selections) map.set(s.placeId, s.status);
    }
    return map;
  }, [selections]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 animate-pulse" aria-live="polite">
        Finding vetted local vendors near {city}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900 text-sm capitalize">
          {selectedNeed.replace('_', ' ')} in {city}
        </h3>
        <span className="text-[11px] text-stone-400 font-medium">Powered by Google</span>
      </div>

      {fallback &&
        renderFallbackBanner(fallback, showManualForm, setShowManualForm, onManualAdd)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.placeId}
            vendor={vendor}
            score={scoreMap.get(vendor.placeId)}
            currentStatus={statusMap.get(vendor.placeId)}
            onSelect={onSelectVendor}
          />
        ))}
      </div>
    </div>
  );
}
