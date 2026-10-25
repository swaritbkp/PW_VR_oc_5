'use client';

import React, { useMemo, useState } from 'react';
import { AppHeader } from '@/components/UI/AppHeader';
import { AppModals, type ModalType } from '@/components/UI/AppModals';
import { CelebrationConcierge } from '@/components/UI/CelebrationConcierge';
import { GuidedJourneyBar } from '@/components/Journey/GuidedJourneyBar';
import { WorkspaceTabs } from '@/components/UI/WorkspaceTabs';
import { CommandCenter } from '@/components/CommandCenter/CommandCenter';
import { NodeInspector } from '@/components/NodeInspector/NodeInspector';
import { allocate, reconcile, type BudgetLine } from '@/lib/budget/engine';
import { layoutEventGraph } from '@/lib/graph/layout';
import { getInitialPlan } from '@/lib/plan/initialPlan';
import { evaluateJourney, type GuidedActionId } from '@/lib/plan/journey';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import { createVersionStore, pushVersion } from '@/lib/plan/versions';
import { computeSchedule } from '@/lib/schedule/cpm';
import { probabilityOnTime } from '@/lib/schedule/pert';
import { evaluate, nextBestAction } from '@/lib/schedule/sentinel';
import type { Vendor, VendorSelection, VendorStatus } from '@/lib/vendors/types';

export default function HomePage(): React.JSX.Element {
  const [versionStore, setVersionStore] = useState(() => createVersionStore(getInitialPlan()));
  const [vendorSelections, setVendorSelections] = useState<VendorSelection[]>([]);
  const [simulationRun, setSimulationRun] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [activeTab, setActiveTab] = useState<'roadmap' | 'vendors' | 'graph'>('roadmap');
  const [vendorCategory, setVendorCategory] = useState<VendorNeedId>('venue');

  const currentPlan = useMemo(() => {
    const cur = versionStore.versions.find((v) => v.id === versionStore.currentId);
    return cur ? cur.plan : versionStore.versions[0].plan;
  }, [versionStore]);

  const journey = useMemo(
    () => evaluateJourney(currentPlan, { vendorSelections, simulationRun }),
    [currentPlan, vendorSelections, simulationRun],
  );

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

  const doneCount = useMemo(
    () => currentPlan.tasks.filter((t) => t.done).length,
    [currentPlan.tasks],
  );

  const handleUpdateTaskStatus = (id: string, done: boolean) => {
    const updatedTasks = currentPlan.tasks.map((t) => (t.id === id ? { ...t, done } : t));
    const nextPlan = { ...currentPlan, tasks: updatedTasks };
    setVersionStore((s) => pushVersion(s, nextPlan, `Updated task ${id} status`));
  };

  const handleUpdateTask = (id: string, updates: Partial<PlanTask>) => {
    const res = propagate(currentPlan, { kind: 'task', taskId: id, updates });
    setVersionStore((s) => pushVersion(s, res.plan, res.diff.join('; ')));
  };

  const handleUpdateBudgetLines = (budgetLines: readonly BudgetLine[], reason: string) => {
    const nextPlan = { ...currentPlan, budgetLines };
    setVersionStore((s) => pushVersion(s, nextPlan, reason));
  };

  const handleOpenVendorNeed = (need: string) => {
    setVendorCategory(need as VendorNeedId);
    setActiveTab('vendors');
  };

  const handleBookVendor = (vendor: Vendor, status: VendorStatus, quoteInr?: number) => {
    setVendorSelections((prev) => [
      ...prev.filter((v) => v.placeId !== vendor.placeId),
      { placeId: vendor.placeId, need: vendorCategory, status, quoteInr: quoteInr ?? 0 },
    ]);
    setVersionStore((s) =>
      pushVersion(
        s,
        currentPlan,
        `Updated vendor ${vendor.name} (${status}${quoteInr ? ` ₹${quoteInr}` : ''})`,
      ),
    );
  };

  const handleJourneyAction = (actionId: GuidedActionId) => {
    if (actionId === 'templates') setActiveModal('templates');
    else if (actionId === 'graph') setActiveTab('graph');
    else if (actionId === 'vendors') setActiveTab('vendors');
    else if (actionId === 'chaos') {
      setSimulationRun(true);
      setActiveModal('chaos');
    } else if (actionId === 'export_jashn') setActiveModal('portable');
    else if (actionId === 'dossier') setActiveModal('dossier');
    else if (actionId === 'whatif') setActiveModal('whatif');
  };

  const handleSimulateTourStep = (stepIndex: number) => {
    const actions: GuidedActionId[] = ['templates', 'graph', 'vendors', 'chaos', 'export_jashn'];
    handleJourneyAction(actions[stepIndex] ?? 'templates');
  };

  const handleImportPlan = (plan: PlanState, selections: readonly VendorSelection[]) => {
    setVersionStore((s) => pushVersion(s, plan, 'Imported .jashn package'));
    if (selections?.length) setVendorSelections([...selections]);
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <AppHeader
        title={currentPlan.intake.eventType}
        city={currentPlan.intake.city}
        onOpen={setActiveModal}
      />

      <GuidedJourneyBar
        journey={journey}
        onTriggerAction={handleJourneyAction}
        onSimulateTourStep={handleSimulateTourStep}
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

      {commandData && (
        <CommandCenter
          daysLeft={currentPlan.targetDays}
          probabilityOnTime={commandData.prob}
          budgetSummary={commandData.alloc}
          budgetReconciliation={commandData.recon}
          nextAction={commandData.nextTask}
          alerts={commandData.alerts}
          onSelectTask={(id) => setSelectedTaskId(id ?? null)}
          onOpenBudget={() => setActiveModal('budget')}
        />
      )}

      <WorkspaceTabs
        activeTab={activeTab}
        tasks={currentPlan.tasks}
        layout={layout}
        selectedTaskId={selectedTaskId}
        onSelectTaskId={setSelectedTaskId}
        onOpenVendorCategory={handleOpenVendorNeed}
        currentCity={currentPlan.intake.city}
        eventType={currentPlan.intake.eventType}
        eventDate={currentPlan.intake.date}
        guests={currentPlan.intake.guests}
        vendorCategory={vendorCategory}
        onBookVendor={handleBookVendor}
      />

      {selectedNode && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedTaskId(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md h-full shadow-2xl">
            <NodeInspector
              node={selectedNode}
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
              onUpdateStatus={(taskId, st) => handleUpdateTaskStatus(taskId, Boolean(st.done))}
              onUpdateTask={handleUpdateTask}
            />
          </div>
        </div>
      )}

      <AppModals
        activeModal={activeModal}
        currentPlan={currentPlan}
        versionStore={versionStore}
        onClose={() => setActiveModal('none')}
        setVersionStore={setVersionStore}
        onOpenModal={setActiveModal}
        onImportPlan={handleImportPlan}
        onUpdateBudgetLines={handleUpdateBudgetLines}
      />
    </main>
  );
}
