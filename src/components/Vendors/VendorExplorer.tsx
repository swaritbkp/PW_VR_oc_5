'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, VendorNeedId } from '@/lib/plan/types';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';
import { VendorCityBar } from './VendorCityBar';
import { VendorCard } from './VendorCard';
import { EmptyState } from '../UI/EmptyState';
import { VendorContactContainer, VendorToolModals } from './VendorModals';

export interface VendorExplorerProps {
  readonly initialCity: string;
  readonly initialCategory?: VendorNeedId;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly guests: number;
  readonly onBookVendor?: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
  readonly onApplyStrategy?: (targetOfferInr: number, vendorName: string, category: string) => void;
}

function useVendorSearch(category: VendorNeedId, eventType: EventType, city: string) {
  const [vendors, setVendors] = useState<readonly Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapsFallbackUrl, setMapsFallbackUrl] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ need: category, eventType, city }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.vendors) && data.vendors.length > 0) {
        setVendors(data.vendors);
        setMapsFallbackUrl(null);
      } else {
        setVendors([]);
        setMapsFallbackUrl(data.fallback?.mapsSearchUrl ?? null);
      }
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [category, eventType, city]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, mapsFallbackUrl };
}

function VendorLoadingSpinner({ category, city }: { readonly category: VendorNeedId; readonly city: string }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-12 text-center text-xs text-stone-500 bg-white rounded-3xl border border-stone-200/80"
    >
      <div className="inline-block animate-spin text-xl mb-2">⏳</div>
      <p className="font-semibold text-stone-800">Discovering verified {category}s in {city}...</p>
    </div>
  );
}

function VendorEmptyState({
  category,
  city,
  mapsFallbackUrl,
}: {
  readonly category: VendorNeedId;
  readonly city: string;
  readonly mapsFallbackUrl: string | null;
}) {
  return (
    <div className="p-8 text-center bg-white rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
      <EmptyState
        type="no-vendors"
        title={`No ${category}s listed yet in ${city}`}
        message="Search directly on Google Maps or add your trusted family vendor."
        actionLabel="Search on Google Maps"
        onAction={() => {
          if (mapsFallbackUrl) window.open(mapsFallbackUrl, '_blank');
        }}
      />
    </div>
  );
}

function VendorResultsView({
  loading,
  category,
  city,
  filteredVendors,
  mapsFallbackUrl,
  onSelectVendor,
}: {
  readonly loading: boolean;
  readonly category: VendorNeedId;
  readonly city: string;
  readonly filteredVendors: readonly Vendor[];
  readonly mapsFallbackUrl: string | null;
  readonly onSelectVendor: (v: Vendor) => void;
}): React.JSX.Element {
  if (loading) return <VendorLoadingSpinner category={category} city={city} />;

  if (filteredVendors.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVendors.map((v) => (
          <VendorCard key={v.placeId} vendor={v} onSelect={() => onSelectVendor(v)} />
        ))}
      </div>
    );
  }

  return <VendorEmptyState category={category} city={city} mapsFallbackUrl={mapsFallbackUrl} />;
}

function useVendorExplorerState(
  initialCity?: string,
  initialCategory?: VendorNeedId,
  eventType: EventType = 'wedding',
) {
  const [city, setCity] = useState(initialCity || 'Chandigarh');
  const [category, setCategory] = useState<VendorNeedId>(initialCategory || 'venue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeTool, setActiveTool] = useState<'none' | 'negotiate' | 'redflags'>('none');

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  const { vendors, loading, mapsFallbackUrl } = useVendorSearch(category, eventType, city);

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter((v) => v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q));
  }, [vendors, searchQuery]);

  return {
    city,
    setCity,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    selectedVendor,
    setSelectedVendor,
    activeTool,
    setActiveTool,
    loading,
    mapsFallbackUrl,
    filteredVendors,
  };
}

function ExplorerActiveModals(props: {
  readonly state: ReturnType<typeof useVendorExplorerState>;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly guests: number;
  readonly onBookVendor?: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
  readonly onApplyStrategy?: (targetOfferInr: number, vendorName: string, category: string) => void;
}) {
  const { state: s, eventType, eventDate, guests, onBookVendor, onApplyStrategy } = props;
  return (
    <>
      <VendorContactContainer
        selectedVendor={s.selectedVendor}
        eventType={eventType}
        eventDate={eventDate}
        city={s.city}
        guests={guests}
        onClose={() => s.setSelectedVendor(null)}
        onOpenNegotiation={() => s.setActiveTool('negotiate')}
        onOpenRedFlags={() => s.setActiveTool('redflags')}
        onBookVendor={onBookVendor}
      />
      <VendorToolModals
        activeTool={s.activeTool}
        selectedVendor={s.selectedVendor}
        category={s.category}
        city={s.city}
        guests={guests}
        eventDate={eventDate}
        onClose={() => s.setActiveTool('none')}
        onApplyStrategy={onApplyStrategy}
      />
    </>
  );
}

/**
 * Location-aware vendor explorer integrating the Google Places API route with ranked list and map views.
 */
export function VendorExplorer(props: VendorExplorerProps): React.JSX.Element {
  const { initialCity, initialCategory, eventType, eventDate, guests, onBookVendor, onApplyStrategy } = props;
  const s = useVendorExplorerState(initialCity, initialCategory, eventType);

  return (
    <div className="space-y-4">
      <VendorCityBar
        currentCity={s.city}
        onSelectCity={s.setCity}
        currentCategory={s.category}
        onSelectCategory={s.setCategory}
        searchQuery={s.searchQuery}
        onSearchChange={s.setSearchQuery}
      />
      <VendorResultsView
        loading={s.loading}
        category={s.category}
        city={s.city}
        filteredVendors={s.filteredVendors}
        mapsFallbackUrl={s.mapsFallbackUrl}
        onSelectVendor={s.setSelectedVendor}
      />
      <ExplorerActiveModals
        state={s}
        eventType={eventType}
        eventDate={eventDate}
        guests={guests}
        onBookVendor={onBookVendor}
        onApplyStrategy={onApplyStrategy}
      />
    </div>
  );
}
