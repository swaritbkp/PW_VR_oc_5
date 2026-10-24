'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { GraphLayout, GraphNode, GraphEdge } from '../../lib/graph/layout';
import type { PlanTask } from '../../lib/plan/types';
import { EventGraphList } from './EventGraphList';

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
const CORNER_RADIUS = 6;

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

function renderEdges(edges: readonly GraphEdge[]) {
  return edges.map((e) => {
    const isCrit = e.critical;
    const midX = (e.x1 + e.x2) / 2;
    const d = `M ${e.x1} ${e.y1} C ${midX} ${e.y1}, ${midX} ${e.y2}, ${e.x2} ${e.y2}`;
    return (
      <path
        key={`${e.from}-${e.to}`}
        d={d}
        fill="none"
        stroke={isCrit ? '#DC2626' : '#94A3B8'}
        strokeWidth={isCrit ? 3.5 : 1.5}
        strokeOpacity={isCrit ? 0.95 : 0.6}
        className={isCrit ? 'transition-all' : ''}
      />
    );
  });
}

function renderNode(
  node: GraphNode,
  isSelected: boolean,
  onClick: () => void,
  onKeyDown: (e: React.KeyboardEvent) => void,
) {
  const isCrit = node.critical;
  const fill = isSelected ? '#FEF3C7' : node.done ? '#F0FDF4' : '#FFFFFF';
  const stroke = isSelected ? '#D97706' : isCrit ? '#DC2626' : '#64748B';

  return (
    <g
      key={node.id}
      tabIndex={0}
      role="button"
      aria-label={`${node.name}, ${node.lane}, starts ${node.startDate || 'unscheduled'}${
        isCrit ? ', critical path' : ''
      }`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="cursor-pointer focus:outline-none"
      transform={`translate(${node.x}, ${node.y})`}
    >
      {node.hasBackup && (
        <rect
          x={-4}
          y={-4}
          width={node.w + 8}
          height={node.h + 8}
          rx={CORNER_RADIUS + 2}
          fill="none"
          stroke="#4F46E5"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}
      <rect
        x={0}
        y={0}
        width={node.w}
        height={node.h}
        rx={CORNER_RADIUS}
        fill={fill}
        stroke={stroke}
        strokeWidth={isSelected ? 2.5 : isCrit ? 2 : 1}
      />
      <text
        x={10}
        y={20}
        fontSize={12}
        fontWeight={isCrit ? '600' : '500'}
        fill="#0F172A"
        className="pointer-events-none select-none"
      >
        {node.name.length > 22 ? `${node.name.slice(0, 20)}...` : node.name}
      </text>
      <text x={10} y={34} fontSize={10} fill="#64748B" className="pointer-events-none select-none">
        {node.startDate ? `${node.startDate}` : ''}
        {node.floatDays > 0 ? ` • +${Math.round(node.floatDays)}d` : ' • 0d'}
      </text>
    </g>
  );
}

/** Interactive SVG Event Graph canvas with full keyboard navigation (AC7, AC16, AC19, AC29). */
export function EventGraph({
  layout,
  tasks,
  selectedNodeId,
  onSelectNode,
  className = '',
}: EventGraphProps) {
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

  const renderedElements = useMemo(() => {
    return (
      <svg
        width={layout.width * zoom}
        height={layout.height * zoom}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="application"
        aria-label="Event dependency and timeline graph"
        className="touch-pan-x touch-pan-y"
      >
        <g>{renderEdges(layout.edges)}</g>
        <g>
          {layout.nodes.map((n) =>
            renderNode(
              n,
              n.id === selectedNodeId,
              () => onSelectNode(n.id),
              (e) => handleKeyDown(e, n.id),
            ),
          )}
        </g>
      </svg>
    );
  }, [layout, zoom, selectedNodeId, onSelectNode, handleKeyDown]);

  return (
    <div
      className={`relative flex flex-col border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 bg-neutral-50/70 text-xs">
        <span className="font-semibold text-neutral-700">Event Graph Workspace</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'canvas' ? 'list' : 'canvas')}
            className="px-2.5 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
            aria-label="Toggle list view"
          >
            {viewMode === 'canvas' ? 'View as List' : 'View Canvas'}
          </button>
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1 border border-neutral-300 rounded bg-white">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
                className="px-2 py-0.5 hover:bg-neutral-100"
                aria-label="Zoom out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="px-1 text-[11px] text-neutral-600"
                aria-label="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
                className="px-2 py-0.5 hover:bg-neutral-100"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 min-h-[360px]">
        {viewMode === 'list' ? (
          <EventGraphList
            nodes={layout.nodes}
            tasks={tasks}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => onSelectNode(id)}
          />
        ) : (
          <div className="inline-block min-w-full">{renderedElements}</div>
        )}
      </div>
    </div>
  );
}
