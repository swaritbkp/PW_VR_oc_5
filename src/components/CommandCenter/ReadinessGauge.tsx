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
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 80 80">
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
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
            P(ready)
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-stone-500">
        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">P50: 98%</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">P80: {pct}%</span>
      </div>
    </div>
  );
}
