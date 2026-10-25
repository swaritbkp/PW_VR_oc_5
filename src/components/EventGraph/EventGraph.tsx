'use client';

import React, { useState, useCallback } from 'react';
import type { GraphLayout, GraphNode, GraphEdge } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';
import { EventGraphList } from './EventGraphList';
import { EventGraphCanvas } from './EventGraphCanvas';

export interface EventGraphProps {
  readonly layout: GraphLayout;
  readonly tasks: readonly PlanTask[];
  readonly selectedNodeId?: string;
  readonly onSelectNode: (id: string | undefined) => void;
  readonly className?: string;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;

function findNextNode(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  currentId: string,
  key: string,
): string | undefined {
  if (key === 'ArrowRight') {
    return edges.find((e) => e.from === currentId)?.to;
  }
  if (key === 'ArrowLeft') {
    return edges.find((e) => e.to === currentId)?.from;
  }
  const cur = nodes.find((n) => n.id === currentId);
  if (!cur) return undefined;
  const sameLane = nodes.filter((n) => n.lane === cur.lane && n.id !== currentId);
  if (key === 'ArrowDown') return sameLane.find((n) => n.y > cur.y)?.id;
  if (key === 'ArrowUp') return sameLane.find((n) => n.y < cur.y)?.id;
  return undefined;
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
      {viewMode === 'canvas' && (
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
      )}
    </div>
  );
}

export function EventGraph({
  layout,
  tasks,
  selectedNodeId,
  onSelectNode,
  className = '',
}: EventGraphProps): React.JSX.Element {
  const [zoom, setZoom] = useState(1.0);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, nodeId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectNode(nodeId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelectNode(undefined);
      } else if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const nextId = findNextNode(layout.nodes, layout.edges, nodeId, e.key);
        if (nextId) onSelectNode(nextId);
      }
    },
    [layout.nodes, layout.edges, onSelectNode],
  );

  const handleZoom = (delta: number | null) => {
    if (delta === null) setZoom(1.0);
    else setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  };

  return (
    <div
      className={`relative flex flex-col border border-stone-200/90 rounded-3xl bg-white overflow-hidden shadow-lg shadow-stone-900/5 ${className}`}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 bg-white/80 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-stone-900">Event Graph Canvas</span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/60">
            {layout.nodes.length} nodes &bull; {layout.edges.length} edges
          </span>
        </div>
        <ToolbarControls
          viewMode={viewMode}
          zoom={zoom}
          onToggleView={() => setViewMode((m) => (m === 'canvas' ? 'list' : 'canvas'))}
          onZoomChange={handleZoom}
        />
      </div>

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

      <div className="flex-1 overflow-auto p-6 min-h-[500px] bg-[#FAF9F6]">
        {viewMode === 'list' ? (
          <EventGraphList
            nodes={layout.nodes}
            tasks={tasks}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => onSelectNode(id)}
          />
        ) : (
          <div className="inline-block min-w-full">
            <EventGraphCanvas
              layout={layout}
              zoom={zoom}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
      </div>
    </div>
  );
}
