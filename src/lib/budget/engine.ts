import type { Driver, EventType, TaskCategory } from '../plan/types';

export const DEFAULT_CONTINGENCY_PCT = 10;
export const TIGHT_MARGIN_RATIO = 0.05;
export const INR_TOLERANCE = 1;
export const BUDGET_CUT_FLOOR_RATIO = 0.4;
export const PERCENT_BASE = 100;

export interface BudgetLine {
  readonly id: string;
  readonly category: TaskCategory;
  readonly name: string;
  readonly unit: 'fixed' | 'per_head';
  readonly rateInr: number;
  readonly quantity?: number;
  readonly drivers: readonly Driver[];
  readonly locked?: boolean;
  readonly notes?: string;
}

export interface ComputedBudgetLine extends BudgetLine {
  readonly totalInr: number;
}

export interface AllocationResult {
  readonly lines: readonly ComputedBudgetLine[];
  readonly totalLineSpend: number;
  readonly contingencyInr: number;
  readonly grandTotal: number;
  readonly gapInr: number;
}

export type ReconcileStatus = 'fits' | 'tight' | 'over' | 'under';

export interface ReconcileResult {
  readonly status: ReconcileStatus;
  readonly gapInr: number;
  readonly isWithinBudget: boolean;
  readonly message: string;
}

export interface BandCheckResult {
  readonly category: TaskCategory;
  readonly sharePct: number;
  readonly minPct: number;
  readonly maxPct: number;
  readonly status: 'low' | 'high' | 'ok';
}

export interface BudgetScaleResult {
  readonly lines: readonly BudgetLine[];
  readonly cuts: readonly string[];
}

/** Computes the total INR cost for a single budget line given the guest count. */
export function computeLine(line: BudgetLine, guests: number): number {
  if (line.unit === 'per_head') {
    return Math.round(line.rateInr * guests);
  }
  const qty = line.quantity ?? 1;
  return Math.round(line.rateInr * qty);
}

/**
 * Allocates budget lines, computes contingency, and calculates reconciliation gap.
 */
export function allocate(
  lines: readonly BudgetLine[],
  totalBudgetInr: number,
  guests: number,
  contingencyPct = DEFAULT_CONTINGENCY_PCT,
): AllocationResult {
  const computed = lines.map((l) => ({
    ...l,
    totalInr: computeLine(l, guests),
  }));
  const totalLineSpend = computed.reduce((sum, l) => sum + l.totalInr, 0);
  const contingencyInr = Math.round((totalLineSpend * contingencyPct) / PERCENT_BASE);
  const grandTotal = totalLineSpend + contingencyInr;
  const gapInr = totalBudgetInr - grandTotal;

  return { lines: computed, totalLineSpend, contingencyInr, grandTotal, gapInr };
}

/** Reconciles allocated budget against total target within INR 1. */
export function reconcile(allocated: AllocationResult): ReconcileResult {
  const gap = allocated.gapInr;
  const budget = allocated.grandTotal + gap;
  if (Math.abs(gap) <= INR_TOLERANCE) {
    return {
      status: 'fits',
      gapInr: gap,
      isWithinBudget: true,
      message: 'Budget balances exactly.',
    };
  }
  if (gap > 0) {
    return {
      status: 'under',
      gapInr: gap,
      isWithinBudget: true,
      message: `Under budget by ₹${gap}.`,
    };
  }
  const tightThreshold = -Math.round(budget * TIGHT_MARGIN_RATIO);
  if (gap >= tightThreshold) {
    return {
      status: 'tight',
      gapInr: gap,
      isWithinBudget: false,
      message: `Tight budget: ₹${Math.abs(gap)} over.`,
    };
  }
  return {
    status: 'over',
    gapInr: gap,
    isWithinBudget: false,
    message: `Exceeds budget by ₹${Math.abs(gap)}.`,
  };
}

const CATEGORY_BANDS: Record<EventType, Partial<Record<TaskCategory, [number, number]>>> = {
  wedding: {
    venue: [10, 15],
    food: [28, 38],
    decor: [8, 12],
    media: [6, 10],
    attire: [10, 15],
    entertainment: [3, 6],
    invites: [2, 4],
    logistics: [4, 8],
    planning: [2, 3],
  },
  birthday: {
    venue: [45, 55],
    food: [45, 55],
    decor: [10, 15],
    entertainment: [10, 15],
    media: [3, 5],
  },
  community: {
    food: [25, 35],
    decor: [15, 20],
    entertainment: [10, 15],
    permits: [8, 12],
    invites: [3, 5],
  },
};

/** Checks category expenditure shares against domain heuristics. */
export function bandCheck(
  lines: readonly ComputedBudgetLine[],
  eventType: EventType,
): readonly BandCheckResult[] {
  const totalSpend = lines.reduce((sum, l) => sum + l.totalInr, 0);
  if (totalSpend === 0) return [];
  const bands = CATEGORY_BANDS[eventType];
  const catTotals = new Map<TaskCategory, number>();
  for (const l of lines) {
    catTotals.set(l.category, (catTotals.get(l.category) ?? 0) + l.totalInr);
  }
  const results: BandCheckResult[] = [];
  for (const [cat, range] of Object.entries(bands) as [TaskCategory, [number, number]][]) {
    const spend = catTotals.get(cat) ?? 0;
    const sharePct = Math.round((spend / totalSpend) * PERCENT_BASE);
    const [minPct, maxPct] = range;
    const status = sharePct < minPct ? 'low' : sharePct > maxPct ? 'high' : 'ok';
    results.push({ category: cat, sharePct, minPct, maxPct, status });
  }
  return results;
}

/** Rescales per-head budget lines when guest count changes. */
export function scaleForGuests(
  lines: readonly BudgetLine[],
  newGuests: number,
  oldGuests: number,
): readonly BudgetLine[] {
  if (oldGuests === 0) return lines;
  const ratio = newGuests / oldGuests;
  return lines.map((line) => {
    if (line.unit !== 'per_head') return line;
    return { ...line, rateInr: Math.round(line.rateInr * ratio) };
  });
}

/** Rescales unlocked budget lines proportionally when total budget changes. */
export function scaleForBudget(
  lines: readonly BudgetLine[],
  targetSpendInr: number,
  currentSpendInr: number,
): BudgetScaleResult {
  if (currentSpendInr <= 0) return { lines, cuts: [] };
  const rawRatio = targetSpendInr / currentSpendInr;
  const ratio = Math.max(BUDGET_CUT_FLOOR_RATIO, rawRatio);
  const cuts: string[] = [];
  const updated = lines.map((line) => {
    if (line.locked) return line;
    const newRate = Math.round(line.rateInr * ratio);
    if (newRate < line.rateInr) {
      cuts.push(`${line.name} cut from ₹${line.rateInr} to ₹${newRate}`);
    }
    return { ...line, rateInr: newRate };
  });
  return { lines: updated, cuts };
}
