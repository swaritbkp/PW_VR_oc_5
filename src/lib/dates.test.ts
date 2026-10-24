import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, formatDate, monthOf, offsetToDate, parseDate } from './dates';

describe('AC4 date math is timezone-safe', () => {
  it('parses valid dates and rejects impossible ones', () => {
    expect(parseDate('2026-12-14')).not.toBeNull();
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('2026-13-01')).toBeNull();
    expect(parseDate('14-12-2026')).toBeNull();
    expect(parseDate('')).toBeNull();
  });

  it('adds days across month and year boundaries and leap days', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-03-01', 1.5)).toBeNull();
    expect(addDays('bad', 1)).toBeNull();
  });

  it('counts calendar days, negative when reversed', () => {
    expect(daysBetween('2026-10-24', '2026-12-14')).toBe(51);
    expect(daysBetween('2026-12-14', '2026-10-24')).toBe(-51);
    expect(daysBetween('x', '2026-10-24')).toBeNull();
    expect(daysBetween('2026-10-24', 'y')).toBeNull();
  });

  it('converts fractional offsets with floor or ceil and tolerates float noise', () => {
    expect(offsetToDate('2026-11-01', 10.4, 'floor')).toBe('2026-11-11');
    expect(offsetToDate('2026-11-01', 10.4, 'ceil')).toBe('2026-11-12');
    expect(offsetToDate('2026-11-01', 0.1 + 0.2 - 0.3, 'ceil')).toBe('2026-11-01');
    expect(offsetToDate('nope', 1)).toBeNull();
  });

  it('formats and reads months', () => {
    expect(formatDate(Date.UTC(2026, 0, 13))).toBe('2026-01-13');
    expect(monthOf('2026-01-13')).toBe(1);
    expect(monthOf('bad')).toBeNull();
  });
});
