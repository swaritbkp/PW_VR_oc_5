import { describe, it, expect } from 'vitest';
import { generatePlan } from './generate';
import type { IntakeInput } from '../../lib/plan/schemas';
import { EVENT_DAY_ID } from '../../lib/templates/skeletons';

describe('generatePlan (AC2, AC5, AC6, AC15)', () => {
  const dummyIntake: IntakeInput = {
    eventType: 'wedding',
    templateId: 'wedding-phulkari-courtyard',
    city: 'Chandigarh',
    date: '2027-11-15',
    guests: 300,
    budgetInr: 2_500_000,
    style: 'Traditional Punjabi with marigold decor',
    nonNegotiables: ['Live dhol'],
    language: 'en',
  };

  const validCoreJson = JSON.stringify({
    tasks: [
      {
        id: 'W01',
        name: 'Select wedding venue',
        optimistic: 3,
        mostLikely: 7,
        pessimistic: 14,
        dependsOn: [],
        category: 'venue',
        drivers: ['city', 'budget'],
        why: 'Venue anchors the entire celebration timeline',
        vendorNeed: 'venue',
        bookingFor: 'venue',
      },
      ...Array.from({ length: 11 }, (_, i) => ({
        id: `W0${i + 2}`,
        name: `Preparation task ${i + 2}`,
        optimistic: 2,
        mostLikely: 4,
        pessimistic: 8,
        dependsOn: ['W01'],
        category: 'planning',
        drivers: ['date'],
        why: 'Necessary event readiness step',
      })),
      {
        id: EVENT_DAY_ID.wedding,
        name: 'Wedding day ceremonies',
        optimistic: 1,
        mostLikely: 1,
        pessimistic: 1,
        dependsOn: Array.from({ length: 11 }, (_, i) => `W0${i + 2}`),
        category: 'milestone',
        drivers: ['date'],
        why: 'Single event-day sink milestone',
      },
    ],
    budgetLines: [
      {
        id: 'B01',
        category: 'venue',
        name: 'Courtyard venue booking',
        unit: 'fixed',
        rateInr: 800_000,
        drivers: ['budget'],
        notes: 'Estimate based on historic Chandigarh venue averages',
      },
      {
        id: 'B02',
        category: 'food',
        name: 'Punjabi feast catering',
        unit: 'per_head',
        rateInr: 2_500,
        drivers: ['guests'],
        notes: 'Estimate based on 300 guests multi-course menu',
      },
      {
        id: 'B03',
        category: 'decor',
        name: 'Marigold and phulkari floral decor',
        unit: 'fixed',
        rateInr: 300_000,
        drivers: ['budget'],
        notes: 'Estimate for courtyard marigold draping and lighting',
      },
      {
        id: 'B04',
        category: 'media',
        name: 'Wedding photography & cinematography',
        unit: 'fixed',
        rateInr: 250_000,
        drivers: ['budget'],
        notes: 'Estimate for full 2-day coverage',
      },
      {
        id: 'B05',
        category: 'entertainment',
        name: 'Live dhol and folk performers',
        unit: 'fixed',
        rateInr: 100_000,
        drivers: ['budget'],
        notes: 'Estimate for baraat and sangeet dhol artists',
      },
    ],
  });

  const validExtrasJson = JSON.stringify({
    ideas: ['Phulkari backdrop photo booth', 'Welcome drinks served in clay kulhads'],
    vendorQuestions: [{ need: 'venue', questions: ['Is live dhol permitted after 10 PM?'] }],
    assumptions: ['Outdoor courtyard requires tent cover in case of rain'],
    risks: ['Peak November wedding rush in Chandigarh may inflate rates'],
  });

  it('generates a full plan with audit metadata when model succeeds (AC15)', async () => {
    const mockClient = {
      models: {
        generateContent: async ({ contents }: { contents: string }) => {
          if (contents.includes('celebration ideas')) {
            return { text: validExtrasJson };
          }
          return { text: validCoreJson };
        },
      },
    };

    const res = await generatePlan(dummyIntake, { client: mockClient });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.plan.tasks.length).toBeGreaterThanOrEqual(12);
      expect(res.plan.extras.ideas.length).toBeGreaterThan(0);
      expect(res.plan.meta.promptVersions['planner-core']).toBe('1.0.0');
      expect(res.plan.meta.agentVersion).toBe('0.1.0');
      expect(res.plan.schedule.criticalPath.length).toBeGreaterThan(0);
      expect(res.plan.budgetSummary.grandTotal).toBeGreaterThan(0);
    }
  });

  it('triggers one automatic repair retry on malformed JSON and succeeds (AC6)', async () => {
    let callCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount === 1) {
            return { text: '{ invalid_json: incomplete ...' };
          }
          return { text: validCoreJson };
        },
      },
    };

    const res = await generatePlan(dummyIntake, { client: mockClient });
    expect(res.ok).toBe(true);
    // 2 core calls (initial + repair) + 1 parallel extras call = 3 total calls
    expect(callCount).toBe(3);
    if (res.ok) {
      expect(res.plan.meta.validationOutcomes?.coreRepaired).toBe(true);
    }
  });

  it('returns a typed error if generation fails twice (never a fake plan) (AC6)', async () => {
    const mockClient = {
      models: {
        generateContent: async () => ({ text: 'NOT JSON' }),
      },
    };

    const res = await generatePlan(dummyIntake, { client: mockClient });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('GENERATION_FAILED');
      expect(res.error).toContain('JSON');
    }
  });

  it('returns a timeout error when model exceeds duration limit (AC6)', async () => {
    const mockClient = {
      models: {
        generateContent: async () => {
          await new Promise((r) => setTimeout(r, 100));
          return { text: validCoreJson };
        },
      },
    };

    const res = await generatePlan(dummyIntake, { client: mockClient, timeoutMs: 20 });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('TIMEOUT');
    }
  });

  it('rejects output containing company suffixes or URLs via guardrails (AC2)', async () => {
    const dirtyJson = JSON.stringify({
      tasks: [
        {
          id: 'W01',
          name: 'Book Decor by Royal Events Pvt Ltd',
          optimistic: 2,
          mostLikely: 4,
          pessimistic: 6,
          dependsOn: [],
          category: 'decor',
          drivers: ['budget'],
          why: 'See https://example.com for brochure',
        },
        ...Array.from({ length: 11 }, (_, i) => ({
          id: `W0${i + 2}`,
          name: `Step ${i + 2}`,
          optimistic: 1,
          mostLikely: 2,
          pessimistic: 3,
          dependsOn: ['W01'],
          category: 'planning',
          drivers: ['date'],
          why: 'Planning step',
        })),
        {
          id: EVENT_DAY_ID.wedding,
          name: 'Wedding day',
          optimistic: 1,
          mostLikely: 1,
          pessimistic: 1,
          dependsOn: ['W02'],
          category: 'milestone',
          drivers: ['date'],
          why: 'Sink',
        },
      ],
      budgetLines: [
        {
          id: 'B01',
          category: 'decor',
          name: 'Decor charge',
          unit: 'fixed',
          rateInr: 100_000,
          drivers: ['budget'],
          notes: 'Estimate',
        },
        {
          id: 'B02',
          category: 'venue',
          name: 'Venue fee',
          unit: 'fixed',
          rateInr: 200_000,
          drivers: ['budget'],
          notes: 'Estimate',
        },
        {
          id: 'B03',
          category: 'food',
          name: 'Food',
          unit: 'fixed',
          rateInr: 300_000,
          drivers: ['budget'],
          notes: 'Estimate',
        },
        {
          id: 'B04',
          category: 'media',
          name: 'Photos',
          unit: 'fixed',
          rateInr: 400_000,
          drivers: ['budget'],
          notes: 'Estimate',
        },
        {
          id: 'B05',
          category: 'entertainment',
          name: 'Music',
          unit: 'fixed',
          rateInr: 50_000,
          drivers: ['budget'],
          notes: 'Estimate',
        },
      ],
    });

    const mockClient = {
      models: {
        generateContent: async () => ({ text: dirtyJson }),
      },
    };

    const res = await generatePlan(dummyIntake, { client: mockClient });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('GENERATION_FAILED');
      expect(res.error).toContain('Guardrail');
    }
  });

  it('fails honestly when GEMINI_API_KEY is not configured (AC6)', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const res = await generatePlan(dummyIntake);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('MISSING_API_KEY');
      }
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
