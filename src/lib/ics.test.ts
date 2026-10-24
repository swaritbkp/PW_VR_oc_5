import { describe, expect, it } from 'vitest';
import { buildIcs, escapeText, foldLine } from './ics';

const options = { calendarName: 'Priya, wedding; plan', stamp: '20261024T000000Z' };

describe('AC14 calendar export', () => {
  it('builds all-day events with reminders and CRLF endings', () => {
    const ics = buildIcs(
      [
        {
          uid: 'w04@jashn',
          title: 'Book venue',
          date: '2026-12-30',
          description: 'Visit 3 halls',
          remindDaysBefore: [7, 2],
        },
      ],
      options,
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261230');
    expect(ics).toContain('DTEND;VALUE=DATE:20261231');
    expect(ics).toContain('TRIGGER:-P7D');
    expect(ics).toContain('TRIGGER:-P2D');
    expect(ics).toContain('X-WR-CALNAME:Priya\\, wedding\\; plan');
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
  });

  it('rolls DTEND over a year boundary and skips invalid dates', () => {
    const ics = buildIcs(
      [
        { uid: 'a', title: 'NYE', date: '2026-12-31' },
        { uid: 'b', title: 'Bad', date: 'nope' },
      ],
      options,
    );
    expect(ics).toContain('DTEND;VALUE=DATE:20270101');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(buildIcs([], { ...options, prodId: '-//X//EN' })).toContain('PRODID:-//X//EN');
  });

  it('escapes text and folds long lines at 75 octets without splitting characters', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    const long = foldLine(`SUMMARY:${'ਵਿਆਹ'.repeat(40)}`);
    const encoder = new TextEncoder();
    for (const piece of long.split('\r\n'))
      expect(encoder.encode(piece).length).toBeLessThanOrEqual(75);
    expect(long.replace(/\r\n /g, '')).toBe(`SUMMARY:${'ਵਿਆਹ'.repeat(40)}`);
    expect(foldLine('SHORT')).toBe('SHORT');
  });
});
