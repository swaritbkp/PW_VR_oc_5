'use client';

import React from 'react';
import type { EventType } from '@/lib/plan/types';
import {
  IconCompass,
  IconDossier,
  IconShieldBolt,
  IconSliders,
  IconSparkles,
  IconTimeline,
} from './JashnIcons';

export interface CelebrationConciergeProps {
  readonly eventType: EventType;
  readonly city: string;
  readonly guests: number;
  readonly daysLeft: number;
  readonly doneCount: number;
  readonly totalCount: number;
  readonly activeTab: 'roadmap' | 'vendors' | 'graph';
  readonly onSelectTab: (tab: 'roadmap' | 'vendors' | 'graph') => void;
  readonly onOpenPlanB: () => void;
  readonly onOpenWhatIf: () => void;
  readonly onOpenChaos?: () => void;
  readonly onOpenDossier?: () => void;
}

export function CelebrationConcierge({
  eventType,
  city,
  guests,
  daysLeft,
  doneCount,
  totalCount,
  activeTab,
  onSelectTab,
  onOpenPlanB,
  onOpenWhatIf,
  onOpenChaos,
  onOpenDossier,
}: CelebrationConciergeProps): React.JSX.Element {
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <section
      aria-label="Celebration Concierge"
      className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-200/80 shadow-xs space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
              Celebration Concierge
            </span>
            <span className="text-xs font-semibold text-stone-600">
              {daysLeft > 0 ? `${daysLeft} days to go` : 'Today'} &bull; {guests} guests
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Namaste &amp; Sat Sri Akal! Planning your {eventType} in {city}.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            {doneCount === totalCount
              ? '✨ Fantastic! All milestones are completed and ready for the big celebration.'
              : `You have completed ${doneCount} of ${totalCount} milestones (${pct}%). Lock in your key vendors and review dates below.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {onOpenChaos && (
            <button
              type="button"
              onClick={onOpenChaos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs hover:border-amber-300"
            >
              <IconShieldBolt className="w-3.5 h-3.5 text-amber-600" />
              <span>Chaos Monkey</span>
            </button>
          )}
          {onOpenDossier && (
            <button
              type="button"
              onClick={onOpenDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs hover:border-amber-300"
            >
              <IconDossier className="w-3.5 h-3.5 text-indigo-600" />
              <span>Executive Dossier</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPlanB}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs hover:border-amber-300"
          >
            <IconShieldBolt className="w-3.5 h-3.5 text-teal-600" />
            <span>Simulate Plan B</span>
          </button>
          <button
            type="button"
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs hover:border-amber-300"
          >
            <IconSliders className="w-3.5 h-3.5 text-stone-600" />
            <span>What-If Sliders</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Workspace views"
        className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/50"
      >
        <button
          type="button"
          onClick={() => onSelectTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 ${
            activeTab === 'roadmap'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 shadow-2xs'
          }`}
        >
          <IconSparkles className="w-3.5 h-3.5" />
          <span>Celebration Roadmap</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'roadmap'
                ? 'bg-amber-700 text-amber-100'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            Intuitive
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('vendors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 ${
            activeTab === 'vendors'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 shadow-2xs'
          }`}
        >
          <IconCompass className="w-3.5 h-3.5" />
          <span>Find Nearby Vendors</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'vendors'
                ? 'bg-amber-700 text-amber-100'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            Live Places
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('graph')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 ${
            activeTab === 'graph'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 shadow-2xs'
          }`}
        >
          <IconTimeline className="w-3.5 h-3.5" />
          <span>Timeline &amp; CPM Graph</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'graph' ? 'bg-amber-700 text-amber-100' : 'bg-stone-100 text-stone-600'
            }`}
          >
            Full Canvas
          </span>
        </button>
      </nav>
    </section>
  );
}
