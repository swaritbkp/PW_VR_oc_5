import { describe, expect, it } from 'vitest';
import { createAgentTask, parseAgentCommand } from './agentActions';

describe('agentActions NLP Parser', () => {
  it('parses multi-intent command: guests, new task, and CPM graph navigation', () => {
    const cmd =
      'Scale guest count to 420, add a Sangeet Soundcheck task to the critical path, and jump to the CPM Event Graph';
    const result = parseAgentCommand(cmd);

    expect(result.actions).toHaveLength(3);
    expect(result.actions[0]).toEqual({ type: 'mutate_guests', guests: 420 });
    expect(result.actions[1]).toMatchObject({
      type: 'add_task',
      name: 'Sangeet Soundcheck',
      critical: true,
    });
    expect(result.actions[2]).toEqual({ type: 'navigate_tab', tab: 'graph' });

    expect(result.executionLog).toContain('✓ Updated Guests -> 420');
    expect(result.executionLog).toContain('✓ Added Node -> Sangeet Soundcheck');
    expect(result.executionLog).toContain('✓ Navigated -> CPM Graph');
  });

  it('parses budget scaling and modal triggers', () => {
    const cmd = 'Set budget to 3000000 and launch Chaos Monkey disruption';
    const result = parseAgentCommand(cmd);

    expect(result.actions.some((a) => a.type === 'mutate_budget')).toBe(true);
    expect(result.actions.some((a) => a.type === 'open_modal')).toBe(true);
    expect(result.executionLog).toContain('✓ Opened -> Chaos Monkey');
  });

  it('parses navigation to vendor explorer and negotiation coach', () => {
    const cmd = 'Find nearby vendors and open negotiation coach';
    const result = parseAgentCommand(cmd);

    expect(result.actions).toContainEqual({ type: 'navigate_tab', tab: 'vendors' });
    expect(result.actions).toContainEqual({ type: 'open_modal', modal: 'negotiate' });
  });

  it('creates valid PlanTask node ready for DAG insertion', () => {
    const task = createAgentTask('Bhangra Performance');
    expect(task.id).toMatch(/^agent_/);
    expect(task.name).toBe('Bhangra Performance');
    expect(task.optimistic).toBe(2);
    expect(task.pessimistic).toBe(6);
    expect(task.dependsOn).toContain('W01');
  });
});
