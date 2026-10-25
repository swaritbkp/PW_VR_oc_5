'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, VendorNeedId } from '@/lib/plan/types';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';
import { VendorCityBar } from './VendorCityBar';
import { VendorCard } from './VendorCard';
import { ContactSheet } from './ContactSheet';
import { NegotiationCoach } from './NegotiationCoach';
import { RedFlagDetector } from './RedFlagDetector';
import { EmptyState } from '../UI/EmptyState';

export interface VendorExplorerProps {
  readonly initialCity: string;
  readonly initialCategory?: VendorNeedId;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly guests: number;
  readonly onBookVendor?: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
}

export function VendorExplorer({
  initialCity,
  initialCategory,
  eventType,
  eventDate,
  guests,
  onBookVendor,
}: VendorExplorerProps): React.JSX.Element {
  const [city, setCity] = useState(initialCity || 'Chandigarh');
  const [category, setCategory] = useState<VendorNeedId>(initialCategory || 'venue');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<readonly Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [mapsFallbackUrl, setMapsFallbackUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'none' | 'negotiate' | 'redflags'>('none');

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

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

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(
      (v) => v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q),
    );
  }, [vendors, searchQuery]);

  return (
    <div className="space-y-4">
      <VendorCityBar
        currentCity={city}
        onSelectCity={setCity}
        currentCategory={category}
        onSelectCategory={setCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="p-12 text-center text-xs text-stone-500 bg-white rounded-3xl border border-stone-200/80"
        >
          <div className="inline-block animate-spin text-xl mb-2">⏳</div>
          <p className="font-semibold text-stone-800">
            Discovering verified {category}s in {city}...
          </p>
        </div>
      ) : filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVendors.map((v) => (
            <VendorCard key={v.placeId} vendor={v} onSelect={() => setSelectedVendor(v)} />
          ))}
        </div>
      ) : (
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
      )}

      {selectedVendor && (
        <ContactSheet
          vendor={selectedVendor}
          eventType={eventType}
          eventDate={eventDate}
          city={city}
          guests={guests}
          onClose={() => setSelectedVendor(null)}
          onOpenNegotiation={() => setActiveTool('negotiate')}
          onOpenRedFlags={() => setActiveTool('redflags')}
          onUpdateStatus={(v, s, q) => {
            onBookVendor?.(v, s, q);
            setSelectedVendor(null);
          }}
        />
      )}

      {activeTool === 'negotiate' && selectedVendor && (
        <NegotiationCoach
          initialVendorName={selectedVendor.name}
          initialCategory={category}
          initialCity={city}
          initialQuoteInr={selectedVendor.priceLevel ? selectedVendor.priceLevel * 100000 : 250000}
          guestCount={guests}
          eventDate={eventDate}
          onClose={() => setActiveTool('none')}
        />
      )}

      {activeTool === 'redflags' && <RedFlagDetector onClose={() => setActiveTool('none')} />}
    </div>
  );
}
