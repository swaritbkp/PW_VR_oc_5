import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { AgentCopilot } from './AgentCopilot';

describe('AgentCopilot Component', () => {
  it('renders floating launcher button when closed and toggles open', () => {
    const handleToggle = vi.fn();
    render(<AgentCopilot isOpen={false} onToggle={handleToggle} onExecuteAction={vi.fn()} />);

    const launcher = screen.getByRole('button', { name: /Open Jashn AI Agent Copilot/i });
    expect(launcher).toBeInTheDocument();
    fireEvent.click(launcher);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('submits command and triggers onExecuteAction with parsed actions', () => {
    const handleAction = vi.fn();
    render(<AgentCopilot isOpen={true} onToggle={vi.fn()} onExecuteAction={handleAction} />);

    const input = screen.getByLabelText(/Ask Jashn AI Agent/i);
    fireEvent.change(input, {
      target: {
        value:
          'Scale guest count to 420, add a Sangeet Soundcheck task to the critical path, and jump to the CPM Event Graph',
      },
    });

    const submitBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(submitBtn);

    expect(handleAction).toHaveBeenCalledWith({ type: 'mutate_guests', guests: 420 });
    expect(handleAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'add_task', name: 'Sangeet Soundcheck' }),
    );
    expect(handleAction).toHaveBeenCalledWith({ type: 'navigate_tab', tab: 'graph' });

    expect(screen.getAllByText(/Updated Guests -> 420/i).length).toBeGreaterThanOrEqual(1);
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <AgentCopilot isOpen={true} onToggle={vi.fn()} onExecuteAction={vi.fn()} />,
    );
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
