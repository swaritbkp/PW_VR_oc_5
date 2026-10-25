'use client';

import React, { useState } from 'react';
import type { ModalType } from './AppModals';
import {
  IconAlertShield,
  IconDownloadFile,
  IconShieldBolt,
  IconSliders,
  IconSparkles,
  IconUploadFile,
} from './JashnIcons';

export type AppLanguage = 'en' | 'hi' | 'pa';

export interface AppHeaderProps {
  readonly title: string;
  readonly city: string;
  readonly onOpen: (modal: ModalType) => void;
  readonly currentLang?: AppLanguage;
  readonly onLanguageChange?: (lang: AppLanguage) => void;
}

interface NavLabels {
  readonly templates: string;
  readonly whatif: string;
  readonly chaos: string;
  readonly portable: string;
  readonly share: string;
  readonly audit: string;
  readonly livingGraph: string;
}

const I18N: Record<AppLanguage, NavLabels> = {
  en: {
    templates: 'Templates', whatif: 'What-If Sliders', chaos: 'Chaos Monkey',
    portable: 'Save / Load .jashn', share: 'Share & Export', audit: 'Audit', livingGraph: 'Living Graph',
  },
  hi: {
    templates: 'टेम्पलेट्स', whatif: 'व्हाट-इफ़ सिमुलेटर', chaos: 'केओस मंकी',
    portable: 'सहेजें .jashn', share: 'शेयर एवं निर्यात', audit: 'ऑडिट', livingGraph: 'जीवंत ग्राफ़',
  },
  pa: {
    templates: 'ਟੈਂਪਲੇਟਸ', whatif: 'ਵਟ-ਇਫ਼ ਸਿਮੂਲੇਟਰ', chaos: 'ਕਿਓਸ ਮੰਕੀ',
    portable: 'ਸੰਭਾਲੋ .jashn', share: 'ਸਾਂਝਾ ਕਰੋ', audit: 'ਆਡਿਟ', livingGraph: 'ਜੀਵੰਤ ਗ੍ਰਾਫ਼',
  },
};

interface NavItemConfig {
  readonly modal: ModalType;
  readonly key: keyof Omit<NavLabels, 'livingGraph'>;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly iconClass: string;
  readonly btnClass: string;
}

const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    modal: 'templates', key: 'templates', icon: IconSparkles, iconClass: 'text-amber-600',
    btnClass: 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200/60',
  },
  {
    modal: 'whatif', key: 'whatif', icon: IconSliders, iconClass: 'text-stone-600',
    btnClass: 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200/60',
  },
  {
    modal: 'chaos', key: 'chaos', icon: IconShieldBolt, iconClass: 'text-amber-600',
    btnClass: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs',
  },
  {
    modal: 'portable', key: 'portable', icon: IconUploadFile, iconClass: 'text-amber-300',
    btnClass: 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs',
  },
  {
    modal: 'share', key: 'share', icon: IconDownloadFile, iconClass: 'text-emerald-600',
    btnClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-xs',
  },
  {
    modal: 'audit', key: 'audit', icon: IconAlertShield, iconClass: 'text-stone-600',
    btnClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200 border-stone-200/60',
  },
];

function MarigoldEmblem(): React.JSX.Element {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-amber-700 p-0.5 shadow-sm flex items-center justify-center">
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" fill="#FEF08A" />
        <path d="M12 2C10.5 5 10.5 8 12 10C13.5 8 13.5 5 12 2Z" fill="#FFFBEB" opacity="0.9" />
        <path d="M12 14C10.5 16 10.5 19 12 22C13.5 19 13.5 16 12 14Z" fill="#FFFBEB" opacity="0.9" />
        <path d="M2 12C5 10.5 8 10.5 10 12C8 13.5 5 13.5 2 12Z" fill="#FFFBEB" opacity="0.9" />
        <path d="M14 12C16 10.5 19 10.5 22 12C19 13.5 16 13.5 14 12Z" fill="#FFFBEB" opacity="0.9" />
      </svg>
    </div>
  );
}

function LanguagePill({
  currentLang,
  onChange,
}: {
  readonly currentLang: AppLanguage;
  readonly onChange: (l: AppLanguage) => void;
}): React.JSX.Element {
  const options: readonly { readonly code: AppLanguage; readonly label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  ];
  return (
    <div
      role="group"
      aria-label="Language selection"
      className="flex items-center rounded-full bg-stone-100 p-0.5 border border-stone-200 text-[11px] font-semibold text-stone-600"
    >
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          aria-pressed={currentLang === opt.code}
          onClick={() => onChange(opt.code)}
          className={`px-2.5 py-0.5 rounded-full transition-colors ${
            currentLang === opt.code ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NavButtons({
  onOpen,
  labels,
}: {
  readonly onOpen: (modal: ModalType) => void;
  readonly labels: NavLabels;
}): React.JSX.Element {
  return (
    <nav aria-label="Planning actions" className="flex flex-wrap items-center gap-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.modal}
            type="button"
            onClick={() => onOpen(item.modal)}
            className={`inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-full hover:-translate-y-0.5 transition-all duration-200 border ${item.btnClass}`}
          >
            <Icon className={`w-3.5 h-3.5 ${item.iconClass}`} />
            <span>{labels[item.key]}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HeaderTitleBlock({
  title,
  city,
  badgeText,
}: {
  readonly title: string;
  readonly city: string;
  readonly badgeText: string;
}): React.JSX.Element {
  return (
    <div className="relative z-10 flex items-center gap-3">
      <MarigoldEmblem />
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-serif font-black text-2xl tracking-tight text-stone-900">Jashn</h1>
          <span className="text-stone-300">|</span>
          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100/80 text-amber-900 rounded-full border border-amber-300">
            {badgeText}
          </span>
        </div>
        <p className="text-xs text-stone-500 font-medium mt-0.5 flex items-center gap-2">
          <span className="capitalize">{title}</span>
          <span>&bull;</span>
          <span className="font-semibold text-stone-700">{city}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Main application header displaying celebration details, language toggle, and action triggers.
 */
export function AppHeader({
  title,
  city,
  onOpen,
  currentLang,
  onLanguageChange,
}: AppHeaderProps): React.JSX.Element {
  const [internalLang, setInternalLang] = useState<AppLanguage>('en');
  const activeLang = currentLang ?? internalLang;
  const handleLang = (l: AppLanguage) => {
    setInternalLang(l);
    onLanguageChange?.(l);
  };
  const labels = I18N[activeLang];

  return (
    <header className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-stone-200/80 shadow-lg shadow-stone-900/5">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: `url('/art/hero-event-graph.png')` }}
        aria-hidden="true"
      />
      <HeaderTitleBlock title={title} city={city} badgeText={labels.livingGraph} />
      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <LanguagePill currentLang={activeLang} onChange={handleLang} />
        <NavButtons onOpen={onOpen} labels={labels} />
      </div>
    </header>
  );
}
