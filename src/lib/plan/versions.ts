import type { PlanState } from './propagate';

export const MAX_VERSIONS = 20;

export interface PlanVersion {
  readonly id: string;
  readonly parentId: string | null;
  readonly plan: PlanState;
  readonly description: string;
  readonly timestamp: string;
}

export interface VersionStore {
  readonly versions: readonly PlanVersion[];
  readonly currentId: string;
}

/** Creates an immutable version store initialized with the baseline plan snapshot. */
export function createVersionStore(initialPlan: PlanState): VersionStore {
  const rootId = 'v_01';
  const rootVersion: PlanVersion = {
    id: rootId,
    parentId: null,
    plan: initialPlan,
    description: 'Initial plan snapshot',
    timestamp: new Date().toISOString(),
  };
  return {
    versions: [rootVersion],
    currentId: rootId,
  };
}

function getNextVersionId(store: VersionStore): string {
  const last = store.versions[store.versions.length - 1];
  if (!last) return 'v_1';
  const num = parseInt(last.id.replace(/\D/g, ''), 10);
  return Number.isFinite(num) ? `v_${num + 1}` : `v_${Date.now()}`;
}

/** Pushes a new plan version, capping total history at MAX_VERSIONS per AC3. */
export function pushVersion(
  store: VersionStore,
  plan: PlanState,
  description: string,
): VersionStore {
  const newId = getNextVersionId(store);
  const newVersion: PlanVersion = {
    id: newId,
    parentId: store.currentId,
    plan,
    description,
    timestamp: new Date().toISOString(),
  };

  const updated = [...store.versions, newVersion];
  let capped = updated;
  if (updated.length > MAX_VERSIONS) {
    const sliced = updated.slice(updated.length - MAX_VERSIONS);
    const first = sliced[0];
    capped = [{ ...first, parentId: null }, ...sliced.slice(1)];
  }

  return {
    versions: capped,
    currentId: newId,
  };
}

/** Alias for pushVersion to record plan revisions. */
export const recordVersion = pushVersion;

/** Checks whether the version store can be undone to a parent snapshot. */
export function canUndo(store: VersionStore): boolean {
  const curIdx = store.versions.findIndex((v) => v.id === store.currentId);
  return curIdx > 0;
}

/** Undoes the current change, restoring the previous snapshot byte-identically per AC3. */
export function undoVersion(store: VersionStore): { store: VersionStore; plan: PlanState | null } {
  const curIdx = store.versions.findIndex((v) => v.id === store.currentId);
  if (curIdx <= 0) {
    return { store, plan: null };
  }
  const current = store.versions[curIdx];
  const parent = (current.parentId ? store.versions.find((v) => v.id === current.parentId) : null)
    ?? store.versions[curIdx - 1];
  if (!parent) {
    return { store, plan: null };
  }
  return {
    store: { ...store, currentId: parent.id },
    plan: parent.plan,
  };
}

/**
 * Convenience helper to undo to the parent version store.
 *
 * @param store - Current version store
 * @returns Updated version store pointing to the parent version
 */
export function undo(store: VersionStore): VersionStore {
  return undoVersion(store).store;
}

/**
 * Restores a specific version snapshot by its identifier.
 *
 * @param store - Current version store
 * @param versionId - ID of version to restore
 * @returns Updated version store pointing to the requested version
 */
export function restoreVersion(store: VersionStore, versionId: string): VersionStore {
  const target = store.versions.find((v) => v.id === versionId);
  if (!target) return store;
  return { ...store, currentId: versionId };
}

/** Returns the current plan snapshot referenced by the active pointer. */
export function currentPlan(store: VersionStore): PlanState {
  const current = store.versions.find((v) => v.id === store.currentId);
  if (!current) {
    return store.versions[0].plan;
  }
  return current.plan;
}
