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
        date: '2027-02-14',
        guests: 350,
        budgetInr: 2500000,
        style: 'Outdoor winter Anand Karaj with rain-proof shamiana and zero-plastic decor',
        nonNegotiables: ['Zero-plastic decor'],
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

    // Verify scaled budget lines fit with 10% contingency exactly to INR 25,00,000
    const allocation = allocate(adapted.budgetLines, adapted.intake.budgetInr, adapted.intake.guests);
    const rec = reconcile(allocation);
    expect(rec.isWithinBudget).toBe(true);
    expect(rec.status).toBe('fits');
    expect(rec.gapInr).toBe(0);
    expect(allocation.contingencyInr).toBe(227273);
    expect(allocation.grandTotal).toBe(2500000);
  });

  it('wires New-Age celebration nuances (Star Night, Multi-Caterer, Craft Bar) into CPM DAG and budget', () => {
    const initial = getInitialPlan();
    const adapted = buildAdaptedPlanFromIntake(
      {
        eventType: 'wedding',
        city: 'Chandigarh',
        date: '2027-03-20',
        guests: 400,
        budgetInr: 3500000,
        style: 'Modern cocktail sangeet with celebrity Star Night performer, 2nd Chaat Caterer, and Craft Bar mixology',
        nonNegotiables: ['Star Night', 'Excise Permit'],
        language: 'en',
      },
      initial,
    );

    // Verify nuance tasks exist in the PERT/CPM DAG
    const starTask = adapted.tasks.find((t) => t.name.includes('Star Night'));
    expect(starTask).toBeDefined();
    expect(starTask?.optimistic).toBe(5);
    expect(starTask?.mostLikely).toBe(8);
    expect(starTask?.pessimistic).toBe(14);

    const catererTask = adapted.tasks.find((t) => t.name.includes('Multi-Caterer'));
    expect(catererTask).toBeDefined();

    const barTask = adapted.tasks.find((t) => t.name.includes('Excise Liquor Permit'));
    expect(barTask).toBeDefined();

    // Verify budget lines exist
    expect(adapted.budgetLines.some((l) => l.name.includes('Star Night'))).toBe(true);
    expect(adapted.budgetLines.some((l) => l.name.includes('Specialty 2nd Caterer'))).toBe(true);
    expect(adapted.budgetLines.some((l) => l.name.includes('Craft Bar'))).toBe(true);
  });
});
