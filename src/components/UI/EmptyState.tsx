'use client';

import React from 'react';

export type EmptyStateType = 'no-plan' | 'no-vendors' | 'all-done';

export interface EmptyStateProps {
  readonly type: EmptyStateType;
  readonly title?: string;
  readonly message?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

const CONFIGS: Record<EmptyStateType, { title: string; message: string; defaultAction?: string }> =
  {
    'no-plan': {
      title: 'No Active Celebration Plan',
      message:
        'Select a culturally authentic starting template or enter custom intake to begin your living plan.',
      defaultAction: 'Browse Templates',
    },
    'no-vendors': {
      title: 'No Vendors Listed',
      message: 'Try expanding the search radius or add your own local vendor directly.',
      defaultAction: 'Add Vendor Manually',
    },
    'all-done': {
      title: 'Celebration Ready!',
      message:
        'Every milestone and booking task is complete. Review your timeline or share with family.',
      defaultAction: 'Share Summary',
    },
  };

export function EmptyState({
  type,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const config = CONFIGS[type];
  const finalTitle = title ?? config.title;
  const finalMessage = message ?? config.message;
  const finalAction = actionLabel ?? config.defaultAction;

  return (
    <div
      role="status"
      className="p-8 text-center bg-stone-50/70 rounded-3xl border border-stone-200/80 flex flex-col items-center justify-center gap-3 my-4 shadow-xs"
      data-testid={`empty-state-${type}`}
    >
      <div className="w-64 h-36 rounded-2xl overflow-hidden shadow-sm relative border border-stone-200/60 bg-white">
        <img
          src={`/art/empty-${type}.png`}
          alt={finalTitle}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="max-w-md space-y-1 mt-1">
        <h4 className="font-bold text-stone-900 text-sm">{finalTitle}</h4>
        <p className="text-xs text-stone-600 leading-relaxed">{finalMessage}</p>
      </div>
      {finalAction && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 py-2 px-4 rounded-xl text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 transition-colors shadow-sm"
        >
          {finalAction}
        </button>
      )}
    </div>
  );
}
