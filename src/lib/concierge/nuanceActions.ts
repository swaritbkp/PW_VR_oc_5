import type { PlanTask } from '../plan/types';
import { computeSchedule } from '../schedule/cpm';
import type { AgentAction } from './types';

function parseStarNightRate(input: string): number {
  const match = /(?:₹|rs\.?|inr)?\s*([0-9.]+)\s*(?:l|lakh|lacs?)/i.exec(input);
  if (!match) return 450000;
  const num = parseFloat(match[1]);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100000) : 450000;
}

function parseStarNightNuance(input: string, actions: AgentAction[], logs: string[]): void {
  const re = /(?:star\s*night|sufi\s*night|artist\s*(?:rider)?|celebrity\s*(?:dj|artist|performer)|live\s*band)/i;
  if (!re.test(input)) return;
  const rate = parseStarNightRate(input);
  actions.push({
    type: 'add_task',
    name: 'Star Night: Artist Tech Rider & Sound NOC',
    category: 'entertainment',
    critical: true,
    optimistic: 5,
    likely: 8,
    pessimistic: 14,
  });
  logs.push('✓ Added Node -> Star Night: Artist Tech Rider & Sound NOC');
  actions.push({
    type: 'add_budget_line',
    line: {
      id: `nuance_star_${Date.now()}`,
      category: 'entertainment',
      name: 'Star Night & Artist Rider',
      unit: 'fixed',
      rateInr: rate,
      quantity: 1,
      drivers: ['budget'],
      notes: 'Artist tech rider, sound NOC & celebrity performance rider',
    },
  });
  logs.push(`✓ Added Budget Line -> Star Night & Artist Rider (₹${rate.toLocaleString('en-IN')})`);
}

function parseMultiCatererNuance(input: string, actions: AgentAction[], logs: string[]): void {
  const re = /(?:multiple\s*caterer|second\s*caterer|2nd\s*(?:chaat\s*)?caterer|chaat\s*(?:counter)?|live\s*counter|specialty\s*caterer|halwai)/i;
  if (!re.test(input)) return;
  actions.push({
    type: 'add_task',
    name: 'Multi-Caterer Split: Tasting & Kitchen Zoning',
    category: 'food',
    critical: false,
    optimistic: 3,
    likely: 5,
    pessimistic: 9,
  });
  logs.push('✓ Added Node -> Multi-Caterer Split: Tasting & Kitchen Zoning');
  actions.push({
    type: 'add_budget_line',
    line: {
      id: `nuance_cater_${Date.now()}`,
      category: 'food',
      name: 'Specialty 2nd Caterer / Live Chaat Counter',
      unit: 'per_head',
      rateInr: 450,
      quantity: 1,
      drivers: ['guests', 'budget'],
      notes: 'Secondary live counters, regional chaat & dessert halwai zoning',
    },
  });
  logs.push('✓ Added Budget Line -> Specialty 2nd Caterer (₹450/guest)');
}

function parseCraftBarNuance(input: string, actions: AgentAction[], logs: string[]): void {
  const re = /(?:drinks|craft\s*bar|mixology|cocktail\s*bar|liquor\s*permit|excise\s*(?:permit)?|bartender|l-?12a)/i;
  if (!re.test(input)) return;
  actions.push({
    type: 'add_task',
    name: 'Excise Liquor Permit (L-12A) & Craft Bar',
    category: 'permits',
    critical: false,
    optimistic: 4,
    likely: 7,
    pessimistic: 12,
  });
  logs.push('✓ Added Node -> Excise Liquor Permit (L-12A) & Craft Bar');
  actions.push({
    type: 'add_budget_line',
    line: {
      id: `nuance_bar_${Date.now()}`,
      category: 'food',
      name: 'Craft Bar, Mixology & Excise Permit',
      unit: 'per_head',
      rateInr: 650,
      quantity: 1,
      drivers: ['guests', 'budget'],
      notes: 'State excise L-12A liquor permit, mixologists & craft cocktails',
    },
  });
  logs.push('✓ Added Budget Line -> Craft Bar & Mixology (₹650/guest)');
}

/**
 * Parses natural language input for New-Age Indian celebration nuances (Star Night,
 * multi-caterer split, craft bar & liquor permits) and appends tasks and budget items.
 */
export function parseNewAgeNuances(input: string, actions: AgentAction[], logs: string[]): void {
  parseStarNightNuance(input, actions, logs);
  parseMultiCatererNuance(input, actions, logs);
  parseCraftBarNuance(input, actions, logs);
}

/**
 * Validates and sanitizes dependencies of a dynamically injected CPM node, guaranteeing
 * no circular dependencies, self-references, or orphan nodes break the schedule.
 */
export function sanitizeTaskDependencies(
  existingTasks: readonly PlanTask[],
  newTask: PlanTask,
): PlanTask {
  const existingIds = new Set(existingTasks.map((t) => t.id));
  const validDepends = newTask.dependsOn.filter((id) => existingIds.has(id) && id !== newTask.id);
  const fallbackId = existingTasks[0]?.id ?? 'W01';
  const safeDepends = validDepends.length > 0 ? validDepends : [fallbackId];

  const candidate: PlanTask = { ...newTask, dependsOn: safeDepends };
  const scheduleRes = computeSchedule([...existingTasks, candidate]);
  if (!scheduleRes.ok) {
    return { ...candidate, dependsOn: [fallbackId] };
  }
  return candidate;
}
