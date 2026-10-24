import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { VendorMap } from './VendorMap';
import type { Vendor } from '@/lib/vendors/types';

describe('VendorMap Component (AC20, AC21)', () => {
  const center = { lat: 30.7333, lng: 76.7794 };
  const sampleVendors: Vendor[] = [
    {
      placeId: 'v1',
      name: 'Grand Banquet Hall',
      address: 'Chandigarh',
      location: { lat: 30.735, lng: 76.78 },
    },
  ];

  it('AC20 & AC21 renders location map with Google attribution', () => {
    render(<VendorMap center={center} vendors={sampleVendors} />);

    expect(screen.getByRole('region', { name: /Vendor location map/i })).toBeInTheDocument();
    expect(screen.getByText(/Map data © Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Location/i)).toBeInTheDocument();
  });

  it('passes accessibility checks', async () => {
    const { container } = render(<VendorMap center={center} vendors={sampleVendors} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
