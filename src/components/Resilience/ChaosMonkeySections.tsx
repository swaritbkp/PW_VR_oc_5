'use client';

import React from 'react';
import type { VendorNeedId } from '@/lib/plan/types';

export const CANDIDATE_SCENARIOS = [
  { id: 'venue_cancels', label: 'Venue double-booked / cancels', severe: true },
  { id: 'caterer_no_show', label: 'Caterer sudden failure', severe: false },
  { id: 'rain_outdoor', label: 'Heavy unseasonal rain storm', severe: false },
  { id: 'artisan_delay', label: 'Custom attire / decor shipment stuck', severe: false },
  { id: 'power_outage', label: 'Grid failure during main event', severe: true },
  { id: 'dj_cancellation', label: 'Lead DJ / sound engineer emergency', severe: false },
];

/** Renders individual scenario toggles for chaos monkey injection. */
export function RenderScenarioCheckboxes({
  selectedIds,
  onToggle,
}: {
  readonly selectedIds: readonly string[];
  readonly onToggle: (id: string) => void;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {CANDIDATE_SCENARIOS.map((s) => {
        const checked = selectedIds.includes(s.id);
        return (
          <label
            key={s.id}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              checked
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-950 font-medium'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(s.id)}
              className="rounded accent-amber-600"
            />
            <span className="flex-1">{s.label}</span>
            {s.severe && (
              <span className="text-[10px] bg-rose-500/10 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">
                High Impact
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

/** Displays a single numeric metric card with rounded styling. */
export function MetricCard({
  title,
  value,
  valueClass = 'text-stone-800',
}: {
  readonly title: string;
  readonly value: string;
  readonly valueClass?: string;
}): React.JSX.Element {
  return (
    <div className="p-3 bg-stone-100 rounded-xl text-center">
      <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">{title}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

/** Header bar with modal title, subtitle, and close button. */
export function ChaosMonkeyHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
      <div>
        <h2 id="chaos-modal-title" className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <span>🐒</span> Agentic Chaos Monkey Stress-Tester
        </h2>
        <p className="text-xs text-stone-500">
          Compound multi-disruption CPM simulator with live rerouting
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded-lg"
      >
        ✕
      </button>
    </div>
  );
}

/** Renders Plan B comparison callout showing days saved. */
export function PlanBComparisonBadge({
  withoutSlippage,
  withSlippage,
  coveredNeeds,
}: {
  readonly withoutSlippage: number;
  readonly withSlippage: number;
  readonly coveredNeeds: ReadonlySet<VendorNeedId>;
}): React.JSX.Element {
  const daysSaved = Math.max(0, Math.round(withoutSlippage - withSlippage));
  const needsLabel = Array.from(coveredNeeds).join(', ') || 'venue, caterer';
  return (
    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1">
      <div className="flex items-center justify-between font-bold text-emerald-900">
        <span className="flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Plan B Mitigation Active</span>
        </span>
        <span className="text-emerald-700 font-extrabold">
          {daysSaved > 0 ? `Cuts disruption delay by ${daysSaved} days!` : 'Ready to absorb impact'}
        </span>
      </div>
      <p className="text-[11px] text-emerald-800">
        Holding verified backup coverage for <span className="font-semibold">{needsLabel}</span> halves recovery critical path latency.
      </p>
    </div>
  );
}
