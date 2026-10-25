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

function NodeCardText({ node }: { readonly node: GraphNode }): React.JSX.Element {
  const displayName = node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name;
  const timingSuffix = node.critical
    ? ' • Priority'
    : node.floatDays > 0
      ? ` • +${Math.round(node.floatDays)}d`
      : ' • 0d';

  return (
    <>
      <NodeDoneCheckmark node={node} />
      <text
        x={12}
        y={18}
        fontSize={11}
        fontWeight={node.critical ? '700' : '600'}
        fill="#0F172A"
        className="pointer-events-none select-none"
      >
        {displayName}
      </text>
      <text
        x={12}
        y={32}
        fontSize={9.5}
        fill="#64748B"
        className="pointer-events-none select-none font-medium"
      >
        {node.startDate ? `${node.startDate}` : ''}
        {timingSuffix}
      </text>
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
