import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { NodeInspector } from './NodeInspector';
import type { GraphNode } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';

describe('NodeInspector component (AC7, AC19, AC29)', () => {
  const dummyNode: GraphNode = {
    id: 'T1',
    name: 'Book Wedding Venue',
    lane: 'venue',
    x: 0,
    y: 0,
    w: 120,
    h: 44,
    milestone: false,
    critical: true,
    floatDays: 0,
    done: false,
    started: true,
    hasBackup: true,
    startDate: '2027-02-01',
    endDate: '2027-02-05',
    mustStartBy: '2027-02-01',
  };

  const dummyTask: PlanTask = {
    id: 'T1',
    name: 'Book Wedding Venue',
    optimistic: 2,
    mostLikely: 4,
    pessimistic: 8,
    dependsOn: [],
    category: 'venue',
    drivers: ['city', 'budget'],
    why: 'Anchors location for all ceremony arrangements',
    vendorNeed: 'venue',
  };

  it('renders task details, dates, and why explanation (AC19)', () => {
    render(<NodeInspector node={dummyNode} task={dummyTask} onClose={vi.fn()} />);

    expect(screen.getByText('Book Wedding Venue')).toBeInTheDocument();
    expect(screen.getByText('Anchors location for all ceremony arrangements')).toBeInTheDocument();
    expect(screen.getAllByText('2027-02-01')[0]).toBeInTheDocument();
  });

  it('switches to Vendors tab and displays vendor need context (AC19)', () => {
    render(<NodeInspector node={dummyNode} task={dummyTask} onClose={vi.fn()} />);

    const vendorTabBtn = screen.getByRole('button', { name: /Vendors & Plan B/i });
    fireEvent.click(vendorTabBtn);

    expect(screen.getByText('Required Vendor Need')).toBeInTheDocument();
    expect(screen.getAllByText('venue')[0]).toBeInTheDocument();
  });

  it('triggers status update callbacks when Mark Done is clicked', () => {
    const handleStatus = vi.fn();
    render(
      <NodeInspector
        node={dummyNode}
        task={dummyTask}
        onClose={vi.fn()}
        onUpdateStatus={handleStatus}
      />,
    );

    const doneBtn = screen.getByRole('button', { name: /Mark Done/i });
    fireEvent.click(doneBtn);
    expect(handleStatus).toHaveBeenCalledWith('T1', { started: true, done: true });
  });

  it('passes automated accessibility audit with zero violations (AC7)', async () => {
    const { container } = render(
      <NodeInspector node={dummyNode} task={dummyTask} onClose={vi.fn()} />,
    );
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
