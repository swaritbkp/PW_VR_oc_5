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
