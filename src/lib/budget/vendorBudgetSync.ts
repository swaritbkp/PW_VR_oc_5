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
};

/**
 * Maps vendor category string to a valid celebration TaskCategory without type assertions.
 */
export function toBudgetCategory(cat: string): TaskCategory {
  return VENDOR_CATEGORY_MAP[cat] ?? 'entertainment';
}

/**
 * Synchronizes custom vendor quote into the active celebration budget lines,
 * locking the negotiated rate and updating or inserting the vendor line item.
 */
export function syncVendorQuoteToBudget(
  lines: readonly BudgetLine[],
  quote: VendorQuoteInput,
): readonly BudgetLine[] {
  const normVendor = quote.vendorName.toLowerCase();
  const targetCat = toBudgetCategory(quote.category);

  const matchIdx = lines.findIndex(
    (l) => l.name.toLowerCase().includes(normVendor) || l.category === targetCat,
  );

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
