'use client';

import React from 'react';

export interface DiffChipsProps {
  readonly diffs: readonly string[];
  readonly dirtyIds?: readonly string[];
}

/**
 * Renders visual badges highlighting modified parameter chips and dirty-set affected task IDs.
 */
export function DiffChips({ diffs, dirtyIds }: DiffChipsProps): React.JSX.Element {
  if (diffs.length === 0 && (!dirtyIds || dirtyIds.length === 0)) {
    return <div className="text-xs text-stone-400 italic">No modifications detected.</div>;
  }

  return (
    <div className="space-y-2">
      {diffs.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="diff-chips-list">
          {diffs.map((diff, idx) => (
            <span
              key={`${diff}-${idx}`}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-900 border border-amber-300"
            >
              {diff}
            </span>
          ))}
        </div>
      )}

      {dirtyIds && dirtyIds.length > 0 && (
        <div className="text-[11px] text-stone-500">
          <strong className="text-stone-700">Affected nodes:</strong> {dirtyIds.join(', ')}
        </div>
      )}
    </div>
  );
}
