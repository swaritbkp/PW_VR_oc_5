'use client';

import React, { useMemo, useState } from 'react';
import { formatInr } from '@/lib/format';
import { TEMPLATES, type EventTemplate } from '@/lib/templates/catalog';
import type { EventType } from '@/lib/plan/types';
import { TemplateCoverImage } from './TemplateCoverImage';

export interface TemplateGalleryProps {
  readonly onSelectTemplate: (template: EventTemplate) => void;
  readonly initialEventType?: EventType;
}

const MONTH_NAMES = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function renderBestMonths(months: readonly number[]) {
  if (months.length === 0) return null;
  const label = months.map((m) => MONTH_NAMES[m]).join(', ');
  return (
    <span className="text-[11px] text-stone-500">
      <strong className="text-stone-700">Best:</strong> {label}
    </span>
  );
}

function renderTemplateMetrics(template: EventTemplate) {
  return (
    <div className="pt-2 border-t border-stone-100 space-y-1 text-xs">
      <div className="flex justify-between text-stone-600">
        <span>Guests:</span>
        <span className="font-semibold text-stone-800">
          {template.guests.min}–{template.guests.max} ({template.guests.typical} typ.)
        </span>
      </div>
      <div className="flex justify-between text-stone-600">
        <span>Budget:</span>
        <span className="font-semibold text-stone-800">
          {formatInr(template.budgetInr.typical)}
        </span>
      </div>
      {renderBestMonths(template.bestMonths)}
    </div>
  );
}

function renderTemplateCard(template: EventTemplate, onSelect: (t: EventTemplate) => void) {
  return (
    <div
      key={template.id}
      role="article"
      className="p-4 rounded-3xl border border-stone-200/90 bg-white hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-3 group"
      data-testid={`template-card-${template.id}`}
    >
      <div className="space-y-2">
        <TemplateCoverImage
          templateId={template.id}
          title={template.title}
          category={template.eventType}
          outdoor={template.outdoor}
          accent={template.accent}
        />
        <h4 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-amber-900 transition-colors">
          {template.title}
        </h4>
        <p className="text-xs text-stone-600 line-clamp-2">{template.tagline}</p>
        {renderTemplateMetrics(template)}
      </div>

      <button
        type="button"
        onClick={() => onSelect(template)}
        className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-stone-900 text-white hover:bg-amber-800 transition-all shadow-sm active:scale-98"
      >
        Choose Template
      </button>
    </div>
  );
}

export function TemplateGallery({
  onSelectTemplate,
  initialEventType,
}: TemplateGalleryProps): React.JSX.Element {
  const [filterType, setFilterType] = useState<EventType | 'all'>(initialEventType ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (filterType !== 'all' && t.eventType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterType, searchQuery]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-stone-900 text-lg">Curated Celebration Templates</h3>
          <p className="text-xs text-stone-500">
            12 culturally authentic, tested starting points adapted for Indian celebrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'wedding', 'birthday', 'community'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filterType === t
                  ? 'bg-amber-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Filter by keyword (e.g. marigold, langar, pool)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2.5 text-xs rounded-xl border border-stone-200 focus:ring-1 focus:ring-amber-500 focus:outline-none"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => renderTemplateCard(t, onSelectTemplate))}
      </div>
    </div>
  );
}
