'use client';

import React from 'react';
import type { GraphNode } from '../../lib/graph/layout';
import type { TaskCategory } from '../../lib/plan/types';

interface EventGraphNodeProps {
  readonly node: GraphNode;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  planning: '#059669',
  venue: '#9A3412',
  permits: '#475569',
  food: '#D97706',
  decor: '#2563EB',
  media: '#7C3AED',
  entertainment: '#DB2777',
  attire: '#0891B2',
  invites: '#4F46E5',
  logistics: '#64748B',
  milestone: '#DC2626',
};

function getNodeColors(node: GraphNode, isSelected: boolean) {
  const accentColor = CATEGORY_COLORS[node.lane] ?? '#64748B';
  const fill = isSelected ? '#FEF3C7' : node.done ? '#F0FDF4' : '#FFFFFF';
  const stroke = isSelected ? '#D97706' : node.critical ? '#DC2626' : '#CBD5E1';
  const strokeWidth = isSelected ? 2.5 : node.critical ? 2 : 1;
  return { accentColor, fill, stroke, strokeWidth };
}

function getNodeAriaLabel(node: GraphNode): string {
  const critSuffix = node.critical ? ', critical path' : '';
  const dateStr = node.startDate || 'unscheduled';
  return `${node.name}, ${node.lane}, starts ${dateStr}${critSuffix}`;
}

function NodeBackupOutline({ node }: { readonly node: GraphNode }): React.JSX.Element | null {
  if (!node.hasBackup) return null;
  return (
    <rect
      x={-4}
      y={-4}
      width={node.w + 8}
      height={node.h + 8}
      rx={10}
      fill="none"
      stroke="#059669"
      strokeWidth={1.75}
      strokeDasharray="4 2"
    />
  );
}

function NodeCardBackground({
  node,
  fill,
  stroke,
  strokeWidth,
  accentColor,
}: {
  readonly node: GraphNode;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly accentColor: string;
}): React.JSX.Element {
  return (
    <>
      <NodeBackupOutline node={node} />
      <rect
        x={0}
        y={0}
        width={node.w}
        height={node.h}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
      />
      <rect x={0} y={0} width={4} height={node.h} rx={2} fill={accentColor} />
    </>
  );
}

function NodeDoneCheckmark({ node }: { readonly node: GraphNode }): React.JSX.Element | null {
  if (!node.done) return null;
  return (
    <text
      x={node.w - 18}
      y={17}
      fontSize={11}
      fill="#059669"
      fontWeight="bold"
      className="pointer-events-none select-none"
    >
      ✓
    </text>
  );
}

function splitNodeTitle(name: string): [string, string | null] {
  if (name.length <= 20) return [name, null];
  const breakPoint = name.lastIndexOf(' ', 20);
  if (breakPoint > 6) {
    const line1 = name.slice(0, breakPoint);
    const line2 = name.slice(breakPoint + 1);
    const trimmed2 = line2.length > 24 ? `${line2.slice(0, 22)}...` : line2;
    return [line1, trimmed2];
  }
  return [name.slice(0, 18), `${name.slice(18, 38)}...`];
}

function getTimingSuffix(node: GraphNode): string {
  if (node.critical) return ' • Priority';
  return node.floatDays > 0 ? ` • +${Math.round(node.floatDays)}d` : ' • 0d';
}

function SingleLineTitle({ title, timing, date }: { readonly title: string; readonly timing: string; readonly date?: string | null }) {
  return (
    <>
      <text x={12} y={18} fontSize={11} fontWeight="600" fill="#0F172A" className="pointer-events-none select-none">
        {title}
      </text>
      <text x={12} y={32} fontSize={9.5} fill="#64748B" className="pointer-events-none select-none font-medium">
        {date ? `${date}` : ''}{timing}
      </text>
    </>
  );
}

function MultiLineTitle({
  line1,
  line2,
  timing,
  date,
}: {
  readonly line1: string;
  readonly line2: string;
  readonly timing: string;
  readonly date?: string | null;
}) {
  return (
    <>
      <text x={12} y={14} fontSize={10} fontWeight="600" fill="#0F172A" className="pointer-events-none select-none">
        {line1}
      </text>
      <text x={12} y={25} fontSize={10} fontWeight="600" fill="#0F172A" className="pointer-events-none select-none">
        {line2}
      </text>
      <text x={12} y={36} fontSize={8.5} fill="#64748B" className="pointer-events-none select-none font-medium">
        {date ? `${date}` : ''}{timing}
      </text>
    </>
  );
}

function NodeCardText({ node }: { readonly node: GraphNode }): React.JSX.Element {
  const [line1, line2] = splitNodeTitle(node.name);
  const timing = getTimingSuffix(node);

  return (
    <>
      <NodeDoneCheckmark node={node} />
      {line2 ? (
        <MultiLineTitle line1={line1} line2={line2} timing={timing} date={node.startDate} />
      ) : (
        <SingleLineTitle title={line1} timing={timing} date={node.startDate} />
      )}
    </>
  );
}

/**
 * SVG node element representing an individual CPM task with category color coding, critical ribbon, and keyboard focus.
 */
export function EventGraphNode({
  node,
  isSelected,
  onClick,
  onKeyDown,
}: EventGraphNodeProps): React.JSX.Element {
  const { accentColor, fill, stroke, strokeWidth } = getNodeColors(node, isSelected);

  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={getNodeAriaLabel(node)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="cursor-pointer focus:outline-none transition-transform"
      transform={`translate(${node.x}, ${node.y})`}
    >
      <NodeCardBackground
        node={node}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        accentColor={accentColor}
      />
      <NodeCardText node={node} />
    </g>
  );
}
