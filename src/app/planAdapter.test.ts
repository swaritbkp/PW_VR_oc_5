import { describe, expect, it } from 'vitest';
import { getInitialPlan } from '@/lib/plan/initialPlan';
import { buildAdaptedPlanFromIntake } from './planAdapter';
import { allocate, reconcile } from '@/lib/budget/engine';

describe('planAdapter: buildAdaptedPlanFromIntake', () => {
  it('adapts baseline plan with 350 guests, ₹25,00,000 budget, and custom style prompt', () => {
    const initial = getInitialPlan();
    const adapted = buildAdaptedPlanFromIntake(
      {
        eventType: 'wedding',
        city: 'Amritsar',
        date: '2026-12-15',
        guests: 350,
        budgetInr: 2500000,
        style: 'Outdoor winter Anand Karaj with rain-proof shamiana and zero-plastic decor',
        nonNegotiables: ['Zero-plastic decor', 'Halwai catering'],
        language: 'en',
      },
      initial,
    );

    expect(adapted.intake.city).toBe('Amritsar');
    expect(adapted.intake.guests).toBe(350);
    expect(adapted.intake.budgetInr).toBe(2500000);

    // Verify custom style task node is created in the DAG
    const customTask = adapted.tasks.find((t) => t.id.startsWith('custom_'));
    expect(customTask).toBeDefined();
    expect(customTask?.name).toContain('Custom Style:');
    expect(customTask?.why).toContain('Outdoor winter Anand Karaj');
    expect(customTask?.category).toBe('decor');

    // Verify scaled budget lines fit with 10% contingency
    const allocation = allocate(adapted.budgetLines, adapted.intake.budgetInr, adapted.intake.guests);
    const rec = reconcile(allocation);
    expect(rec.isWithinBudget).toBe(true);
    expect(allocation.contingencyInr).toBeGreaterThan(0);
    expect(allocation.grandTotal).toBeLessThanOrEqual(2500000);
  });
});
