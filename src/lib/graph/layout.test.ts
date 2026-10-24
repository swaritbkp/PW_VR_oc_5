import { describe, expect, it } from 'vitest';
import { buildTemplateTasks, getTemplate } from '../templates/catalog';
import { computeSchedule } from '../schedule/cpm';
import { layoutEventGraph, tickStepDays } from './layout';

const tasks = buildTemplateTasks(getTemplate('wedding-phulkari-courtyard')!);
const schedule = (() => {
  const r = computeSchedule(tasks);
  if (!r.ok) throw new Error('expected ok');
  return r.value;
})();
const options = { startDate: '2026-11-01', availableDays: 200 };

describe('AC19 the event graph layout is the main artifact', () => {
  const layout = layoutEventGraph(schedule, tasks, options);

  it('places every task once and every dependency as an edge', () => {
    expect(layout.nodes).toHaveLength(tasks.length);
    expect(new Set(layout.nodes.map((n) => n.id)).size).toBe(tasks.length);
    expect(layout.edges).toHaveLength(tasks.reduce((sum, t) => sum + t.dependsOn.length, 0));
  });

  it('never overlaps boxes inside a lane', () => {
    const byLane = new Map<string, typeof layout.nodes>();
    layout.nodes.forEach((n) => byLane.set(n.lane, [...(byLane.get(n.lane) ?? []), n]));
    for (const nodes of byLane.values()) {
      for (const a of nodes) {
        for (const b of nodes) {
          if (a.id === b.id || a.y !== b.y) continue;
          expect(a.x + a.w <= b.x || b.x + b.w <= a.x).toBe(true);
        }
      }
    }
  });

  it('is date aware: x follows time and nodes carry calendar dates', () => {
    const venue = layout.nodes.find((n) => n.id === 'W04')!;
    const first = schedule.tasks.find((t) => t.id === 'W04')!;
    expect(venue.x).toBe(24 + first.earliestStart * 24);
    expect(venue.startDate).toMatch(/^2026-/);
    expect(venue.endDate! >= venue.startDate!).toBe(true);
    expect(venue.mustStartBy! >= venue.startDate!).toBe(true);
    const day0 = layout.ticks[0]!;
    expect(day0).toMatchObject({ offsetDays: 0, date: '2026-11-01' });
    expect(layout.eventX).toBe(24 + 200 * 24);
    expect(layout.width).toBeGreaterThan(layout.eventX);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('marks critical nodes and edges only along tight critical links', () => {
    const critical = new Set(layout.nodes.filter((n) => n.critical).map((n) => n.id));
    expect(critical.size).toBeGreaterThan(0);
    for (const edge of layout.edges.filter((e) => e.critical)) {
      expect(critical.has(edge.from) && critical.has(edge.to)).toBe(true);
    }
    expect(layout.edges.some((e) => e.critical)).toBe(true);
  });

  it('draws milestones as small diamonds and orders lanes consistently', () => {
    const eventDay = layout.nodes.find((n) => n.id === 'W16')!;
    expect(eventDay).toMatchObject({ milestone: true, w: 32, h: 32 });
    expect(layout.lanes.at(-1)?.lane).toBe('milestone');
    const ys = layout.lanes.map((l) => l.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('shows backups, status and negative spare time when the date is too close', () => {
    const tight = layoutEventGraph(schedule, tasks, {
      ...options,
      availableDays: 30,
      backedUpTaskIds: new Set(['W04']),
      todayOffset: 5,
    });
    expect(tight.nodes.find((n) => n.id === 'W04')?.hasBackup).toBe(true);
    expect(tight.nodes.find((n) => n.id === 'W05')?.hasBackup).toBe(false);
    expect(tight.nodes.some((n) => n.floatDays < 0)).toBe(true);
    expect(tight.todayX).toBe(24 + 5 * 24);
  });

  it('reflects progress and handles an invalid start date and sparse metadata', () => {
    const done = tasks.map((t) => (t.id === 'W01' ? { ...t, done: true } : t));
    const doneSchedule = computeSchedule(done);
    if (!doneSchedule.ok) throw new Error('expected ok');
    const withDone = layoutEventGraph(doneSchedule.value, done, options);
    expect(withDone.nodes.find((n) => n.id === 'W01')).toMatchObject({ done: true, started: true });
    const bad = layoutEventGraph(schedule, tasks, { ...options, startDate: 'nope' });
    expect(bad.nodes[0]?.startDate).toBeNull();
    expect(bad.ticks[0]?.date).toBeNull();
    const noMeta = layoutEventGraph(schedule, [], options);
    expect(noMeta.lanes).toHaveLength(1);
    expect(noMeta.lanes[0]?.lane).toBe('planning');
    const custom = layoutEventGraph(schedule, tasks, {
      ...options,
      dayWidth: 10,
      nodeHeight: 30,
      rowGap: 4,
      laneGap: 10,
      minNodeWidth: 60,
      padding: 8,
    });
    expect(custom.eventX).toBe(8 + 2000);
  });

  it('chooses calendar tick spacing by plan length', () => {
    expect(tickStepDays(10)).toBe(1);
    expect(tickStepDays(40)).toBe(7);
    expect(tickStepDays(150)).toBe(14);
    expect(tickStepDays(400)).toBe(30);
  });

  it('is deterministic', () => {
    expect(layoutEventGraph(schedule, tasks, options)).toEqual(layout);
  });
});
