import type { PlanState } from './propagate';
import type { VendorSelection } from '../vendors/types';

export type GuidedStageId =
  'vision_intake' | 'critical_path' | 'vet_vendors' | 'resilience_plan_b' | 'export_package';

export type GuidedActionId =
  'templates' | 'graph' | 'vendors' | 'chaos' | 'export_jashn' | 'dossier' | 'whatif';

export interface GuidedStep {
  readonly id: GuidedStageId;
  readonly stepNumber: number;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly isComplete: boolean;
  readonly isActive: boolean;
  readonly actionId: GuidedActionId;
  readonly actionLabel: string;
}

export interface JourneyEvaluation {
  readonly progressPct: number;
  readonly completedStepsCount: number;
  readonly currentStep: GuidedStep;
  readonly steps: readonly GuidedStep[];
  readonly nextGuidedPrompt: string;
  readonly nextAction: {
    readonly actionId: GuidedActionId;
    readonly label: string;
  };
}

export interface JourneyContext {
  readonly vendorSelections?: readonly VendorSelection[];
  readonly simulationRun?: boolean;
  readonly exportedPackage?: boolean;
}

const TOTAL_STEPS = 5;
const PERCENT_PER_STEP = 20;

function evaluateStepCompletions(plan: PlanState, ctx?: JourneyContext) {
  const s1Complete = Boolean(plan.intake.eventType && plan.tasks.length > 0);
  const s2Complete = s1Complete && plan.tasks.some((t) => t.done);
  const hasVendors = Boolean(
    ctx?.vendorSelections?.some((v) => v.status === 'booked' || v.status === 'contacted'),
  );
  const s3Complete = s2Complete && hasVendors;
  const hasBackupOrSim = Boolean(
    ctx?.vendorSelections?.some((v) => v.status === 'backup') || ctx?.simulationRun,
  );
  const s4Complete = s3Complete && hasBackupOrSim;
  const s5Complete = s4Complete && Boolean(ctx?.exportedPackage);

  return [s1Complete, s2Complete, s3Complete, s4Complete, s5Complete] as const;
}

function findActiveIndex(completions: readonly boolean[]): number {
  const firstIncomplete = completions.findIndex((c) => !c);
  return firstIncomplete === -1 ? TOTAL_STEPS - 1 : firstIncomplete;
}

function buildStepDefinitions(
  completions: readonly boolean[],
  activeIdx: number,
): readonly GuidedStep[] {
  const defs = [
    {
      id: 'vision_intake' as const,
      title: 'Choose Vision & Intake',
      shortTitle: '1. Vision',
      description: 'Select an authentic template and set celebration parameters.',
      actionId: 'templates' as const,
      actionLabel: 'Browse Templates',
    },
    {
      id: 'critical_path' as const,
      title: 'Calibrate Critical Path',
      shortTitle: '2. Critical Path',
      description: 'Inspect CPM timeline, float, and initial milestone deliverables.',
      actionId: 'graph' as const,
      actionLabel: 'View Event Graph',
    },
    {
      id: 'vet_vendors' as const,
      title: 'Scout, Negotiate & Vet Vendors',
      shortTitle: '3. Vendors',
      description: 'Discover nearby verified vendors and apply negotiation strategies.',
      actionId: 'vendors' as const,
      actionLabel: 'Scout Vendors',
    },
    {
      id: 'resilience_plan_b' as const,
      title: 'Fortify Plan B & Run Chaos Monkey',
      shortTitle: '4. Resilience',
      description: 'Hold backup vendors and stress-test schedule against compound incidents.',
      actionId: 'chaos' as const,
      actionLabel: 'Trigger Chaos Monkey',
    },
    {
      id: 'export_package' as const,
      title: 'Share & Export Portable .jashn',
      shortTitle: '5. Export & Share',
      description: 'Export verifiable .jashn event file, iCal, or Executive Dossier.',
      actionId: 'export_jashn' as const,
      actionLabel: 'Export .jashn File',
    },
  ];

  return defs.map((d, i) => ({
    ...d,
    stepNumber: i + 1,
    isComplete: completions[i],
    isActive: i === activeIdx,
  }));
}

function getCoachPrompt(step: GuidedStep, allDone: boolean): string {
  if (allDone) {
    return 'Your master celebration plan is fully fortified, budgeted, and ready for execution!';
  }
  switch (step.id) {
    case 'vision_intake':
      return 'Pick one of 12 regional templates or customize your guest count and city to anchor the vision.';
    case 'critical_path':
      return 'Review your CPM critical path in the Event Graph to calibrate zero-slack milestones.';
    case 'vet_vendors':
      return 'Find nearby verified vendors on Google Places and run the Cultural Negotiation Coach.';
    case 'resilience_plan_b':
      return 'Hold at least one Plan B vendor and stress-test the schedule with Chaos Monkey.';
    case 'export_package':
      return 'Export your portable .jashn event package or generate an Executive Celebration Dossier.';
  }
}

/**
 * Pure deterministic state evaluator that computes 5-step guided journey progress,
 * active step, and proactive coach guidance.
 */
export function evaluateJourney(plan: PlanState, context?: JourneyContext): JourneyEvaluation {
  const completions = evaluateStepCompletions(plan, context);
  const completedCount = completions.filter(Boolean).length;
  const activeIdx = findActiveIndex(completions);
  const steps = buildStepDefinitions(completions, activeIdx);
  const currentStep = steps[activeIdx];
  const allDone = completedCount === TOTAL_STEPS;

  return {
    progressPct: Math.min(100, completedCount * PERCENT_PER_STEP),
    completedStepsCount: completedCount,
    currentStep,
    steps,
    nextGuidedPrompt: getCoachPrompt(currentStep, allDone),
    nextAction: {
      actionId: currentStep.actionId,
      label: currentStep.actionLabel,
    },
  };
}
