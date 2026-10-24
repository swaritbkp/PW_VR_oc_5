import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { EventGraph } from './EventGraph';
import type { GraphLayout } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';

describe('EventGraph component (AC7, AC16, AC19, AC29)', () => {
  const dummyLayout: GraphLayout = {
    nodes: [
      {
        id: 'T1',
        name: 'Select Venue',
        lane: 'venue',
        x: 20,
        y: 40,
        w: 120,
        h: 44,
        milestone: false,
        critical: true,
        floatDays: 0,
        done: false,
        started: true,
        hasBackup: true,
        startDate: '2027-01-10',
        endDate: '2027-01-15',
        mustStartBy: '2027-01-10',
      },
      {
        id: 'T2',
        name: 'Book Caterer',
        lane: 'food',
        x: 180,
        y: 100,
        w: 120,
        h: 44,
        milestone: false,
        critical: false,
        floatDays: 5,
        done: false,
        started: false,
        hasBackup: false,
        startDate: '2027-01-16',
        endDate: '2027-01-20',
        mustStartBy: '2027-01-21',
      },
    ],
    edges: [
      {
        from: 'T1',
        to: 'T2',
        critical: true,
        x1: 140,
        y1: 62,
        x2: 180,
        y2: 122,
      },
    ],
    lanes: [
      { lane: 'venue', y: 30, height: 60 },
      { lane: 'food', y: 90, height: 60 },
    ],
    ticks: [{ x: 50, offsetDays: 0, date: '2027-01-10' }],
    todayX: 20,
    eventX: 300,
    width: 600,
    height: 300,
  };

  const dummyTasks: PlanTask[] = [
    {
      id: 'T1',
      name: 'Select Venue',
      optimistic: 2,
      mostLikely: 5,
      pessimistic: 10,
      dependsOn: [],
      category: 'venue',
      drivers: ['city', 'budget'],
      why: 'Secures event location',
      vendorNeed: 'venue',
    },
    {
      id: 'T2',
      name: 'Book Caterer',
      optimistic: 3,
      mostLikely: 4,
      pessimistic: 8,
      dependsOn: ['T1'],
      category: 'food',
      drivers: ['guests'],
      why: 'Provides culinary feast',
      vendorNeed: 'caterer',
    },
  ];

  it('renders SVG canvas and nodes correctly (AC19)', () => {
    const handleSelect = vi.fn();
    render(<EventGraph layout={dummyLayout} tasks={dummyTasks} onSelectNode={handleSelect} />);

    expect(screen.getByRole('application', { name: /timeline graph/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Venue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book Caterer/i })).toBeInTheDocument();
  });

  it('supports keyboard navigation following dependency edges with arrow keys (AC29)', () => {
    const handleSelect = vi.fn();
    render(<EventGraph layout={dummyLayout} tasks={dummyTasks} onSelectNode={handleSelect} />);

    const node1 = screen.getByRole('button', { name: /Select Venue/i });
    // Right arrow on T1 should move focus / select successor T2
    fireEvent.keyDown(node1, { key: 'ArrowRight' });
    expect(handleSelect).toHaveBeenCalledWith('T2');

    const node2 = screen.getByRole('button', { name: /Book Caterer/i });
    // Left arrow on T2 should move focus / select predecessor T1
    fireEvent.keyDown(node2, { key: 'ArrowLeft' });
    expect(handleSelect).toHaveBeenCalledWith('T1');
  });

  it('opens inspector on Enter and closes on Escape (AC29)', () => {
    const handleSelect = vi.fn();
    render(
      <EventGraph
        layout={dummyLayout}
        tasks={dummyTasks}
        selectedNodeId="T1"
        onSelectNode={handleSelect}
      />,
    );

    const node1 = screen.getByRole('button', { name: /Select Venue/i });
    fireEvent.keyDown(node1, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('T1');

    fireEvent.keyDown(node1, { key: 'Escape' });
    expect(handleSelect).toHaveBeenCalledWith(undefined);
  });

  it('toggles to accessible vertical timeline list view (AC7, AC16, AC19)', () => {
    render(<EventGraph layout={dummyLayout} tasks={dummyTasks} onSelectNode={vi.fn()} />);

    const toggleBtn = screen.getByRole('button', { name: /Toggle list view/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('list', { name: /Event tasks timeline list/i })).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations (AC7)', async () => {
    const { container } = render(
      <EventGraph layout={dummyLayout} tasks={dummyTasks} onSelectNode={vi.fn()} />,
    );
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
