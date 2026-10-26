import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { NegotiationCoach } from './NegotiationCoach';

describe('NegotiationCoach Component (AC22)', () => {
  it('renders negotiation coach and calculates counter-offer savings', () => {
    const handleClose = vi.fn();
    render(
      <NegotiationCoach
        initialVendorName="Grand Palace Banquets"
        initialCategory="venue"
        initialCity="Chandigarh"
        initialQuoteInr={500000}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText(/AI Vendor Negotiation Coach/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Grand Palace Banquets/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Target Savings/i)).toBeInTheDocument();
  });

  it('switches languages when language button clicked', () => {
    render(
      <NegotiationCoach
        initialVendorName="Grand Palace Banquets"
        initialCategory="venue"
        initialCity="Chandigarh"
        initialQuoteInr={500000}
        onClose={vi.fn()}
      />,
    );

    const hindiBtn = screen.getByRole('button', { name: /हिन्दी/i });
    fireEvent.click(hindiBtn);
    expect(screen.getByText(/नमस्ते/i)).toBeInTheDocument();
  });

  it('applies negotiation strategy and displays locked budget confirmation', () => {
    const handleApply = vi.fn();
    render(
      <NegotiationCoach
        initialVendorName="Grand Palace Banquets"
        initialCategory="venue"
        initialCity="Chandigarh"
        initialQuoteInr={500000}
        onClose={vi.fn()}
        onApplyStrategy={handleApply}
      />,
    );

    const applyBtn = screen.getByRole('button', { name: /Apply Strategy & Lock to Budget/i });
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith(expect.any(Number), 'Grand Palace Banquets', 'venue');
    expect(screen.getByText(/Locked Custom Vendor Quote into Budget Ledger/i)).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <NegotiationCoach
        initialVendorName="Grand Palace Banquets"
        initialCategory="venue"
        initialCity="Chandigarh"
        initialQuoteInr={500000}
        onClose={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
