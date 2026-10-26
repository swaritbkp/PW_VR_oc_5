import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { PRESETS, RedFlagDetector } from './RedFlagDetector';

describe('RedFlagDetector Component (AC23)', () => {
  it('renders detector and scans predatory clauses', () => {
    const handleClose = vi.fn();
    render(<RedFlagDetector initialText={PRESETS[0].text} onClose={handleClose} />);

    expect(screen.getByText(/Vendor Contract Red-Flag Detector/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Detected Predatory Clauses/i)).toBeInTheDocument();
  });

  it('defaults to Standard Safe Contract with 100/100 score', () => {
    render(<RedFlagDetector onClose={vi.fn()} />);

    expect(screen.getByText(/Vendor Contract Red-Flag Detector/i)).toBeInTheDocument();
    expect(screen.getByText(/100\/100 • Safe \(Low Risk\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Guardrail Active: PII Redacted/i)).toBeInTheDocument();
  });

  it('switches text when preset button is clicked and dynamically updates score', () => {
    render(<RedFlagDetector onClose={vi.fn()} />);

    const standardBtn = screen.getByRole('button', { name: /Standard Safe Contract/i });
    fireEvent.click(standardBtn);
    expect(screen.getAllByText(/Safe/i).length).toBeGreaterThanOrEqual(1);

    const textarea = screen.getByLabelText(/Paste Vendor Quotation/i);
    fireEvent.change(textarea, {
      target: {
        value:
          'Vendor demands 100% non-refundable cash advance 60 days prior with no rain cancellation clause and hourly fine.',
      },
    });
    expect(screen.getAllByText(/High Risk/i).length).toBeGreaterThanOrEqual(1);
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<RedFlagDetector onClose={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
