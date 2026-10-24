import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { WhatIfDrawer } from './WhatIfDrawer';
import type { PlanState } from '@/lib/plan/propagate';
import { createVersionStore, pushVersion } from '@/lib/plan/versions';

describe('WhatIfDrawer Component (AC3, AC4, AC11)', () => {
  const initialPlan: PlanState = {
    id: 'plan_test_01',
    intake: {
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2026-12-15',
      guests: 200,
      budgetInr: 2000000,
      nonNegotiables: [],
      language: 'en',
    },
    tasks: [
      {
        id: 'W01',
        name: 'Book Venue',
        category: 'venue',
        optimistic: 5,
        mostLikely: 7,
        pessimistic: 12,
        dependsOn: [],
        drivers: ['city'],
        why: 'Venue',
      },
      {
        id: 'W02',
        name: 'Catering Tasting',
        category: 'food',
        optimistic: 3,
        mostLikely: 5,
        pessimistic: 9,
        dependsOn: ['W01'],
        drivers: ['guests'],
        why: 'Tasting',
      },
    ],
    budgetLines: [
      {
        id: 'b1',
        category: 'food',
        name: 'Catering',
        unit: 'per_head',
        rateInr: 1500,
        quantity: 200,
        drivers: ['guests'],
      },
      {
        id: 'b2',
        category: 'venue',
        name: 'Venue Hall',
        unit: 'fixed',
        rateInr: 500000,
        drivers: ['budget'],
      },
    ],
    targetDays: 45,
  };

  const store = createVersionStore(initialPlan);

  it('AC3 live dirty-set re-planning when sliders change', () => {
    const handleCommit = vi.fn();
    render(
      <WhatIfDrawer
        currentPlan={initialPlan}
        versionStore={store}
        onClose={vi.fn()}
        onCommit={handleCommit}
        onRestore={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    const guestSlider = screen.getByLabelText(/Guest Count/i);
    fireEvent.change(guestSlider, { target: { value: '250' } });

    expect(screen.getByText(/Guests changed from 200 to 250/i)).toBeInTheDocument();
    expect(screen.getByText(/Affected nodes:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Commit Revision/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Commit Revision/i }));
    expect(handleCommit).toHaveBeenCalled();
  });

  it('AC4 & AC11 restores earlier plan versions and triggers undo', () => {
    const v2Store = pushVersion(store, initialPlan, 'Guest count updated');
    const handleRestore = vi.fn();
    const handleUndo = vi.fn();

    render(
      <WhatIfDrawer
        currentPlan={initialPlan}
        versionStore={v2Store}
        onClose={vi.fn()}
        onCommit={vi.fn()}
        onRestore={handleRestore}
        onUndo={handleUndo}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Revision History/i }));
    expect(screen.getByText(/Plan History/i)).toBeInTheDocument();

    const undoBtn = screen.getByRole('button', { name: /Undo Last/i });
    fireEvent.click(undoBtn);
    expect(handleUndo).toHaveBeenCalled();

    const revertBtn = screen.getByRole('button', { name: /Revert/i });
    fireEvent.click(revertBtn);
    expect(handleRestore).toHaveBeenCalledWith('v_01');
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <WhatIfDrawer
        currentPlan={initialPlan}
        versionStore={store}
        onClose={vi.fn()}
        onCommit={vi.fn()}
        onRestore={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
