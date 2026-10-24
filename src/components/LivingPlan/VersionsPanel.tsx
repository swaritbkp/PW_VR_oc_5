'use client';

import React from 'react';
import type { VersionStore, PlanVersion } from '@/lib/plan/versions';
import { canUndo } from '@/lib/plan/versions';

export interface VersionsPanelProps {
  readonly store: VersionStore;
  readonly onRestore: (versionId: string) => void;
  readonly onUndo?: () => void;
}

function renderVersionItem(
  version: PlanVersion,
  isCurrent: boolean,
  onRestore: (id: string) => void,
) {
  return (
    <div
      key={version.id}
      className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
        isCurrent
          ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
          : 'bg-white border-stone-200 hover:border-stone-300'
      }`}
      data-testid={`version-item-${version.id}`}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold font-mono text-stone-900">{version.id}</span>
          {isCurrent && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-600 text-white rounded">
              Current
            </span>
          )}
        </div>
        <p className="text-stone-600 font-medium">{version.description}</p>
        <span className="text-[10px] text-stone-400">
          {new Date(version.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {!isCurrent && (
        <button
          type="button"
          onClick={() => onRestore(version.id)}
          className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200"
        >
          Revert
        </button>
      )}
    </div>
  );
}

export function VersionsPanel({
  store,
  onRestore,
  onUndo,
}: VersionsPanelProps): React.JSX.Element {
  const undoAvailable = canUndo(store);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-stone-900 text-xs">
          Plan History ({store.versions.length} Revisions)
        </h4>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={!undoAvailable}
            className="py-1 px-3 text-xs font-semibold rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40"
          >
            Undo Last
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {store.versions.map((v) => renderVersionItem(v, v.id === store.currentId, onRestore))}
      </div>
    </div>
  );
}
