import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { BudgetLedger } from './BudgetLedger';
import type { BudgetLine } from '../../lib/budget/engine';

describe('BudgetLedger Component (AC1, AC3)', () => {
  const sampleLines: BudgetLine[] = [
    {
      id: 'b1',
      category: 'venue',
      name: 'Heritage Haveli',
      unit: 'fixed',
      rateInr: 500000,
      drivers: ['budget'],
    },
    {
      id: 'b2',
      category: 'food',
      name: 'Punjabi Feast',
      unit: 'per_head',
      rateInr: 1200,
      drivers: ['guests'],
    },
  ];

  it('renders budget summary and line items correctly', () => {
    render(
      <BudgetLedger
        budgetLines={sampleLines}
        budgetInr={2000000}
        guests={200}
        onClose={vi.fn()}
        onUpdateBudgetLines={vi.fn()}
      />,
    );

    expect(screen.getByText('Celebration Budget Ledger')).toBeInTheDocument();
    expect(screen.getByText('Heritage Haveli')).toBeInTheDocument();
    expect(screen.getByText('Punjabi Feast')).toBeInTheDocument();
  });

  it('allows editing rate, adding custom item, and applying changes', () => {
    const handleUpdate = vi.fn();
    const handleClose = vi.fn();

    render(
      <BudgetLedger
        budgetLines={sampleLines}
        budgetInr={2000000}
        guests={200}
        onClose={handleClose}
        onUpdateBudgetLines={handleUpdate}
      />,
    );

    // Edit rate of Heritage Haveli
    const haveliRate = screen.getByLabelText(/Rate for Heritage Haveli/i);
    fireEvent.change(haveliRate, { target: { value: '600000' } });

    // Add custom line
    const nameInput = screen.getByLabelText(/New item name/i);
    fireEvent.change(nameInput, { target: { value: 'Live Dhol Troupe' } });
    const rateInput = screen.getByLabelText(/New item rate in INR/i);
    fireEvent.change(rateInput, { target: { value: '35000' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }));

    expect(screen.getByText('Live Dhol Troupe')).toBeInTheDocument();

    // Save & apply
    fireEvent.click(screen.getByRole('button', { name: /Save & Apply Changes/i }));
    expect(handleUpdate).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
    const updated = handleUpdate.mock.calls[0][0];
    expect(updated).toHaveLength(3);
    expect(updated[0].rateInr).toBe(600000);
  });

  it('passes automated accessibility audit with zero violations (AC7)', async () => {
    const { container } = render(
      <BudgetLedger
        budgetLines={sampleLines}
        budgetInr={2000000}
        guests={200}
        onClose={vi.fn()}
        onUpdateBudgetLines={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
