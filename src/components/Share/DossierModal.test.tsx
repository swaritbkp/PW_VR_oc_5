import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { DossierModal } from './DossierModal';
import { getInitialPlan } from '@/lib/plan/initialPlan';

describe('DossierModal Component (AC14)', () => {
  const plan = getInitialPlan();

  it('renders executive celebration dossier with sections and metrics', () => {
    const handleClose = vi.fn();
    render(<DossierModal plan={plan} onClose={handleClose} />);

    expect(screen.getAllByText(/Executive Celebration Dossier/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/On-Time Probability/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Path & Timeline/i)).toBeInTheDocument();
  });

  it('triggers window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<DossierModal plan={plan} onClose={vi.fn()} />);

    const printBtn = screen.getByRole('button', { name: /Print \/ PDF/i });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<DossierModal plan={plan} onClose={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
