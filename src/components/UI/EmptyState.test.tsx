import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  it('renders configured empty state with icon and action button', () => {
    const handleAction = vi.fn();
    render(<EmptyState type="no-plan" onAction={handleAction} />);

    expect(screen.getByText(/No Active Celebration Plan/i)).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /Browse Templates/i });
    expect(actionBtn).toBeInTheDocument();
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalled();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(<EmptyState type="all-done" />);

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
