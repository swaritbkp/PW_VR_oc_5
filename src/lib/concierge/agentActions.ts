import type { PlanTask, TaskCategory } from '../plan/types';

export type AgentAction =
  | { readonly type: 'mutate_guests'; readonly guests: number }
  | { readonly type: 'mutate_budget'; readonly budgetInr: number }
  | {
      readonly type: 'add_task';
      readonly name: string;
      readonly days?: number;
      readonly critical?: boolean;
      readonly category?: TaskCategory;
    }
  | { readonly type: 'navigate_tab'; readonly tab: 'roadmap' | 'vendors' | 'graph' }
  | {
      readonly type: 'open_modal';
      readonly modal:
        | 'chaos'
        | 'redflags'
        | 'negotiate'
        | 'whatif'
        | 'templates'
        | 'dossier'
        | 'budget';
    }
  | { readonly type: 'set_city'; readonly city: string };

export interface ParsedAgentCommand {
  readonly reply: string;
  readonly actions: readonly AgentAction[];
  readonly executionLog: readonly string[];
}

function parseGuestsAction(input: string): { action: AgentAction; log: string } | null {
  const match = /(?:scale|set|change|update|guests?|to)\s*(\d{2,5})\s*guests?/i.exec(input)
    ?? /(?:guest\s*count\s*(?:to|=)?\s*)(\d{2,5})/i.exec(input)
    ?? /(?:scale\s+(?:to\s+)?|to\s+)(\d{2,5})\s*guests/i.exec(input);
  if (!match) return null;
  const guests = Math.max(1, parseInt(match[1], 10));
  return {
    action: { type: 'mutate_guests', guests },
    log: `✓ Updated Guests -> ${guests}`,
  };
}

function parseBudgetAction(input: string): { action: AgentAction; log: string } | null {
  const match = /(?:budget|₹|rs\.?|inr)\s*(?:to|=)?\s*(\d[\d,]*)/i.exec(input);
  if (!match) return null;
  const rawNum = match[1].replace(/,/g, '');
  const budgetInr = Math.max(1000, parseInt(rawNum, 10));
  return {
    action: { type: 'mutate_budget', budgetInr },
    log: `✓ Updated Budget -> ₹${budgetInr.toLocaleString('en-IN')}`,
  };
}

function parseTaskAction(input: string): { action: AgentAction; log: string } | null {
  const match = /(?:add|create|insert|inject)\s+(?:a\s+)?(?:task\s+)?["']?([^,"']+?)["']?\s*(?:to\s+(?:the\s+)?critical\s+path|task)?(?:\s*,\s*|\s+and\s+|$)/i.exec(input);
  if (!match) return null;
  const rawName = match[1].trim().replace(/(?:task|to the critical path)$/i, '').trim();
  if (!rawName || rawName.length < 3) return null;
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

/**
 * Deterministically parses natural language commands to extract state mutation
 * and UI navigation actions for the Jashn Agentic Copilot.
 */
export function parseAgentCommand(input: string): ParsedAgentCommand {
  const actions: AgentAction[] = [];
  const executionLog: string[] = [];

  const g = parseGuestsAction(input);
  if (g) { actions.push(g.action); executionLog.push(g.log); }

  const b = parseBudgetAction(input);
  if (b) { actions.push(b.action); executionLog.push(b.log); }

  const t = parseTaskAction(input);
  if (t) { actions.push(t.action); executionLog.push(t.log); }

  const tab = parseTabAction(input);
  if (tab) { actions.push(tab.action); executionLog.push(tab.log); }

  const m = parseModalAction(input);
  if (m) { actions.push(m.action); executionLog.push(m.log); }

  const reply = executionLog.length > 0
    ? `Executed: ${executionLog.map((l) => l.replace('✓ ', '')).join(', ')}. Living event plan updated live.`
    : "I'm your Jashn AI Copilot. Ask me to scale guests, budget, add critical tasks, or jump to any workspace view!";

  return { reply, actions, executionLog };
}

/**
 * Creates a new PlanTask ready for insertion into the CPM Event Graph.
 */
export function createAgentTask(name: string, dependsOnId = 'W01'): PlanTask {
  return {
    id: `agent_${Date.now().toString(36)}`,
    name,
    optimistic: 2,
    mostLikely: 4,
    pessimistic: 6,
    dependsOn: [dependsOnId],
    category: 'entertainment',
    drivers: ['date'],
    why: 'Autonomous AI Copilot living plan injection',
    optional: false,
  };
}
