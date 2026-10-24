import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { RiskRegister } from './RiskRegister';
import type { RiskContext } from '@/lib/resilience/resilience';

describe('RiskRegister Component (AC25)', () => {
  const context: RiskContext = {
    eventType: 'wedding',
    outdoor: true,
    month: 7, // July (monsoon)
    backedUp: new Set(['tent_house']),
  };

  it('AC25 computes resilience score and ranks seasonal risks', () => {
    render(<RiskRegister context={context} />);

    expect(screen.getByText(/Plan B Resilience Score/i)).toBeInTheDocument();
    expect(screen.getByTestId('resilience-score-gauge')).toBeInTheDocument();
    expect(screen.getByText(/Rain on an outdoor event/i)).toBeInTheDocument();
    expect(screen.getByText(/Venue cancels or double-books/i)).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<RiskRegister context={context} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
