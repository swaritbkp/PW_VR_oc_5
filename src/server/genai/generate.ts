import { getGeminiClient, getGeminiModel } from './client';
import { getPromptDefinition, type PlannerCoreContext } from './registry';
import {
  PlannerCoreOutputSchema,
  PlannerExtrasOutputSchema,
  type PlannerCoreOutput,
  type PlannerExtrasOutput,
} from './schemas';
import { runGuardrails } from './guardrails';
import { getTemplate, templatesFor, buildTemplateTasks } from '../../lib/templates/catalog';
import { EVENT_DAY_ID } from '../../lib/templates/skeletons';
import { computeSchedule } from '../../lib/schedule/cpm';
import { allocate, reconcile } from '../../lib/budget/engine';
import { probabilityOnTime } from '../../lib/schedule/pert';
import { evaluate as evaluateSentinels } from '../../lib/schedule/sentinel';
import { daysBetween } from '../../lib/dates';
import type { IntakeInput } from '../../lib/plan/schemas';
import type { PlanTask } from '../../lib/plan/types';
import type { Plan, ModelClient, GeneratePlanOptions, PlanGenerationResult } from './types';

export * from './types';

const DEFAULT_TIMEOUT_MS = 30_000;
const AGENT_VERSION = '0.1.0';
const DEFAULT_HORIZON_DAYS = 180;

async function callWithTimeout(fn: () => Promise<string>, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    fn()
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function invokeModel(
  client: ModelClient,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  return callWithTimeout(async () => {
    const res = await client.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });
    return res.text ?? '';
  }, timeoutMs);
}

function parseCoreJson(
  raw: string,
): { success: true; data: PlannerCoreOutput } | { success: false; errors: string[] } {
  try {
    const parsed = JSON.parse(raw);
    const zRes = PlannerCoreOutputSchema.safeParse(parsed);
    if (zRes.success) return { success: true, data: zRes.data };
    return {
      success: false,
      errors: zRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  } catch (e) {
    return { success: false, errors: [(e as Error).message] };
  }
}

interface CoreExecOptions {
  client: ModelClient;
  model: string;
  timeoutMs: number;
  sinkId: string;
}

async function executeCore(opts: CoreExecOptions, ctx: PlannerCoreContext) {
  const corePromptDef = getPromptDefinition('planner-core');
  const raw = await invokeModel(opts.client, opts.model, corePromptDef.build(ctx), opts.timeoutMs);
  const firstPass = parseCoreJson(raw);
  if (firstPass.success) {
    const guardrail = runGuardrails(firstPass.data, ctx.intake.language, opts.sinkId);
    if (!guardrail.ok) throw new Error(`Guardrail check failed: ${guardrail.errors.join('; ')}`);
    return { data: firstPass.data, repaired: false };
  }
  const repairDef = getPromptDefinition('planner-repair');
  const repairRaw = await invokeModel(
    opts.client,
    opts.model,
    repairDef.build({ previousOutput: raw, errors: firstPass.errors }),
    opts.timeoutMs,
  );
  const secondPass = parseCoreJson(repairRaw);
  if (!secondPass.success)
    throw new Error(`JSON schema invalid after repair: ${secondPass.errors.join('; ')}`);
  const guardrail = runGuardrails(secondPass.data, ctx.intake.language, opts.sinkId);
  if (!guardrail.ok) throw new Error(`Guardrail check failed: ${guardrail.errors.join('; ')}`);
  return { data: secondPass.data, repaired: true };
}

interface ExtrasExecOptions {
  client: ModelClient;
  model: string;
  timeoutMs: number;
}

async function executeExtras(
  opts: ExtrasExecOptions,
  ctx: PlannerCoreContext,
): Promise<PlannerExtrasOutput> {
  try {
    const extrasPromptDef = getPromptDefinition('planner-extras');
    const raw = await invokeModel(
      opts.client,
      opts.model,
      extrasPromptDef.build(ctx),
      opts.timeoutMs,
    );
    const parsed = JSON.parse(raw);
    const zRes = PlannerExtrasOutputSchema.safeParse(parsed);
    return zRes.success
      ? zRes.data
      : { ideas: [], vendorQuestions: [], assumptions: [], risks: [] };
  } catch {
    return { ideas: [], vendorQuestions: [], assumptions: [], risks: [] };
  }
}

function resolveTemplate(intake: IntakeInput) {
  const found = intake.templateId ? getTemplate(intake.templateId) : undefined;
  return found ?? templatesFor(intake.eventType)[0];
}

function buildPlanArtifact(
  intake: IntakeInput,
  core: PlannerCoreOutput,
  extras: PlannerExtrasOutput,
  repaired: boolean,
): Plan {
  const tasks = core.tasks as PlanTask[];
  const schedRes = computeSchedule(tasks);
  if (!schedRes.ok) throw new Error(`Schedule calculation error: ${schedRes.error.message}`);
  const schedule = schedRes.value;
  const budgetSummary = allocate(core.budgetLines, intake.budgetInr, intake.guests);
  const budgetReconciliation = reconcile(budgetSummary);
  const todayIso = new Date().toISOString().slice(0, 10);
  const days = daysBetween(todayIso, intake.date) ?? DEFAULT_HORIZON_DAYS;
  const prob = probabilityOnTime(schedule, days);
  const alerts = evaluateSentinels({
    schedule,
    today: 0,
    availableDays: days,
    probabilityOnTime: prob,
  });

  return {
    meta: {
      id: `plan_${Date.now()}`,
      promptVersions: { 'planner-core': '1.0.0', 'planner-extras': '1.0.0' },
      agentVersion: AGENT_VERSION,
      model: getGeminiModel(),
      createdAt: new Date().toISOString(),
      validationOutcomes: { coreRepaired: repaired, guardrailsPassed: true },
    },
    intake,
    tasks,
    budgetLines: core.budgetLines,
    budgetSummary,
    budgetReconciliation,
    schedule,
    sentinelAlerts: alerts,
    extras,
  };
}

/** Generates a living celebration plan using parallel Gemini structured calls and code engines. */
export async function generatePlan(
  intake: IntakeInput,
  options: GeneratePlanOptions = {},
): Promise<PlanGenerationResult> {
  const client = (options.client ?? getGeminiClient()) as ModelClient | null;
  if (!client) {
    return {
      ok: false,
      code: 'MISSING_API_KEY',
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const template = resolveTemplate(intake);
  const baselineTasks = buildTemplateTasks(template);
  const sinkId = EVENT_DAY_ID[intake.eventType];
  const ctx = { intake, template, baselineTasks };

  try {
    const [coreRes, extras] = await Promise.all([
      executeCore({ client, model: getGeminiModel(), timeoutMs, sinkId }, ctx),
      executeExtras({ client, model: getGeminiModel(), timeoutMs }, ctx),
    ]);
    const plan = buildPlanArtifact(intake, coreRes.data, extras, coreRes.repaired);
    return { ok: true, plan };
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Generation failed';
    const code = msg === 'TIMEOUT' ? 'TIMEOUT' : 'GENERATION_FAILED';
    return { ok: false, code, error: msg };
  }
}
