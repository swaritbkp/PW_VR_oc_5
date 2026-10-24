import { addDays } from './dates';

const MAX_OCTETS = 75;
const CRLF = '\r\n';
const encoder = new TextEncoder();

export interface IcsEvent {
  readonly uid: string;
  readonly title: string;
  /** All-day date, YYYY-MM-DD. */
  readonly date: string;
  readonly description?: string;
  /** Reminders, in days before the date. */
  readonly remindDaysBefore?: readonly number[];
}

export interface IcsOptions {
  readonly calendarName: string;
  /** Timestamp for DTSTAMP, YYYYMMDDTHHMMSSZ. Injected so output is deterministic. */
  readonly stamp: string;
  readonly prodId?: string;
}

/** Escapes text per RFC 5545. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Folds a content line at 75 octets without splitting a UTF-8 character. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = '';
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

const compact = (iso: string): string => iso.replace(/-/g, '');

function eventLines(event: IcsEvent, stamp: string): string[] | null {
  const end = addDays(event.date, 1);
  if (end === null) return null;
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(event.date)}`,
    `DTEND;VALUE=DATE:${compact(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  for (const days of event.remindDaysBefore ?? []) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:-P${Math.max(0, Math.floor(days))}D`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.title)}`,
      'END:VALARM',
    );
  }
  lines.push('END:VEVENT');
  return lines;
}

/** Builds an iCalendar file of all-day events with optional reminders. Events with invalid dates are skipped. */
export function buildIcs(events: readonly IcsEvent[], options: IcsOptions): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${options.prodId ?? '-//Jashn//Event Plan//EN'}`,
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(options.calendarName)}`,
    ...events.flatMap((e) => eventLines(e, options.stamp) ?? []),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}
