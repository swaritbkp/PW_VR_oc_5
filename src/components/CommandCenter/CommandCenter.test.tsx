import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { CommandCenter } from './CommandCenter';
import type { ScheduledTask } from '../../lib/schedule/types';
import type { Alert } from '../../lib/schedule/sentinel';

describe('CommandCenter component (AC7, AC10, AC12, AC13)', () => {
  const dummyTask: ScheduledTask = {
    id: 'T1',
    name: 'Book Venue',
    optimistic: 2,
    mostLikely: 5,
    pessimistic: 10,
    dependsOn: [],
    expected: 5.33,
    sigma: 1.33,
    earliestStart: 0,
    earliestFinish: 5.33,
    latestStart: 0,
    latestFinish: 5.33,
    totalFloat: 0,
    critical: true,
  };

  const dummyAlerts: Alert[] = [
    {
      ruleId: 'R1_START_SOON',
      severity: 'warning',
      taskId: 'T1',
      params: { daysUntilStart: 2 },
    },
    {
      ruleId: 'R3_NO_BUFFER',
      severity: 'critical',
      params: { buffer: -4 },
    },
  ];

  const dummyBudgetSummary = {
    lines: [],
    totalLineSpend: 900_000,
    contingencyInr: 90_000,
    grandTotal: 990_000,
    gapInr: 10_000,
  };

  const dummyReconcile = {
    status: 'under' as const,
    gapInr: 10_000,
    isWithinBudget: true,
    message: 'Under budget by ₹10,000.',
  };

  it('renders countdown, P(ready) gauge, and budget status (AC10)', () => {
    render(
      <CommandCenter
        daysLeft={45}
        probabilityOnTime={0.92}
        budgetSummary={dummyBudgetSummary}
        budgetReconciliation={dummyReconcile}
        nextAction={dummyTask}
        alerts={dummyAlerts}
      />,
    );

    expect(screen.getByText('45d')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('₹9,90,000')).toBeInTheDocument();
  });

  it('highlights next best action with interactive focus callback (AC13)', () => {
    const handleSelect = vi.fn();
    render(
      <CommandCenter
        daysLeft={45}
        probabilityOnTime={0.92}
        budgetSummary={dummyBudgetSummary}
        budgetReconciliation={dummyReconcile}
        nextAction={dummyTask}
        alerts={dummyAlerts}
        onSelectTask={handleSelect}
      />,
    );

    expect(screen.getByText('Next Best Action')).toBeInTheDocument();
    expect(screen.getByText('Book Venue')).toBeInTheDocument();

    const focusBtn = screen.getByText(/Focus task on graph/i);
    fireEvent.click(focusBtn);
    expect(handleSelect).toHaveBeenCalledWith('T1');
  });

  it('displays ranked Sentinel alerts citing rule IDs (AC12)', () => {
    render(
      <CommandCenter
        daysLeft={45}
        probabilityOnTime={0.92}
        budgetSummary={dummyBudgetSummary}
        budgetReconciliation={dummyReconcile}
        nextAction={dummyTask}
        alerts={dummyAlerts}
      />,
    );

    expect(screen.getByText('R1_START_SOON')).toBeInTheDocument();
    expect(screen.getByText('R3_NO_BUFFER')).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations (AC7)', async () => {
    const { container } = render(
      <CommandCenter
        daysLeft={45}
        probabilityOnTime={0.92}
        budgetSummary={dummyBudgetSummary}
        budgetReconciliation={dummyReconcile}
        nextAction={dummyTask}
        alerts={dummyAlerts}
      />,
    );
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
