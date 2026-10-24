'use client';

import React from 'react';

export interface AppHeaderProps {
  readonly title: string;
  readonly city: string;
  readonly onOpen: (modal: 'templates' | 'whatif' | 'disruption' | 'share' | 'audit') => void;
}

function renderNavActions(
  onOpen: (modal: 'templates' | 'whatif' | 'disruption' | 'share' | 'audit') => void,
) {
  const btnCls =
    'py-1.5 px-3 text-xs font-semibold rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200';
  return (
    <nav aria-label="Planning actions" className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => onOpen('templates')} className={btnCls}>
        Templates
      </button>
      <button type="button" onClick={() => onOpen('whatif')} className={btnCls}>
        What-If Sliders
      </button>
      <button
        type="button"
        onClick={() => onOpen('disruption')}
        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
      >
        Simulate Disruption
      </button>
      <button type="button" onClick={() => onOpen('share')} className={btnCls}>
        Share & Export
      </button>
      <button
        type="button"
        onClick={() => onOpen('audit')}
        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200"
      >
        Audit
      </button>
    </nav>
  );
}

export function AppHeader({ title, city, onOpen }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-serif font-black text-2xl text-amber-950">Jashn</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
            Living Graph
          </span>
        </div>
        <p className="text-xs text-stone-600 mt-0.5">
          {title} &bull; <span className="font-semibold">{city}</span>
        </p>
      </div>
      {renderNavActions(onOpen)}
    </header>
  );
}
