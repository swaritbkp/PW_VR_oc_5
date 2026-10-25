import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { VendorExplorer } from './VendorExplorer';

const MOCK_VENDORS = [
  {
    placeId: 'place-forest-hill',
    name: 'Forest Hill Resort & Country Club',
    address: 'Near Nayagaon, Mohali, Chandigarh',
    rating: 4.6,
    userRatingCount: 380,
    phone: '+91 172 523 0000',
    priceLevel: 3,
    verified: true,
  },
];

describe('VendorExplorer Component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          vendors: MOCK_VENDORS,
          total: 1,
        }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders city selector, category pills, and fetches verified vendors', async () => {
    render(
      <VendorExplorer
        initialCity="Chandigarh"
        eventType="wedding"
        eventDate="2026-11-20"
        guests={250}
      />,
    );

    expect(screen.getByLabelText(/Location Aware City/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Live search/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Forest Hill Resort & Country Club')).toBeInTheDocument();
    });
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <VendorExplorer
        initialCity="Chandigarh"
        eventType="wedding"
        eventDate="2026-11-20"
        guests={250}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Forest Hill Resort & Country Club')).toBeInTheDocument();
    });

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
