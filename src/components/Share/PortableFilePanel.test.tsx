import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { PortableFilePanel } from './PortableFilePanel';
import { getInitialPlan } from '@/lib/plan/initialPlan';

describe('PortableFilePanel Component (AC5, AC30)', () => {
  const plan = getInitialPlan();

  it('renders export button and file upload dropzone', () => {
    const handleClose = vi.fn();
    render(<PortableFilePanel plan={plan} onClose={handleClose} onImportPlan={vi.fn()} />);

    expect(screen.getByText(/Save & Load \.jashn Event Package/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Export Portable \.jashn File/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Drop your \.jashn file here/i)).toBeInTheDocument();
  });

  it('triggers download when Export button is clicked', () => {
    const orig = window.URL.createObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    render(<PortableFilePanel plan={plan} onClose={vi.fn()} onImportPlan={vi.fn()} />);

    const exportBtn = screen.getByRole('button', { name: /Export Portable \.jashn File/i });
    fireEvent.click(exportBtn);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    window.URL.createObjectURL = orig;
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <PortableFilePanel plan={plan} onClose={vi.fn()} onImportPlan={vi.fn()} />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
