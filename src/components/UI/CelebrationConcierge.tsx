'use client';

import React from 'react';
import type { EventType } from '@/lib/plan/types';
import type { AppLanguage } from './AppHeader';
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
  readonly onOpenCopilot?: () => void;
  readonly language?: AppLanguage;
}

interface ConciergeTextOptions {
  readonly lang: AppLanguage;
  readonly eventType: string;
  readonly city: string;
  readonly doneCount: number;
  readonly totalCount: number;
  readonly pct: number;
}

function getConciergeStrings(opts: ConciergeTextOptions) {
  const { lang, eventType, city, doneCount, totalCount, pct } = opts;
  const isDone = doneCount === totalCount;
  if (lang === 'hi') {
    return {
      badge: 'उत्सव कंसीयर्ज',
      headline: `नमस्ते और सत श्री अकाल! आपके उत्सव की जीवंत योजना — ${city} में ${eventType}।`,
      sub: isDone ? '✨ शानदार! आपके सभी मील के पत्थर पूरे हो चुके हैं।' : `आपने ${totalCount} में से ${doneCount} मील के पत्थर पूरे कर लिए हैं (${pct}%)।`,
    };
  }
  if (lang === 'pa') {
    return {
      badge: 'ਜਸ਼ਨ ਕੰਸੀਅਰਜ',
      headline: `ਨਮਸਤੇ ਅਤੇ ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੇ ਜਸ਼ਨ ਦੀ ਜੀਵੰਤ ਯੋਜਨਾ — ${city} ਵਿਖੇ ${eventType}।`,
      sub: isDone ? '✨ ਸ਼ਾਨਦਾਰ! ਤੁਹਾਡੇ ਸਾਰੇ ਮੀਲ ਪੱਥਰ ਪੂਰੇ ਹੋ ਗਏ ਹਨ।' : `ਤੁਸੀਂ ${totalCount} ਵਿੱਚੋਂ ${doneCount} ਮੀਲ ਪੱਥਰ ਪੂਰੇ ਕਰ ਲਏ ਹਨ (${pct}%)।`,
    };
  }
  return {
    badge: 'Celebration Concierge',
    headline: `Namaste & Sat Sri Akal! Planning your ${eventType} in ${city}.`,
    sub: isDone ? '✨ Fantastic! All milestones are completed and ready for the big celebration.' : `You have completed ${doneCount} of ${totalCount} milestones (${pct}%). Lock in key vendors below.`,
  };
}

function ConciergeHeader(props: {
  readonly eventType: EventType;
  readonly city: string;
  readonly guests: number;
  readonly daysLeft: number;
  readonly doneCount: number;
  readonly totalCount: number;
  readonly language?: AppLanguage;
}): React.JSX.Element {
  const { eventType, city, guests, daysLeft, doneCount, totalCount, language = 'en' } = props;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const daysText = daysLeft > 0 ? `${daysLeft} days to go` : 'Today';
  const text = getConciergeStrings({ lang: language, eventType, city, doneCount, totalCount, pct });

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
          {text.badge}
        </span>
        <span className="text-xs font-semibold text-stone-600">
          {daysText} &bull; {guests} guests
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">{text.headline}</h2>
      <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">{text.sub}</p>
    </div>
  );
}

function CopilotHeroButton({ onClick }: { readonly onClick?: () => void }): React.JSX.Element | null {
  if (!onClick) return null;
  return (
    <button
      type="button"
      id="hero-copilot-btn"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
    >
      <span>💬</span>
      <span>Ask AI Agent</span>
    </button>
  );
}

function ConciergeQuickActions(props: {
  readonly onOpenChaos?: () => void;
  readonly onOpenDossier?: () => void;
  readonly onOpenPlanB: () => void;
  readonly onOpenWhatIf: () => void;
  readonly onOpenCopilot?: () => void;
}): React.JSX.Element {
  const btnCls = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 shadow-2xs hover:border-amber-300';

  return (
    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
      <CopilotHeroButton onClick={props.onOpenCopilot} />
      {props.onOpenChaos && (
        <button type="button" onClick={props.onOpenChaos} className={btnCls}>
          <IconShieldBolt className="w-3.5 h-3.5 text-amber-600" />
          <span>Chaos Monkey</span>
        </button>
      )}
      {props.onOpenDossier && (
        <button type="button" onClick={props.onOpenDossier} className={btnCls}>
          <IconDossier className="w-3.5 h-3.5 text-indigo-600" />
          <span>Executive Dossier</span>
        </button>
      )}
      <button type="button" onClick={props.onOpenPlanB} className={btnCls}>
        <IconShieldBolt className="w-3.5 h-3.5 text-teal-600" />
        <span>Simulate Plan B</span>
      </button>
      <button type="button" onClick={props.onOpenWhatIf} className={btnCls}>
        <IconSliders className="w-3.5 h-3.5 text-stone-600" />
        <span>What-If Sliders</span>
      </button>
    </div>
  );
}

function NavTabButton(props: {
  readonly label: string;
  readonly badge: string;
  readonly icon: React.ReactNode;
  readonly active: boolean;
  readonly onClick: () => void;
}): React.JSX.Element {
  const containerCls = props.active
    ? 'bg-amber-600 text-white shadow-sm'
    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 shadow-2xs';
  const badgeCls = props.active ? 'bg-amber-700 text-amber-100' : 'bg-stone-100 text-stone-600';

  return (
    <button
      type="button"
      aria-current={props.active ? 'page' : undefined}
      aria-pressed={props.active}
      onClick={props.onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 ${containerCls}`}
    >
      {props.icon}
      <span>{props.label}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeCls}`}>{props.badge}</span>
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
export function CelebrationConcierge(props: CelebrationConciergeProps): React.JSX.Element {
  return (
    <section
      aria-label="Celebration Concierge"
      className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-200/80 shadow-xs space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <ConciergeHeader
          eventType={props.eventType}
          city={props.city}
          guests={props.guests}
          daysLeft={props.daysLeft}
          doneCount={props.doneCount}
          totalCount={props.totalCount}
          language={props.language}
        />
        <ConciergeQuickActions
          onOpenChaos={props.onOpenChaos}
          onOpenDossier={props.onOpenDossier}
          onOpenPlanB={props.onOpenPlanB}
          onOpenWhatIf={props.onOpenWhatIf}
          onOpenCopilot={props.onOpenCopilot}
        />
      </div>
      <ConciergeNavTabs activeTab={props.activeTab} onSelectTab={props.onSelectTab} />
    </section>
  );
}
