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

function ConciergeHeader({
  eventType,
  city,
  guests,
  daysLeft,
  doneCount,
  totalCount,
}: {
  readonly eventType: EventType;
  readonly city: string;
  readonly guests: number;
  readonly daysLeft: number;
  readonly doneCount: number;
  readonly totalCount: number;
}): React.JSX.Element {
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const daysText = daysLeft > 0 ? `${daysLeft} days to go` : 'Today';
  const subText =
    doneCount === totalCount
      ? '✨ Fantastic! All milestones are completed and ready for the big celebration.'
      : `You have completed ${doneCount} of ${totalCount} milestones (${pct}%). Lock in your key vendors and review dates below.`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
          Celebration Concierge
        </span>
        <span className="text-xs font-semibold text-stone-600">
          {daysText} &bull; {guests} guests
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
        Namaste &amp; Sat Sri Akal! Planning your {eventType} in {city}.
      </h2>
      <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">{subText}</p>
    </div>
  );
}

function ConciergeQuickActions({
  onOpenChaos,
  onOpenDossier,
  onOpenPlanB,
  onOpenWhatIf,
}: {
  readonly onOpenChaos?: () => void;
  readonly onOpenDossier?: () => void;
  readonly onOpenPlanB: () => void;
  readonly onOpenWhatIf: () => void;
}): React.JSX.Element {
  const btnCls =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs hover:border-amber-300';

  return (
    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
      {onOpenChaos && (
        <button type="button" onClick={onOpenChaos} className={btnCls}>
          <IconShieldBolt className="w-3.5 h-3.5 text-amber-600" />
          <span>Chaos Monkey</span>
        </button>
      )}
      {onOpenDossier && (
        <button type="button" onClick={onOpenDossier} className={btnCls}>
          <IconDossier className="w-3.5 h-3.5 text-indigo-600" />
          <span>Executive Dossier</span>
        </button>
      )}
      <button type="button" onClick={onOpenPlanB} className={btnCls}>
        <IconShieldBolt className="w-3.5 h-3.5 text-teal-600" />
        <span>Simulate Plan B</span>
      </button>
      <button type="button" onClick={onOpenWhatIf} className={btnCls}>
        <IconSliders className="w-3.5 h-3.5 text-stone-600" />
        <span>What-If Sliders</span>
      </button>
    </div>
  );
}

function NavTabButton({
  label,
  badge,
  icon,
  active,
  onClick,
}: {
  readonly label: string;
  readonly badge: string;
  readonly icon: React.ReactNode;
  readonly active: boolean;
  readonly onClick: () => void;
}): React.JSX.Element {
  const containerCls = active
    ? 'bg-amber-600 text-white shadow-sm'
    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 shadow-2xs';
  const badgeCls = active ? 'bg-amber-700 text-amber-100' : 'bg-stone-100 text-stone-600';

  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 ${containerCls}`}
    >
      {icon}
      <span>{label}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
    </button>
  );
}

function ConciergeNavTabs({
  activeTab,
  onSelectTab,
}: {
  readonly activeTab: 'roadmap' | 'vendors' | 'graph';
  readonly onSelectTab: (tab: 'roadmap' | 'vendors' | 'graph') => void;
}): React.JSX.Element {
  return (
    <nav aria-label="Workspace views" className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/50">
      <NavTabButton
        label="Celebration Roadmap"
        badge="Intuitive"
        icon={<IconSparkles className="w-3.5 h-3.5" />}
        active={activeTab === 'roadmap'}
        onClick={() => onSelectTab('roadmap')}
      />
      <NavTabButton
        label="Find Nearby Vendors"
        badge="Live Places"
        icon={<IconCompass className="w-3.5 h-3.5" />}
        active={activeTab === 'vendors'}
        onClick={() => onSelectTab('vendors')}
      />
      <NavTabButton
        label="Timeline & CPM Graph"
        badge="Full Canvas"
        icon={<IconTimeline className="w-3.5 h-3.5" />}
        active={activeTab === 'graph'}
        onClick={() => onSelectTab('graph')}
      />
    </nav>
  );
}

/**
 * Warm cultural celebration concierge providing personalized guidance, countdown status, and view mode switching.
 */
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
  return (
    <section
      aria-label="Celebration Concierge"
      className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-200/80 shadow-xs space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <ConciergeHeader
          eventType={eventType}
          city={city}
          guests={guests}
          daysLeft={daysLeft}
          doneCount={doneCount}
          totalCount={totalCount}
        />
        <ConciergeQuickActions
          onOpenChaos={onOpenChaos}
          onOpenDossier={onOpenDossier}
          onOpenPlanB={onOpenPlanB}
          onOpenWhatIf={onOpenWhatIf}
        />
      </div>
      <ConciergeNavTabs activeTab={activeTab} onSelectTab={onSelectTab} />
    </section>
  );
}
