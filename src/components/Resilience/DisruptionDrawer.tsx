'use client';

import React, { useMemo, useState } from 'react';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import {
  DISRUPTIONS,
  simulateDisruption,
  type DisruptionResult,
  type DisruptionScenario,
} from '@/lib/resilience/disruptions';

export interface DisruptionDrawerProps {
  readonly tasks: readonly PlanTask[];
  readonly availableDays: number;
  readonly backedUpNeeds: ReadonlySet<VendorNeedId>;
  readonly onClose: () => void;
  readonly onSimulate?: (result: DisruptionResult | null) => void;
}

function renderScenarioSelector(
  selectedId: string,
  onSelect: (scenario: DisruptionScenario) => void,
) {
  return (
    <div>
      <label htmlFor="scenario-select" className="block text-xs font-semibold text-stone-700 mb-1">
        Select Disruption Scenario
      </label>
      <select
        id="scenario-select"
        value={selectedId}
        onChange={(e) => {
          const found = DISRUPTIONS.find((d) => d.id === e.target.value);
          if (found) onSelect(found);
        }}
        className="w-full p-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none"
      >
        {DISRUPTIONS.map((d) => (
          <option key={d.id} value={d.id}>
            [{d.kind.toUpperCase()}] {d.title}
          </option>
        ))}
      </select>
    </div>
  );
}

function renderComparisonRow(label: string, beforeVal: string, afterVal: string, isBad?: boolean) {
  return (
    <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100 last:border-0">
      <span className="text-stone-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-stone-400 line-through">{beforeVal}</span>
        <span className={`font-bold ${isBad ? 'text-red-700' : 'text-stone-900'}`}>{afterVal}</span>
      </div>
    </div>
  );
}

function renderDiffsList(diffs: DisruptionResult['diffs']) {
  if (diffs.length === 0) return null;
  return (
    <div>
      <h4 className="font-semibold text-stone-700 text-xs mb-1.5">
        Slipped Tasks ({diffs.length})
      </h4>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {diffs.map((d, idx) => (
          <div
            key={`${d.taskId}-${d.field}-${idx}`}
            className="text-[11px] p-1.5 bg-stone-100 rounded flex justify-between"
          >
            <span className="font-mono text-stone-800">
              {d.taskId} ({d.field})
            </span>
            <span className="text-red-700 font-semibold">
              {String(d.before)} &rarr; {String(d.after)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderAssessmentTable(res: DisruptionResult) {
  return (
    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
      <h4 className="font-bold text-stone-800 text-xs mb-2">Schedule Impact Assessment</h4>
      {renderComparisonRow(
        'Project Duration',
        `${res.before.durationDays.toFixed(1)} days`,
        `${res.after.durationDays.toFixed(1)} days`,
        res.deltaDays > 0,
      )}
      {renderComparisonRow(
        'Buffer Slack',
        `${res.before.bufferDays.toFixed(1)} days`,
        `${res.after.bufferDays.toFixed(1)} days`,
        res.after.bufferDays < 0,
      )}
      {renderComparisonRow(
        'P(On-Time)',
        `${(res.before.probability * 100).toFixed(0)}%`,
        `${(res.after.probability * 100).toFixed(0)}%`,
        res.after.probability < 0.8,
      )}
    </div>
  );
}

function renderSimulationResults(res: DisruptionResult, scenario: DisruptionScenario) {
  return (
    <div className="space-y-4 pt-3">
      <div
        className={`p-3 rounded-xl border text-xs ${res.covered ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}
      >
        <div className="font-bold mb-0.5">
          {res.covered ? '✓ Plan B Active (Covered)' : '⚠ No Plan B Held (Uncovered)'}
        </div>
        <p className="text-[11px] leading-relaxed">{scenario.backupPlan}</p>
      </div>

      {res.eventAtRisk && (
        <div
          role="alert"
          className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-bold"
        >
          🚨 EVENT AT RISK: Schedule buffer collapsed below zero!
        </div>
      )}

      {renderAssessmentTable(res)}
      {renderDiffsList(res.diffs)}
    </div>
  );
}

export function DisruptionDrawer({
  tasks,
  availableDays,
  backedUpNeeds,
  onClose,
  onSimulate,
}: DisruptionDrawerProps): React.JSX.Element {
  const [selectedScenario, setSelectedScenario] = useState<DisruptionScenario>(DISRUPTIONS[0]);

  const simResult = useMemo(() => {
    const res = simulateDisruption(tasks, selectedScenario, {
      availableDays,
      backedUp: backedUpNeeds,
    });
    return res.ok ? res.value : null;
  }, [tasks, selectedScenario, availableDays, backedUpNeeds]);

  return (
    <div
      role="dialog"
      aria-label="Disruption Simulator"
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between z-50 overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Disruption Simulator</h3>
            <p className="text-xs text-stone-500">
              Test graph resilience against real-world incidents.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close disruption simulator"
            className="p-1 text-stone-400 hover:text-stone-700 text-sm"
          >
            ✕
          </button>
        </div>

        {renderScenarioSelector(selectedScenario.id, setSelectedScenario)}

        {simResult && renderSimulationResults(simResult, selectedScenario)}
      </div>

      <div className="pt-4 border-t border-stone-200 flex gap-2">
        <button
          type="button"
          onClick={() => onSimulate?.(simResult)}
          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-amber-800 text-white hover:bg-amber-900 shadow-sm"
        >
          Highlight Ghost Path
        </button>
        <button
          type="button"
          onClick={() => onSimulate?.(null)}
          className="py-2 px-3 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
