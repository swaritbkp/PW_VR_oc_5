import type { PlannerCoreOutput } from './schemas';
import type { Language } from '../../lib/plan/schemas';

const URL_PATTERN = /https?:\/\/|www\./i;
const PHONE_PATTERN = /\b(?:\+?91)?[6-9]\d{9}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const COMPANY_PATTERN = /\b(Pvt\.?|Ltd\.?|LLP|Studios|Enterprise|Enterprises|Company|Corp\.?)\b/i;

const SCRIPT_DEVANAGARI = /\p{Script=Devanagari}/u;
const SCRIPT_GURMUKHI = /\p{Script=Gurmukhi}/u;
const MAX_DAYS_LIMIT = 365;

export interface GuardrailResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

/** Checks for banned URLs, phone numbers, emails, or company suffixes. */
export function checkBannedPatterns(text: string): string | null {
  if (URL_PATTERN.test(text)) return 'URL detected in text';
  if (PHONE_PATTERN.test(text)) return 'Phone number detected in text';
  if (EMAIL_PATTERN.test(text)) return 'Email address detected in text';
  if (COMPANY_PATTERN.test(text)) return 'Company suffix detected in text';
  return null;
}

/** Validates duration ordering and cost range non-negativity. */
export function checkNumericSanity(
  tasks: PlannerCoreOutput['tasks'],
  budgetLines: PlannerCoreOutput['budgetLines'],
): string | null {
  for (const t of tasks) {
    if (t.optimistic > t.mostLikely || t.mostLikely > t.pessimistic) {
      return `Task ${t.id} durations invalid: optimistic <= mostLikely <= pessimistic required`;
    }
    if (t.pessimistic > MAX_DAYS_LIMIT) {
      return `Task ${t.id} duration exceeds ${MAX_DAYS_LIMIT} days`;
    }
  }
  for (const b of budgetLines) {
    if (b.rateInr < 0) {
      return `Budget line ${b.id} rate must be non-negative`;
    }
  }
  return null;
}

/** Checks script presence for non-English languages. */
export function checkLanguageScript(text: string, language: Language): boolean {
  if (language === 'hi') return SCRIPT_DEVANAGARI.test(text);
  if (language === 'pa') return SCRIPT_GURMUKHI.test(text);
  return true;
}

interface DagTask {
  id: string;
  dependsOn: readonly string[];
}

function verifyDependencies(tasks: readonly DagTask[]): string | null {
  const ids = new Set(tasks.map((t) => t.id));
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (!ids.has(dep)) return `Missing dependency ${dep} for task ${t.id}`;
    }
  }
  return null;
}

/** Verifies that the task graph is acyclic and reaches the sink. */
export function checkDagOrder(
  tasks: readonly DagTask[],
  sinkId?: string,
): { ok: boolean; error?: string } {
  const depErr = verifyDependencies(tasks);
  if (depErr) return { ok: false, error: depErr };

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  tasks.forEach((t) => {
    inDegree.set(t.id, t.dependsOn.length);
    adj.set(t.id, []);
  });
  tasks.forEach((t) => {
    t.dependsOn.forEach((dep) => adj.get(dep)?.push(t.id));
  });

  const queue = tasks.filter((t) => t.dependsOn.length === 0).map((t) => t.id);
  let visited = 0;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    visited++;
    for (const nxt of adj.get(cur) ?? []) {
      const remaining = (inDegree.get(nxt) ?? 1) - 1;
      inDegree.set(nxt, remaining);
      if (remaining === 0) queue.push(nxt);
    }
  }

  if (visited !== tasks.length) return { ok: false, error: 'Cyclic dependency detected' };
  if (sinkId && !tasks.some((t) => t.id === sinkId)) {
    return { ok: false, error: `Sink ${sinkId} missing from graph` };
  }
  return { ok: true };
}

/** Runs all guardrails over core planner output. */
export function runGuardrails(
  output: PlannerCoreOutput,
  language: Language,
  sinkId?: string,
): GuardrailResult {
  const errors: string[] = [];
  const corpus = [
    ...output.tasks.map((t) => `${t.name} ${t.why}`),
    ...output.budgetLines.map((b) => `${b.name} ${b.notes}`),
  ].join(' ');

  const banned = checkBannedPatterns(corpus);
  if (banned) errors.push(banned);

  const numSanity = checkNumericSanity(output.tasks, output.budgetLines);
  if (numSanity) errors.push(numSanity);

  if (!checkLanguageScript(corpus, language)) {
    errors.push(`Language script check failed for ${language}`);
  }

  const dag = checkDagOrder(output.tasks, sinkId);
  if (!dag.ok && dag.error) errors.push(dag.error);

  return { ok: errors.length === 0, errors };
}
