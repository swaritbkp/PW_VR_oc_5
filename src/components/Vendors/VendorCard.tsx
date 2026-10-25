'use client';

import React from 'react';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';

export interface VendorCardProps {
  readonly vendor: Vendor;
  readonly score?: number;
  readonly currentStatus?: VendorStatus;
  readonly onSelect?: (vendor: Vendor) => void;
  readonly onOpenDetails?: (vendor: Vendor) => void;
}

const PRICE_SYMBOLS = ['', '₹', '₹₹', '₹₹₹', '₹₹₹₹'];

const VENDOR_ICON_REGEX: readonly [RegExp, string][] = [
  [/restaurant|cater|sweet|halwai|food|kitchen/i, '🍲'],
  [/resort|palace|grand|hotel|farm|hall|banquet|lawn|estate|venue/i, '🏛️'],
  [/photo|studio|film|lens|cinema/i, '📸'],
  [/decor|flower|florist|tent|phulkari/i, '🌺'],
  [/salon|beauty|makeup|makeover|mehendi/i, '💄'],
  [/dj|band|sound|music|entertainment/i, '🎵'],
];

function getVendorIcon(vendor: Vendor): string {
  const match = VENDOR_ICON_REGEX.find(([re]) => re.test(vendor.name));
  return match ? match[1] : '✨';
}

function renderBadge(status?: VendorStatus) {
  if (!status) return null;
  const colors: Record<VendorStatus, string> = {
    shortlisted: 'bg-amber-100 text-amber-800 border-amber-300',
    contacted: 'bg-blue-100 text-blue-800 border-blue-300',
    quoted: 'bg-purple-100 text-purple-800 border-purple-300',
    booked: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    backup: 'bg-teal-100 text-teal-800 border-teal-300',
    rejected: 'bg-stone-100 text-stone-600 border-stone-300',
  };
  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${colors[status]}`}
      data-testid="vendor-status-badge"
    >
      {status}
    </span>
  );
}

function renderMeta(vendor: Vendor, score?: number) {
  const price = vendor.priceLevel !== undefined ? PRICE_SYMBOLS[vendor.priceLevel] : null;
  return (
    <div className="flex items-center gap-2 text-xs text-stone-600">
      {vendor.rating !== undefined && (
        <span className="font-semibold text-amber-700 flex items-center gap-0.5">
          ★ {vendor.rating.toFixed(1)}
          {vendor.ratingCount !== undefined && (
            <span className="text-stone-400 font-normal">({vendor.ratingCount})</span>
          )}
        </span>
      )}
      {score !== undefined && (
        <span className="text-stone-500 font-mono text-[11px]" title="Bayesian confidence score">
          Score: {score.toFixed(2)}
        </span>
      )}
      {price && <span className="font-semibold text-stone-700">{price}</span>}
      {vendor.distanceKm !== undefined && (
        <span className="text-stone-500">{vendor.distanceKm} km away</span>
      )}
    </div>
  );
}

function VendorCardHeader({
  vendor,
  score,
  currentStatus,
}: {
  readonly vendor: Vendor;
  readonly score?: number;
  readonly currentStatus?: VendorStatus;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-lg shrink-0 shadow-2xs select-none">
          {getVendorIcon(vendor)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-stone-900 text-sm leading-snug truncate">
              {vendor.name}
            </h4>
            {renderBadge(currentStatus)}
          </div>
          <p className="text-xs text-stone-500 line-clamp-1">{vendor.address}</p>
        </div>
      </div>
      {renderMeta(vendor, score)}
    </div>
  );
}

function VendorCardFooterButtons({
  vendor,
  onSelect,
  onOpenDetails,
}: {
  readonly vendor: Vendor;
  readonly onSelect?: (vendor: Vendor) => void;
  readonly onOpenDetails?: (vendor: Vendor) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
      <button
        type="button"
        onClick={() => onSelect?.(vendor)}
        className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs active:scale-98"
      >
        Contact & Book
      </button>
      {onOpenDetails && (
        <button
          type="button"
          onClick={() => onOpenDetails(vendor)}
          className="py-1.5 px-3 rounded-xl text-xs font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Details
        </button>
      )}
    </div>
  );
}

/**
 * Card displaying an individual verified Google Places vendor with rating, price level, and contact trigger.
 */
export function VendorCard({
  vendor,
  score,
  currentStatus,
  onSelect,
  onOpenDetails,
}: VendorCardProps): React.JSX.Element {
  return (
    <div
      role="article"
      className="p-4 rounded-2xl border border-stone-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 shadow-2xs"
      data-testid={`vendor-card-${vendor.placeId}`}
    >
      <VendorCardHeader vendor={vendor} score={score} currentStatus={currentStatus} />
      <VendorCardFooterButtons
        vendor={vendor}
        onSelect={onSelect}
        onOpenDetails={onOpenDetails}
      />
    </div>
  );
}
