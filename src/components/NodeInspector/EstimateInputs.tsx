'use client';

import React from 'react';

function EstimateInputItem({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly onChange: (v: number) => void;
}): React.JSX.Element {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
        {label}
      </label>
      <input
        id={id}
        aria-label={`${label} duration days`}
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full p-1.5 text-xs font-bold text-center border border-stone-200 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}

/**
 * Three-point PERT duration estimate input group (optimistic, most likely, pessimistic).
 */
export function EstimateInputs({
  opt,
  ml,
  pess,
  onChange,
}: {
  readonly opt: number;
  readonly ml: number;
  readonly pess: number;
  readonly onChange: (field: 'optimistic' | 'mostLikely' | 'pessimistic', v: number) => void;
}): React.JSX.Element {
  const expected = Math.round(((opt + 4 * ml + pess) / 6) * 10) / 10;

  return (
    <div className="space-y-1.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-stone-800">Duration Estimates (PERT Days)</span>
        <span className="font-bold text-amber-900 tabular-nums">Expected: {expected}d</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <EstimateInputItem id="input-opt" label="Optimistic" value={opt} onChange={(v) => onChange('optimistic', v)} />
        <EstimateInputItem id="input-ml" label="Most Likely" value={ml} onChange={(v) => onChange('mostLikely', v)} />
        <EstimateInputItem id="input-pess" label="Pessimistic" value={pess} onChange={(v) => onChange('pessimistic', v)} />
      </div>
    </div>
  );
}
