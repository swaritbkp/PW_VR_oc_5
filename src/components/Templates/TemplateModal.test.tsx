import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { TemplateModal } from './TemplateModal';
import { getInitialPlan } from '@/lib/plan/initialPlan';

describe('TemplateModal Component', () => {
  const samplePlan = getInitialPlan();

  it('renders template gallery by default and switches to custom intake sheet', () => {
    const handleClose = vi.fn();
    const handleApply = vi.fn();
    render(
      <TemplateModal
        currentPlan={samplePlan}
        onClose={handleClose}
        setVersionStore={vi.fn()}
        onApplyIntake={handleApply}
      />,
    );

    expect(screen.getByText(/Curated Celebration Templates/i)).toBeInTheDocument();

    const intakeTabBtn = screen.getByRole('button', { name: /Custom Plan Intake Sheet/i });
    fireEvent.click(intakeTabBtn);
    expect(screen.getByText(/Celebration Details/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Generate Living Event Graph/i });
    fireEvent.click(submitBtn);
    expect(handleApply).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <TemplateModal
        currentPlan={samplePlan}
        onClose={vi.fn()}
        setVersionStore={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
