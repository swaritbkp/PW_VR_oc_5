'use client';

import React from 'react';

export function ReadinessGauge({
  probability,
}: {
  readonly probability: number;
}): React.JSX.Element {
  const pct = Math.min(100, Math.max(0, Math.round(probability * 100)));
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (pct / 100) * circ;
  const strokeColor = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';

  return (
    <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs font-semibold text-stone-600">Timeline Health</span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            pct >= 80
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : 'bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          {pct >= 80 ? 'On Track' : 'Needs Attention'}
        </span>
      </div>
      <div className="relative w-22 h-22 flex items-center justify-center my-1">
        <svg className="w-22 h-22 -rotate-90 transform" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} stroke="#F1F5F9" strokeWidth="7" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={strokeColor}
            strokeWidth="7"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black tabular-nums tracking-tight text-stone-900">
            {pct}%
          </span>
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
            Feasible
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-stone-500 text-center">
        {pct >= 85 ? 'High confidence buffer' : 'Buffer tightened by dependencies'}
      </p>
    </div>
  );
}
