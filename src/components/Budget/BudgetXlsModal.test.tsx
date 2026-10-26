import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { BudgetXlsModal } from './BudgetXlsModal';
import type { BudgetLine } from '../../lib/budget/engine';

describe('BudgetXlsModal Component', () => {
  const sampleLines: BudgetLine[] = [
    {
      id: 'b1',
      category: 'venue',
      name: 'Haveli Lawn',
      unit: 'fixed',
      rateInr: 500000,
      drivers: ['budget'],
    },
  ];

  it('renders modal with XLS export and 5-layer guardrails badge', () => {
    render(
      <BudgetXlsModal
        lines={sampleLines}
        guests={250}
        city="Chandigarh"
        onClose={vi.fn()}
        onImportLines={vi.fn()}
      />,
    );

    expect(screen.getByText('Excel (.xls) Round-Trip Portability')).toBeInTheDocument();
    expect(screen.getByText(/XLS Guardrails Active:/i)).toBeInTheDocument();
    expect(screen.getByText(/Macro-Safe • XXE • Injection • PII • Bounds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download jashn-budget.xls/i })).toBeInTheDocument();
  });

  it('detects macro formula injection and displays red guardrail banner', () => {
    render(
      <BudgetXlsModal
        lines={sampleLines}
        guests={250}
        city="Chandigarh"
        onClose={vi.fn()}
        onImportLines={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText(/XLS data input or paste area/i);
    fireEvent.change(textarea, {
      target: {
        value: `Category,Item,PricingMode,UnitRateInr,Quantity,TotalInr
venue,=CMD|' /C calc'!A0,fixed,500000,1,500000`,
      },
    });

    const verifyBtn = screen.getByRole('button', { name: /Parse & Verify XLS Guardrails/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText(/Spreadsheet Formula \/ Macro Injection Blocked/i)).toBeInTheDocument();
  });

  it('parses valid CSV/XLS text and calls onImportLines when Apply is clicked', () => {
    const handleImport = vi.fn();
    const handleClose = vi.fn();

    render(
      <BudgetXlsModal
        lines={sampleLines}
        guests={250}
        city="Chandigarh"
        onClose={handleClose}
        onImportLines={handleImport}
      />,
    );

    const textarea = screen.getByLabelText(/XLS data input or paste area/i);
    fireEvent.change(textarea, {
      target: {
        value: `Category,Item,PricingMode,UnitRateInr,Quantity,TotalInr
entertainment,Sufi Qawwali Troupe,fixed,350000,1,350000`,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Parse & Verify XLS Guardrails/i }));
    expect(screen.getByText(/Successfully validated 1 line items from spreadsheet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Apply to Budget/i }));
    expect(handleImport).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <BudgetXlsModal
        lines={sampleLines}
        guests={250}
        city="Chandigarh"
        onClose={vi.fn()}
        onImportLines={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
