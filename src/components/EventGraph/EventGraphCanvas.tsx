'use client';

import React from 'react';
import type { GraphLayout } from '../../lib/graph/layout';
import { EventGraphNode } from './EventGraphNode';

interface EventGraphCanvasProps {
  readonly layout: GraphLayout;
  readonly zoom: number;
  readonly selectedNodeId?: string;
  readonly onSelectNode: (id: string | undefined) => void;
  readonly onKeyDown: (e: React.KeyboardEvent, id: string) => void;
}

function renderEdges(edges: GraphLayout['edges']) {
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

function renderLanes(lanes: GraphLayout['lanes'], width: number) {
  return lanes.map((l, i) => (
    <g key={l.lane}>
      <rect
        x={0}
        y={l.y - 8}
        width={width}
        height={l.height + 16}
        fill={i % 2 === 0 ? '#FFFFFF' : '#FAF9F6'}
        opacity={0.8}
      />
      <text
        x={12}
        y={l.y + l.height / 2 + 4}
        fontSize={10}
        fontWeight="700"
        fill="#94A3B8"
        letterSpacing="0.05em"
        className="uppercase select-none pointer-events-none"
      >
        {l.lane}
      </text>
    </g>
  ));
}

function renderTicks(ticks: GraphLayout['ticks'], height: number) {
  return ticks.map((t) => (
    <g key={`tick-${t.offsetDays}`}>
      <line
        x1={t.x}
        y1={0}
        x2={t.x}
        y2={height}
        stroke="#E2E8F0"
        strokeDasharray="3 3"
        opacity={0.7}
      />
      <text
        x={t.x + 4}
        y={16}
        fontSize={10}
        fill="#64748B"
        fontWeight="600"
        className="select-none"
      >
        {t.date ?? `Day ${t.offsetDays}`}
      </text>
    </g>
  ));
}

function renderMilestones(todayX: number, eventX: number, height: number) {
  return (
    <>
      <line
        x1={todayX}
        y1={0}
        x2={todayX}
        y2={height}
        stroke="#059669"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <text x={todayX + 4} y={32} fontSize={10} fill="#059669" fontWeight="bold">
        TODAY
      </text>
      <line x1={eventX} y1={0} x2={eventX} y2={height} stroke="#DC2626" strokeWidth={2.5} />
      <polygon
        points={`${eventX},12 ${eventX + 8},22 ${eventX},32 ${eventX - 8},22`}
        fill="#DC2626"
      />
      <text x={eventX + 12} y={26} fontSize={11} fill="#DC2626" fontWeight="bold">
        EVENT DAY
      </text>
    </>
  );
}

/**
 * Renders the responsive SVG canvas with dependency bezier edges, swimlanes, and interactive milestone nodes.
 */
export function EventGraphCanvas({
  layout,
  zoom,
  selectedNodeId,
  onSelectNode,
  onKeyDown,
}: EventGraphCanvasProps): React.JSX.Element {
  return (
    <svg
      role="region"
      aria-label="Interactive celebration event timeline graph showing task dependencies and critical path"
      width={layout.width * zoom}
      height={layout.height * zoom}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="touch-pan-x touch-pan-y"
    >
      <g>{renderLanes(layout.lanes, layout.width)}</g>
      <g>
        {renderTicks(layout.ticks, layout.height)}
        {renderMilestones(layout.todayX, layout.eventX, layout.height)}
      </g>
      <g>{renderEdges(layout.edges)}</g>
      <g>
        {layout.nodes.map((n) => (
          <EventGraphNode
            key={n.id}
            node={n}
            isSelected={n.id === selectedNodeId}
            onClick={() => onSelectNode(n.id)}
            onKeyDown={(e) => onKeyDown(e, n.id)}
          />
        ))}
      </g>
    </svg>
  );
}
