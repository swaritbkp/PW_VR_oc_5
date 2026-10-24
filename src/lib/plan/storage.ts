import type { Result } from '../schedule/types';
import { StoredPlanSchema, type StoredPlan } from './schemas';

export const STORAGE_KEY_PREFIX = 'jashn_plan_';

/** Serializes a validated plan to JSON string for browser persistence per AC30. */
export function serializePlan(plan: StoredPlan): string {
  // Strip transient vendor fields and ensure schema compliance
  const sanitized = StoredPlanSchema.parse(plan);
  return JSON.stringify(sanitized);
}

/** Deserializes and validates a JSON string from persistence per AC30. */
export function deserializePlan(rawJson: string): Result<StoredPlan, string> {
  try {
    const raw = JSON.parse(rawJson);
    const parsed = StoredPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
    }
    return { ok: true, value: parsed.data };
  } catch {
    return { ok: false, error: 'Malformed JSON payload' };
  }
}

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Saves a plan into the provided storage backend using safe serialization per AC30. */
export function savePlanToStorage(storage: StorageBackend, plan: StoredPlan): Result<void, string> {
  try {
    const serialized = serializePlan(plan);
    storage.setItem(`${STORAGE_KEY_PREFIX}${plan.id}`, serialized);
    return { ok: true, value: undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Storage save failure';
    return { ok: false, error: msg };
  }
}

/** Loads and validates a plan from storage backend per AC30. */
export function loadPlanFromStorage(
  storage: StorageBackend,
  planId: string,
): Result<StoredPlan, string> {
  const raw = storage.getItem(`${STORAGE_KEY_PREFIX}${planId}`);
  if (!raw) {
    return { ok: false, error: `No plan found with id ${planId}` };
  }
  return deserializePlan(raw);
}
