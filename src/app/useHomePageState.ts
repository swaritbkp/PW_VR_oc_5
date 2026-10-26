'use client';

import { useMemo, useState } from 'react';
import { allocate, reconcile } from '@/lib/budget/engine';
import { layoutEventGraph } from '@/lib/graph/layout';
import { getInitialPlan } from '@/lib/plan/initialPlan';
import { evaluateJourney, type GuidedActionId } from '@/lib/plan/journey';
import type { PlanState } from '@/lib/plan/propagate';
import type { PlanTask, VendorNeedId } from '@/lib/plan/types';
import type { IntakeInput } from '@/lib/plan/schemas';
import { VendorNeedEnum } from '@/lib/plan/schemas';
import { createVersionStore, pushVersion } from '@/lib/plan/versions';
import { computeSchedule } from '@/lib/schedule/cpm';
import { probabilityOnTime } from '@/lib/schedule/pert';
import { evaluate, nextBestAction } from '@/lib/schedule/sentinel';
import type { VendorSelection } from '@/lib/vendors/types';
import type { ModalType } from '@/components/UI/AppModals';
import type { AppLanguage } from '@/components/UI/AppHeader';
import { buildAdaptedPlanFromIntake } from './planAdapter';
import { createPlanActionHandlers } from './planActionHandlers';
import { useAgentCopilotHandler } from './useAgentCopilotHandler';

function usePlanStoreState() {
  const [versionStore, setVersionStore] = useState(() => createVersionStore(getInitialPlan()));
  const [vendorSelections, setVendorSelections] = useState<VendorSelection[]>([]);
  const [simulationRun, setSimulationRun] = useState(false);

  const curPlan = useMemo(() => {
    const cur = versionStore.versions.find((v) => v.id === versionStore.currentId);
    return cur ? cur.plan : versionStore.versions[0].plan;
  }, [versionStore]);

  const journey = useMemo(
    () => evaluateJourney(curPlan, { vendorSelections, simulationRun }),
    [curPlan, vendorSelections, simulationRun],
  );

  return {
    versionStore, setVersionStore,
    vendorSelections, setVendorSelections,
    simulationRun, setSimulationRun,
    currentPlan: curPlan, journey,
  };
}

function useScheduleLayoutState(plan: PlanState) {
  const schedule = useMemo(() => {
    const res = computeSchedule(plan.tasks);
    return res.ok ? res.value : null;
  }, [plan.tasks]);

  const layout = useMemo(() => {
    if (!schedule) return null;
    return layoutEventGraph(schedule, plan.tasks, {
      startDate: plan.intake.date,
      availableDays: plan.targetDays,
    });
  }, [schedule, plan.tasks, plan.intake.date, plan.targetDays]);

  const commandData = useMemo(() => {
    if (!schedule) return null;
    const prob = probabilityOnTime(schedule, plan.targetDays);
    const todayOffset = Math.max(0, schedule.projectDuration - plan.targetDays);
    const alerts = evaluate({
      schedule, today: todayOffset, availableDays: plan.targetDays, probabilityOnTime: prob,
    });
    const alloc = allocate(plan.budgetLines, plan.intake.budgetInr, plan.intake.guests);
    const recon = reconcile(alloc);
    const nextTask = nextBestAction(schedule, plan.targetDays) ?? schedule.tasks[0];
    return { prob, alerts, alloc, recon, nextTask };
  }, [schedule, plan]);

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
      templates: 'templates', chaos: 'chaos', export_jashn: 'portable',
      dossier: 'dossier', whatif: 'whatif',
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
    uiState.setActiveModal, uiState.setActiveTab, planState.setSimulationRun,
  );
  const planHandlers = createPlanActionHandlers(
    planState.currentPlan, uiState.vendorCategory, planState.setVersionStore, planState.setVendorSelections,
  );
  const intakeHandlers = createIntakeHandlers(planState, uiState);
  const copilot = useAgentCopilotHandler({
    currentPlan: planState.currentPlan,
    setVersionStore: planState.setVersionStore,
    setActiveTab: uiState.setActiveTab,
    setActiveModal: uiState.setActiveModal,
  });

  return {
    ...planState, ...navHandlers, ...planHandlers, ...uiState, ...derived, ...intakeHandlers, ...copilot,
    layout, commandData,
  };
}

export type HomePageState = ReturnType<typeof useHomePageState>;
