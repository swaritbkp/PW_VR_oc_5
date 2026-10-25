import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { CelebrationConcierge } from './CelebrationConcierge';

describe('CelebrationConcierge Component', () => {
  it('renders warm greeting, celebration progress, and handles tab switching', () => {
    const handleSelectTab = vi.fn();
    const handleOpenPlanB = vi.fn();
    const handleOpenWhatIf = vi.fn();

    render(
      <CelebrationConcierge
        eventType="wedding"
        city="Chandigarh"
        guests={250}
        daysLeft={75}
        doneCount={2}
        totalCount={8}
        activeTab="roadmap"
        onSelectTab={handleSelectTab}
        onOpenPlanB={handleOpenPlanB}
        onOpenWhatIf={handleOpenWhatIf}
      />,
    );

    expect(screen.getByText(/Namaste & Sat Sri Akal!/i)).toBeInTheDocument();
    expect(screen.getByText(/Planning your wedding in Chandigarh/i)).toBeInTheDocument();
    expect(screen.getByText(/75 days to go/i)).toBeInTheDocument();
    expect(screen.getByText(/250 guests/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Find Nearby Vendors/i }));
    expect(handleSelectTab).toHaveBeenCalledWith('vendors');

    fireEvent.click(screen.getByRole('button', { name: /Simulate Plan B/i }));
    expect(handleOpenPlanB).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /What-If Sliders/i }));
    expect(handleOpenWhatIf).toHaveBeenCalledTimes(1);
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <CelebrationConcierge
        eventType="wedding"
        city="Chandigarh"
        guests={250}
        daysLeft={75}
        doneCount={2}
        totalCount={8}
        activeTab="roadmap"
        onSelectTab={vi.fn()}
        onOpenPlanB={vi.fn()}
        onOpenWhatIf={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
