import { describe, expect, it } from 'vitest';
import { DISRUPTIONS } from '../resilience/disruptions';
import { VENDOR_NEEDS } from '../vendors/needs';
import { computeSchedule } from '../schedule/cpm';
import { TEMPLATES, buildTemplateTasks, getTemplate, templatesFor } from './catalog';
import { EVENT_DAY_ID, SKELETONS } from './skeletons';

const DISRUPTION_IDS = new Set(DISRUPTIONS.map((d) => d.id));

describe('AC18 templates: contemporary starting points', () => {
  it('offers four templates per event type with unique ids', () => {
    expect(TEMPLATES).toHaveLength(12);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(12);
    for (const type of ['wedding', 'birthday', 'community'] as const) {
      expect(templatesFor(type)).toHaveLength(4);
    }
    expect(getTemplate('community-lohri-bonfire')?.title).toContain('Lohri');
    expect(getTemplate('missing')).toBeUndefined();
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    '%s builds a valid, schedulable network',
    (_id, template) => {
      const tasks = buildTemplateTasks(template);
      const ids = new Set(tasks.map((t) => t.id));
      expect(ids.size).toBe(tasks.length);
      const result = computeSchedule(tasks);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.projectDuration).toBeGreaterThan(0);
      expect(result.value.projectDuration).toBeLessThan(365);
      expect(result.value.criticalPath.at(-1)).toBe(EVENT_DAY_ID[template.eventType]);
    },
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    '%s has exactly one sink: the event day',
    (_id, template) => {
      const tasks = buildTemplateTasks(template);
      const referenced = new Set(tasks.flatMap((t) => t.dependsOn));
      const sinks = tasks.filter((t) => !referenced.has(t.id)).map((t) => t.id);
      expect(sinks).toEqual([EVENT_DAY_ID[template.eventType]]);
    },
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    '%s uses known vendor needs, backups and sane ranges',
    (_id, template) => {
      for (const task of buildTemplateTasks(template)) {
        if (task.vendorNeed) expect(VENDOR_NEEDS[task.vendorNeed]).toBeDefined();
        if (task.bookingFor) expect(VENDOR_NEEDS[task.bookingFor]).toBeDefined();
        expect(task.why.length).toBeGreaterThan(10);
        expect(task.drivers.length).toBeGreaterThan(0);
      }
      template.backups.forEach((b) => expect(DISRUPTION_IDS.has(b)).toBe(true));
      expect(template.guests.min).toBeLessThan(template.guests.typical);
      expect(template.guests.typical).toBeLessThan(template.guests.max);
      expect(template.budgetInr.min).toBeLessThan(template.budgetInr.max);
      expect(template.art.alt.length).toBeGreaterThan(20);
      expect(template.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(template.bestMonths.every((m) => m >= 1 && m <= 12)).toBe(true);
    },
  );

  it('removes tasks, rewires dependents and scales durations', () => {
    const base = SKELETONS.wedding.find((t) => t.id === 'W03');
    const intimate = buildTemplateTasks(getTemplate('wedding-intimate-morning')!);
    expect(intimate.some((t) => t.id === 'W11')).toBe(false);
    expect(intimate.every((t) => !t.dependsOn.includes('W11'))).toBe(true);
    const scaled = intimate.find((t) => t.id === 'W03');
    expect(scaled?.mostLikely).toBe(Math.round((base?.mostLikely ?? 0) * 0.6 * 10) / 10);
  });

  it('keeps the original skeleton untouched', () => {
    const before = JSON.stringify(SKELETONS);
    TEMPLATES.forEach(buildTemplateTasks);
    expect(JSON.stringify(SKELETONS)).toBe(before);
  });
});
