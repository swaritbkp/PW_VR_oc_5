import { describe, expect, it } from 'vitest';
import { syncVendorQuoteToBudget, toBudgetCategory } from './vendorBudgetSync';
import type { BudgetLine } from './engine';

describe('Vendor Budget Sync & Negotiation Locking', () => {
  const initialLines: readonly BudgetLine[] = [
    {
      id: 'b_venue',
      category: 'venue',
      name: 'Celebration Venue',
      unit: 'fixed',
      rateInr: 500000,
      drivers: ['budget'],
    },
    {
      id: 'b_cater',
      category: 'food',
      name: 'Royal Catering',
      unit: 'per_head',
      rateInr: 1500,
      drivers: ['guests'],
    },
  ];

  it('updates existing category line item with negotiated quote and marks locked', () => {
    const updated = syncVendorQuoteToBudget(initialLines, {
      vendorName: 'Taj Swarna',
      category: 'venue',
      quoteInr: 420000,
    });

    const venue = updated.find((l) => l.category === 'venue');
    expect(venue).toBeDefined();
    expect(venue?.rateInr).toBe(420000);
    expect(venue?.locked).toBe(true);
    expect(venue?.notes).toContain('Taj Swarna');
  });

  it('appends a new locked line item when category does not exist in ledger', () => {
    const updated = syncVendorQuoteToBudget(initialLines, {
      vendorName: 'DJ Shadow Dubai',
      category: 'music',
      quoteInr: 250000,
    });

    expect(updated).toHaveLength(3);
    const djLine = updated.find((l) => l.name.includes('DJ Shadow Dubai'));
    expect(djLine).toBeDefined();
    expect(djLine?.category).toBe('entertainment');
    expect(djLine?.rateInr).toBe(250000);
    expect(djLine?.locked).toBe(true);
  });

  it('correctly maps vendor need categories to budget task categories', () => {
    expect(toBudgetCategory('caterer')).toBe('food');
    expect(toBudgetCategory('decorator')).toBe('decor');
    expect(toBudgetCategory('photographer')).toBe('media');
    expect(toBudgetCategory('venue')).toBe('venue');
    expect(toBudgetCategory('music')).toBe('entertainment');
  });
});
