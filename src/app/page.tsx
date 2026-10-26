'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AppHeader } from '@/components/UI/AppHeader';
import { AppModals } from '@/components/UI/AppModals';
import { useHomePageState } from './useHomePageState';
import { CelebrationWorkspaceSection, NodeInspectorOverlay } from './HomePageSections';

const AgentCopilot = dynamic(
  () => import('@/components/Concierge/AgentCopilot').then((m) => m.AgentCopilot),
  { ssr: false },
);

/**
 * Main application dashboard hosting the Event Graph, Command Center, and Living Plan workflows.
 */
export default function HomePage(): React.JSX.Element {
  const state = useHomePageState();
  const { currentPlan, activeModal, setActiveModal } = state;

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <AppHeader
        title={currentPlan.intake.eventType}
        city={currentPlan.intake.city}
        onOpen={setActiveModal}
        currentLang={state.language}
        onLanguageChange={state.setLanguage}
      />

      <main id="main-content" className="space-y-6" tabIndex={-1}>
        <CelebrationWorkspaceSection state={state} />
        <NodeInspectorOverlay state={state} />
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
      </main>
    </div>
  );
}
