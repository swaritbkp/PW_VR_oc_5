'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { PlanState } from '@/lib/plan/propagate';
import type { VendorNeedId } from '@/lib/plan/types';
import type { VersionStore } from '@/lib/plan/versions';
import { pushVersion, restoreVersion, undo } from '@/lib/plan/versions';
import { buildTemplateTasks } from '@/lib/templates/catalog';

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

const TemplateGallery = dynamic(
  () => import('@/components/Templates/TemplateGallery').then((m) => m.TemplateGallery),
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

export type ModalType =
  | 'none'
  | 'templates'
  | 'whatif'
  | 'disruption'
  | 'share'
  | 'audit'
  | 'chaos'
  | 'dossier'
  | 'negotiate'
  | 'redflags';

export interface AppModalsProps {
  readonly activeModal: ModalType;
  readonly currentPlan: PlanState;
  readonly versionStore: VersionStore;
  readonly onClose: () => void;
  readonly setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>;
  readonly onOpenModal?: (modal: ModalType) => void;
}

function renderAuditModal(onClose: () => void) {
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

function renderTemplateModal(
  currentPlan: PlanState,
  onClose: () => void,
  setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>,
) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm"
          >
            ✕ Close
          </button>
        </div>
        <TemplateGallery
          onSelectTemplate={(tmpl) => {
            const tasks = buildTemplateTasks(tmpl);
            const np = {
              ...currentPlan,
              intake: { ...currentPlan.intake, eventType: tmpl.eventType },
              tasks,
            };
            setVersionStore((s) => pushVersion(s, np, `Switched to template ${tmpl.title}`));
            onClose();
          }}
        />
      </div>
    </div>
  );
}

function renderFeatureModal(activeModal: ModalType, currentPlan: PlanState, onClose: () => void) {
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
  return null;
}

export function AppModals({
  activeModal,
  currentPlan,
  versionStore,
  onClose,
  setVersionStore,
  onOpenModal,
}: AppModalsProps): React.JSX.Element | null {
  if (activeModal === 'none') return null;
  const feature = renderFeatureModal(activeModal, currentPlan, onClose);
  if (feature) return feature;
  if (activeModal === 'audit') return renderAuditModal(onClose);
  if (activeModal === 'templates')
    return renderTemplateModal(currentPlan, onClose, setVersionStore);
  if (activeModal === 'share') {
    return (
      <ShareSheet
        plan={currentPlan}
        onClose={onClose}
        onOpenDossier={onOpenModal ? () => onOpenModal('dossier') : undefined}
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
