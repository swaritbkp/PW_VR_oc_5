import { describe, expect, it } from 'vitest';
import { getInitialPlan } from './initialPlan';
import { evaluateJourney } from './journey';
import type { VendorSelection } from '../vendors/types';

describe('Guided Event Journey Engine (AC18, AC19, AC25, AC30)', () => {
  const plan = getInitialPlan();

  it('evaluates baseline plan at Step 2 with calibrated critical path prompt', () => {
    const res = evaluateJourney(plan);

    expect(res.steps.length).toBe(5);
    expect(res.steps[0].isComplete).toBe(true);
    expect(res.steps[0].id).toBe('vision_intake');
    expect(res.progressPct).toBeGreaterThanOrEqual(20);
    expect(res.currentStep.id).toBe('critical_path');
    expect(res.nextGuidedPrompt).toContain('critical path');
    expect(res.nextAction.actionId).toBe('graph');
  });

  it('advances to Step 3 when tasks are marked done or reviewed', () => {
    const reviewedPlan = {
      ...plan,
      tasks: plan.tasks.map((t, idx) => (idx === 0 ? { ...t, done: true } : t)),
    };
    const res = evaluateJourney(reviewedPlan);

    expect(res.steps[1].isComplete).toBe(true);
    expect(res.currentStep.id).toBe('vet_vendors');
    expect(res.nextAction.actionId).toBe('vendors');
  });

  it('advances to Step 4 when vendors are booked or shortlisted', () => {
    const reviewedPlan = {
      ...plan,
      tasks: plan.tasks.map((t, idx) => (idx === 0 ? { ...t, done: true } : t)),
    };
    const selections: VendorSelection[] = [
      { placeId: 'place-1', need: 'venue', status: 'booked', quoteInr: 500000 },
    ];
    const res = evaluateJourney(reviewedPlan, { vendorSelections: selections });

    expect(res.steps[2].isComplete).toBe(true);
    expect(res.currentStep.id).toBe('resilience_plan_b');
    expect(res.nextAction.actionId).toBe('chaos');
  });

  it('reaches 100% progress when all 5 guided steps are accomplished', () => {
    const reviewedPlan = {
      ...plan,
      tasks: plan.tasks.map((t, idx) => (idx === 0 ? { ...t, done: true } : t)),
    };
    const selections: VendorSelection[] = [
      { placeId: 'place-1', need: 'venue', status: 'booked', quoteInr: 500000 },
      { placeId: 'place-2', need: 'venue', status: 'backup' },
    ];
    const res = evaluateJourney(reviewedPlan, {
      vendorSelections: selections,
      simulationRun: true,
      exportedPackage: true,
    });

    expect(res.progressPct).toBe(100);
    expect(res.completedStepsCount).toBe(5);
    expect(res.steps.every((s) => s.isComplete)).toBe(true);
    expect(res.nextGuidedPrompt).toMatch(/master celebration plan is fully fortified/i);
  });
});
