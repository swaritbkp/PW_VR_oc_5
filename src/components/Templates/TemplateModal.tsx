'use client';

import React, { useState } from 'react';
import type { PlanState } from '@/lib/plan/propagate';
import type { VersionStore } from '@/lib/plan/versions';
import type { IntakeInput } from '@/lib/plan/schemas';
import { pushVersion } from '@/lib/plan/versions';
import { buildTemplateTasks } from '@/lib/templates/catalog';
import { TemplateGallery } from './TemplateGallery';
import { IntakeSheet } from './IntakeSheet';

export interface TemplateModalProps {
  readonly currentPlan: PlanState;
  readonly onClose: () => void;
  readonly setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>;
  readonly onApplyIntake?: (intake: IntakeInput) => void;
  readonly initialView?: 'gallery' | 'intake';
}

function TemplateModalNavTabs({
  view,
  onSwitchView,
}: {
  readonly view: 'gallery' | 'intake';
  readonly onSwitchView: (v: 'gallery' | 'intake') => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onSwitchView('gallery')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
          view === 'gallery' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        }`}
      >
        Curated Templates
      </button>
      <button
        type="button"
        id="open-intake-tab-btn"
        onClick={() => onSwitchView('intake')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
          view === 'intake' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        }`}
      >
        Custom Plan Intake Sheet
      </button>
    </div>
  );
}

function TemplateModalContent({
  view,
  currentPlan,
  onClose,
  setVersionStore,
  onApplyIntake,
}: TemplateModalProps & { readonly view: 'gallery' | 'intake' }) {
  if (view === 'gallery') {
    return (
      <TemplateGallery
        onSelectTemplate={(tmpl) => {
          const tasks = buildTemplateTasks(tmpl);
          const np = { ...currentPlan, intake: { ...currentPlan.intake, eventType: tmpl.eventType }, tasks };
          setVersionStore((s) => pushVersion(s, np, `Switched to template ${tmpl.title}`));
          onClose();
        }}
      />
    );
  }
  return (
    <IntakeSheet
      initialValues={currentPlan.intake}
      onSubmit={(data) => {
        onApplyIntake?.(data);
        onClose();
      }}
      onCancel={onClose}
    />
  );
}

/**
 * Modal dialog displaying the Curated Template Gallery alongside the Custom Plan Intake Sheet.
 */
export function TemplateModal(props: TemplateModalProps): React.JSX.Element {
  const [view, setView] = useState<'gallery' | 'intake'>(props.initialView ?? 'gallery');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <TemplateModalNavTabs view={view} onSwitchView={setView} />
          <button type="button" onClick={props.onClose} className="text-stone-400 hover:text-stone-700 text-sm font-bold">
            ✕ Close
          </button>
        </div>
        <TemplateModalContent {...props} view={view} />
      </div>
    </div>
  );
}
