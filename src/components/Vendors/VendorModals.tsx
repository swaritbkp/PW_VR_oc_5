'use client';

import React from 'react';
import type { EventType, VendorNeedId } from '@/lib/plan/types';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';
import { ContactSheet } from './ContactSheet';
import { NegotiationCoach } from './NegotiationCoach';
import { RedFlagDetector } from './RedFlagDetector';

/**
 * Slide-out contact drawer container for communicating with and booking a selected vendor.
 */
export function VendorContactContainer({
  selectedVendor,
  eventType,
  eventDate,
  city,
  guests,
  onClose,
  onOpenNegotiation,
  onOpenRedFlags,
  onBookVendor,
}: {
  readonly selectedVendor: Vendor | null;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly city: string;
  readonly guests: number;
  readonly onClose: () => void;
  readonly onOpenNegotiation: () => void;
  readonly onOpenRedFlags: () => void;
  readonly onBookVendor?: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
}): React.JSX.Element | null {
  if (!selectedVendor) return null;
  return (
    <ContactSheet
      vendor={selectedVendor}
      eventType={eventType}
      eventDate={eventDate}
      city={city}
      guests={guests}
      onClose={onClose}
      onOpenNegotiation={onOpenNegotiation}
      onOpenRedFlags={onOpenRedFlags}
      onUpdateStatus={(v, s, q) => {
        onBookVendor?.(v, s, q);
        onClose();
      }}
    />
  );
}

/**
 * Negotiation coach and contract red-flag detector modals for vendor exploration.
 */
export function VendorToolModals({
  activeTool,
  selectedVendor,
  category,
  city,
  guests,
  eventDate,
  onClose,
}: {
  readonly activeTool: 'none' | 'negotiate' | 'redflags';
  readonly selectedVendor: Vendor | null;
  readonly category: VendorNeedId;
  readonly city: string;
  readonly guests: number;
  readonly eventDate: string;
  readonly onClose: () => void;
}): React.JSX.Element | null {
  if (activeTool === 'negotiate' && selectedVendor) {
    return (
      <NegotiationCoach
        initialVendorName={selectedVendor.name}
        initialCategory={category}
        initialCity={city}
        initialQuoteInr={selectedVendor.priceLevel ? selectedVendor.priceLevel * 100000 : 250000}
        guestCount={guests}
        eventDate={eventDate}
        onClose={onClose}
      />
    );
  }
  if (activeTool === 'redflags') return <RedFlagDetector onClose={onClose} />;
  return null;
}
