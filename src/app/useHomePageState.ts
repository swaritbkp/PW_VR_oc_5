'use client';

import { useMemo, useState } from 'react';
import { allocate, reconcile, type BudgetLine } from '@/lib/budget/engine';
import { layoutEventGraph } from '@/lib/graph/layout';
import { getInitialPlan } from '@/lib/plan/initialPlan';
import { evaluateJourney, type GuidedActionId } from '@/lib/plan/journey';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import type { IntakeInput } from '@/lib/plan/schemas';
import { VendorNeedEnum } from '@/lib/plan/schemas';
import { createVersionStore, pushVersion, type VersionStore } from '@/lib/plan/versions';
import { computeSchedule } from '@/lib/schedule/cpm';
import { probabilityOnTime } from '@/lib/schedule/pert';
import { evaluate, nextBestAction } from '@/lib/schedule/sentinel';
import type { Vendor, VendorSelection, VendorStatus } from '@/lib/vendors/types';
import type { ModalType } from '@/components/UI/AppModals';
import type { AppLanguage } from '@/components/UI/AppHeader';
import { buildAdaptedPlanFromIntake } from './planAdapter';

function usePlanStoreState() {
  const [versionStore, setVersionStore] = useState(() => createVersionStore(getInitialPlan()));
  const [vendorSelections, setVendorSelections] = useState<VendorSelection[]>([]);
  const [simulationRun, setSimulationRun] = useState(false);

  const currentPlan = useMemo(() => {
    const cur = versionStore.versions.find((v) => v.id === versionStore.currentId);
    return cur ? cur.plan : versionStore.versions[0].plan;
  }, [versionStore]);

  const journey = useMemo(
    () => evaluateJourney(currentPlan, { vendorSelections, simulationRun }),
    [currentPlan, vendorSelections, simulationRun],
  );

  return {
    versionStore,
    setVersionStore,
    vendorSelections,
    setVendorSelections,
    simulationRun,
    setSimulationRun,
    currentPlan,
    journey,
  };
}

function useScheduleLayoutState(currentPlan: PlanState) {
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
    const alloc = allocate(currentPlan.budgetLines, currentPlan.intake.budgetInr, currentPlan.intake.guests);
    const recon = reconcile(alloc);
    const nextTask = nextBestAction(schedule, currentPlan.targetDays) ?? schedule.tasks[0];
    return { prob, alerts, alloc, recon, nextTask };
  }, [schedule, currentPlan]);

  return { schedule, layout, commandData };
}

function createNavigationHandlers(
  setActiveModal: (m: ModalType) => void,
  setActiveTab: (t: 'roadmap' | 'vendors' | 'graph') => void,
  setSimulationRun: (s: boolean) => void,
) {
  const handleJourneyAction = (actionId: GuidedActionId) => {
    if (actionId === 'graph' || actionId === 'vendors') {
      setActiveTab(actionId);
      return;
    }
    const modalMap: Record<string, ModalType> = {
      templates: 'templates',
      chaos: 'chaos',
      export_jashn: 'portable',
      dossier: 'dossier',
      whatif: 'whatif',
    };
    const targetModal = modalMap[actionId];
    if (targetModal) {
      if (actionId === 'chaos') setSimulationRun(true);
      setActiveModal(targetModal);
    }
  };

  const handleSimulateTourStep = (stepIndex: number) => {
    const actions: GuidedActionId[] = ['templates', 'graph', 'vendors', 'chaos', 'export_jashn'];
    handleJourneyAction(actions[stepIndex] ?? 'templates');
  };

  return { handleJourneyAction, handleSimulateTourStep };
}

function createPlanActionHandlers(
  currentPlan: PlanState,
  vendorCategory: VendorNeedId,
  setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>,
  setVendorSelections: React.Dispatch<React.SetStateAction<VendorSelection[]>>,
) {
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

  const handleBookVendor = (vendor: Vendor, status: VendorStatus, quoteInr?: number) => {
    setVendorSelections((prev) => [
      ...prev.filter((v) => v.placeId !== vendor.placeId),
      { placeId: vendor.placeId, need: vendorCategory, status, quoteInr: quoteInr ?? 0 },
    ]);
    const quoteSuffix = quoteInr ? ` ₹${quoteInr}` : '';
    setVersionStore((s) =>
      pushVersion(s, currentPlan, `Updated vendor ${vendor.name} (${status}${quoteSuffix})`),
    );
  };

  return { handleUpdateTaskStatus, handleUpdateTask, handleUpdateBudgetLines, handleBookVendor };
}

function useWorkspaceUiState() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [activeTab, setActiveTab] = useState<'roadmap' | 'vendors' | 'graph'>('roadmap');
  const [vendorCategory, setVendorCategory] = useState<VendorNeedId>('venue');
  const [language, setLanguage] = useState<AppLanguage>('en');
  return {
    selectedTaskId, setSelectedTaskId,
    activeModal, setActiveModal,
    activeTab, setActiveTab,
    vendorCategory, setVendorCategory,
    language, setLanguage,
  };
}

function useWorkspaceDerived(
  layout: ReturnType<typeof layoutEventGraph> | null,
  tasks: readonly PlanTask[],
  selectedTaskId: string | null,
) {
  const selectedNode = useMemo(
    () => layout?.nodes.find((n) => n.id === selectedTaskId),
    [layout, selectedTaskId],
  );
  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId],
  );
  const doneCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  return { selectedNode, selectedTask, doneCount };
}

function createIntakeHandlers(
  planState: ReturnType<typeof usePlanStoreState>,
  uiState: ReturnType<typeof useWorkspaceUiState>,
) {
  const handleOpenVendorNeed = (need: string) => {
    const parsed = VendorNeedEnum.safeParse(need);
    if (parsed.success) uiState.setVendorCategory(parsed.data);
    uiState.setActiveTab('vendors');
  };
  const handleImportPlan = (plan: PlanState, selections: readonly VendorSelection[]) => {
    planState.setVersionStore((s) => pushVersion(s, plan, 'Imported .jashn package'));
    if (selections?.length) planState.setVendorSelections([...selections]);
  };
  const handleApplyIntake = (intake: IntakeInput) => {
    const adapted = buildAdaptedPlanFromIntake(intake, planState.currentPlan);
    planState.setVersionStore((s) =>
      pushVersion(s, adapted, `Intake adapted: ${intake.city} (${intake.guests} guests)`),
    );
    if (intake.language) uiState.setLanguage(intake.language);
  };
  return { handleOpenVendorNeed, handleImportPlan, handleApplyIntake };
}

/**
 * State container and event dispatcher hook for the Jashn HomePage celebration workspace.
 */
export function useHomePageState() {
  const planState = usePlanStoreState();
  const uiState = useWorkspaceUiState();
  const { layout, commandData } = useScheduleLayoutState(planState.currentPlan);
  const derived = useWorkspaceDerived(layout, planState.currentPlan.tasks, uiState.selectedTaskId);
  const navHandlers = createNavigationHandlers(
    uiState.setActiveModal,
    uiState.setActiveTab,
    planState.setSimulationRun,
  );
  const planHandlers = createPlanActionHandlers(
    planState.currentPlan,
    uiState.vendorCategory,
    planState.setVersionStore,
    planState.setVendorSelections,
  );
  const intakeHandlers = createIntakeHandlers(planState, uiState);

  return {
    ...planState,
    ...navHandlers,
    ...planHandlers,
    ...uiState,
    ...derived,
    ...intakeHandlers,
    layout,
    commandData,
  };
}

export type HomePageState = ReturnType<typeof useHomePageState>;
