import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ContactSheet } from './ContactSheet';
import type { Vendor } from '@/lib/vendors/types';

describe('ContactSheet Component (AC22, AC23, AC24, AC30)', () => {
  const sampleVendor: Vendor = {
    placeId: 'pl_venue_1',
    name: 'Shivalik View Banquets',
    address: 'Sector 17, Chandigarh',
    location: { lat: 30.738, lng: 76.782 },
    phone: '+919876543210',
    website: 'https://shivalikview.example.com',
  };

  it('AC22 generates tel and wa.me links with human message in multiple languages', () => {
    const handleUpdate = vi.fn();
    const handleClose = vi.fn();

    render(
      <ContactSheet
        vendor={sampleVendor}
        eventType="wedding"
        eventDate="2026-11-20"
        city="Chandigarh"
        guests={250}
        onClose={handleClose}
        onUpdateStatus={handleUpdate}
      />,
    );

    const callLink = screen.getByRole('link', { name: /Call/i });
    expect(callLink).toHaveAttribute('href', 'tel:+919876543210');

    const waLink = screen.getByRole('link', { name: /WhatsApp/i });
    expect(waLink).toHaveAttribute('href');
    expect(waLink.getAttribute('href')).toContain('https://wa.me/919876543210?text=');

    fireEvent.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(screen.getByText(/नमस्ते/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ਪੰਜਾਬੀ' }));
    expect(screen.getByText(/ਸਤ ਸ੍ਰੀ ਅਕਾਲ/i)).toBeInTheDocument();
  });

  it('AC24 updates status to backup when Hold as Backup is clicked', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactSheet
        vendor={sampleVendor}
        eventType="wedding"
        eventDate="2026-11-20"
        city="Chandigarh"
        guests={250}
        onClose={vi.fn()}
        onUpdateStatus={handleUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Hold as Backup/i }));
    expect(handleUpdate).toHaveBeenCalledWith(sampleVendor, 'backup');
  });

  it('AC23 & AC30 confirms booking with quote and triggers update', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactSheet
        vendor={sampleVendor}
        eventType="wedding"
        eventDate="2026-11-20"
        city="Chandigarh"
        guests={250}
        onClose={vi.fn()}
        onUpdateStatus={handleUpdate}
      />,
    );

    const quoteInput = screen.getByLabelText(/Agreed Quote/i);
    fireEvent.change(quoteInput, { target: { value: '150000' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/i }));
    expect(handleUpdate).toHaveBeenCalledWith(sampleVendor, 'booked', 150000);
  });

  it('passes accessibility audits with axe', async () => {
    const { container } = render(
      <ContactSheet
        vendor={sampleVendor}
        eventType="wedding"
        eventDate="2026-11-20"
        city="Chandigarh"
        guests={250}
        onClose={vi.fn()}
        onUpdateStatus={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
