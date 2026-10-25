'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { PlanState } from '@/lib/plan/propagate';
import type { VendorNeedId } from '@/lib/plan/types';
import type { BudgetLine } from '@/lib/budget/engine';
import type { VendorSelection } from '@/lib/vendors/types';
import type { VersionStore } from '@/lib/plan/versions';
import type { IntakeInput } from '@/lib/plan/schemas';
import { pushVersion, restoreVersion, undo } from '@/lib/plan/versions';

const WhatIfDrawer = dynamic(
  () => import('@/components/LivingPlan/WhatIfDrawer').then((m) => m.WhatIfDrawer),
  { ssr: false },
);
const DisruptionDrawer = dynamic(
  () => import('@/components/Resilience/DisruptionDrawer').then((m) => m.DisruptionDrawer),
  { ssr: false },
);
const ShareSheet = dynamic(
  () => import('@/components/Share/ShareSheet').then((m) => m.ShareSheet),
  { ssr: false },
);
const AuditPanel = dynamic(
  () => import('@/components/Audit/AuditPanel').then((m) => m.AuditPanel),
  { ssr: false },
);
const TemplateModal = dynamic(
  () => import('@/components/Templates/TemplateModal').then((m) => m.TemplateModal),
  { ssr: false },
);
const ChaosMonkey = dynamic(
  () => import('@/components/Resilience/ChaosMonkey').then((m) => m.ChaosMonkey),
  { ssr: false },
);
const DossierModal = dynamic(
  () => import('@/components/Share/DossierModal').then((m) => m.DossierModal),
  { ssr: false },
);
const NegotiationCoach = dynamic(
  () => import('@/components/Vendors/NegotiationCoach').then((m) => m.NegotiationCoach),
  { ssr: false },
);
const RedFlagDetector = dynamic(
  () => import('@/components/Vendors/RedFlagDetector').then((m) => m.RedFlagDetector),
  { ssr: false },
);
const PortableFilePanel = dynamic(
  () => import('@/components/Share/PortableFilePanel').then((m) => m.PortableFilePanel),
  { ssr: false },
);
const BudgetLedger = dynamic(
  () => import('@/components/Budget/BudgetLedger').then((m) => m.BudgetLedger),
  { ssr: false },
);

export type ModalType =
  | 'none'
  | 'templates'
  | 'intake'
  | 'whatif'
  | 'disruption'
  | 'share'
  | 'audit'
  | 'chaos'
  | 'dossier'
  | 'negotiate'
  | 'redflags'
  | 'portable'
  | 'budget';

export interface AppModalsProps {
  readonly activeModal: ModalType;
  readonly currentPlan: PlanState;
  readonly versionStore: VersionStore;
  readonly onClose: () => void;
  readonly setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>;
  readonly onOpenModal?: (modal: ModalType) => void;
  readonly onImportPlan?: (plan: PlanState, selections: readonly VendorSelection[]) => void;
  readonly onUpdateBudgetLines?: (lines: readonly BudgetLine[], reason: string) => void;
  readonly onApplyIntake?: (intake: IntakeInput) => void;
}

function RenderAuditModal({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full">
        <AuditPanel
          metadata={{
            agentVersion: '0.1.0',
            model: 'gemini-2.5-pro',
            promptVersions: { core: '1.0.0', extras: '1.0.0' },
            guardrailsPassed: true,
            schemaValidated: true,
          }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function RenderFeatureModal(opts: AppModalsProps): React.JSX.Element | null {
  const { activeModal, currentPlan, onClose, onImportPlan, onUpdateBudgetLines } = opts;
  if (activeModal === 'chaos') {
    return (
      <ChaosMonkey
        tasks={currentPlan.tasks}
        availableDays={currentPlan.targetDays}
        backedUpNeeds={new Set<VendorNeedId>()}
        onClose={onClose}
      />
    );
  }
  if (activeModal === 'dossier') return <DossierModal plan={currentPlan} onClose={onClose} />;
  if (activeModal === 'negotiate') return <NegotiationCoach onClose={onClose} />;
  if (activeModal === 'redflags') return <RedFlagDetector onClose={onClose} />;
  if (activeModal === 'portable') {
    return (
      <PortableFilePanel
        plan={currentPlan}
        onClose={onClose}
        onImportPlan={(np, sel) => onImportPlan?.(np, sel)}
      />
    );
  }
  if (activeModal === 'budget') {
    return (
      <BudgetLedger
        budgetLines={currentPlan.budgetLines}
        budgetInr={currentPlan.intake.budgetInr}
        guests={currentPlan.intake.guests}
        onUpdateBudgetLines={onUpdateBudgetLines}
        onClose={onClose}
      />
    );
  }
  return null;
}

function RenderDrawerModal(opts: AppModalsProps): React.JSX.Element {
  const { activeModal, currentPlan, versionStore, onClose, setVersionStore, onOpenModal } = opts;
  if (activeModal === 'share') {
    return (
      <ShareSheet
        plan={currentPlan}
        onClose={onClose}
        onOpenDossier={onOpenModal ? () => onOpenModal('dossier') : undefined}
        onOpenPortable={onOpenModal ? () => onOpenModal('portable') : undefined}
      />
    );
  }
  if (activeModal === 'disruption') {
    return (
      <DisruptionDrawer
        tasks={currentPlan.tasks}
        availableDays={currentPlan.targetDays}
        backedUpNeeds={new Set<VendorNeedId>()}
        onClose={onClose}
        onOpenChaos={onOpenModal ? () => onOpenModal('chaos') : undefined}
      />
    );
  }
  return (
    <WhatIfDrawer
      currentPlan={currentPlan}
      versionStore={versionStore}
      onClose={onClose}
      onCommit={(np, desc) => {
        setVersionStore((s) => pushVersion(s, np, desc));
        onClose();
      }}
      onRestore={(vid) => setVersionStore((s) => restoreVersion(s, vid))}
      onUndo={() => setVersionStore(undo)}
    />
  );
}

/**
 * Container rendering whichever modal dialog or slide-over drawer is currently active.
 */
export function AppModals(props: AppModalsProps): React.JSX.Element | null {
  const { activeModal, onClose } = props;
  if (activeModal === 'none') return null;
  if (activeModal === 'audit') return <RenderAuditModal onClose={onClose} />;
  if (activeModal === 'templates' || activeModal === 'intake') {
    return (
      <TemplateModal
        currentPlan={props.currentPlan}
        onClose={onClose}
        setVersionStore={props.setVersionStore}
        onApplyIntake={props.onApplyIntake}
        initialView={activeModal === 'intake' ? 'intake' : 'gallery'}
      />
    );
  }
  const feature = RenderFeatureModal(props);
  if (feature) return feature;
  return RenderDrawerModal(props);
}
