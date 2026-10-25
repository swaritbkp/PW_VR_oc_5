import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { GuidedJourneyBar } from './GuidedJourneyBar';
import { getInitialPlan } from '@/lib/plan/initialPlan';
import { evaluateJourney } from '@/lib/plan/journey';

describe('GuidedJourneyBar Component (AC18, AC19, AC25)', () => {
  const plan = getInitialPlan();
  const journey = evaluateJourney(plan);

  it('renders 5 steps and progress bar', () => {
    const handleAction = vi.fn();
    render(<GuidedJourneyBar journey={journey} onTriggerAction={handleAction} />);

    expect(screen.getByText(/5-Step Guided Event Journey/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Vision/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Critical Path/i)).toBeInTheDocument();
    expect(screen.getByText(/Guide Me:/i)).toBeInTheDocument();
  });

  it('triggers action callback when Guide Me button is clicked', () => {
    const handleAction = vi.fn();
    render(<GuidedJourneyBar journey={journey} onTriggerAction={handleAction} />);

    const guideBtn = screen.getByRole('button', { name: /Guide Me:/i });
    fireEvent.click(guideBtn);
    expect(handleAction).toHaveBeenCalledWith(journey.nextAction.actionId);
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<GuidedJourneyBar journey={journey} onTriggerAction={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
