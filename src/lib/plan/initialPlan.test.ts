import { describe, expect, it } from 'vitest';
import { getInitialPlan } from './initialPlan';

describe('Initial Plan Helper', () => {
  it('returns valid initial plan state with tasks and budget lines', () => {
    const plan = getInitialPlan();
    expect(plan.id).toBe('plan_phulkari_01');
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.budgetLines.length).toBeGreaterThan(0);
    expect(plan.targetDays).toBe(111);
  });
});
