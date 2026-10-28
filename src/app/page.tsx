'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AppHeader } from '@/components/UI/AppHeader';
import { useHomePageState, type HomePageState } from './useHomePageState';
import { CelebrationWorkspaceSection, NodeInspectorOverlay } from './HomePageSections';

const AppModals = dynamic(
  () => import('@/components/UI/AppModals').then((m) => m.AppModals),
  { ssr: false },
);

const AgentCopilot = dynamic(
  () => import('@/components/Concierge/AgentCopilot').then((m) => m.AgentCopilot),
  { ssr: false },
);

function WorkspaceModalsAndCopilot({ state }: { readonly state: HomePageState }): React.JSX.Element {
  const { currentPlan, activeModal, setActiveModal } = state;
  return (
    <>
      <AppModals
        activeModal={activeModal}
        currentPlan={currentPlan}
        versionStore={state.versionStore}
        vendorSelections={state.vendorSelections}
        onClose={() => setActiveModal('none')}
        setVersionStore={state.setVersionStore}
        onOpenModal={setActiveModal}
        onImportPlan={state.handleImportPlan}
        onUpdateBudgetLines={state.handleUpdateBudgetLines}
        onApplyIntake={state.handleApplyIntake}
        onApplyStrategy={state.handleApplyNegotiationStrategy}
      />
      <AgentCopilot
        isOpen={state.isCopilotOpen}
        onToggle={() => state.setIsCopilotOpen(!state.isCopilotOpen)}
        onClose={() => state.setIsCopilotOpen(false)}
        onExecuteAction={state.handleExecuteAgentAction}
      />
    </>
  );
}

/**
 * Main application dashboard hosting the Event Graph, Command Center, and Living Plan workflows.
 */
export default function HomePage(): React.JSX.Element {
  const state = useHomePageState();
  const { currentPlan, setActiveModal } = state;

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <AppHeader
        title={currentPlan.intake.eventType}
        city={currentPlan.intake.city}
        onOpen={setActiveModal}
        currentLang={state.language}
        onLanguageChange={state.setLanguage}
      />
      <main id="main-workspace" className="space-y-6" tabIndex={-1}>
        <div id="workspace-status" aria-live="polite" aria-atomic="true" className="sr-only" />
        <CelebrationWorkspaceSection state={state} />
        <NodeInspectorOverlay state={state} />
        <WorkspaceModalsAndCopilot state={state} />
      </main>
    </div>
  );
}
