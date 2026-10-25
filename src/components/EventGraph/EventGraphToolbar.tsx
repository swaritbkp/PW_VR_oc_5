'use client';

import React from 'react';

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.0;
export const ZOOM_STEP = 0.15;

function ZoomButtons({
  zoom,
  onZoomChange,
}: {
  readonly zoom: number;
  readonly onZoomChange: (delta: number | null) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center border border-stone-200 rounded-xl bg-white overflow-hidden shadow-2xs">
      <button
        type="button"
        onClick={() => onZoomChange(-ZOOM_STEP)}
        className="px-2.5 py-1 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors"
        aria-label="Zoom out"
      >
        -
      </button>
      <button
        type="button"
        onClick={() => onZoomChange(null)}
        className="px-2 text-[11px] font-semibold text-stone-600 tabular-nums hover:text-amber-800 transition-colors"
        aria-label="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => onZoomChange(ZOOM_STEP)}
        className="px-2.5 py-1 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}

function ToolbarControls({
  viewMode,
  zoom,
  onToggleView,
  onZoomChange,
}: {
  readonly viewMode: 'canvas' | 'list';
  readonly zoom: number;
  readonly onToggleView: () => void;
  readonly onZoomChange: (delta: number | null) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-2xs">
      <button
        type="button"
        onClick={onToggleView}
        className="px-2.5 py-1 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white text-stone-700 font-semibold text-xs hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
        aria-label="Toggle list view"
      >
        {viewMode === 'canvas' ? 'View as List' : 'View Canvas'}
      </button>
      {viewMode === 'canvas' && <ZoomButtons zoom={zoom} onZoomChange={onZoomChange} />}
    </div>
  );
}

/**
 * Visual key guide for node color semantics.
 */
export function EventGraphVisualGuide(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-2 bg-stone-50/80 border-b border-stone-100 text-[11px] text-stone-600">
      <span className="font-bold text-stone-800">Visual Guide:</span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Priority Milestone
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" /> Flexible Date
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-xs border-2 border-dashed border-emerald-600 inline-block" />{' '}
        Plan B Backup
      </span>
    </div>
  );
}

/**
 * Header and toolbar controls for the event graph canvas.
 */
export function EventGraphHeader({
  nodeCount,
  edgeCount,
  viewMode,
  zoom,
  onToggleView,
  onZoomChange,
}: {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly viewMode: 'canvas' | 'list';
  readonly zoom: number;
  readonly onToggleView: () => void;
  readonly onZoomChange: (delta: number | null) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 bg-white/80 backdrop-blur-md text-xs">
      <div className="flex items-center gap-2.5">
        <span className="font-bold text-stone-900">Event Graph Canvas</span>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/60">
          {nodeCount} nodes &bull; {edgeCount} edges
        </span>
      </div>
      <ToolbarControls
        viewMode={viewMode}
        zoom={zoom}
        onToggleView={onToggleView}
        onZoomChange={onZoomChange}
      />
    </div>
  );
}
