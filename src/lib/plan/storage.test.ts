import { describe, expect, it } from 'vitest';
import {
  deserializePlan,
  loadPlanFromStorage,
  savePlanToStorage,
  serializePlan,
  type StorageBackend,
} from './storage';
import type { StoredPlan } from './schemas';

const sampleStoredPlan: StoredPlan = {
  id: 'plan_storage_test',
  version: 1,
  intake: {
    eventType: 'wedding',
    city: 'Chandigarh',
    date: '2026-12-14',
    guests: 300,
    budgetInr: 2500000,
    nonNegotiables: [],
    language: 'en',
  },
  tasks: [
    {
      id: 'T1',
      name: 'Book Venue',
      optimistic: 3,
      mostLikely: 5,
      pessimistic: 10,
      dependsOn: [],
      category: 'venue',
      drivers: ['budget'],
      why: 'Venue',
    },
  ],
  budgetLines: [
    {
      id: 'B1',
      category: 'venue',
      name: 'Hall',
      unit: 'fixed',
      rateInr: 300000,
      drivers: ['budget'],
    },
  ],
  vendorSelections: [
    {
      placeId: 'ChIJ_abc123',
      need: 'venue',
      status: 'shortlisted',
      quoteInr: 280000,
      note: 'Checked lawn',
    },
  ],
  updatedAt: '2026-10-24T12:00:00.000Z',
};

class MemoryStorage implements StorageBackend {
  private store = new Map<string, string>();
  private shouldThrow = false;

  setThrow(val: boolean) {
    this.shouldThrow = val;
  }

  getItem(key: string): string | null {
    if (this.shouldThrow) throw new Error('Simulated read error');
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.shouldThrow) throw new Error('Simulated write error');
    this.store.set(key, value);
  }
}

describe('AC30 storage persistence', () => {
  it('serializes and deserializes plan cleanly without storing transient vendor data', () => {
    const serialized = serializePlan(sampleStoredPlan);
    expect(serialized).toContain('ChIJ_abc123');
    expect(serialized).not.toContain('rating');
    expect(serialized).not.toContain('address');

    const deserialized = deserializePlan(serialized);
    expect(deserialized.ok).toBe(true);
    if (deserialized.ok) {
      expect(deserialized.value.id).toBe('plan_storage_test');
      expect(deserialized.value.vendorSelections[0].placeId).toBe('ChIJ_abc123');
    }
  });

  it('rejects malformed json safely with Result error', () => {
    const res = deserializePlan('{ invalid json');
    expect(res.ok).toBe(false);

    const schemaMismatch = deserializePlan(JSON.stringify({ id: 'bad', version: 0 }));
    expect(schemaMismatch.ok).toBe(false);
  });

  it('saves and loads from storage backend seamlessly', () => {
    const storage = new MemoryStorage();
    const saveRes = savePlanToStorage(storage, sampleStoredPlan);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadPlanFromStorage(storage, 'plan_storage_test');
    expect(loadRes.ok).toBe(true);
    if (loadRes.ok) {
      expect(loadRes.value.intake.city).toBe('Chandigarh');
    }
  });

  it('handles missing keys and storage exceptions safely', () => {
    const storage = new MemoryStorage();
    const missing = loadPlanFromStorage(storage, 'non_existent_id');
    expect(missing.ok).toBe(false);

    storage.setThrow(true);
    const saveError = savePlanToStorage(storage, sampleStoredPlan);
    expect(saveError.ok).toBe(false);
  });
});
