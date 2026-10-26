import { describe, expect, it } from 'vitest';
import {
  canUndo,
  createVersionStore,
  currentPlan,
  MAX_VERSIONS,
  pushVersion,
  recordVersion,
  undoVersion,
} from './versions';
import type { PlanState } from './propagate';

const samplePlan: PlanState = {
  id: 'plan_1',
  intake: {
    eventType: 'birthday',
    city: 'Ludhiana',
    date: '2026-11-20',
    guests: 50,
    budgetInr: 60000,
    nonNegotiables: [],
    language: 'en',
  },
  tasks: [],
  budgetLines: [],
  targetDays: 20,
};

describe('AC3 plan versioning and undo', () => {
  it('creates version store and restores previous plan exactly upon undo', () => {
    const store = createVersionStore(samplePlan);
    expect(canUndo(store)).toBe(false);

    const changedPlan: PlanState = {
      ...samplePlan,
      intake: { ...samplePlan.intake, guests: 80 },
    };
    const store2 = pushVersion(store, changedPlan, 'Guests increased to 80');
    expect(canUndo(store2)).toBe(true);
    expect(currentPlan(store2).intake.guests).toBe(80);

    const { store: undoneStore, plan: restoredPlan } = undoVersion(store2);
    expect(restoredPlan).not.toBeNull();
    expect(restoredPlan?.intake.guests).toBe(50);
    expect(currentPlan(undoneStore).intake.guests).toBe(50);
    expect(restoredPlan).toBe(samplePlan); // Exact snapshot identity
  });

  it('handles invalid undo or missing parent gracefully', () => {
    const store = createVersionStore(samplePlan);
    const noUndo = undoVersion(store);
    expect(noUndo.plan).toBeNull();

    const brokenStore = {
      versions: [
        { id: 'v1', parentId: 'v_ghost', plan: samplePlan, description: '', timestamp: '' },
      ],
      currentId: 'v1',
    };
    expect(undoVersion(brokenStore).plan).toBeNull();
  });

  it('returns initial plan fallback if currentId is missing', () => {
    const brokenStore = {
      versions: [{ id: 'v1', parentId: null, plan: samplePlan, description: '', timestamp: '' }],
      currentId: 'v_invalid',
    };
    expect(currentPlan(brokenStore)).toBe(samplePlan);
  });

  it('caps history size at MAX_VERSIONS', () => {
    let store = createVersionStore(samplePlan);
    for (let i = 1; i <= 25; i++) {
      const nextPlan: PlanState = {
        ...samplePlan,
        intake: { ...samplePlan.intake, guests: 50 + i },
      };
      store = pushVersion(store, nextPlan, `Iteration ${i}`);
    }
    expect(store.versions.length).toBe(MAX_VERSIONS);
  });

  it('undoes reliably after 25 consecutive recordVersion calls without returning null', () => {
    let store = createVersionStore(samplePlan);
    for (let i = 1; i <= 25; i++) {
      const nextPlan: PlanState = {
        ...samplePlan,
        intake: { ...samplePlan.intake, guests: 100 + i },
      };
      store = recordVersion(store, nextPlan, `Revision ${i}`);
    }
    expect(store.versions.length).toBe(MAX_VERSIONS);
    expect(currentPlan(store).intake.guests).toBe(125);

    const { store: undoneStore, plan: restoredPlan } = undoVersion(store);
    expect(restoredPlan).not.toBeNull();
    expect(restoredPlan?.intake.guests).toBe(124);
    expect(currentPlan(undoneStore).intake.guests).toBe(124);
  });
});
