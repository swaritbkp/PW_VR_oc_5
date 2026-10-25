import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { RedFlagDetector } from './RedFlagDetector';

describe('RedFlagDetector Component (AC23)', () => {
  it('renders detector and scans predatory clauses', () => {
    const handleClose = vi.fn();
    render(<RedFlagDetector onClose={handleClose} />);

    expect(screen.getByText(/Vendor Contract Red-Flag Detector/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Detected Predatory Clauses/i)).toBeInTheDocument();
  });

  it('switches text when preset button is clicked', () => {
    render(<RedFlagDetector onClose={vi.fn()} />);

    const standardBtn = screen.getByRole('button', { name: /Standard Fair Contract/i });
    fireEvent.click(standardBtn);
    expect(screen.getAllByText(/Safe/i).length).toBeGreaterThanOrEqual(1);
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<RedFlagDetector onClose={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
