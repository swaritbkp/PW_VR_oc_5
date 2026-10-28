// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import ErrorBoundary from './error';

describe('App Router ErrorBoundary Component', () => {
  it('renders an accessible alert container with error message and reference digest', () => {
    const mockReset = vi.fn();
    const testError = Object.assign(new Error('Simulated CPM calculation failure'), {
      digest: 'err_cpm_404',
    });

    render(<ErrorBoundary error={testError} reset={mockReset} />);

    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toBeInTheDocument();
    expect(screen.getByText('Celebration Workspace Interrupted')).toBeInTheDocument();
    expect(screen.getByText('Simulated CPM calculation failure')).toBeInTheDocument();
    expect(screen.getByText(/err_cpm_404/)).toBeInTheDocument();
  });

  it('triggers the reset recovery callback when the recovery button is clicked', () => {
    const mockReset = vi.fn();
    const testError = new Error('Client runtime failure');

    render(<ErrorBoundary error={testError} reset={mockReset} />);

    const button = screen.getByRole('button', { name: /Reset & Recover Workspace/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const mockReset = vi.fn();
    const testError = new Error('Accessibility test error');

    const { container } = render(<ErrorBoundary error={testError} reset={mockReset} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
