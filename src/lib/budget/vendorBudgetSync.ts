import type { BudgetLine } from './engine';
import type { TaskCategory } from '../plan/types';

export interface VendorQuoteInput {
  readonly vendorName: string;
  readonly category: string;
  readonly quoteInr: number;
}

const VENDOR_CATEGORY_MAP: Readonly<Record<string, TaskCategory>> = {
  venue: 'venue',
  food: 'food',
  caterer: 'food',
  decor: 'decor',
  decorator: 'decor',
  media: 'media',
  photographer: 'media',
  permits: 'permits',
  music: 'entertainment',
  entertainment: 'entertainment',
};

/**
 * Maps vendor category string to a valid celebration TaskCategory without type assertions.
 */
export function toBudgetCategory(cat: string): TaskCategory {
  return VENDOR_CATEGORY_MAP[cat] ?? 'entertainment';
}

const EXCLUDED_PATTERNS: readonly string[] = ['star night', 'firework', 'weather proof'];
const BASE_PATTERNS: readonly string[] = ['venue', 'feast', 'catering', 'styling', 'photo'];

function isBaseCategoryLine(name: string, category: string): boolean {
  const norm = name.toLowerCase();
  if (EXCLUDED_PATTERNS.some((p) => norm.includes(p))) {
    return false;
  }
  return norm.includes(category) || BASE_PATTERNS.some((p) => norm.includes(p));
}

/**
 * Synchronizes custom vendor quote into the active celebration budget lines,
 * locking the negotiated rate and updating or inserting the vendor line item
 * without overwriting custom lines like Star Night or Fireworks.
 */
export function syncVendorQuoteToBudget(
  lines: readonly BudgetLine[],
  quote: VendorQuoteInput,
): readonly BudgetLine[] {
  const normVendor = quote.vendorName.toLowerCase();
  const targetCat = toBudgetCategory(quote.category);

  let matchIdx = lines.findIndex((l) => l.name.toLowerCase().includes(normVendor));
  if (matchIdx < 0) {
    matchIdx = lines.findIndex((l) => l.category === targetCat && isBaseCategoryLine(l.name, targetCat));
  }

  if (matchIdx >= 0) {
    return lines.map((l, idx) =>
      idx === matchIdx
        ? {
            ...l,
            rateInr: quote.quoteInr,
            unit: 'fixed',
            locked: true,
            notes: `Locked custom quote for ${quote.vendorName}: ₹${quote.quoteInr.toLocaleString('en-IN')}`,
          }
        : l,
    );
  }

  const newLine: BudgetLine = {
    id: `vendor_${Date.now()}`,
    category: targetCat,
    name: `${quote.vendorName} (${quote.category})`,
    unit: 'fixed',
    rateInr: quote.quoteInr,
    quantity: 1,
    locked: true,
    drivers: ['budget'],
    notes: `Locked custom vendor quote: ₹${quote.quoteInr.toLocaleString('en-IN')}`,
  };

  return [...lines, newLine];
}
