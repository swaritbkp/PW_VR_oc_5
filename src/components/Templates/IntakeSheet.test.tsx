import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { IntakeSheet } from './IntakeSheet';

describe('IntakeSheet Component (AC5, AC18)', () => {
  it('AC5 validates input and submits clean parsed data', () => {
    const handleSubmit = vi.fn();
    render(
      <IntakeSheet
        initialValues={{
          eventType: 'wedding',
          city: 'Chandigarh',
          date: '2026-11-20',
          guests: 200,
          budgetInr: 2000000,
          language: 'hi',
        }}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate Living Event Graph/i }));
    expect(handleSubmit).toHaveBeenCalled();
    const data = handleSubmit.mock.calls[0][0];
    expect(data.city).toBe('Chandigarh');
    expect(data.guests).toBe(200);
    expect(data.eventType).toBe('wedding');
  });

  it('AC5 shows validation error for past date', () => {
    const handleSubmit = vi.fn();
    render(
      <IntakeSheet
        initialValues={{
          date: '2020-01-01',
        }}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate Living Event Graph/i }));
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<IntakeSheet onSubmit={vi.fn()} />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
