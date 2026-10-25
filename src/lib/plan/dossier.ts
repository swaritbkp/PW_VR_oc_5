import { formatInr, formatLakh } from '../format';
import { allocate } from '../budget/engine';
import { computeSchedule } from '../schedule/cpm';
import { probabilityOnTime } from '../schedule/pert';
import type { PlanState } from './propagate';

export interface DossierSection {
  readonly title: string;
  readonly summary: string;
  readonly keyMetrics: readonly { readonly label: string; readonly value: string }[];
  readonly items: readonly string[];
}

export interface ExecutiveDossier {
  readonly title: string;
  readonly subtitle: string;
  readonly generatedDate: string;
  readonly eventType: string;
  readonly city: string;
  readonly targetDate: string;
  readonly totalGuests: number;
  readonly totalBudgetFormatted: string;
  readonly onTimeProbabilityFormatted: string;
  readonly criticalPathCount: number;
  readonly sections: readonly DossierSection[];
  readonly vendorReadinessSummary: string;
  readonly contingencyReserveFormatted: string;
}

function buildExecutiveSection(plan: PlanState, daysLeft: number): DossierSection {
  return {
    title: '1. Executive Summary',
    summary: `Comprehensive master celebration brief for ${plan.intake.eventType} in ${plan.intake.city}.`,
    keyMetrics: [
      { label: 'Event Date', value: plan.intake.date },
      { label: 'Countdown', value: `${daysLeft} Days` },
      { label: 'Confirmed Guests', value: `${plan.intake.guests} Pax` },
      { label: 'Total Budget', value: formatInr(plan.intake.budgetInr) },
    ],
    items: [
      `Destination: ${plan.intake.city}, India`,
      `Theme / Style: ${plan.intake.style || 'Traditional Luxury'}`,
      `Core Non-Negotiables: ${plan.intake.nonNegotiables.join(', ') || 'None specified'}`,
    ],
  };
}

function buildScheduleSection(plan: PlanState): DossierSection {
  const sched = computeSchedule(plan.tasks);
  const dur = sched.ok ? sched.value.projectDuration : plan.targetDays;
  const critPath = sched.ok ? sched.value.criticalPath : [];
  const prob = sched.ok ? Math.round(probabilityOnTime(sched.value, plan.targetDays) * 100) : 95;

  return {
    title: '2. Critical Path & Timeline Milestone Map',
    summary: 'CPM/PERT derived scheduling tracking the exact critical sequence with zero slack.',
    keyMetrics: [
      { label: 'Estimated Lead Time', value: `${dur} Days` },
      { label: 'Critical Path Tasks', value: `${critPath.length} Tasks` },
      { label: 'On-Time Confidence', value: `${prob}%` },
    ],
    items: plan.tasks
      .filter((t) => critPath.includes(t.id))
      .map((t) => `[Critical] ${t.name} (${t.mostLikely}d lead, ${t.done ? 'Done' : 'Pending'})`),
  };
}

function buildBudgetSection(plan: PlanState): DossierSection {
  const alloc = allocate(plan.budgetLines, plan.intake.budgetInr, plan.intake.guests);
  const costPerGuest = Math.round(alloc.grandTotal / (plan.intake.guests || 1));

  return {
    title: '3. Budget Allocation & Contingency Reserve',
    summary:
      'Deterministic budget architecture ensuring strict capital discipline and emergency buffers.',
    keyMetrics: [
      { label: 'Total Planned', value: formatLakh(plan.intake.budgetInr) },
      { label: 'Contingency Reserve', value: formatInr(alloc.contingencyInr) },
      { label: 'Per Guest Allocation', value: formatInr(costPerGuest) },
    ],
    items: alloc.lines.map((line) => {
      const share = Math.round((line.totalInr / plan.intake.budgetInr) * 100);
      return `${line.name} (${line.category}): ${formatInr(line.totalInr)} (${share}%)`;
    }),
  };
}

function buildResilienceSection(plan: PlanState): DossierSection {
  const doneTasks = plan.tasks.filter((t) => t.done).length;
  const bookingTasks = plan.tasks.filter((t) => t.bookingFor);
  const bookedCount = bookingTasks.filter((t) => t.done).length;

  return {
    title: '4. Resilience & Vendor Readiness Directory',
    summary: 'Plan B standby coverage, vendor pipeline velocity, and risk mitigation status.',
    keyMetrics: [
      { label: 'Total Tasks Complete', value: `${doneTasks} / ${plan.tasks.length}` },
      { label: 'Vendor Contracts Finalized', value: `${bookedCount} / ${bookingTasks.length}` },
      { label: 'Plan B Status', value: 'Active Monitoring' },
    ],
    items: bookingTasks.map(
      (t) => `Vendor Need [${t.bookingFor}]: ${t.name} - ${t.done ? 'Contracted' : 'In Discovery'}`,
    ),
  };
}

/**
 * Synthesizes an executive stakeholder celebration dossier from the living plan state,
 * generating structured metrics ready for print and luxury presentation.
 */
export function generateExecutiveDossier(plan: PlanState): ExecutiveDossier {
  const sched = computeSchedule(plan.tasks);
  const prob = sched.ok ? Math.round(probabilityOnTime(sched.value, plan.targetDays) * 100) : 95;
  const alloc = allocate(plan.budgetLines, plan.intake.budgetInr, plan.intake.guests);
  const doneTasks = plan.tasks.filter((t) => t.done).length;

  return {
    title: `Executive Celebration Dossier: ${plan.intake.eventType}`,
    subtitle: `Official Master Planning Portfolio - ${plan.intake.city}, India`,
    generatedDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    eventType: plan.intake.eventType,
    city: plan.intake.city,
    targetDate: plan.intake.date,
    totalGuests: plan.intake.guests,
    totalBudgetFormatted: formatInr(plan.intake.budgetInr),
    onTimeProbabilityFormatted: `${prob}%`,
    criticalPathCount: sched.ok ? sched.value.criticalPath.length : 0,
    contingencyReserveFormatted: formatInr(alloc.contingencyInr),
    vendorReadinessSummary: `${doneTasks}/${plan.tasks.length} deliverables complete`,
    sections: [
      buildExecutiveSection(plan, plan.targetDays),
      buildScheduleSection(plan),
      buildBudgetSection(plan),
      buildResilienceSection(plan),
    ],
  };
}
