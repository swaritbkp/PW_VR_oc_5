import { describe, expect, it } from 'vitest';
import { buildTemplateTasks, getTemplate } from '../templates/catalog';
import { computeSchedule } from '../schedule/cpm';
import { DISRUPTIONS, isCovered, simulateDisruption } from './disruptions';
import { backupAlerts, rankRisks, resilienceScore, seasonAlerts } from './resilience';
import { applyLeadMultiplier, regionForCity, seasonProfile } from './seasonality';
import type { VendorNeedId } from '../plan/types';

const wedding = buildTemplateTasks(getTemplate('wedding-phulkari-courtyard')!);
const scenario = (id: string) => DISRUPTIONS.find((d) => d.id === id)!;
const none = new Set<VendorNeedId>();

describe('AC26 date-aware seasonality', () => {
  it('knows north-India peak, monsoon, fog and heat months', () => {
    expect(regionForCity('Chandigarh')).toBe('north-india');
    expect(regionForCity('Pune')).toBe('default');
    expect(seasonProfile('2026-12-14', 'north-india')).toMatchObject({ weddingPeak: true, fog: true, leadMultiplier: 1.4 });
    expect(seasonProfile('2026-08-10', 'north-india')).toMatchObject({ monsoon: true, weddingPeak: false, leadMultiplier: 1 });
    expect(seasonProfile('2026-05-10', 'north-india')).toMatchObject({ heatWave: true, leadMultiplier: 1.15, priceMultiplier: 1.1 });
    expect(seasonProfile('2026-12-14', 'default')).toMatchObject({ leadMultiplier: 1, weddingPeak: false });
    expect(seasonProfile('bad', 'default')).toBeNull();
  });

  it('stretches only booking tasks in peak season', () => {
    const profile = seasonProfile('2026-12-14', 'north-india')!;
    const stretched = applyLeadMultiplier(wedding, profile);
    const venue = (list: readonly (typeof wedding)[number][]) => list.find((t) => t.id === 'W04')!;
    expect(venue(stretched).mostLikely).toBeGreaterThan(venue(wedding).mostLikely);
    expect(stretched.find((t) => t.id === 'W01')).toBe(wedding.find((t) => t.id === 'W01'));
    const calm = seasonProfile('2026-08-10', 'north-india')!;
    expect(applyLeadMultiplier(wedding, calm)).toBe(wedding);
  });
});

describe('AC25 disruptions and backups', () => {
  it('a venue cancellation hurts far less with a backup venue held', () => {
    const ctx = { availableDays: 200 };
    const without = simulateDisruption(wedding, scenario('venue_cancels'), { ...ctx, backedUp: none });
    const withBackup = simulateDisruption(wedding, scenario('venue_cancels'), { ...ctx, backedUp: new Set<VendorNeedId>(['venue']) });
    if (!without.ok || !withBackup.ok) throw new Error('expected ok');
    expect(without.value.covered).toBe(false);
    expect(withBackup.value.covered).toBe(true);
    expect(without.value.deltaDays).toBeGreaterThan(withBackup.value.deltaDays);
    expect(withBackup.value.deltaDays).toBeGreaterThan(0);
    expect(without.value.diffs.length).toBeGreaterThan(0);
  });

  it('flags event-day risk when no Plan B exists and clears it when covered', () => {
    const rain = scenario('rain_outdoor');
    const bare = simulateDisruption(wedding, rain, { availableDays: 120, backedUp: none });
    const tented = simulateDisruption(wedding, rain, { availableDays: 120, backedUp: new Set<VendorNeedId>(['tent_house']) });
    if (!bare.ok || !tented.ok) throw new Error('expected ok');
    expect(bare.value.eventAtRisk).toBe(true);
    expect(tented.value.eventAtRisk).toBe(false);
    expect(bare.value.deltaDays).toBe(0);
  });

  it('shows a date move as a shrinking buffer and lower confidence', () => {
    const result = simulateDisruption(wedding, scenario('date_pulled_forward'), { availableDays: 90, backedUp: none });
    if (!result.ok) throw new Error('expected ok');
    expect(result.value.after.bufferDays).toBe(result.value.before.bufferDays - 14);
    expect(result.value.after.probability).toBeLessThanOrEqual(result.value.before.probability);
    expect(isCovered(scenario('date_pulled_forward'), new Set<VendorNeedId>(['venue']))).toBe(false);
  });

  it('reopens an already-booked task and reports a budget-only scenario', () => {
    const booked = wedding.map((t) => (t.id === 'W04' ? { ...t, started: true, done: true } : t));
    const cancelled = simulateDisruption(booked, scenario('venue_cancels'), { availableDays: 200, backedUp: none });
    if (!cancelled.ok) throw new Error('expected ok');
    expect(cancelled.value.deltaDays).toBeGreaterThan(0);
    const surge = simulateDisruption(wedding, scenario('guest_surge'), { availableDays: 200, backedUp: none });
    if (!surge.ok) throw new Error('expected ok');
    expect(surge.value.budgetImpactPct).toBe(15);
    expect(surge.value.deltaDays).toBe(0);
  });

  it('applies category effects (permits) and rejects broken networks', () => {
    const community = buildTemplateTasks(getTemplate('community-lohri-bonfire')!);
    const permit = simulateDisruption(community, scenario('permit_denied'), { availableDays: 90, backedUp: none });
    if (!permit.ok) throw new Error('expected ok');
    expect(permit.value.deltaDays).toBeGreaterThan(0);
    expect(simulateDisruption([], scenario('venue_cancels'), { availableDays: 10, backedUp: none }).ok).toBe(false);
    const broken = wedding.map((t) => (t.id === 'W01' ? { ...t, dependsOn: ['W15'] } : t));
    expect(simulateDisruption(broken, scenario('venue_cancels'), { availableDays: 10, backedUp: none }).ok).toBe(false);
    const loop = computeSchedule(broken);
    expect(loop.ok).toBe(false);
  });
});

describe('AC24 risk ranking, resilience score and alerts', () => {
  const ctx = (month: number, outdoor: boolean, backedUp: ReadonlySet<VendorNeedId> = none) => ({ eventType: 'wedding' as const, outdoor, month, backedUp });

  it('ranks rain first for an outdoor monsoon event and hides it indoors', () => {
    const outdoor = rankRisks(ctx(8, true));
    expect(outdoor[0]?.scenario.id).toBe('rain_outdoor');
    expect(outdoor[0]?.likelihood).toBe(5);
    expect(rankRisks(ctx(8, false)).some((r) => r.scenario.id === 'rain_outdoor')).toBe(false);
    expect(rankRisks(ctx(8, false)).some((r) => r.scenario.id === 'entertainer_no_show')).toBe(false);
    expect(rankRisks(ctx(3, true)).find((r) => r.scenario.id === 'rain_outdoor')?.likelihood).toBe(1);
  });

  it('scores resilience by covered exposure', () => {
    const bare = resilienceScore(rankRisks(ctx(11, true)));
    const covered = resilienceScore(rankRisks(ctx(11, true, new Set<VendorNeedId>(['venue', 'tent_house', 'power_backup', 'caterer']))));
    expect(covered).toBeGreaterThan(bare);
    expect(bare).toBe(0);
    expect(resilienceScore([])).toBe(100);
  });

  it('raises R6 only for critical booking tasks without a backup', () => {
    const result = computeSchedule(wedding);
    if (!result.ok) throw new Error('expected ok');
    const alerts = backupAlerts(result.value, wedding, none);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.ruleId === 'R6_NO_BACKUP')).toBe(true);
    const need = alerts[0]?.params.need as VendorNeedId;
    const fewer = backupAlerts(result.value, wedding, new Set<VendorNeedId>([need]));
    expect(fewer.length).toBeLessThan(alerts.length);
  });

  it('raises R7 season alerts for weather and peak season', () => {
    const monsoon = seasonAlerts(seasonProfile('2026-08-10', 'north-india')!, true);
    expect(monsoon).toEqual([{ ruleId: 'R7_SEASON_RISK', severity: 'warning', params: { risk: 'monsoon' } }]);
    expect(seasonAlerts(seasonProfile('2026-08-10', 'north-india')!, false)).toEqual([]);
    const winter = seasonAlerts(seasonProfile('2026-12-14', 'north-india')!, true).map((a) => a.params.risk);
    expect(winter).toEqual(['fog', 'peak_season']);
    expect(seasonAlerts(seasonProfile('2026-05-10', 'north-india')!, true)[0]?.params.risk).toBe('heat');
  });
});
