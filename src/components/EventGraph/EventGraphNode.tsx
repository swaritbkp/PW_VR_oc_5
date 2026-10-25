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

export function EventGraphNode({
  node,
  isSelected,
  onClick,
  onKeyDown,
}: EventGraphNodeProps): React.JSX.Element {
  const isCrit = node.critical;
  const accentColor = CATEGORY_COLORS[node.lane] ?? '#64748B';
  const fill = isSelected ? '#FEF3C7' : node.done ? '#F0FDF4' : '#FFFFFF';
  const stroke = isSelected ? '#D97706' : isCrit ? '#DC2626' : '#CBD5E1';

  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={`${node.name}, ${node.lane}, starts ${node.startDate || 'unscheduled'}${
        isCrit ? ', critical path' : ''
      }`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="cursor-pointer focus:outline-none transition-transform"
      transform={`translate(${node.x}, ${node.y})`}
    >
      {node.hasBackup && (
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
      )}
      <rect
        x={0}
        y={0}
        width={node.w}
        height={node.h}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={isSelected ? 2.5 : isCrit ? 2 : 1}
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
      />
      <rect x={0} y={0} width={4} height={node.h} rx={2} fill={accentColor} />
      {node.done && (
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
      )}
      <text
        x={12}
        y={18}
        fontSize={11}
        fontWeight={isCrit ? '700' : '600'}
        fill="#0F172A"
        className="pointer-events-none select-none"
      >
        {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
      </text>
      <text
        x={12}
        y={32}
        fontSize={9.5}
        fill="#64748B"
        className="pointer-events-none select-none font-medium"
      >
        {node.startDate ? `${node.startDate}` : ''}
        {isCrit
          ? ' • Priority'
          : node.floatDays > 0
            ? ` • +${Math.round(node.floatDays)}d`
            : ' • 0d'}
      </text>
    </g>
  );
}
