import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { VendorList } from './VendorList';
import type { Vendor } from '@/lib/vendors/types';

describe('VendorList Component (AC20, AC21, AC27)', () => {
  const sampleVendors: Vendor[] = [
    {
      placeId: 'v1',
      name: 'Amritsari Kulcha Caterers',
      address: 'Sector 35, Chandigarh',
      location: { lat: 30.72, lng: 76.76 },
      rating: 4.8,
      ratingCount: 85,
      priceLevel: 2,
      distanceKm: 2.4,
    },
    {
      placeId: 'v2',
      name: 'Deluxe Party Caterers',
      address: 'Sector 22, Chandigarh',
      location: { lat: 30.74, lng: 76.78 },
      rating: 4.3,
      ratingCount: 30,
      priceLevel: 1,
      distanceKm: 3.1,
    },
  ];

  it('AC20 & AC21 renders ranked vendors with Google attribution', () => {
    render(
      <VendorList
        vendors={sampleVendors}
        rankedVendors={[
          { vendor: sampleVendors[0], score: 4.7 },
          { vendor: sampleVendors[1], score: 4.1 },
        ]}
        selectedNeed="caterer"
        city="Chandigarh"
      />,
    );

    expect(screen.getByText(/caterer in Chandigarh/i)).toBeInTheDocument();
    expect(screen.getByText('Powered by Google')).toBeInTheDocument();
    expect(screen.getByText('Amritsari Kulcha Caterers')).toBeInTheDocument();
    expect(screen.getByText('Deluxe Party Caterers')).toBeInTheDocument();
  });

  it('AC27 renders fallback search link and manual add form when API is offline', () => {
    const handleManualAdd = vi.fn();
    render(
      <VendorList
        vendors={[]}
        selectedNeed="venue"
        city="Chandigarh"
        fallback={{
          reason: 'NO_KEY',
          mapsSearchUrl: 'https://www.google.com/maps/search/?api=1&query=banquet+hall+Chandigarh',
          query: 'banquet hall in Chandigarh',
        }}
        onManualAdd={handleManualAdd}
      />,
    );

    expect(screen.getByText(/Live API Offline/i)).toBeInTheDocument();
    const mapLink = screen.getByRole('link', { name: /Search on Google Maps/i });
    expect(mapLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=banquet+hall+Chandigarh',
    );
  });

  it('passes accessibility audits with axe', async () => {
    const { container } = render(
      <VendorList vendors={sampleVendors} selectedNeed="caterer" city="Chandigarh" />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
