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

const CONFIGS: Record<
  EmptyStateType,
  { title: string; message: string; icon: string; defaultAction?: string }
> = {
  'no-plan': {
    title: 'No Active Celebration Plan',
    message:
      'Select a culturally authentic starting template or enter custom intake to begin your living plan.',
    icon: '✨',
    defaultAction: 'Browse Templates',
  },
  'no-vendors': {
    title: 'No Vendors Listed',
    message: 'Try expanding the search radius or add your own local vendor directly.',
    icon: '📍',
    defaultAction: 'Add Vendor Manually',
  },
  'all-done': {
    title: 'Celebration Ready!',
    message:
      'Every milestone and booking task is complete. Review your timeline or share with family.',
    icon: '🎉',
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
      className="p-8 text-center bg-stone-50/60 rounded-2xl border border-stone-200/80 flex flex-col items-center justify-center gap-3 my-4"
      data-testid={`empty-state-${type}`}
    >
      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl shadow-inner select-none">
        {config.icon}
      </div>
      <div className="max-w-md space-y-1">
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
