'use client';

import { useState } from 'react';
import type { AgentAction } from '@/lib/concierge/agentActions';
import { createAgentTask } from '@/lib/concierge/agentActions';
import { sanitizeTaskDependencies } from '@/lib/concierge/nuanceActions';
import { propagate, type PlanState } from '@/lib/plan/propagate';
import { currentPlan, pushVersion, type VersionStore } from '@/lib/plan/versions';
import type { ModalType } from '@/components/UI/AppModals';

export interface AgentHandlerContext {
  readonly currentPlan: PlanState;
  readonly setVersionStore: React.Dispatch<React.SetStateAction<VersionStore>>;
  readonly setActiveTab: (tab: 'roadmap' | 'vendors' | 'graph') => void;
  readonly setActiveModal: (modal: ModalType) => void;
}

function handleStateMutation(action: AgentAction, ctx: AgentHandlerContext) {
  if (action.type === 'mutate_guests') {
    ctx.setVersionStore((s) => {
      const plan = currentPlan(s);
      const res = propagate(plan, { kind: 'guests', guests: action.guests });
      return pushVersion(s, res.plan, res.diff.join('; '));
    });
  } else if (action.type === 'mutate_budget') {
    ctx.setVersionStore((s) => {
      const plan = currentPlan(s);
      const res = propagate(plan, { kind: 'budget', budgetInr: action.budgetInr });
      return pushVersion(s, res.plan, res.diff.join('; '));
    });
  } else if (action.type === 'add_task') {
    ctx.setVersionStore((s) => {
      const plan = currentPlan(s);
      const raw = createAgentTask(action.name, {
        category: action.category,
        optimistic: action.optimistic,
        mostLikely: action.mostLikely ?? action.likely ?? 4,
        pessimistic: action.pessimistic,
      });
      const safe = sanitizeTaskDependencies(plan.tasks, raw);
      return pushVersion(s, { ...plan, tasks: [safe, ...plan.tasks] }, `Injected task: ${action.name}`);
    });
  } else if (action.type === 'add_budget_line') {
    ctx.setVersionStore((s) => {
      const plan = currentPlan(s);
      const filtered = plan.budgetLines.filter((l) => l.name !== action.line.name);
      return pushVersion(s, { ...plan, budgetLines: [...filtered, action.line] }, `Added line: ${action.line.name}`);
    });
  } else if (action.type === 'set_city') {
    ctx.setVersionStore((s) => {
      const plan = currentPlan(s);
      const res = propagate(plan, { kind: 'city', city: action.city });
      return pushVersion(s, res.plan, res.diff.join('; '));
    });
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
