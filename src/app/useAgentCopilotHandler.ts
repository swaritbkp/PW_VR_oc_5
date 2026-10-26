'use client';

import { useState } from 'react';
import type { AgentAction } from '@/lib/concierge/agentActions';
import { createAgentTask } from '@/lib/concierge/agentActions';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import { pushVersion, type VersionStore } from '@/lib/plan/versions';
import type { ModalType } from '@/components/UI/AppModals';

export interface AgentHandlerContext {
  readonly currentPlan: PlanState;
  readonly setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>;
  readonly setActiveTab: (tab: 'roadmap' | 'vendors' | 'graph') => void;
  readonly setActiveModal: (modal: ModalType) => void;
}

function handleStateMutation(action: AgentAction, ctx: AgentHandlerContext) {
  if (action.type === 'mutate_guests') {
    const res = propagate(ctx.currentPlan, { kind: 'guests', guests: action.guests });
    ctx.setVersionStore((s) => pushVersion(s, res.plan, res.diff.join('; ')));
  } else if (action.type === 'mutate_budget') {
    const res = propagate(ctx.currentPlan, { kind: 'budget', budgetInr: action.budgetInr });
    ctx.setVersionStore((s) => pushVersion(s, res.plan, res.diff.join('; ')));
  } else if (action.type === 'add_task') {
    const newTask = createAgentTask(action.name);
    const nextPlan = { ...ctx.currentPlan, tasks: [newTask, ...ctx.currentPlan.tasks] };
    ctx.setVersionStore((s) => pushVersion(s, nextPlan, `Injected task: ${action.name}`));
  } else if (action.type === 'set_city') {
    const res = propagate(ctx.currentPlan, { kind: 'city', city: action.city });
    ctx.setVersionStore((s) => pushVersion(s, res.plan, res.diff.join('; ')));
  }
}

function handleUiNavigation(action: AgentAction, ctx: AgentHandlerContext) {
  if (action.type === 'navigate_tab') {
    ctx.setActiveTab(action.tab);
    if (typeof window !== 'undefined') {
      const id = action.tab === 'graph' ? 'cpm-graph-canvas' : 'event-graph';
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else if (action.type === 'open_modal') {
    ctx.setActiveModal(action.modal);
  }
}

/**
 * Manages chat visibility and autonomous workspace mutation execution for the Agentic Copilot.
 */
export function useAgentCopilotHandler(ctx: AgentHandlerContext) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleExecuteAgentAction = (action: AgentAction) => {
    handleStateMutation(action, ctx);
    handleUiNavigation(action, ctx);
  };

  return { isCopilotOpen, setIsCopilotOpen, handleExecuteAgentAction };
}
