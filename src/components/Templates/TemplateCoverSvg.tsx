'use client';

import React from 'react';

export function TemplateCoverSvg({
  templateId,
  accent,
}: {
  readonly templateId: string;
  readonly accent: string;
}): React.JSX.Element {
  return (
    <div
      className="w-full h-24 rounded-xl overflow-hidden relative flex items-center justify-center mb-1"
      style={{
        background: `linear-gradient(135deg, ${accent}22, ${accent}55)`,
        border: `1px solid ${accent}44`,
      }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="30" cy="40" r="28" fill={accent} opacity="0.25" />
        <circle cx="170" cy="40" r="35" fill={accent} opacity="0.2" />
        <path
          d="M-10 60 Q 50 20, 100 50 T 210 40 L 210 90 L -10 90 Z"
          fill={accent}
          opacity="0.35"
        />
        <circle cx="100" cy="35" r="14" fill="#FFFFFF" opacity="0.85" />
        <circle cx="100" cy="35" r="8" fill={accent} />
      </svg>
      <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 shadow-2xs text-stone-800 backdrop-blur-xs">
        {templateId.split('-')[0].toUpperCase()}
      </span>
    </div>
  );
}
