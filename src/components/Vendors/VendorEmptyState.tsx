'use client';

import React from 'react';
import type { VendorNeedId } from '@/lib/plan/types';
import { EmptyState } from '../UI/EmptyState';

export interface VendorEmptyStateProps {
  readonly category: VendorNeedId;
  readonly city: string;
  readonly mapsFallbackUrl: string | null;
  readonly onOpenRedFlags?: () => void;
  readonly onOpenNegotiate?: () => void;
}

function EmptyStateActions({
  onOpenRedFlags,
  onOpenNegotiate,
}: {
  readonly onOpenRedFlags?: () => void;
  readonly onOpenNegotiate?: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-stone-100">
      {onOpenRedFlags && (
        <button
          type="button"
          id="empty-state-redflags-btn"
          onClick={onOpenRedFlags}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 transition-all shadow-2xs hover:-translate-y-0.5"
        >
          🛡️ Scan Contract Red-Flags
        </button>
      )}
      {onOpenNegotiate && (
        <button
          type="button"
          id="empty-state-negotiate-btn"
          onClick={onOpenNegotiate}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all shadow-2xs hover:-translate-y-0.5"
        >
          🤝 AI Negotiation Coach
        </button>
      )}
    </div>
  );
}

/**
 * Empty state displayed when Google Places yields no nearby vendors, offering Google Maps fallback and contract audit actions.
 */
export function VendorEmptyState({
  category,
  city,
  mapsFallbackUrl,
  onOpenRedFlags,
  onOpenNegotiate,
}: VendorEmptyStateProps): React.JSX.Element {
  return (
    <div className="p-8 text-center bg-white rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
      <EmptyState
        type="no-vendors"
        title={`No ${category}s listed yet in ${city}`}
        message="Search directly on Google Maps or audit external vendor contracts with our AI tools below."
        actionLabel="Search on Google Maps"
        onAction={() => {
          if (mapsFallbackUrl) window.open(mapsFallbackUrl, '_blank');
        }}
      />
      <EmptyStateActions onOpenRedFlags={onOpenRedFlags} onOpenNegotiate={onOpenNegotiate} />
    </div>
  );
}
