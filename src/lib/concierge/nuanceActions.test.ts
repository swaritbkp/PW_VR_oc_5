import { describe, expect, it } from 'vitest';
import { parseNewAgeNuances, sanitizeTaskDependencies } from './nuanceActions';
import type { AgentAction } from './types';
import type { PlanTask } from '../plan/types';

describe('New-Age Indian Celebration Nuances & DAG Guard', () => {
  it('parses Star Night nuance with PERT 3-point estimate and fixed budget line', () => {
    const cmd = 'Book Star Night with celebrity artist rider ₹4.5L';
    const actions: AgentAction[] = [];
    const logs: string[] = [];

    parseNewAgeNuances(cmd, actions, logs);

    const taskAction = actions.find((a) => a.type === 'add_task' && a.name.includes('Star Night'));
    expect(taskAction).toBeDefined();
    if (taskAction && taskAction.type === 'add_task') {
      expect(taskAction.optimistic).toBe(5);
      expect(taskAction.likely).toBe(8);
      expect(taskAction.pessimistic).toBe(14);
      expect(taskAction.critical).toBe(true);
      expect(taskAction.category).toBe('entertainment');
    }

    const budgetAction = actions.find((a) => a.type === 'add_budget_line' && a.line.name.includes('Star Night'));
    expect(budgetAction).toBeDefined();
    if (budgetAction && budgetAction.type === 'add_budget_line') {
      expect(budgetAction.line.rateInr).toBe(450000);
      expect(budgetAction.line.unit).toBe('fixed');
    }
    expect(logs.some((l) => l.includes('Star Night: Artist Tech Rider'))).toBe(true);
  });

  it('parses Multi-Caterer Split and Craft Bar Excise permits simultaneously', () => {
    const cmd = 'Include specialty second caterer with chaat counters and arrange craft bar with excise permit';
    const actions: AgentAction[] = [];
    const logs: string[] = [];

    parseNewAgeNuances(cmd, actions, logs);

    // Multi-Caterer
    const catererTask = actions.find((a) => a.type === 'add_task' && a.name.includes('Multi-Caterer'));
    expect(catererTask).toBeDefined();
    if (catererTask && catererTask.type === 'add_task') {
      expect(catererTask.optimistic).toBe(3);
      expect(catererTask.likely).toBe(5);
      expect(catererTask.pessimistic).toBe(9);
    }
    const catererBudget = actions.find((a) => a.type === 'add_budget_line' && a.line.name.includes('Specialty 2nd Caterer'));
    expect(catererBudget).toBeDefined();
    if (catererBudget && catererBudget.type === 'add_budget_line') {
      expect(catererBudget.line.rateInr).toBe(450);
      expect(catererBudget.line.unit).toBe('per_head');
    }

    // Craft Bar & Excise
    const barTask = actions.find((a) => a.type === 'add_task' && a.name.includes('Excise Liquor Permit'));
    expect(barTask).toBeDefined();
    if (barTask && barTask.type === 'add_task') {
      expect(barTask.optimistic).toBe(4);
      expect(barTask.likely).toBe(7);
      expect(barTask.pessimistic).toBe(12);
    }
    const barBudget = actions.find((a) => a.type === 'add_budget_line' && a.line.name.includes('Craft Bar'));
    expect(barBudget).toBeDefined();
    if (barBudget && barBudget.type === 'add_budget_line') {
      expect(barBudget.line.rateInr).toBe(650);
      expect(barBudget.line.unit).toBe('per_head');
    }
  });

  it('parses Variable Star Night rates (₹12L, ₹8.5L) and Showstopper Fireworks (₹1.8L)', () => {
    const cmd = 'Add Star Night at ₹12L and add fireworks and cold pyro showstopper at ₹1.8L';
    const actions: AgentAction[] = [];
    const logs: string[] = [];

    parseNewAgeNuances(cmd, actions, logs);

    // Star Night ₹12L
    const starBudget = actions.find((a) => a.type === 'add_budget_line' && a.line.name.includes('Star Night'));
    expect(starBudget).toBeDefined();
    if (starBudget && starBudget.type === 'add_budget_line') {
      expect(starBudget.line.rateInr).toBe(1200000);
    }

    // Showstopper & Fireworks ₹1.8L
    const pyroTask = actions.find((a) => a.type === 'add_task' && a.name.includes('Showstopper & Fireworks'));
    expect(pyroTask).toBeDefined();
    if (pyroTask && pyroTask.type === 'add_task') {
      expect(pyroTask.optimistic).toBe(4);
      expect(pyroTask.likely).toBe(7);
      expect(pyroTask.pessimistic).toBe(12);
      expect(pyroTask.category).toBe('permits');
    }

    const pyroBudget = actions.find((a) => a.type === 'add_budget_line' && a.line.name.includes('Showstopper'));
    expect(pyroBudget).toBeDefined();
    if (pyroBudget && pyroBudget.type === 'add_budget_line') {
      expect(pyroBudget.line.rateInr).toBe(180000);
    }
    expect(logs.some((l) => l.includes('Showstopper & Fireworks'))).toBe(true);
  });

  it('parses Weather Proofing nuance with German Hanger task and reserve line', () => {
    const cmd = 'Include weather proofing with waterproof german hanger and heaters';
    const actions: AgentAction[] = [];
    const logs: string[] = [];

    parseNewAgeNuances(cmd, actions, logs);

    const weatherTask = actions.find((a) => a.type === 'add_task' && a.name.includes('Waterproof German Hanger'));
    expect(weatherTask).toBeDefined();

    const weatherBudget = actions.find((a) => a.type === 'add_budget_line' && a.line.name.includes('Weather Proofing'));
    expect(weatherBudget).toBeDefined();
    if (weatherBudget && weatherBudget.type === 'add_budget_line') {
      expect(weatherBudget.line.rateInr).toBe(150000);
    }
  });

  it('sanitizeTaskDependencies prevents cycles and reparents to root task', () => {
    const existingTasks: PlanTask[] = [
      {
        id: 'W01',
        name: 'Budget & Theme',
        optimistic: 2,
        mostLikely: 3,
        pessimistic: 5,
        dependsOn: [],
        category: 'planning',
        drivers: ['date'],
        why: 'Kickoff milestone',
      },
      {
        id: 'W02',
        name: 'Venue Booking',
        optimistic: 4,
        mostLikely: 7,
        pessimistic: 10,
        dependsOn: ['W01'],
        category: 'venue',
        drivers: ['date'],
        why: 'Venue anchor',
      },
    ];

    // Case 1: missing dependency -> reparents to root W01
    const taskWithMissing: PlanTask = {
      id: 'agent_task_1',
      name: 'Custom Decor',
      optimistic: 2,
      mostLikely: 4,
      pessimistic: 6,
      dependsOn: ['NON_EXISTENT_ID'],
      category: 'decor',
      drivers: ['budget'],
      why: 'Decor setup',
    };
    const sanitized1 = sanitizeTaskDependencies(existingTasks, taskWithMissing);
    expect(sanitized1.dependsOn).toEqual(['W01']);

    // Case 2: valid dependency -> preserves
    const taskValid: PlanTask = {
      id: 'agent_task_2',
      name: 'Soundcheck',
      optimistic: 1,
      mostLikely: 2,
      pessimistic: 3,
      dependsOn: ['W02'],
      category: 'entertainment',
      drivers: ['date'],
      why: 'Sound check',
    };
    const sanitized2 = sanitizeTaskDependencies(existingTasks, taskValid);
    expect(sanitized2.dependsOn).toEqual(['W02']);
  });
});
