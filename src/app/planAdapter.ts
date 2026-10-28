import { daysBetween } from '@/lib/dates';
import { type BudgetLine } from '@/lib/budget/engine';
import { buildTemplateTasks, getTemplate, templatesFor } from '@/lib/templates/catalog';
import type { IntakeInput } from '@/lib/plan/schemas';
import type { PlanState } from '@/lib/plan/propagate';
import type { PlanTask } from '@/lib/plan/types';
import { redactPii } from '@/lib/security/guardrails';

function createCustomTask(intake: IntakeInput, parentTaskId: string): PlanTask | null {
  const rawPrompt = intake.style || intake.nonNegotiables?.join(', ');
  if (!rawPrompt) return null;
  const piiCleaned = redactPii(rawPrompt).text;
  const snippet = piiCleaned.length > 36 ? `${piiCleaned.slice(0, 36)}...` : piiCleaned;
  return {
    id: 'custom_decor_style',
    name: `Custom Style: ${snippet}`,
    optimistic: 3,
    mostLikely: 5,
    pessimistic: 8,
    dependsOn: [parentTaskId],
    category: 'decor',
    drivers: ['budget'],
    why: piiCleaned,
    optional: false,
  };
}

function getStarNightNuance(rawPrompt: string, rootId: string): { task?: PlanTask; line?: BudgetLine } {
  if (!/(?:star\s*night|sufi\s*night|artist|celebrity|live\s*band)/i.test(rawPrompt)) return {};
  return {
    task: {
      id: 'nuance_star_rider',
      name: 'Star Night: Artist Tech Rider & Sound NOC',
      optimistic: 5, mostLikely: 8, pessimistic: 14,
      dependsOn: [rootId], category: 'entertainment', drivers: ['budget'],
      why: 'Artist technical rider, sound setup and legal NOC', optional: false,
    },
    line: {
      id: 'b_nuance_star', category: 'entertainment', name: 'Star Night & Artist Rider',
      unit: 'fixed', rateInr: 450000, quantity: 1, drivers: ['budget'],
      notes: 'Artist tech rider, sound setup & NOC',
    },
  };
}

function getCatererNuance(rawPrompt: string, rootId: string): { task?: PlanTask; line?: BudgetLine } {
  if (!/(?:multiple\s*caterer|second\s*caterer|2nd\s*caterer|chaat|live\s*counter|halwai)/i.test(rawPrompt)) return {};
  return {
    task: {
      id: 'nuance_cater_specialty',
      name: 'Multi-Caterer Split: Tasting & Kitchen Zoning',
      optimistic: 3, mostLikely: 5, pessimistic: 9,
      dependsOn: [rootId], category: 'food', drivers: ['guests'],
      why: 'Dual kitchen zoning, tasting signoff & live counters', optional: false,
    },
    line: {
      id: 'b_nuance_cater', category: 'food', name: 'Specialty 2nd Caterer / Live Chaat Counter',
      unit: 'per_head', rateInr: 450, quantity: 1, drivers: ['guests', 'budget'],
      notes: 'Secondary live counters, chaat & dessert halwai',
    },
  };
}

function getBarNuance(rawPrompt: string, rootId: string): { task?: PlanTask; line?: BudgetLine } {
  if (!/(?:craft\s*bar|cocktail|drinks|liquor|excise|mixology|l-?12a)/i.test(rawPrompt)) return {};
  return {
    task: {
      id: 'nuance_bar_excise',
      name: 'Excise Liquor Permit (L-12A) & Craft Bar',
      optimistic: 4, mostLikely: 7, pessimistic: 12,
      dependsOn: [rootId], category: 'permits', drivers: ['date'],
      why: 'State excise liquor permit and mixologist setup', optional: false,
    },
    line: {
      id: 'b_nuance_bar', category: 'food', name: 'Craft Bar, Mixology & Excise Permit',
      unit: 'per_head', rateInr: 650, quantity: 1, drivers: ['guests', 'budget'],
      notes: 'Craft mixology, bar setup & excise permit',
    },
  };
}

function extractNuanceElements(rawPrompt: string, rootId: string): { tasks: PlanTask[]; lines: BudgetLine[] } {
  const helpers = [getStarNightNuance(rawPrompt, rootId), getCatererNuance(rawPrompt, rootId), getBarNuance(rawPrompt, rootId)];
  const tasks = helpers.map((h) => h.task).filter((t): t is PlanTask => t !== undefined);
  const lines = helpers.map((h) => h.line).filter((l): l is BudgetLine => l !== undefined);
  return { tasks, lines };
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

  const categoryLines = buildCategoryLines(venue, decor, media, styleSnippet);
  const venueLine = categoryLines[0] ?? {
    id: 'b_venue',
    category: 'venue',
    name: 'Celebration Venue & Grounds',
    unit: 'fixed',
    rateInr: venue,
    drivers: ['budget'],
  };
  const foodLine: BudgetLine = {
    id: 'b_food',
    category: 'food',
    name: 'Curated Feast & Beverages',
    unit: 'per_head',
    rateInr: perHeadRate,
    quantity: safeGuests,
    drivers: ['guests'],
  };
  return [venueLine, foodLine, ...categoryLines.slice(1)];
}

function resolveTemplate(intake: IntakeInput) {
  if (intake.templateId) {
    const matched = getTemplate(intake.templateId);
    if (matched) return matched;
  }
  const byType = templatesFor(intake.eventType)[0];
  if (byType) return byType;
  const fallback = getTemplate('wedding-phulkari-courtyard');
  if (fallback) return fallback;
  const allTemplates = templatesFor('wedding');
  return allTemplates[0];
}

function resolvePrompt(intake: IntakeInput): string {
  if (intake.style) return intake.style;
  if (intake.nonNegotiables && intake.nonNegotiables.length > 0) {
    return intake.nonNegotiables.join(', ');
  }
  return '';
}

/**
 * Builds an adapted PlanState from user intake parameters, creating a customized CPM DAG task node
 * and scaling the budget with a 10% contingency reserve.
 */
export function buildAdaptedPlanFromIntake(intake: IntakeInput, currentPlan: PlanState): PlanState {
  const template = resolveTemplate(intake);
  const baseTasks = buildTemplateTasks(template);
  const anchorId = baseTasks[0]?.id ?? 'W01';
  const customTask = createCustomTask(intake, anchorId);
  const nuances = extractNuanceElements(resolvePrompt(intake), anchorId);

  const tasks = [...nuances.tasks, ...(customTask ? [customTask] : []), ...baseTasks];
  const styleSnippet = intake.style ? intake.style.slice(0, 24) : undefined;
  const budgetLines = [...nuances.lines, ...buildScaledLines(intake.budgetInr, intake.guests, styleSnippet)];
  const todayIso = new Date().toISOString().slice(0, 10);
  const diffDays = daysBetween(todayIso, intake.date);
  const targetDays = diffDays !== null ? diffDays : currentPlan.targetDays;

  return {
    id: `plan_${intake.eventType}_${intake.city.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    intake,
    tasks,
    budgetLines,
    targetDays: Math.max(30, targetDays),
  };
}
