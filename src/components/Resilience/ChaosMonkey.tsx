'use client';

import React, { useMemo, useState } from 'react';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import { simulateChaosCascade, type CompoundDisruptionResult } from '@/lib/resilience/chaos';

export interface ChaosMonkeyProps {
  readonly tasks: readonly PlanTask[];
  readonly availableDays: number;
  readonly backedUpNeeds: ReadonlySet<VendorNeedId>;
  readonly onClose: () => void;
}

const CANDIDATE_SCENARIOS = [
  { id: 'venue_cancels', label: 'Venue double-booked / cancels', severe: true },
  { id: 'caterer_no_show', label: 'Caterer sudden failure', severe: false },
  { id: 'rain_outdoor', label: 'Heavy unseasonal rain storm', severe: false },
  { id: 'artisan_delay', label: 'Custom attire / decor shipment stuck', severe: false },
  { id: 'power_outage', label: 'Grid failure during main event', severe: true },
  { id: 'dj_cancellation', label: 'Lead DJ / sound engineer emergency', severe: false },
];

function RenderScenarioCheckboxes({
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

function MetricCard({
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

function RenderResultMetrics({
  slippage,
  remainingBuffer,
  catastrophic,
  prob,
}: {
  readonly slippage: number;
  readonly remainingBuffer: number;
  readonly catastrophic: boolean;
  readonly prob: number;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      <MetricCard title="Net Slippage" value={`+${slippage}d`} valueClass="text-rose-700" />
      <MetricCard title="Remaining Buffer" value={`${remainingBuffer}d`} />
      <MetricCard title="On-Time Probability" value={`${Math.round(prob * 100)}%`} />
      {catastrophic && (
        <div className="col-span-3 p-2.5 bg-rose-500/10 border border-rose-500 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>Catastrophic cascade: event buffer breached! Emergency re-scheduling required.</span>
        </div>
      )}
    </div>
  );
}

function ChaosMonkeyHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
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

function ChaosMonkeyScenarioPicker({
  selectedIds,
  onToggle,
  onRandomChaos,
}: {
  readonly selectedIds: readonly string[];
  readonly onToggle: (id: string) => void;
  readonly onRandomChaos: () => void;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-700">
          Simultaneous Disruptions ({selectedIds.length} active)
        </span>
        <button
          type="button"
          onClick={onRandomChaos}
          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-2.5 py-1 rounded-lg transition-colors shadow-xs"
        >
          🎲 Inject Random Chaos
        </button>
      </div>
      <RenderScenarioCheckboxes selectedIds={selectedIds} onToggle={onToggle} />
    </div>
  );
}

function ChaosCascadeDetails({
  cascadeResult,
}: {
  readonly cascadeResult: CompoundDisruptionResult;
}): React.JSX.Element {
  return (
    <div className="space-y-3 pt-2">
      <RenderResultMetrics
        slippage={cascadeResult.netSlippageDays}
        remainingBuffer={cascadeResult.remainingBufferDays}
        catastrophic={cascadeResult.catastrophicFailure}
        prob={cascadeResult.disruptedProbability}
      />
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold text-stone-800">Dynamic Emergency Recovery Protocols</h3>
        <ul className="text-xs space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
          {cascadeResult.recoveryActions.map((action: string, i: number) => (
            <li key={`action-${i}`} className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function useChaosMonkeySelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['venue_cancels', 'caterer_no_show']);
  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };
  const handleInjectRandomChaos = () => {
    const shuffled = [...CANDIDATE_SCENARIOS].sort(() => 0.5 - Math.random());
    setSelectedIds(shuffled.slice(0, 3).map((s) => s.id));
  };
  return { selectedIds, handleToggle, handleInjectRandomChaos };
}

/**
 * Agentic Chaos Monkey simulator stress-testing compound cascading disruptions across the celebration schedule.
 */
export function ChaosMonkey(props: ChaosMonkeyProps): React.JSX.Element {
  const { tasks, availableDays, backedUpNeeds, onClose } = props;
  const { selectedIds, handleToggle, handleInjectRandomChaos } = useChaosMonkeySelection();

  const cascadeResult = useMemo(() => {
    const res = simulateChaosCascade(tasks, selectedIds, { availableDays, backedUp: backedUpNeeds });
    return res.ok ? res.value : null;
  }, [tasks, selectedIds, availableDays, backedUpNeeds]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chaos-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
        <ChaosMonkeyHeader onClose={onClose} />
        <ChaosMonkeyScenarioPicker
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onRandomChaos={handleInjectRandomChaos}
        />
        {cascadeResult && <ChaosCascadeDetails cascadeResult={cascadeResult} />}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
          >Close Stress-Tester</button>
        </div>
      </div>
    </div>
  );
}
