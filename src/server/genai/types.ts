import type { IntakeInput } from '../../lib/plan/schemas';
import type { PlanTask } from '../../lib/plan/types';
import type { Schedule } from '../../lib/schedule/types';
import type { AllocationResult, ReconcileResult } from '../../lib/budget/engine';
import type { Alert } from '../../lib/schedule/sentinel';
import type { PlannerCoreOutput, PlannerExtrasOutput } from './schemas';

export interface PlanMeta {
  readonly id: string;
  readonly promptVersions: Record<string, string>;
  readonly agentVersion: string;
  readonly model: string;
  readonly createdAt: string;
  readonly validationOutcomes?: {
    readonly coreRepaired?: boolean;
    readonly guardrailsPassed: boolean;
  };
}

export interface Plan {
  readonly meta: PlanMeta;
  readonly intake: IntakeInput;
  readonly tasks: PlanTask[];
  readonly budgetLines: PlannerCoreOutput['budgetLines'];
  readonly budgetSummary: AllocationResult;
  readonly budgetReconciliation: ReconcileResult;
  readonly schedule: Schedule;
  readonly sentinelAlerts: readonly Alert[];
  readonly extras: PlannerExtrasOutput;
}

export interface ModelClient {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config?: { temperature?: number; responseMimeType?: string };
    }): Promise<{ text?: string | null }>;
  };
}

export interface GeneratePlanOptions {
  readonly client?: ModelClient;
  readonly timeoutMs?: number;
}

export type PlanGenerationResult =
  | { readonly ok: true; readonly plan: Plan }
  | {
      readonly ok: false;
      readonly code: 'MISSING_API_KEY' | 'GENERATION_FAILED' | 'TIMEOUT';
      readonly error: string;
    };
