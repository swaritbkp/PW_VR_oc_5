'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AppHeader } from '@/components/UI/AppHeader';
import { CommandCenter } from '@/components/CommandCenter/CommandCenter';
import { EventGraphList } from '@/components/EventGraph/EventGraphList';
import { NodeInspector } from '@/components/NodeInspector/NodeInspector';
import { allocate, reconcile } from '@/lib/budget/engine';
import { layoutEventGraph } from '@/lib/graph/layout';
import { computeSchedule } from '@/lib/schedule/cpm';
import { probabilityOnTime } from '@/lib/schedule/pert';
import { evaluate, nextBestAction } from '@/lib/schedule/sentinel';
import { getTemplate, buildTemplateTasks } from '@/lib/templates/catalog';
import { createVersionStore, pushVersion, restoreVersion, undo } from '@/lib/plan/versions';
import type { PlanState } from '@/lib/plan/propagate';
import type { VendorNeedId } from '@/lib/plan/types';

const EventGraph = dynamic(
  () => import('@/components/EventGraph/EventGraph').then((m) => m.EventGraph),
  { ssr: false, loading: () => <div className="p-12 text-center text-xs text-stone-400">Loading graph canvas...</div> },
);

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

function getInitialPlan(): PlanState {
  const tmpl = getTemplate('wedding-phulkari-courtyard')!;
  const tasks = buildTemplateTasks(tmpl);
  return {
    id: 'plan_phulkari_01',
    intake: {
      eventType: 'wedding',
      city: 'Chandigarh',
      date: '2026-11-20',
      guests: 250,
      budgetInr: 2500000,
      nonNegotiables: ['Phulkari backdrop', 'Halwai catering'],
      language: 'en',
    },
    tasks,
    budgetLines: [
      { id: 'b1', category: 'venue', name: 'Courtyard Hall', unit: 'fixed', rateInr: 600000, drivers: ['budget'] },
      { id: 'b2', category: 'food', name: 'Langar & Feast', unit: 'per_head', rateInr: 1200, quantity: 250, drivers: ['guests'] },
    ],
    targetDays: 75,
  };
}

  return (
    <main className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <AppHeader
        title={currentPlan.intake.eventType}
        city={currentPlan.intake.city}
        onOpen={setActiveModal}
      />

      {commandData && (
        <CommandCenter
          daysLeft={currentPlan.targetDays}
          probabilityOnTime={commandData.prob}
          budgetSummary={commandData.alloc}
          budgetReconciliation={commandData.recon}
          nextAction={commandData.nextTask}
          alerts={commandData.alerts}
          onSelectTask={(id) => setSelectedTaskId(id ?? null)}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Living Event Graph Workspace
          </h2>
          <div className="flex gap-1 bg-stone-200 p-1 rounded-lg text-xs">
            <button type="button" onClick={() => setViewMode('graph')} className={`px-2.5 py-1 rounded-md font-semibold ${viewMode === 'graph' ? 'bg-white shadow-xs' : 'text-stone-600'}`}>
              Canvas
            </button>
            <button type="button" onClick={() => setViewMode('list')} className={`px-2.5 py-1 rounded-md font-semibold ${viewMode === 'list' ? 'bg-white shadow-xs' : 'text-stone-600'}`}>
              Timeline List
            </button>
          </div>
        </div>

        {viewMode === 'graph' && layout ? (
          <EventGraph layout={layout} tasks={currentPlan.tasks} selectedNodeId={selectedTaskId ?? undefined} onSelectNode={(id) => setSelectedTaskId(id ?? null)} />
        ) : (
          <EventGraphList nodes={layout?.nodes ?? []} tasks={currentPlan.tasks} selectedNodeId={selectedTaskId ?? undefined} onSelectNode={(id) => setSelectedTaskId(id)} />
        )}
      </div>

      {selectedNode && (
        <NodeInspector
          node={selectedNode}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdateStatus={(taskId, st) => handleUpdateTaskStatus(taskId, Boolean(st.done))}
        />
      )}

      {activeModal === 'whatif' && (
        <WhatIfDrawer
          currentPlan={currentPlan}
          versionStore={versionStore}
          onClose={() => setActiveModal('none')}
          onCommit={(np, desc) => {
            setVersionStore((s) => pushVersion(s, np, desc));
            setActiveModal('none');
          }}
          onRestore={(vid) => setVersionStore((s) => restoreVersion(s, vid))}
          onUndo={() => setVersionStore(undo)}
        />
      )}

      {activeModal === 'disruption' && (
        <DisruptionDrawer
          tasks={currentPlan.tasks}
          availableDays={currentPlan.targetDays}
          backedUpNeeds={new Set<VendorNeedId>()}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'share' && <ShareSheet plan={currentPlan} onClose={() => setActiveModal('none')} />}

      {activeModal === 'audit' && (
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
              onClose={() => setActiveModal('none')}
            />
          </div>
        </div>
      )}

      {activeModal === 'templates' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="max-w-4xl w-full bg-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => setActiveModal('none')} className="text-stone-400 hover:text-stone-700 text-sm">✕ Close</button>
            </div>
            <TemplateGallery
              onSelectTemplate={(tmpl) => {
                const tasks = buildTemplateTasks(tmpl);
                const np = { ...currentPlan, intake: { ...currentPlan.intake, eventType: tmpl.eventType }, tasks };
                setVersionStore((s) => pushVersion(s, np, `Switched to template ${tmpl.title}`));
                setActiveModal('none');
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
