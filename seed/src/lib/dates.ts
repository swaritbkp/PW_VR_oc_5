/** Date-only helpers. All math is UTC-based on YYYY-MM-DD strings, so DST and time zones never shift a day. */

const MS_PER_DAY = 86_400_000;
const FLOAT_TOLERANCE = 1e-9;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type Rounding = 'floor' | 'ceil';

/** Parses YYYY-MM-DD to UTC midnight milliseconds. Returns null for malformed or impossible dates. */
export function parseDate(iso: string): number | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const back = new Date(ms);
  const same =
    back.getUTCFullYear() === year && back.getUTCMonth() === month - 1 && back.getUTCDate() === day;
  return same ? ms : null;
}

/** Formats UTC milliseconds as YYYY-MM-DD. */
export function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Adds whole days to a date string. Returns null for invalid input. */
export function addDays(iso: string, days: number): string | null {
  const ms = parseDate(iso);
  if (ms === null || !Number.isInteger(days)) return null;
  return formatDate(ms + days * MS_PER_DAY);
}

/** Whole calendar days from `fromIso` to `toIso` (negative when `toIso` is earlier). Null for invalid input. */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const from = parseDate(fromIso);
  const to = parseDate(toIso);
  if (from === null || to === null) return null;
  return Math.round((to - from) / MS_PER_DAY);
}

/** Converts a fractional day offset from a start date into a calendar date. */
export function offsetToDate(startIso: string, offsetDays: number, rounding: Rounding = 'floor'): string | null {
  const whole =
    rounding === 'floor' ? Math.floor(offsetDays + FLOAT_TOLERANCE) : Math.ceil(offsetDays - FLOAT_TOLERANCE);
  return addDays(startIso, whole);
}

/** Month number 1-12 of a date string, or null when invalid. */
export function monthOf(iso: string): number | null {
  const ms = parseDate(iso);
  return ms === null ? null : new Date(ms).getUTCMonth() + 1;
}
