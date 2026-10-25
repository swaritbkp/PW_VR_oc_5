'use client';

import React from 'react';

interface TemplateCoverImageProps {
  readonly templateId: string;
  readonly title: string;
  readonly category: string;
  readonly outdoor: boolean;
  readonly accent: string;
}

/**
 * Cover image container with editorial art fallbacks for event templates in the template gallery.
 */
export function TemplateCoverImage({
  templateId,
  title,
  category,
  outdoor,
  accent,
}: TemplateCoverImageProps): React.JSX.Element {
  return (
    <div
      className="relative w-full h-36 rounded-2xl overflow-hidden mb-2 group shadow-xs"
      style={{
        backgroundColor: accent,
      }}
    >
      <img
        src={`/art/${templateId}.png`}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/20 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
            {category}
          </span>
          {outdoor ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-md">
              Outdoor
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-700/80 backdrop-blur-md">
              Indoor
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
