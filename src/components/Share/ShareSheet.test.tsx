import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ShareSheet } from './ShareSheet';
import type { PlanState } from '@/lib/plan/propagate';

describe('ShareSheet Component (AC14)', () => {
  const samplePlan: PlanState = {
    id: 'plan_share_01',
    intake: {
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2026-11-20',
      guests: 250,
      budgetInr: 2500000,
      nonNegotiables: [],
      language: 'en',
    },
    tasks: [
      {
        id: 'W01',
        title: 'Book Wedding Venue',
        category: 'venue',
        optimistic: 3,
        mostLikely: 5,
        pessimistic: 10,
        dependsOn: [],
        drivers: ['city'],
        why: 'Venue',
        done: true,
      },
    ],
    budgetLines: [],
    targetDays: 30,
  };

  it('AC14 generates WhatsApp message and switches languages', () => {
    render(<ShareSheet plan={samplePlan} onClose={vi.fn()} />);

    expect(screen.getByText(/Share Living Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Jashn: Wedding Celebration/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(screen.getByText(/विवाह समारोह/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ਪੰਜਾਬੀ' }));
    expect(screen.getByText(/ਵਿਆਹ ਸਮਾਗਮ/i)).toBeInTheDocument();
  });

  it('AC14 provides calendar export download', () => {
    const originalCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test');

    render(<ShareSheet plan={samplePlan} onClose={vi.fn()} />);

    const calBtn = screen.getByRole('button', { name: /Export iCalendar/i });
    expect(calBtn).toBeInTheDocument();
    fireEvent.click(calBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
    URL.createObjectURL = originalCreate;
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<ShareSheet plan={samplePlan} onClose={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
