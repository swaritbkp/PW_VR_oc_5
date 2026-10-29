'use client';

import React, { useState } from 'react';
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

const ConfettiCanvas = dynamic<{ readonly trigger?: number; readonly className?: string }>(
  () => import('../components/Celebration/ConfettiCanvas').then((m) => m.ConfettiCanvas),
  { ssr: false },
);

const CountdownGlow = dynamic<{ readonly targetDate: string; readonly label?: string }>(
  () => import('../components/Celebration/CountdownGlow').then((m) => m.CountdownGlow),
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
  const [celebrateTrigger, setCelebrateTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <section className="rounded-2xl glass p-6 sm:p-8">
        <h2 className="text-display font-black text-2xl text-stone-900 mb-4">Celebrate</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <CountdownGlow targetDate="2026-12-14T18:00:00.000Z" label="Countdown to celebration" />
          <button
            type="button"
            onClick={() => setCelebrateTrigger((t) => t + 1)}
            className="px-4 py-2 rounded-lg font-semibold text-white bg-stone-900 hover:bg-stone-800"
          >
            Fire Confetti
          </button>
          <ConfettiCanvas trigger={celebrateTrigger} />
        </div>
      </section>
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
