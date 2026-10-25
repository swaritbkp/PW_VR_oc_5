import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ChaosMonkey } from './ChaosMonkey';
import { buildTemplateTasks, getTemplate } from '@/lib/templates/catalog';

describe('ChaosMonkey Component (AC25, AC26)', () => {
  const sampleTasks = buildTemplateTasks(getTemplate('wedding-phulkari-courtyard')!);

  it('renders compound disruption stress-tester and shows live metrics', () => {
    const handleClose = vi.fn();
    render(
      <ChaosMonkey
        tasks={sampleTasks}
        availableDays={120}
        backedUpNeeds={new Set()}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText(/Chaos Monkey Stress-Tester/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Slippage/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining Buffer/i)).toBeInTheDocument();
  });

  it('injects random chaos when button is clicked', () => {
    render(
      <ChaosMonkey
        tasks={sampleTasks}
        availableDays={120}
        backedUpNeeds={new Set()}
        onClose={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /Inject Random Chaos/i });
    fireEvent.click(btn);
    expect(screen.getByText(/Simultaneous Disruptions/i)).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations (AC7)', async () => {
    const { container } = render(
      <ChaosMonkey
        tasks={sampleTasks}
        availableDays={120}
        backedUpNeeds={new Set()}
        onClose={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
