'use client';

import React, { useMemo } from 'react';
import {
  rankRisks,
  resilienceScore,
  type RankedRisk,
  type RiskContext,
} from '@/lib/resilience/resilience';

export interface RiskRegisterProps {
  readonly context: RiskContext;
  readonly onSelectRisk?: (risk: RankedRisk) => void;
}

function renderScoreGauge(score: number) {
  const color =
    score >= 80
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : score >= 50
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${color}`}>
      <div>
        <h4 className="font-bold text-xs">Plan B Resilience Score</h4>
        <p className="text-[11px] opacity-80">
          Share of coverable risk exposure secured with backups.
        </p>
      </div>
      <div className="text-2xl font-black font-mono" data-testid="resilience-score-gauge">
        {score}%
      </div>
    </div>
  );
}

function renderRiskStatusBadge(risk: RankedRisk) {
  if (risk.covered) {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
        Covered
      </span>
    );
  }
  if (risk.coverable) {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full">
        Uncovered
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-500 rounded-full">
      No Vendor Backup
    </span>
  );
}

function renderExposureStats(risk: RankedRisk) {
  return (
    <div className="flex items-center gap-4 text-[11px] text-stone-600">
      <span>
        Likelihood: <strong>{risk.likelihood}/5</strong>
      </span>
      <span>
        Impact: <strong>{risk.scenario.impact}/5</strong>
      </span>
      <span>
        Exposure: <strong className="font-mono text-stone-900">{risk.exposure}</strong>
      </span>
    </div>
  );
}

function renderRiskCard(risk: RankedRisk, onSelect?: (r: RankedRisk) => void) {
  return (
    <div
      key={risk.scenario.id}
      role="article"
      className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition-all space-y-2"
      data-testid={`risk-card-${risk.scenario.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {risk.scenario.kind}
          </span>
          <h5 className="font-bold text-stone-900 text-xs">{risk.scenario.title}</h5>
        </div>
        {renderRiskStatusBadge(risk)}
      </div>

      {renderExposureStats(risk)}

      <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
        <strong>Mitigation:</strong> {risk.scenario.backupPlan}
      </p>

      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(risk)}
          className="text-xs font-semibold text-amber-800 hover:text-amber-900"
        >
          Simulate this disruption &rarr;
        </button>
      )}
    </div>
  );
}

export function RiskRegister({ context, onSelectRisk }: RiskRegisterProps): React.JSX.Element {
  const risks = useMemo(() => rankRisks(context), [context]);
  const score = useMemo(() => resilienceScore(risks), [risks]);

  return (
    <div className="space-y-4">
      {renderScoreGauge(score)}

      <div className="space-y-2.5">
        <h4 className="font-bold text-stone-900 text-xs">
          Ranked Risk Register ({risks.length} Scenarios Evaluated)
        </h4>
        <div className="space-y-2">{risks.map((risk) => renderRiskCard(risk, onSelectRisk))}</div>
      </div>
    </div>
  );
}
