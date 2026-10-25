'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { GraphLayout } from '@/lib/graph/layout';
import type { EventType, PlanTask, VendorNeedId } from '@/lib/plan/types';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';
import { CelebrationRoadmap } from '../EventGraph/CelebrationRoadmap';
import { VendorExplorer } from '../Vendors/VendorExplorer';
import { EventGraphList } from '../EventGraph/EventGraphList';

const EventGraph = dynamic(() => import('../EventGraph/EventGraph').then((m) => m.EventGraph), {
  ssr: false,
  loading: () => (
    <div className="p-12 text-center text-xs text-stone-400">Loading graph canvas...</div>
  ),
});

export interface WorkspaceTabsProps {
  readonly activeTab: 'roadmap' | 'vendors' | 'graph';
  readonly tasks: readonly PlanTask[];
  readonly layout: GraphLayout | null;
  readonly selectedTaskId: string | null;
  readonly onSelectTaskId: (id: string | null) => void;
  readonly onOpenVendorCategory: (need: string) => void;
  readonly currentCity: string;
  readonly eventType: EventType;
  readonly eventDate: string;
  readonly guests: number;
  readonly vendorCategory?: VendorNeedId;
  readonly onBookVendor: (vendor: Vendor, status: VendorStatus, quoteInr?: number) => void;
}

export function WorkspaceTabs({
  activeTab,
  tasks,
  layout,
  selectedTaskId,
  onSelectTaskId,
  onOpenVendorCategory,
  currentCity,
  eventType,
  eventDate,
  guests,
  vendorCategory,
  onBookVendor,
}: WorkspaceTabsProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  if (activeTab === 'roadmap') {
    return (
      <CelebrationRoadmap
        tasks={tasks}
        selectedTaskId={selectedTaskId ?? undefined}
        onSelectTask={(id) => onSelectTaskId(id)}
        onOpenVendorSearch={onOpenVendorCategory}
      />
    );
  }

  if (activeTab === 'vendors') {
    return (
      <VendorExplorer
        initialCity={currentCity}
        initialCategory={vendorCategory}
        eventType={eventType}
        eventDate={eventDate}
        guests={guests}
        onBookVendor={onBookVendor}
      />
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
          <span>CPM Event Graph Timeline</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Interactive Network
          </span>
        </h2>
        <div className="flex gap-1 bg-stone-200/70 p-1 rounded-xl text-xs backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'graph'
                ? 'bg-white shadow-xs text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Canvas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white shadow-xs text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Timeline List
          </button>
        </div>
      </div>

      {viewMode === 'graph' && layout ? (
        <EventGraph
          layout={layout}
          tasks={tasks}
          selectedNodeId={selectedTaskId ?? undefined}
          onSelectNode={(id) => onSelectTaskId(id ?? null)}
        />
      ) : (
        <EventGraphList
          nodes={layout?.nodes ?? []}
          tasks={tasks}
          selectedNodeId={selectedTaskId ?? undefined}
          onSelectNode={(id) => onSelectTaskId(id)}
        />
      )}
    </div>
  );
}
