import { describe, it, expect } from 'vitest';
import {
  checkBannedPatterns,
  checkNumericSanity,
  checkLanguageScript,
  checkDagOrder,
  runGuardrails,
} from './guardrails';
import type { PlannerCoreOutput } from './schemas';

describe('guardrails (AC2, AC5, AC9)', () => {
  const validTasks = [
    {
      id: 'T1',
      name: 'Book venue',
      optimistic: 2,
      mostLikely: 5,
      pessimistic: 10,
      dependsOn: [],
      category: 'venue' as const,
      drivers: ['city' as const],
      why: 'Secures event location',
    },
    {
      id: 'T00',
      name: 'Event day celebration',
      optimistic: 1,
      mostLikely: 1,
      pessimistic: 1,
      dependsOn: ['T1'],
      category: 'milestone' as const,
      drivers: ['date' as const],
      why: 'Event day sink',
    },
  ];

  const validBudgetLines = [
    {
      id: 'B1',
      category: 'venue' as const,
      name: 'Venue rental charge',
      unit: 'fixed' as const,
      rateInr: 200_000,
      drivers: ['budget' as const],
      notes: 'Estimate based on 300 guests',
    },
  ];

  it('rejects text containing URLs, phones, emails, or company suffixes (AC2, AC5)', () => {
    expect(checkBannedPatterns('Visit https://example.com for info')).not.toBeNull();
    expect(checkBannedPatterns('Call us at +919876543210')).not.toBeNull();
    expect(checkBannedPatterns('Contact test@jashn.ai')).not.toBeNull();
    expect(checkBannedPatterns('Decor by Royal Events Pvt Ltd')).not.toBeNull();
    expect(checkBannedPatterns('Sound setup by DJ Rahul Studios')).not.toBeNull();
    expect(checkBannedPatterns('Clean booking task notes')).toBeNull();
  });

  it('detects inverted durations or negative budget estimates (AC9)', () => {
    const inverted = [{ ...validTasks[0], optimistic: 10, mostLikely: 5, pessimistic: 2 }];
    expect(checkNumericSanity(inverted, validBudgetLines)).toContain('optimistic <= mostLikely');

    const negativeBudget = [{ ...validBudgetLines[0], rateInr: -500 }];
    expect(checkNumericSanity(validTasks, negativeBudget)).toContain('non-negative');
  });

  it('verifies script share for Hindi and Punjabi (AC17)', () => {
    expect(checkLanguageScript('Book wedding venue in Chandigarh', 'hi')).toBe(false);
    expect(checkLanguageScript('चंडीगढ़ में विवाह स्थल बुक करें', 'hi')).toBe(true);

    expect(checkLanguageScript('Book wedding venue in Ludhiana', 'pa')).toBe(false);
    expect(checkLanguageScript('ਲੁਧਿਆਣਾ ਵਿਖੇ ਵਿਆਹ ਦਾ ਸਥਾਨ ਬੁੱਕ ਕਰੋ', 'pa')).toBe(true);

    expect(checkLanguageScript('English text for event', 'en')).toBe(true);
  });

  it('verifies DAG topological order and detects circular dependencies (AC9)', () => {
    const cyclic = [
      { ...validTasks[0], dependsOn: ['T00'] },
      { ...validTasks[1], dependsOn: ['T1'] },
    ];
    const res = checkDagOrder(cyclic, 'T00');
    expect(res.ok).toBe(false);
  });

  it('passes comprehensive guardrail run on clean output', () => {
    const payload: PlannerCoreOutput = {
      tasks: validTasks,
      budgetLines: validBudgetLines,
    };
    const res = runGuardrails(payload, 'en', 'T00');
    expect(res.ok).toBe(true);
  });
});
