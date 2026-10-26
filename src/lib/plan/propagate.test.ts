import { describe, expect, it } from 'vitest';
import { computeSchedule } from '../schedule/cpm';
import { propagate, rankCrunchOptions, type PlanState } from './propagate';
import type { PlanTask } from './types';

const baseTasks: PlanTask[] = [
  {
    id: 'T01',
    name: 'Book Hall',
    optimistic: 5,
    mostLikely: 10,
    pessimistic: 15,
    dependsOn: [],
    category: 'venue',
    drivers: ['budget', 'date'],
    why: 'Venue',
  },
  {
    id: 'T02',
    name: 'Design Menu',
    optimistic: 2,
    mostLikely: 4,
    pessimistic: 6,
    dependsOn: ['T01'],
    category: 'food',
    drivers: ['guests'],
    why: 'Menu',
  },
  {
    id: 'T03',
    name: 'Print Cards',
    optimistic: 3,
    mostLikely: 6,
    pessimistic: 9,
    dependsOn: ['T01'],
    category: 'invites',
    drivers: ['guests'],
    optional: true,
    why: 'Cards',
  },
  {
    id: 'T04',
    name: 'Coordinate City Logistics',
    optimistic: 1,
    mostLikely: 2,
    pessimistic: 3,
    dependsOn: ['T01'],
    category: 'logistics',
    drivers: ['city'],
    why: 'City',
  },
];

const samplePlan: PlanState = {
  id: 'plan_1',
  intake: {
    eventType: 'wedding',
    city: 'Chandigarh',
    date: '2026-12-31',
    guests: 200,
    budgetInr: 2000000,
    nonNegotiables: [],
    language: 'en',
  },
  tasks: baseTasks,
  budgetLines: [
    {
      id: 'B01',
      category: 'venue',
      name: 'Venue Rental',
      unit: 'fixed',
      rateInr: 500000,
      drivers: ['budget'],
      locked: true,
    },
    {
      id: 'B02',
      category: 'food',
      name: 'Food per head',
      unit: 'per_head',
      rateInr: 1500,
      drivers: ['guests', 'budget'],
    },
  ],
  targetDays: 60,
};

describe('AC3 change propagation', () => {
  it('touches only dirty tasks and lines whose drivers match the changed field', () => {
    const res = propagate(samplePlan, { kind: 'guests', guests: 300 });

    expect(res.dirtyIds).toContain('B02');
    expect(res.dirtyIds).toContain('T02');
    expect(res.dirtyIds).toContain('T03');
    expect(res.dirtyIds).not.toContain('B01'); // Venue rental is locked and driven by budget only

    // Untouched nodes preserve exact reference/values
    expect(res.plan.budgetLines[0]).toBe(samplePlan.budgetLines[0]);
    expect(res.plan.tasks[0]).toBe(samplePlan.tasks[0]);
    expect(res.diff.length).toBeGreaterThan(0);
  });

  it('keeps locked budget lines fixed during budget changes', () => {
    const res = propagate(samplePlan, { kind: 'budget', budgetInr: 1500000 });
    expect(res.plan.budgetLines[0].rateInr).toBe(500000); // locked line preserved
    expect(res.dirtyIds).toContain('B02');
  });

  it('propagates date changes and updates target days', () => {
    const res = propagate(samplePlan, { kind: 'date', date: '2026-11-30' });
    expect(res.plan.intake.date).toBe('2026-11-30');
    expect(res.dirtyIds).toContain('T01');
    expect(res.diff[0]).toContain('Date moved to 2026-11-30');
  });

  it('updates guest quantity on per-head lines without rate explosion', () => {
    const res = propagate(samplePlan, { kind: 'guests', guests: 500 });
    const foodLine = res.plan.budgetLines.find((b) => b.id === 'B02');
    expect(foodLine?.quantity).toBe(500);
    expect(foodLine?.rateInr).toBe(1500); // Unit rate remains realistic
  });

  it('propagates city changes and updates relevant logistics nodes', () => {
    const res = propagate(samplePlan, { kind: 'city', city: 'Amritsar' });
    expect(res.plan.intake.city).toBe('Amritsar');
    expect(res.dirtyIds).toContain('T04');
    expect(res.diff[0]).toBe('City changed to Amritsar');
  });

  it('AC3 propagates task estimate updates and marks downstream dependents as dirty', () => {
    const res = propagate(samplePlan, {
      kind: 'task',
      taskId: 'T01',
      updates: { optimistic: 7, mostLikely: 12, pessimistic: 18, name: 'Book Royal Palace' },
    });
    expect(res.dirtyIds).toContain('T01');
    expect(res.dirtyIds).toContain('T02');
    expect(res.dirtyIds).toContain('T03');
    expect(res.dirtyIds).toContain('T04');
    const updatedT01 = res.plan.tasks.find((t) => t.id === 'T01');
    expect(updatedT01?.name).toBe('Book Royal Palace');
    expect(updatedT01?.optimistic).toBe(7);
    expect(updatedT01?.mostLikely).toBe(12);
    expect(updatedT01?.pessimistic).toBe(18);
    expect(res.diff[0]).toContain('Updated task T01: Book Royal Palace');
  });
});

describe('AC4 crunch mode ranking', () => {
  it('calculates shortfallDays and ranks drop/compress options when schedule is crunched', () => {
    const schedRes = computeSchedule(baseTasks);
    expect(schedRes.ok).toBe(true);
    if (!schedRes.ok) return;

    const crunch = rankCrunchOptions(schedRes.value, baseTasks, 5);
    expect(crunch.isCrunch).toBe(true);
    expect(crunch.shortfallDays).toBeGreaterThan(0);
    expect(crunch.options.length).toBeGreaterThan(0);

    const dropOption = crunch.options.find((o) => o.action === 'drop');
    expect(dropOption?.taskId).toBe('T03');

    const compressOption = crunch.options.find((o) => o.action === 'compress');
    expect(compressOption).toBeDefined();
  });

  it('reports no crunch when available days exceed schedule duration', () => {
    const schedRes = computeSchedule(baseTasks);
    expect(schedRes.ok).toBe(true);
    if (!schedRes.ok) return;

    const crunch = rankCrunchOptions(schedRes.value, baseTasks, 100);
    expect(crunch.isCrunch).toBe(false);
    expect(crunch.shortfallDays).toBe(0);
    expect(crunch.options).toHaveLength(0);
  });
});
