'use client';

import React, { useMemo } from 'react';
import type { LatLng, Vendor } from '@/lib/vendors/types';

export interface VendorMapProps {
  readonly center: LatLng;
  readonly vendors: readonly Vendor[];
  readonly selectedPlaceId?: string;
  readonly onSelectVendor?: (vendor: Vendor) => void;
}

interface PinCoordinate {
  readonly vendor: Vendor;
  readonly x: number;
  readonly y: number;
}

function calculatePins(center: LatLng, vendors: readonly Vendor[]): readonly PinCoordinate[] {
  const SCALE = 2500;
  return vendors.map((v) => {
    const dx = (v.location.lng - center.lng) * SCALE;
    const dy = (center.lat - v.location.lat) * SCALE;
    const clampedX = Math.max(20, Math.min(380, 200 + dx));
    const clampedY = Math.max(20, Math.min(280, 150 + dy));
    return { vendor: v, x: clampedX, y: clampedY };
  });
}

function renderPin(pin: PinCoordinate, isSelected: boolean, onSelect?: (v: Vendor) => void) {
  return (
    <g
      key={pin.vendor.placeId}
      transform={`translate(${pin.x}, ${pin.y})`}
      className="cursor-pointer transition-transform hover:scale-125"
      onClick={() => onSelect?.(pin.vendor)}
      role="button"
      tabIndex={0}
      aria-label={`Vendor pin: ${pin.vendor.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect?.(pin.vendor);
      }}
    >
      <circle
        r={isSelected ? 10 : 7}
        className={
          isSelected
            ? 'fill-amber-600 stroke-white stroke-2'
            : 'fill-stone-800 hover:fill-amber-700 stroke-white stroke-1'
        }
      />
      <text
        y={-10}
        textAnchor="middle"
        className="text-[10px] font-semibold fill-stone-700 select-none"
      >
        {pin.vendor.name.slice(0, 12)}
      </text>
    </g>
  );
}

export function VendorMap({
  center,
  vendors,
  selectedPlaceId,
  onSelectVendor,
}: VendorMapProps): React.JSX.Element {
  const pins = useMemo(() => calculatePins(center, vendors), [center, vendors]);

  return (
    <div
      role="region"
      aria-label="Vendor location map"
      className="relative w-full h-80 rounded-xl border border-stone-200 bg-stone-100 overflow-hidden flex flex-col justify-between"
    >
      <svg viewBox="0 0 400 300" className="w-full h-full" aria-hidden="true">
        <rect width="400" height="300" fill="#f5f5f4" />
        <circle cx="200" cy="150" r="10" fill="#d97706" opacity="0.3" />
        <circle cx="200" cy="150" r="4" fill="#b45309" />
        <text x="200" y="170" textAnchor="middle" className="text-[10px] fill-amber-900 font-bold">
          Event Location
        </text>

        {pins.map((pin) => renderPin(pin, pin.vendor.placeId === selectedPlaceId, onSelectVendor))}
      </svg>

      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-stone-500 font-medium shadow-sm">
        Map data &copy; Google
      </div>
    </div>
  );
}
