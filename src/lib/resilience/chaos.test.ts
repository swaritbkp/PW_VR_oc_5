import { describe, expect, it } from 'vitest';
import { buildTemplateTasks, getTemplate } from '../templates/catalog';
import type { VendorNeedId } from '../plan/types';
import { simulateChaosCascade } from './chaos';

const wedding = buildTemplateTasks(getTemplate('wedding-phulkari-courtyard')!);
const none = new Set<VendorNeedId>();
const fullBackups = new Set<VendorNeedId>(['venue', 'caterer', 'photographer', 'tent_house']);

describe('AC25 Agentic Chaos Monkey Stress-Tester (compound disruptions)', () => {
  it('combines multiple simultaneous disruptions and amplifies slippage', () => {
    const res = simulateChaosCascade(
      wedding,
      ['venue_cancels', 'caterer_no_show', 'rain_outdoor'],
      { availableDays: 200, backedUp: none },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.scenariosApplied.length).toBe(3);
    expect(res.value.netSlippageDays).toBeGreaterThan(20);
    expect(res.value.remainingBufferDays).toBeLessThan(res.value.originalBufferDays);
    expect(res.value.totalBudgetImpactPct).toBeGreaterThanOrEqual(0);
    expect(res.value.recoveryActions.length).toBeGreaterThan(0);
  });

  it('dramatically mitigates slippage when Plan B vendor backups are active', () => {
    const withoutBackups = simulateChaosCascade(wedding, ['venue_cancels', 'caterer_no_show'], {
      availableDays: 200,
      backedUp: none,
    });
    const withBackups = simulateChaosCascade(wedding, ['venue_cancels', 'caterer_no_show'], {
      availableDays: 200,
      backedUp: fullBackups,
    });

    expect(withoutBackups.ok).toBe(true);
    expect(withBackups.ok).toBe(true);
    if (!withoutBackups.ok || !withBackups.ok) return;

    expect(withBackups.value.netSlippageDays).toBeLessThan(withoutBackups.value.netSlippageDays);
    expect(withBackups.value.remainingBufferDays).toBeGreaterThan(
      withoutBackups.value.remainingBufferDays,
    );
    expect(withBackups.value.disruptedProbability).toBeGreaterThanOrEqual(
      withoutBackups.value.disruptedProbability,
    );
  });

  it('flags catastrophic failure when remaining buffer drops negative', () => {
    const res = simulateChaosCascade(
      wedding,
      ['venue_cancels', 'caterer_no_show', 'date_pulled_forward'],
      { availableDays: 50, backedUp: none },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.remainingBufferDays).toBeLessThan(0);
    expect(res.value.catastrophicFailure).toBe(true);
  });

  it('handles empty scenario list cleanly with zero slippage', () => {
    const res = simulateChaosCascade(wedding, [], { availableDays: 200, backedUp: none });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.scenariosApplied.length).toBe(0);
    expect(res.value.netSlippageDays).toBe(0);
    expect(res.value.criticalPathShifted).toBe(false);
  });

  it('tracks newly critical task ids after compound shifts', () => {
    const res = simulateChaosCascade(wedding, ['caterer_no_show', 'decorator_delay'], {
      availableDays: 200,
      backedUp: none,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(Array.isArray(res.value.newlyCriticalTaskIds)).toBe(true);
  });
});
