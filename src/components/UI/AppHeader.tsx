'use client';

import React, { useState } from 'react';

export interface AppHeaderProps {
  readonly title: string;
  readonly city: string;
  readonly onOpen: (modal: 'templates' | 'whatif' | 'disruption' | 'share' | 'audit') => void;
}

function MarigoldEmblem(): React.JSX.Element {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-amber-700 p-0.5 shadow-sm flex items-center justify-center">
      <svg
        className="w-7 h-7 text-white"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3.5" fill="#FEF08A" />
        <path d="M12 2C10.5 5 10.5 8 12 10C13.5 8 13.5 5 12 2Z" fill="#FFFBEB" opacity="0.9" />
        <path
          d="M12 14C10.5 16 10.5 19 12 22C13.5 19 13.5 16 12 14Z"
          fill="#FFFBEB"
          opacity="0.9"
        />
        <path d="M2 12C5 10.5 8 10.5 10 12C8 13.5 5 13.5 2 12Z" fill="#FFFBEB" opacity="0.9" />
        <path
          d="M14 12C16 10.5 19 10.5 22 12C19 13.5 16 13.5 14 12Z"
          fill="#FFFBEB"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

function LanguagePill(): React.JSX.Element {
  const [lang, setLang] = useState<'en' | 'hi' | 'pa'>('en');
  return (
    <div className="flex items-center rounded-full bg-stone-100 p-0.5 border border-stone-200 text-[11px] font-semibold text-stone-600">
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          lang === 'en' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          lang === 'hi' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
        }`}
      >
        हिं
      </button>
      <button
        type="button"
        onClick={() => setLang('pa')}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          lang === 'pa' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
        }`}
      >
        ਪੰ
      </button>
    </div>
  );
}

function NavButtons({
  onOpen,
}: {
  readonly onOpen: (modal: 'templates' | 'whatif' | 'disruption' | 'share' | 'audit') => void;
}): React.JSX.Element {
  return (
    <nav aria-label="Planning actions" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen('templates')}
        className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors border border-stone-200/60"
      >
        <span>✨</span> Templates
      </button>
      <button
        type="button"
        onClick={() => onOpen('whatif')}
        className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors border border-stone-200/60"
      >
        <span>🎚️</span> What-If Sliders
      </button>
      <button
        type="button"
        onClick={() => onOpen('disruption')}
        className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
      >
        <span>⚡</span> Simulate Disruption
      </button>
      <button
        type="button"
        onClick={() => onOpen('share')}
        className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
      >
        <span>📤</span> Share & Export
      </button>
      <button
        type="button"
        onClick={() => onOpen('audit')}
        className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors border border-stone-200/60"
      >
        <span>🛡️</span> Audit
      </button>
    </nav>
  );
}

export function AppHeader({ title, city, onOpen }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-stone-200/80 shadow-lg shadow-stone-900/5">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: `url('/art/hero-event-graph.png')` }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-center gap-3">
        <MarigoldEmblem />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-black text-2xl tracking-tight text-stone-900">Jashn</h1>
            <span className="text-stone-300">|</span>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100/80 text-amber-900 rounded-full border border-amber-300">
              Living Graph
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5 flex items-center gap-2">
            <span className="capitalize">{title}</span>
            <span>&bull;</span>
            <span className="font-semibold text-stone-700">{city}</span>
          </p>
        </div>
      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <LanguagePill />
        <NavButtons onOpen={onOpen} />
      </div>
    </header>
  );
}
