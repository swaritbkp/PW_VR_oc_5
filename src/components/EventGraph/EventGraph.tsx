'use client';

import React, { useState, useCallback } from 'react';
import type { GraphLayout, GraphNode, GraphEdge } from '@/lib/graph/layout';
import type { PlanTask } from '@/lib/plan/types';
import { EventGraphCanvas } from './EventGraphCanvas';
import { EventGraphList } from './EventGraphList';
import {
  EventGraphHeader,
  EventGraphVisualGuide,
  MAX_ZOOM,
  MIN_ZOOM,
} from './EventGraphToolbar';

export interface EventGraphProps {
  readonly layout: GraphLayout;
  readonly tasks?: readonly PlanTask[];
  readonly selectedNodeId?: string;
  readonly onSelectNode: (nodeId: string | undefined) => void;
  readonly className?: string;
}

function findNextNode(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  currentId: string,
  key: string,
): string | undefined {
  const cur = nodes.find((n) => n.id === currentId);
  if (!cur) return undefined;
  if (key === 'ArrowRight') return edges.find((e) => e.from === currentId)?.to;
  if (key === 'ArrowLeft') return edges.find((e) => e.to === currentId)?.from;
  const sameLane = nodes.filter((n) => n.lane === cur.lane && n.id !== currentId);
  if (key === 'ArrowDown') return sameLane.find((n) => n.y > cur.y)?.id;
  if (key === 'ArrowUp') return sameLane.find((n) => n.y < cur.y)?.id;
  return undefined;
}

function EventGraphCanvasView({
  layout,
  zoom,
  selectedNodeId,
  onSelectNode,
  onKeyDown,
}: {
  readonly layout: GraphLayout;
  readonly zoom: number;
  readonly selectedNodeId?: string;
  readonly onSelectNode: (nodeId: string | undefined) => void;
  readonly onKeyDown: (e: React.KeyboardEvent, nodeId: string) => void;
}): React.JSX.Element {
  return (
    <div
      role="application"
      aria-label="Interactive celebration event timeline graph"
      className="inline-block min-w-full"
    >
      <EventGraphCanvas
        layout={layout}
        zoom={zoom}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

function EventGraphBody({
  viewMode,
  layout,
  tasks,
  zoom,
  selectedNodeId,
  onSelectNode,
  onKeyDown,
}: {
  readonly viewMode: 'canvas' | 'list';
  readonly layout: GraphLayout;
  readonly tasks?: readonly PlanTask[];
  readonly zoom: number;
  readonly selectedNodeId?: string;
  readonly onSelectNode: (nodeId: string | undefined) => void;
  readonly onKeyDown: (e: React.KeyboardEvent, nodeId: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex-1 overflow-auto p-6 min-h-[500px] bg-[#FAF9F6]">
      {viewMode === 'list' ? (
        <EventGraphList
          nodes={layout.nodes}
          tasks={tasks ?? []}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => onSelectNode(id)}
        />
      ) : (
        <EventGraphCanvasView
          layout={layout}
          zoom={zoom}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  );
}

function useGraphKeyNav(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  onSelectNode: (id?: string) => void,
) {
  return useCallback(
    (e: React.KeyboardEvent, nodeId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectNode(nodeId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelectNode(undefined);
      } else if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const nextId = findNextNode(nodes, edges, nodeId, e.key);
        if (nextId) onSelectNode(nextId);
      }
    },
    [nodes, edges, onSelectNode],
  );
}

/**
 * Interactive CPM Event Graph with SVG canvas swimlanes, zoom controls, and accessible list view toggle.
 */
export function EventGraph({
  layout,
  tasks,
  selectedNodeId,
  onSelectNode,
  className = '',
}: EventGraphProps): React.JSX.Element {
  const [zoom, setZoom] = useState(1.0);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const handleKeyDown = useGraphKeyNav(layout.nodes, layout.edges, onSelectNode);
  const changeZoom = (d: number | null) =>
    setZoom((z) => (d === null ? 1.0 : Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + d))));

  return (
    <div
      className={`relative flex flex-col border border-stone-200/90 rounded-3xl bg-white overflow-hidden shadow-lg shadow-stone-900/5 ${className}`}
    >
      <EventGraphHeader
        nodeCount={layout.nodes.length}
        edgeCount={layout.edges.length}
        viewMode={viewMode}
        zoom={zoom}
        onToggleView={() => setViewMode((m) => (m === 'canvas' ? 'list' : 'canvas'))}
        onZoomChange={changeZoom}
      />
      <EventGraphVisualGuide />
      <EventGraphBody
        viewMode={viewMode}
        layout={layout}
        tasks={tasks}
        zoom={zoom}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
