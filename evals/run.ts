import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { IntakeSchema, PlanTaskSchema, BudgetLineSchema } from '../src/lib/plan/schemas';
import {
  checkBannedPatterns,
  checkNumericSanity,
  checkLanguageScript,
  checkDagOrder,
} from '../src/server/genai/guardrails';
import { computeSchedule, bufferDays } from '../src/lib/schedule/cpm';
import { allocate, reconcile } from '../src/lib/budget/engine';
import { EVENT_DAY_ID } from '../src/lib/templates/skeletons';
import { daysBetween } from '../src/lib/dates';
import { recordAllFixtures, type FixtureData } from './record_fixtures';

const FIXTURES_DIR = resolve(process.cwd(), 'evals', 'fixtures');
const MIN_TASKS = 12;
const MAX_TASKS = 45;

interface EvalCheckResult {
  scenarioId: string;
  passed: boolean;
  errors: string[];
}

function evaluateFixture(fixture: FixtureData): EvalCheckResult {
  const errors: string[] = [];
  const intakeRes = IntakeSchema.safeParse(fixture.intake);
  if (!intakeRes.success) errors.push(`Intake schema invalid: ${intakeRes.error.message}`);

  const taskCount = fixture.core.tasks.length;
  if (taskCount < MIN_TASKS || taskCount > MAX_TASKS) {
    errors.push(`Task count ${taskCount} outside bounds [${MIN_TASKS}, ${MAX_TASKS}]`);
  }

  for (const t of fixture.core.tasks) {
    const taskRes = PlanTaskSchema.safeParse(t);
    if (!taskRes.success) errors.push(`Task ${t.id} schema invalid: ${taskRes.error.message}`);
  }

  for (const b of fixture.core.budgetLines) {
    const bRes = BudgetLineSchema.safeParse(b);
    if (!bRes.success) errors.push(`Budget line ${b.id} schema invalid: ${bRes.error.message}`);
  }

  const sinkId = EVENT_DAY_ID[fixture.intake.eventType];
  const dagRes = checkDagOrder(fixture.core.tasks, sinkId);
  if (!dagRes.ok && dagRes.error) errors.push(`DAG order invalid: ${dagRes.error}`);

  const numSanity = checkNumericSanity(fixture.core.tasks, fixture.core.budgetLines);
  if (numSanity) errors.push(`Numeric sanity error: ${numSanity}`);

  const corpus = [
    ...fixture.core.tasks.map((t) => `${t.name} ${t.why}`),
    ...fixture.core.budgetLines.map((b) => `${b.name} ${b.notes}`),
    ...fixture.extras.ideas,
    ...fixture.extras.risks,
  ].join(' ');

  const banned = checkBannedPatterns(corpus);
  if (banned) errors.push(`Banned pattern error: ${banned}`);

  if (!checkLanguageScript(corpus, fixture.intake.language)) {
    errors.push(`Language script check failed for ${fixture.intake.language}`);
  }

  const schedRes = computeSchedule(fixture.core.tasks);
  if (!schedRes.ok) {
    errors.push(`Schedule CPM computation failed: ${schedRes.error.message}`);
  } else {
    const available =
      daysBetween(new Date().toISOString().slice(0, 10), fixture.intake.date) ?? 180;
    const buf = bufferDays(schedRes.value, available);
    if (fixture.scenarioId.includes('crunch') && buf >= 0) {
      errors.push(`Crunch scenario expected negative buffer, but got ${buf} days`);
    }
  }

  const allocation = allocate(
    fixture.core.budgetLines,
    fixture.intake.budgetInr,
    fixture.intake.guests,
  );
  const reconciled = reconcile(allocation);
  if (reconciled.status === 'over') {
    errors.push(`Budget does not reconcile: over budget by ₹${reconciled.gapInr}`);
  }

  return { scenarioId: fixture.scenarioId, passed: errors.length === 0, errors };
}

function runEvals(): void {
  if (process.argv.includes('--record') || !existsSync(FIXTURES_DIR)) {
    recordAllFixtures();
  }

  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No fixtures found in evals/fixtures/');
    process.exit(1);
  }

  console.log(`Running ADLC offline evals across ${files.length} scenarios...`);
  const results: EvalCheckResult[] = [];
  let failures = 0;

  for (const file of files) {
    const raw = readFileSync(resolve(FIXTURES_DIR, file), 'utf-8');
    const fixture = JSON.parse(raw) as FixtureData;
    const res = evaluateFixture(fixture);
    results.push(res);
    if (res.passed) {
      console.log(`  ✓ ${res.scenarioId}`);
    } else {
      failures++;
      console.error(`  ✗ ${res.scenarioId}`);
      res.errors.forEach((e) => console.error(`      - ${e}`));
    }
  }

  console.log(`\nADLC Evals Summary: ${files.length - failures}/${files.length} scenarios passed.`);
  if (failures > 0) {
    console.error(`[FAIL] ${failures} scenarios failed offline evals.`);
    process.exit(1);
  }
  console.log('[PASS] All offline ADLC deterministic evals passed.');
  process.exit(0);
}

runEvals();
