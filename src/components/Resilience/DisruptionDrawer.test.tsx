import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { DisruptionDrawer } from './DisruptionDrawer';
import { buildTemplateTasks, getTemplate } from '@/lib/templates/catalog';

describe('DisruptionDrawer Component (AC25, AC26)', () => {
  const sampleTasks = buildTemplateTasks(getTemplate('wedding-phulkari-courtyard')!);

  it('AC25 simulates venue cancellation with uncovered status and shows slip', () => {
    const handleClose = vi.fn();
    render(
      <DisruptionDrawer
        tasks={sampleTasks}
        availableDays={30}
        backedUpNeeds={new Set()}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText(/Disruption Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/No Plan B Held/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Impact Assessment/i)).toBeInTheDocument();
  });

  it('AC26 reflects covered status when backup vendor is held', () => {
    render(
      <DisruptionDrawer
        tasks={sampleTasks}
        availableDays={30}
        backedUpNeeds={new Set(['venue'])}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Plan B Active/i)).toBeInTheDocument();
  });

  it('AC25 triggers highlight ghost path callback', () => {
    const handleSimulate = vi.fn();
    render(
      <DisruptionDrawer
        tasks={sampleTasks}
        availableDays={30}
        backedUpNeeds={new Set()}
        onClose={vi.fn()}
        onSimulate={handleSimulate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Highlight Ghost Path/i }));
    expect(handleSimulate).toHaveBeenCalledWith(
      expect.objectContaining({ scenarioId: 'venue_cancels' }),
    );
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <DisruptionDrawer
        tasks={sampleTasks}
        availableDays={30}
        backedUpNeeds={new Set()}
        onClose={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
