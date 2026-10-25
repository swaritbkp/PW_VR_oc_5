'use client';

import React, { useMemo, useState } from 'react';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import { DISRUPTIONS } from '@/lib/resilience/disruptions';
import { simulateChaosCascade } from '@/lib/resilience/chaos';

export interface ChaosMonkeyProps {
  readonly tasks: readonly PlanTask[];
  readonly availableDays: number;
  readonly backedUpNeeds: ReadonlySet<VendorNeedId>;
  readonly onClose: () => void;
}

const CANDIDATE_SCENARIOS = DISRUPTIONS.slice(0, 6);

function renderScenarioCheckboxes(selectedIds: readonly string[], onToggle: (id: string) => void) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {CANDIDATE_SCENARIOS.map((sc) => {
        const isChecked = selectedIds.includes(sc.id);
        return (
          <label
            key={sc.id}
            className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              isChecked
                ? 'bg-amber-500/10 border-amber-500 text-stone-900'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(sc.id)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-semibold">{sc.title}</p>
              <p className="text-[11px] text-stone-500 capitalize">
                Impact {sc.impact}/5 • {sc.kind}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function renderResultMetrics(
  netSlippage: number,
  remBuffer: number,
  catastrophic: boolean,
  prob: number,
) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 bg-stone-100 rounded-xl text-center">
        <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          Net Slippage
        </p>
        <p className="text-xl font-bold text-amber-600">+{netSlippage}d</p>
      </div>
      <div
        className={`p-3 rounded-xl text-center ${remBuffer < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
      >
        <p className="text-[11px] font-medium uppercase tracking-wider">Remaining Buffer</p>
        <p className="text-xl font-bold">{remBuffer}d</p>
      </div>
      <div className="p-3 bg-stone-100 rounded-xl text-center">
        <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          On-Time Probability
        </p>
        <p className="text-xl font-bold text-stone-800">{Math.round(prob * 100)}%</p>
      </div>
      {catastrophic && (
        <div className="col-span-3 p-2.5 bg-rose-500/10 border border-rose-500 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Catastrophic cascade: event buffer breached! Emergency re-scheduling required.
          </span>
        </div>
      )}
    </div>
  );
}

export function ChaosMonkey({
  tasks,
  availableDays,
  backedUpNeeds,
  onClose,
}: ChaosMonkeyProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>(['venue_cancels', 'caterer_no_show']);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleInjectRandomChaos = () => {
    const shuffled = [...CANDIDATE_SCENARIOS].sort(() => 0.5 - Math.random());
    setSelectedIds(shuffled.slice(0, 3).map((s) => s.id));
  };

  const cascadeResult = useMemo(() => {
    const res = simulateChaosCascade(tasks, selectedIds, {
      availableDays,
      backedUp: backedUpNeeds,
    });
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
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2
              id="chaos-modal-title"
              className="text-lg font-bold text-stone-900 flex items-center gap-2"
            >
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">
              Simultaneous Disruptions ({selectedIds.length} active)
            </span>
            <button
              type="button"
              onClick={handleInjectRandomChaos}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-2.5 py-1 rounded-lg transition-colors shadow-xs"
            >
              🎲 Inject Random Chaos
            </button>
          </div>
          {renderScenarioCheckboxes(selectedIds, handleToggle)}
        </div>

        {cascadeResult && (
          <div className="space-y-3 pt-2">
            {renderResultMetrics(
              cascadeResult.netSlippageDays,
              cascadeResult.remainingBufferDays,
              cascadeResult.catastrophicFailure,
              cascadeResult.disruptedProbability,
            )}

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-stone-800">
                Dynamic Emergency Recovery Protocols
              </h3>
              <ul className="text-xs space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
                {cascadeResult.recoveryActions.map((action, i) => (
                  <li key={`action-${i}`} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
          >
            Close Stress-Tester
          </button>
        </div>
      </div>
    </div>
  );
}
