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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleView}
        className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors"
        aria-label="Toggle list view"
      >
        {viewMode === 'canvas' ? 'View as List' : 'View Canvas'}
      </button>
      {viewMode === 'canvas' && (
        <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => onZoomChange(-ZOOM_STEP)}
            className="px-2 py-1 hover:bg-stone-100 text-stone-700 text-xs font-bold"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(null)}
            className="px-1.5 text-[11px] font-semibold text-stone-600 tabular-nums"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(ZOOM_STEP)}
            className="px-2 py-1 hover:bg-stone-100 text-stone-700 text-xs font-bold"
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
      className={`relative flex flex-col border border-stone-200 rounded-2xl bg-white overflow-hidden shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-800">Event Graph Workspace</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200/60 text-stone-600">
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

      <div className="flex-1 overflow-auto p-4 min-h-[440px] bg-[#FAF9F6]">
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
