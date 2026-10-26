import type { TaskCategory } from '../plan/types';
import type { BudgetLine } from '../budget/engine';

export type AgentAction =
  | { readonly type: 'mutate_guests'; readonly guests: number }
  | { readonly type: 'mutate_budget'; readonly budgetInr: number }
  | {
      readonly type: 'add_task';
      readonly name: string;
      readonly days?: number;
      readonly critical?: boolean;
      readonly category?: TaskCategory;
      readonly optimistic?: number;
      readonly mostLikely?: number;
      readonly likely?: number;
      readonly pessimistic?: number;
    }
  | {
      readonly type: 'add_budget_line';
      readonly line: BudgetLine;
    }
  | { readonly type: 'navigate_tab'; readonly tab: 'roadmap' | 'vendors' | 'graph' }
  | {
      readonly type: 'open_modal';
      readonly modal:
        | 'chaos'
        | 'redflags'
        | 'negotiate'
        | 'whatif'
        | 'templates'
        | 'dossier'
        | 'budget';
    }
  | { readonly type: 'set_city'; readonly city: string };

export interface ParsedAgentCommand {
  readonly reply: string;
  readonly actions: readonly AgentAction[];
  readonly executionLog: readonly string[];
  readonly guardrailBlocked?: boolean;
  readonly guardrailReason?: string;
  readonly piiRedacted?: boolean;
}
