import { daysBetween } from '@/lib/dates';
import { type BudgetLine } from '@/lib/budget/engine';
import { buildTemplateTasks, getTemplate, templatesFor } from '@/lib/templates/catalog';
import type { IntakeInput } from '@/lib/plan/schemas';
import type { PlanState } from '@/lib/plan/propagate';
import type { PlanTask } from '@/lib/plan/types';

function createCustomTask(intake: IntakeInput, parentTaskId: string): PlanTask | null {
  const rawPrompt = intake.style || intake.nonNegotiables?.join(', ');
  if (!rawPrompt) return null;
  const snippet = rawPrompt.length > 36 ? `${rawPrompt.slice(0, 36)}...` : rawPrompt;
  return {
    id: `custom_${Date.now().toString(36)}`,
    name: `Custom Style: ${snippet}`,
    optimistic: 3,
    mostLikely: 5,
    pessimistic: 8,
    dependsOn: [parentTaskId],
    category: 'decor',
    drivers: ['budget'],
    why: rawPrompt,
    optional: false,
  };
}

function buildCategoryLines(venue: number, decor: number, media: number, styleSnippet?: string): BudgetLine[] {
  return [
    {
      id: 'b_venue', category: 'venue', name: 'Celebration Venue & Grounds',
      unit: 'fixed', rateInr: venue, drivers: ['budget'],
    },
    {
      id: 'b_decor', category: 'decor', name: styleSnippet ? `Decor: ${styleSnippet}` : 'Theme Styling & Lighting',
      unit: 'fixed', rateInr: decor, drivers: ['budget'],
    },
    {
      id: 'b_media', category: 'media', name: 'Cinematography & Photo',
      unit: 'fixed', rateInr: media, drivers: ['budget'],
    },
  ];
}

function buildScaledLines(budgetInr: number, guests: number, styleSnippet?: string): BudgetLine[] {
  const netSpend = Math.round(budgetInr / 1.10);
  const safeGuests = Math.max(1, guests);
  const perHeadRate = Math.max(500, Math.round((netSpend * 0.30) / safeGuests));
  const remainingNet = netSpend - perHeadRate * safeGuests;
  const venue = Math.round(remainingNet * (35 / 70));
  const decor = Math.round(remainingNet * (20 / 70));
  const media = remainingNet - venue - decor;

  const foodLine: BudgetLine = {
    id: 'b_food', category: 'food', name: 'Curated Feast & Beverages',
    unit: 'per_head', rateInr: perHeadRate, quantity: safeGuests, drivers: ['guests'],
  };
  return [buildCategoryLines(venue, decor, media, styleSnippet)[0], foodLine, ...buildCategoryLines(venue, decor, media, styleSnippet).slice(1)];
}

/**
 * Builds an adapted PlanState from user intake parameters, creating a customized CPM DAG task node
 * and scaling the budget with a 10% contingency reserve.
 */
export function buildAdaptedPlanFromIntake(intake: IntakeInput, currentPlan: PlanState): PlanState {
  const template =
    (intake.templateId ? getTemplate(intake.templateId) : undefined) ??
    templatesFor(intake.eventType)[0] ??
    getTemplate('wedding-phulkari-courtyard')!;
  const baseTasks = buildTemplateTasks(template);
  const customTask = createCustomTask(intake, baseTasks[0]?.id ?? 'W01');
  const tasks = customTask ? [customTask, ...baseTasks] : baseTasks;

  const styleSnippet = intake.style ? intake.style.slice(0, 24) : undefined;
  const budgetLines = buildScaledLines(intake.budgetInr, intake.guests, styleSnippet);
  const todayIso = new Date().toISOString().slice(0, 10);
  const targetDays = daysBetween(todayIso, intake.date) ?? currentPlan.targetDays;

  return {
    id: `plan_${Date.now()}`,
    intake,
    tasks,
    budgetLines,
    targetDays: Math.max(30, targetDays),
  };
}
