'use client';

import React from 'react';
import { GuidedJourneyBar } from '@/components/Journey/GuidedJourneyBar';
import { CelebrationConcierge } from '@/components/UI/CelebrationConcierge';
import { CommandCenter } from '@/components/CommandCenter/CommandCenter';
import { WorkspaceTabs } from '@/components/UI/WorkspaceTabs';
import { NodeInspector } from '@/components/NodeInspector/NodeInspector';
import type { HomePageState } from './useHomePageState';

function WorkspaceTopSection({ state }: { readonly state: HomePageState }): React.JSX.Element {
  const { currentPlan, doneCount, activeTab, setActiveTab, setSimulationRun, setActiveModal } = state;

  return (
    <>
      <GuidedJourneyBar
        journey={state.journey}
        onTriggerAction={state.handleJourneyAction}
        onSimulateTourStep={state.handleSimulateTourStep}
      />
      <CelebrationConcierge
        eventType={currentPlan.intake.eventType}
        city={currentPlan.intake.city}
        guests={currentPlan.intake.guests}
        daysLeft={currentPlan.targetDays}
        doneCount={doneCount}
        totalCount={currentPlan.tasks.length}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPlanB={() => {
          setSimulationRun(true);
          setActiveModal('disruption');
        }}
        onOpenWhatIf={() => setActiveModal('whatif')}
        onOpenChaos={() => {
          setSimulationRun(true);
          setActiveModal('chaos');
        }}
        onOpenDossier={() => setActiveModal('dossier')}
      />
    </>
  );
}

function WorkspaceBottomSection({ state }: { readonly state: HomePageState }): React.JSX.Element {
  const { currentPlan, activeTab } = state;

  return (
    <>
      {state.commandData && (
        <CommandCenter
          daysLeft={currentPlan.targetDays}
          probabilityOnTime={state.commandData.prob}
          budgetSummary={state.commandData.alloc}
          budgetReconciliation={state.commandData.recon}
          nextAction={state.commandData.nextTask}
          alerts={state.commandData.alerts}
          onSelectTask={(id) => state.setSelectedTaskId(id ?? null)}
          onOpenBudget={() => state.setActiveModal('budget')}
        />
      )}
      <WorkspaceTabs
        activeTab={activeTab}
        tasks={currentPlan.tasks}
        layout={state.layout}
        selectedTaskId={state.selectedTaskId}
        onSelectTaskId={state.setSelectedTaskId}
        onOpenVendorCategory={state.handleOpenVendorNeed}
        currentCity={currentPlan.intake.city}
        eventType={currentPlan.intake.eventType}
        eventDate={currentPlan.intake.date}
        guests={currentPlan.intake.guests}
        vendorCategory={state.vendorCategory}
        onBookVendor={state.handleBookVendor}
      />
    </>
  );
}

/**
 * Main dashboard content section rendering journey bar, concierge, command center, and workspace tabs.
 */
export function CelebrationWorkspaceSection({
  state,
}: {
  readonly state: HomePageState;
}): React.JSX.Element {
  return (
    <>
      <WorkspaceTopSection state={state} />
      <WorkspaceBottomSection state={state} />
    </>
  );
}

/**
 * Slide-out modal drawer for inspecting and modifying a selected node in the Event Graph.
 */
export function NodeInspectorOverlay({
  state,
}: {
  readonly state: HomePageState;
}): React.JSX.Element | null {
  if (!state.selectedNode) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => state.setSelectedTaskId(null)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md h-full shadow-2xl">
        <NodeInspector
          node={state.selectedNode}
          task={state.selectedTask}
          onClose={() => state.setSelectedTaskId(null)}
          onUpdateStatus={(taskId, st) => state.handleUpdateTaskStatus(taskId, Boolean(st.done))}
          onUpdateTask={state.handleUpdateTask}
        />
      </div>
    </div>
  );
}
