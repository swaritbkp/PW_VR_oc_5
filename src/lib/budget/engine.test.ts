import { describe, expect, it } from 'vitest';
import {
  allocate,
  bandCheck,
  computeLine,
  reconcile,
  scaleForBudget,
  scaleForGuests,
  type BudgetLine,
} from './engine';

const sampleLines: BudgetLine[] = [
  {
    id: 'b1',
    category: 'venue',
    name: 'Banquet Hall',
    unit: 'fixed',
    rateInr: 250000,
    drivers: ['budget'],
  },
  {
    id: 'b2',
    category: 'food',
    name: 'Catering per head',
    unit: 'per_head',
    rateInr: 1200,
    drivers: ['guests', 'budget'],
  },
  {
    id: 'b3',
    category: 'decor',
    name: 'Stage Floral',
    unit: 'fixed',
    rateInr: 80000,
    drivers: ['budget'],
    locked: true,
  },
];

describe('AC1 budget engine', () => {
  it('computes line totals correctly for fixed and per_head lines', () => {
    expect(computeLine(sampleLines[0], 100)).toBe(250000);
    expect(computeLine(sampleLines[1], 100)).toBe(120000);
  });

  it('allocates budget and calculates contingency accurately', () => {
    const allocated = allocate(sampleLines, 500000, 100, 10);
    expect(allocated.totalLineSpend).toBe(250000 + 120000 + 80000); // 450,000
    expect(allocated.contingencyInr).toBe(45000); // 10% of 450,000
    expect(allocated.grandTotal).toBe(495000);
    expect(allocated.gapInr).toBe(5000);
  });

  it('reconciles totals within INR 1 and classifies status (fits, tight, over, under)', () => {
    const exact = allocate(sampleLines, 495000, 100, 10);
    expect(reconcile(exact)).toMatchObject({ status: 'fits', gapInr: 0, isWithinBudget: true });

    const under = allocate(sampleLines, 520000, 100, 10);
    expect(reconcile(under)).toMatchObject({ status: 'under', isWithinBudget: true });

    const tight = allocate(sampleLines, 480000, 100, 10); // gap -15,000 <= 5% of 495,000 (24,750)
    expect(reconcile(tight)).toMatchObject({ status: 'tight', isWithinBudget: false });

    const over = allocate(sampleLines, 400000, 100, 10);
    expect(reconcile(over)).toMatchObject({ status: 'over', isWithinBudget: false });
  });

  it('checks category share bands and flags out-of-band allocations', () => {
    const allocated = allocate(sampleLines, 500000, 100, 10);
    const bands = bandCheck(allocated.lines, 'wedding');
    expect(bands.length).toBeGreaterThan(0);
    const venueBand = bands.find((b) => b.category === 'venue');
    expect(venueBand).toBeDefined();
  });

  it('scales per_head lines proportionally when guests change', () => {
    const scaled = scaleForGuests(sampleLines, 150, 100);
    expect(scaled[0].rateInr).toBe(250000); // fixed
    expect(scaled[1].rateInr).toBe(1800); // 1200 * 1.5
    expect(scaled[2].rateInr).toBe(80000); // fixed
  });

  it('scales budget cuts proportionally while protecting locked lines with 40% floor', () => {
    const scaled = scaleForBudget(sampleLines, 200000, 450000);
    expect(scaled.lines[2].rateInr).toBe(80000); // locked line preserved
    expect(scaled.lines[0].rateInr).toBeLessThan(250000);
    expect(scaled.cuts.length).toBeGreaterThan(0);
  });
});
