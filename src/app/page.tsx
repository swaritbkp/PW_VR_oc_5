'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AppHeader } from '@/components/UI/AppHeader';
import { AppModals, type ModalType } from '@/components/UI/AppModals';
import { CommandCenter } from '@/components/CommandCenter/CommandCenter';
import { EventGraphList } from '@/components/EventGraph/EventGraphList';
import { NodeInspector } from '@/components/NodeInspector/NodeInspector';
import { allocate, reconcile } from '@/lib/budget/engine';
import { layoutEventGraph } from '@/lib/graph/layout';
import { getInitialPlan } from '@/lib/plan/initialPlan';
import { createVersionStore, pushVersion } from '@/lib/plan/versions';
import { computeSchedule } from '@/lib/schedule/cpm';
import { probabilityOnTime } from '@/lib/schedule/pert';
import { evaluate, nextBestAction } from '@/lib/schedule/sentinel';

const EventGraph = dynamic(
  () => import('@/components/EventGraph/EventGraph').then((m) => m.EventGraph),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 text-center text-xs text-stone-400">Loading graph canvas...</div>
    ),
  },
);

export default function HomePage(): React.JSX.Element {
  const [versionStore, setVersionStore] = useState(() => createVersionStore(getInitialPlan()));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  const currentPlan = useMemo(() => {
    const cur = versionStore.versions.find((v) => v.id === versionStore.currentId);
    return cur ? cur.plan : versionStore.versions[0].plan;
  }, [versionStore]);

  const schedule = useMemo(() => {
    const res = computeSchedule(currentPlan.tasks);
    return res.ok ? res.value : null;
  }, [currentPlan.tasks]);

  const layout = useMemo(() => {
    if (!schedule) return null;
    return layoutEventGraph(schedule, currentPlan.tasks, {
      startDate: currentPlan.intake.date,
      availableDays: currentPlan.targetDays,
    });
  }, [schedule, currentPlan.tasks, currentPlan.intake.date, currentPlan.targetDays]);

  const commandData = useMemo(() => {
    if (!schedule) return null;
    const prob = probabilityOnTime(schedule, currentPlan.targetDays);
    const alerts = evaluate({
      schedule,
      today: 0,
      availableDays: currentPlan.targetDays,
      probabilityOnTime: prob,
    });
    const alloc = allocate(
      currentPlan.budgetLines,
      currentPlan.intake.budgetInr,
      currentPlan.intake.guests,
    );
    const recon = reconcile(alloc);
    const nextTask = nextBestAction(schedule, currentPlan.targetDays) ?? schedule.tasks[0];
    return { prob, alerts, alloc, recon, nextTask };
  }, [schedule, currentPlan]);

  const selectedNode = useMemo(
    () => layout?.nodes.find((n) => n.id === selectedTaskId),
    [layout, selectedTaskId],
  );
  const selectedTask = useMemo(
    () => currentPlan.tasks.find((t) => t.id === selectedTaskId),
    [currentPlan.tasks, selectedTaskId],
  );

  const handleUpdateTaskStatus = (id: string, done: boolean) => {
    const updatedTasks = currentPlan.tasks.map((t) => (t.id === id ? { ...t, done } : t));
    const nextPlan = { ...currentPlan, tasks: updatedTasks };
    setVersionStore((s) => pushVersion(s, nextPlan, `Updated task ${id} status`));
  };

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
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`px-2.5 py-1 rounded-md font-semibold ${viewMode === 'graph' ? 'bg-white shadow-xs' : 'text-stone-600'}`}
            >
              Canvas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md font-semibold ${viewMode === 'list' ? 'bg-white shadow-xs' : 'text-stone-600'}`}
            >
              Timeline List
            </button>
          </div>
        </div>
        {viewMode === 'graph' && layout ? (
          <EventGraph
            layout={layout}
            tasks={currentPlan.tasks}
            selectedNodeId={selectedTaskId ?? undefined}
            onSelectNode={(id) => setSelectedTaskId(id ?? null)}
          />
        ) : (
          <EventGraphList
            nodes={layout?.nodes ?? []}
            tasks={currentPlan.tasks}
            selectedNodeId={selectedTaskId ?? undefined}
            onSelectNode={(id) => setSelectedTaskId(id)}
          />
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

      <AppModals
        activeModal={activeModal}
        currentPlan={currentPlan}
        versionStore={versionStore}
        onClose={() => setActiveModal('none')}
        setVersionStore={setVersionStore}
      />
    </main>
  );
}
