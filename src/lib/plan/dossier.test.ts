import { describe, expect, it } from 'vitest';
import { getInitialPlan } from './initialPlan';
import { generateExecutiveDossier } from './dossier';

describe('AC14 Executive Celebration Dossier Exporter', () => {
  it('synthesizes a comprehensive luxury dossier from living plan state', () => {
    const plan = getInitialPlan();
    const dossier = generateExecutiveDossier(plan);

    expect(dossier.title).toContain(plan.intake.eventType);
    expect(dossier.city).toBe(plan.intake.city);
    expect(dossier.totalGuests).toBe(plan.intake.guests);
    expect(dossier.totalBudgetFormatted).toMatch(/₹/);
    expect(dossier.sections.length).toBeGreaterThanOrEqual(4);

    const execSummary = dossier.sections.find((s) => s.title.includes('Executive Summary'));
    expect(execSummary).toBeDefined();

    const criticalPath = dossier.sections.find((s) => s.title.includes('Critical Path'));
    expect(criticalPath).toBeDefined();

    const budgetSection = dossier.sections.find((s) => s.title.includes('Budget'));
    expect(budgetSection).toBeDefined();

    const riskSection = dossier.sections.find((s) => s.title.includes('Resilience'));
    expect(riskSection).toBeDefined();
  });

  it('aggregates key metrics cleanly with Indian formatting', () => {
    const plan = getInitialPlan();
    const dossier = generateExecutiveDossier(plan);

    expect(dossier.onTimeProbabilityFormatted).toMatch(/%/);
    expect(dossier.criticalPathCount).toBeGreaterThan(0);
    expect(dossier.vendorReadinessSummary.length).toBeGreaterThan(0);
  });
});
