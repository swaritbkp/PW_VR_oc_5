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

/** Pushes a new plan version, capping total history at MAX_VERSIONS per AC3. */
export function pushVersion(
  store: VersionStore,
  plan: PlanState,
  description: string,
): VersionStore {
  const newId = `v_${store.versions.length + 1}`;
  const newVersion: PlanVersion = {
    id: newId,
    parentId: store.currentId,
    plan,
    description,
    timestamp: new Date().toISOString(),
  };

  const updated = [...store.versions, newVersion];
  const capped =
    updated.length > MAX_VERSIONS ? updated.slice(updated.length - MAX_VERSIONS) : updated;

  return {
    versions: capped,
    currentId: newId,
  };
}

/** Checks whether the version store can be undone to a parent snapshot. */
export function canUndo(store: VersionStore): boolean {
  const current = store.versions.find((v) => v.id === store.currentId);
  return Boolean(current?.parentId);
}

/** Undoes the current change, restoring the previous snapshot byte-identically per AC3. */
export function undoVersion(store: VersionStore): { store: VersionStore; plan: PlanState | null } {
  const current = store.versions.find((v) => v.id === store.currentId);
  if (!current?.parentId) {
    return { store, plan: null };
  }
  const parent = store.versions.find((v) => v.id === current.parentId);
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
