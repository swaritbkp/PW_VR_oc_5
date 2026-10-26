'use client';

import React, { useState } from 'react';
import type { GraphLayout } from '@/lib/graph/layout';
import type { EventType, PlanTask, VendorNeedId } from '@/lib/plan/types';
import type { Vendor, VendorStatus } from '@/lib/vendors/types';
import { EventGraph } from '../EventGraph/EventGraph';
import { CelebrationRoadmap } from '../EventGraph/CelebrationRoadmap';
import { VendorExplorer } from '../Vendors/VendorExplorer';
import { EventGraphList } from '../EventGraph/EventGraphList';

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
  readonly onApplyStrategy?: (targetOfferInr: number, vendorName: string, category: string) => void;
}

function GraphViewToggle({
  viewMode,
  setViewMode,
}: {
  readonly viewMode: 'graph' | 'list';
  readonly setViewMode: (mode: 'graph' | 'list') => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-1 bg-stone-200/70 p-1 rounded-xl text-xs backdrop-blur-xs">
      <button
        type="button"
        aria-pressed={viewMode === 'graph'}
        onClick={() => setViewMode('graph')}
        className={`px-3 py-1 rounded-lg font-bold transition-all ${
          viewMode === 'graph' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'
        }`}
      >
        Canvas
      </button>
      <button
        type="button"
        aria-pressed={viewMode === 'list'}
        onClick={() => setViewMode('list')}
        className={`px-3 py-1 rounded-lg font-bold transition-all ${
          viewMode === 'list' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'
        }`}
      >
        Timeline List
      </button>
    </div>
  );
}

function GraphViewContainer({
  showCanvas,
  layout,
  tasks,
  selectedTaskId,
  onSelectTaskId,
}: {
  readonly showCanvas: boolean;
  readonly layout: GraphLayout | null;
  readonly tasks: readonly PlanTask[];
  readonly selectedTaskId: string | null;
  readonly onSelectTaskId: (id: string | null) => void;
}): React.JSX.Element {
  if (showCanvas && layout) {
    return (
      <EventGraph
        layout={layout}
        tasks={tasks}
        selectedNodeId={selectedTaskId ?? undefined}
        onSelectNode={(id) => onSelectTaskId(id ?? null)}
      />
    );
  }
  return (
    <EventGraphList
      nodes={layout?.nodes ?? []}
      tasks={tasks}
      selectedNodeId={selectedTaskId ?? undefined}
      onSelectNode={(id) => onSelectTaskId(id)}
    />
  );
}

function WorkspaceGraphView({
  viewMode,
  setViewMode,
  layout,
  tasks,
  selectedTaskId,
  onSelectTaskId,
}: {
  readonly viewMode: 'graph' | 'list';
  readonly setViewMode: (mode: 'graph' | 'list') => void;
  readonly layout: GraphLayout | null;
  readonly tasks: readonly PlanTask[];
  readonly selectedTaskId: string | null;
  readonly onSelectTaskId: (id: string | null) => void;
}): React.JSX.Element {
  const showCanvas = viewMode === 'graph' && layout !== null;

  return (
    <div id="cpm-graph-canvas" className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
          <span>CPM Event Graph Timeline</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Interactive Network
          </span>
        </h2>
        <GraphViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
      <GraphViewContainer
        showCanvas={showCanvas}
        layout={layout}
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onSelectTaskId={onSelectTaskId}
      />
    </div>
  );
}

/**
 * Main workspace tabs switcher hosting the Celebration Roadmap, Vendor Explorer, and CPM Event Graph.
 */
export function WorkspaceTabs(props: WorkspaceTabsProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  if (props.activeTab === 'roadmap') {
    return (
      <CelebrationRoadmap
        tasks={props.tasks}
        selectedTaskId={props.selectedTaskId ?? undefined}
        onSelectTask={(id) => props.onSelectTaskId(id)}
        onOpenVendorSearch={props.onOpenVendorCategory}
      />
    );
  }

  if (props.activeTab === 'vendors') {
    return (
      <VendorExplorer
        initialCity={props.currentCity}
        initialCategory={props.vendorCategory}
        eventType={props.eventType}
        eventDate={props.eventDate}
        guests={props.guests}
        onBookVendor={props.onBookVendor}
        onApplyStrategy={props.onApplyStrategy}
      />
    );
  }

  return (
    <WorkspaceGraphView
      viewMode={viewMode}
      setViewMode={setViewMode}
      layout={props.layout}
      tasks={props.tasks}
      selectedTaskId={props.selectedTaskId}
      onSelectTaskId={props.onSelectTaskId}
    />
  );
}
