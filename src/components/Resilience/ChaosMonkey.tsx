'use client';

import React, { useMemo, useState } from 'react';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import { simulateChaosCascade, type CompoundDisruptionResult } from '@/lib/resilience/chaos';
import {
  CANDIDATE_SCENARIOS,
  ChaosMonkeyHeader,
  MetricCard,
  PlanBComparisonBadge,
  RenderScenarioCheckboxes,
} from './ChaosMonkeySections';

export interface ChaosMonkeyProps {
  readonly tasks: readonly PlanTask[];
  readonly availableDays: number;
  readonly backedUpNeeds: ReadonlySet<VendorNeedId>;
  readonly onClose: () => void;
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
  const roundedSlippage = Math.round(slippage);
  const roundedBuffer = Math.round(remainingBuffer);
  const slipDisplay = roundedSlippage > 0 ? `+${roundedSlippage}d` : `${roundedSlippage}d`;
  return (
    <div className="grid grid-cols-3 gap-2">
      <MetricCard title="Net Slippage" value={slipDisplay} valueClass="text-rose-700" />
      <MetricCard title="Remaining Buffer" value={`${roundedBuffer}d`} />
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
  withoutResult,
  backedUpNeeds,
}: {
  readonly cascadeResult: CompoundDisruptionResult;
  readonly withoutResult: CompoundDisruptionResult | null;
  readonly backedUpNeeds: ReadonlySet<VendorNeedId>;
}): React.JSX.Element {
  return (
    <div className="space-y-3 pt-2">
      <RenderResultMetrics
        slippage={cascadeResult.netSlippageDays}
        remainingBuffer={cascadeResult.remainingBufferDays}
        catastrophic={cascadeResult.catastrophicFailure}
        prob={cascadeResult.disruptedProbability}
      />
      {withoutResult && (
        <PlanBComparisonBadge
          withoutSlippage={withoutResult.netSlippageDays}
          withSlippage={cascadeResult.netSlippageDays}
          coveredNeeds={backedUpNeeds}
        />
      )}
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

function useChaosSimulations(
  tasks: readonly PlanTask[],
  selectedIds: readonly string[],
  availableDays: number,
  backedUpNeeds: ReadonlySet<VendorNeedId>,
) {
  const withoutResult = useMemo(() => {
    const res = simulateChaosCascade(tasks, selectedIds, {
      availableDays,
      backedUp: new Set<VendorNeedId>(),
    });
    return res.ok ? res.value : null;
  }, [tasks, selectedIds, availableDays]);

  const cascadeResult = useMemo(() => {
    const res = simulateChaosCascade(tasks, selectedIds, { availableDays, backedUp: backedUpNeeds });
    return res.ok ? res.value : null;
  }, [tasks, selectedIds, availableDays, backedUpNeeds]);

  return { withoutResult, cascadeResult };
}

/**
 * Agentic Chaos Monkey simulator stress-testing compound cascading disruptions across the celebration schedule.
 */
export function ChaosMonkey(props: ChaosMonkeyProps): React.JSX.Element {
  const { tasks, availableDays, backedUpNeeds, onClose } = props;
  const { selectedIds, handleToggle, handleInjectRandomChaos } = useChaosMonkeySelection();
  const { withoutResult, cascadeResult } = useChaosSimulations(tasks, selectedIds, availableDays, backedUpNeeds);

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
        {cascadeResult && (
          <ChaosCascadeDetails
            cascadeResult={cascadeResult}
            withoutResult={withoutResult}
            backedUpNeeds={backedUpNeeds}
          />
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
