import type { PlanTask, TaskCategory } from '../plan/types';
import { runGuardrailPipeline, BOUNDS_LIMITS } from '../security/guardrails';
import type { AgentAction, ParsedAgentCommand } from './types';
import { parseNewAgeNuances, sanitizeTaskDependencies } from './nuanceActions';

export type { AgentAction, ParsedAgentCommand };
export { sanitizeTaskDependencies };

interface ParsedNumberResult<T> {
  readonly action?: T;
  readonly log?: string;
  readonly outOfBounds?: boolean;
  readonly val?: number;
}

function parseGuestsAction(input: string): ParsedNumberResult<AgentAction> | null {
  const match = /(?:scale|set|change|update|guests?|to)\s*(-?\d+)\s*guests?/i.exec(input)
    ?? /(?:guest\s*count\s*(?:to|=)?\s*)(-?\d+)/i.exec(input)
    ?? /(?:scale\s+(?:to\s+)?|to\s+)(-?\d+)\s*guests/i.exec(input);
  if (!match) return null;
  const count = parseInt(match[1], 10);
  if (count < BOUNDS_LIMITS.minGuests || count > BOUNDS_LIMITS.maxGuests) {
    return { outOfBounds: true, val: count };
  }
  return { action: { type: 'mutate_guests', guests: count }, log: `✓ Updated Guests -> ${count}` };
}

function parseBudgetAction(input: string): ParsedNumberResult<AgentAction> | null {
  const match = /(?:set\s+|scale\s+|update\s+|change\s+)?(?:the\s+)?budget\s*(?:to|=|\s:?)\s*(?:₹|rs\.?|inr)?\s*(-?\d[\d,]*)/i.exec(input);
  if (!match) return null;
  const amount = parseInt(match[1].replace(/,/g, ''), 10);
  if (amount < BOUNDS_LIMITS.minBudgetInr || amount > BOUNDS_LIMITS.maxBudgetInr) {
    return { outOfBounds: true, val: amount };
  }
  return { action: { type: 'mutate_budget', budgetInr: amount }, log: `✓ Updated Budget -> ₹${amount.toLocaleString('en-IN')}` };
}

function parseTaskAction(input: string): { action: AgentAction; log: string } | null {
  const match = /(?:add|create|insert|inject)\s+(?:a\s+)?(?:task\s+)?["']?([^,"']+?)["']?\s*(?:to\s+(?:the\s+)?critical\s+path|task)?(?:\s*,\s*|\s+and\s+|$)/i.exec(input);
  if (!match) return null;
  const rawName = match[1].trim().replace(/(?:task|to the critical path)$/i, '').trim();
  if (!rawName || rawName.length < 3) return null;
  // If the command already specifically represents one of our celebration nuances, skip duplicate
  if (/(?:star\s*night|artist|sufi|caterer|chaat|craft\s*bar|cocktail|excise|liquor|firework|pyro|showstopper|weather)/i.test(rawName)) {
    return null;
  }
  return {
    action: { type: 'add_task', name: rawName, critical: true, category: 'entertainment' },
    log: `✓ Added Node -> ${rawName}`,
  };
}

function parseTabAction(input: string): { action: AgentAction; log: string } | null {
  if (/(?:jump|switch|navigate|go|view|show)\s*(?:to\s*)?(?:the\s*)?(?:cpm|event\s*graph|graph|dag|network)/i.test(input) || /cpm\s*event\s*graph/i.test(input)) {
    return { action: { type: 'navigate_tab', tab: 'graph' }, log: '✓ Navigated -> CPM Graph' };
  }
  if (/(?:vendors?|find\s*vendors?|places)/i.test(input)) {
    return { action: { type: 'navigate_tab', tab: 'vendors' }, log: '✓ Navigated -> Vendor Explorer' };
  }
  if (/(?:roadmap|timeline\s*list)/i.test(input)) {
    return { action: { type: 'navigate_tab', tab: 'roadmap' }, log: '✓ Navigated -> Roadmap' };
  }
  return null;
}

function parseModalAction(input: string): { action: AgentAction; log: string } | null {
  if (/(?:chaos\s*monkey|disruption|delay)/i.test(input)) {
    return { action: { type: 'open_modal', modal: 'chaos' }, log: '✓ Opened -> Chaos Monkey' };
  }
  if (/(?:red-?flag|contract|predatory)/i.test(input)) {
    return { action: { type: 'open_modal', modal: 'redflags' }, log: '✓ Opened -> Contract Red-Flag Scanner' };
  }
  if (/(?:negotiat|coach|bargain)/i.test(input)) {
    return { action: { type: 'open_modal', modal: 'negotiate' }, log: '✓ Opened -> Negotiation Coach' };
  }
  if (/(?:what-?if|sliders)/i.test(input)) {
    return { action: { type: 'open_modal', modal: 'whatif' }, log: '✓ Opened -> What-If Sliders' };
  }
  if (/(?:templates?|intake)/i.test(input)) {
    return { action: { type: 'open_modal', modal: 'templates' }, log: '✓ Opened -> Template Gallery' };
  }
  if (/(?:dossier|executive\s*summary)/i.test(input)) {
    return { action: { type: 'open_modal', modal: 'dossier' }, log: '✓ Opened -> Executive Dossier' };
  }
  return null;
}

function checkSafetyPipeline(input: string): ParsedAgentCommand | null {
  const guard = runGuardrailPipeline(input);
  if (guard.isInjection) {
    return {
      reply: '🛡️ AI Guardrail Intercepted: Adversarial prompt injection or instruction override blocked. System security maintained.',
      actions: [],
      executionLog: ['🛡️ Injection Attempt Blocked'],
      guardrailBlocked: true,
      guardrailReason: 'Prompt Injection / Adversarial Override',
    };
  }
  if (guard.isUnsafe) {
    return {
      reply: '🛡️ AI Guardrail Intercepted: Off-topic or unsafe request blocked. Jashn Copilot only processes celebration event planning workflows.',
      actions: [],
      executionLog: ['🛡️ Unsafe Content Blocked'],
      guardrailBlocked: true,
      guardrailReason: 'Off-Topic / Unsafe Request',
    };
  }
  return null;
}

function checkBoundsViolations(
  g: ParsedNumberResult<AgentAction> | null,
  b: ParsedNumberResult<AgentAction> | null,
): ParsedAgentCommand | null {
  if (g?.outOfBounds) {
    return {
      reply: `🛡️ AI Guardrail Intercepted: Guest count (${g.val}) is out of domain bounds (1 to 5,000). Action rejected.`,
      actions: [],
      executionLog: ['🛡️ Out-of-Bounds Numbers Blocked'],
      guardrailBlocked: true,
      guardrailReason: 'Guest count out of bounds',
    };
  }
  if (b?.outOfBounds) {
    return {
      reply: `🛡️ AI Guardrail Intercepted: Budget amount is out of domain bounds (₹1,000 to ₹50 Crore). Action rejected.`,
      actions: [],
      executionLog: ['🛡️ Out-of-Bounds Numbers Blocked'],
      guardrailBlocked: true,
      guardrailReason: 'Budget out of bounds',
    };
  }
  return null;
}

function pushParsedAction(
  item: { readonly action: AgentAction; readonly log: string } | null,
  actions: AgentAction[],
  logs: string[],
): void {
  if (!item) return;
  actions.push(item.action);
  logs.push(item.log);
}

function pushNumberAction(
  item: ParsedNumberResult<AgentAction> | null,
  actions: AgentAction[],
  logs: string[],
): void {
  if (!item?.action || !item.log) return;
  actions.push(item.action);
  logs.push(item.log);
}

function parseCommandActions(cleanText: string, piiRedacted: boolean): ParsedAgentCommand {
  const g = parseGuestsAction(cleanText);
  const b = parseBudgetAction(cleanText);
  const boundsErr = checkBoundsViolations(g, b);
  if (boundsErr) return boundsErr;

  const actions: AgentAction[] = [];
  const executionLog: string[] = [];
  if (piiRedacted) executionLog.push('🛡️ PII Auto-Redacted');
  pushNumberAction(g, actions, executionLog);
  pushNumberAction(b, actions, executionLog);
  parseNewAgeNuances(cleanText, actions, executionLog);
  pushParsedAction(parseTaskAction(cleanText), actions, executionLog);
  pushParsedAction(parseTabAction(cleanText), actions, executionLog);
  pushParsedAction(parseModalAction(cleanText), actions, executionLog);

  const reply = executionLog.length > 0
    ? `Executed: ${executionLog.map((l) => l.replace('✓ ', '').replace('🛡️ ', '')).join(', ')}. Living event plan updated live.`
    : "I'm your Jashn AI Copilot. Ask me to scale guests, budget, add critical tasks, or jump to any workspace view!";

  return { reply, actions, executionLog, piiRedacted };
}

/**
 * Deterministically parses natural language commands to extract state mutation
 * and UI navigation actions for the Jashn Agentic Copilot, guarded by safety checks.
 */
export function parseAgentCommand(input: string): ParsedAgentCommand {
  const blocked = checkSafetyPipeline(input);
  if (blocked) return blocked;

  const guard = runGuardrailPipeline(input);
  return parseCommandActions(guard.sanitizedText, guard.hasPii);
}

export interface AgentTaskOptions {
  readonly dependsOnId?: string;
  readonly category?: TaskCategory;
  readonly optimistic?: number;
  readonly mostLikely?: number;
  readonly pessimistic?: number;
}

/**
 * Creates a new PlanTask ready for insertion into the CPM Event Graph.
 */
export function createAgentTask(name: string, options?: AgentTaskOptions | string): PlanTask {
  const opts: AgentTaskOptions = typeof options === 'string' ? { dependsOnId: options } : (options ?? {});
  const dependsOnId = opts.dependsOnId ?? 'W01';
  return {
    id: `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    optimistic: opts.optimistic ?? 2,
    mostLikely: opts.mostLikely ?? 4,
    pessimistic: opts.pessimistic ?? 6,
    dependsOn: [dependsOnId],
    category: opts.category ?? 'entertainment',
    drivers: ['date'],
    why: 'Autonomous AI Copilot living plan injection',
    optional: false,
  };
}
