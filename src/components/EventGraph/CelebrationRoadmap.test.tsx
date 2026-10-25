import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { CelebrationRoadmap } from './CelebrationRoadmap';
import type { PlanTask } from '@/lib/plan/types';

const MOCK_TASKS: readonly PlanTask[] = [
  {
    id: 't-budget',
    name: 'Finalize Guest List & Budget',
    category: 'planning',
    optimistic: 3,
    mostLikely: 5,
    pessimistic: 10,
    dependsOn: [],
    drivers: ['guests', 'budget'],
    why: 'Required before booking vendors',
    done: true,
  },
  {
    id: 't-venue',
    name: 'Book Heritage Courtyard Venue',
    category: 'venue',
    optimistic: 10,
    mostLikely: 14,
    pessimistic: 20,
    dependsOn: ['t-budget'],
    drivers: ['city', 'date'],
    why: 'Venue locks the celebration date',
    vendorNeed: 'venue',
  },
  {
    id: 't-decor',
    name: 'Design Marigold & Brass Decor',
    category: 'decor',
    optimistic: 5,
    mostLikely: 7,
    pessimistic: 12,
    dependsOn: ['t-venue'],
    drivers: ['budget'],
    why: 'Sets the festive aesthetic',
    vendorNeed: 'decorator',
  },
  {
    id: 't-countdown',
    name: 'Final Guest Rehearsal & Welcome',
    category: 'milestone',
    optimistic: 1,
    mostLikely: 2,
    pessimistic: 3,
    dependsOn: ['t-decor'],
    drivers: ['date'],
    why: 'Ensures flawless celebration flow',
  },
];

describe('CelebrationRoadmap Component', () => {
  it('renders all four celebration phases and task cards', () => {
    const handleSelectTask = vi.fn();
    const handleFindVendor = vi.fn();

    render(
      <CelebrationRoadmap
        tasks={MOCK_TASKS}
        onSelectTask={handleSelectTask}
        onOpenVendorSearch={handleFindVendor}
      />,
    );

    expect(screen.getByText(/Phase 1: Foundations & Planning/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 2: Core Vendors & Venue/i)).toBeInTheDocument();
    expect(screen.getByText('Finalize Guest List & Budget')).toBeInTheDocument();
    expect(screen.getByText('Book Heritage Courtyard Venue')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Book Heritage Courtyard Venue'));
    expect(handleSelectTask).toHaveBeenCalledWith('t-venue');

    const findVendorBtns = screen.getAllByRole('button', { name: /Find Vendors/i });
    expect(findVendorBtns.length).toBeGreaterThan(0);
    fireEvent.click(findVendorBtns[0]);
    expect(handleFindVendor).toHaveBeenCalledWith('venue');
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <CelebrationRoadmap tasks={MOCK_TASKS} onSelectTask={vi.fn()} onOpenVendorSearch={vi.fn()} />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
