import { describe, expect, it } from 'vitest';
import { buildWhatsAppSummary } from './whatsapp';
import type { PlanState } from './propagate';

const samplePlan: PlanState = {
  id: 'plan_wa',
  intake: {
    eventType: 'wedding',
    city: 'Chandigarh',
    date: '2026-12-14',
    guests: 300,
    budgetInr: 2500000,
    nonNegotiables: ['Pure veg', 'Live dhol'],
    language: 'en',
  },
  tasks: [
    {
      id: 'T1',
      name: 'Venue',
      optimistic: 1,
      mostLikely: 2,
      pessimistic: 3,
      dependsOn: [],
      category: 'venue',
      drivers: [],
      why: '',
      done: true,
    },
    {
      id: 'T2',
      name: 'Catering',
      optimistic: 1,
      mostLikely: 2,
      pessimistic: 3,
      dependsOn: [],
      category: 'food',
      drivers: [],
      why: '',
    },
  ],
  budgetLines: [],
  targetDays: 51,
};

describe('whatsapp plan sharing', () => {
  it('generates clear formatted summaries in English', () => {
    const summary = buildWhatsAppSummary(samplePlan, 'en');
    expect(summary).toContain('Wedding Celebration');
    expect(summary).toContain('Chandigarh');
    expect(summary).toContain('₹25,00,000');
    expect(summary).toContain('1/2 complete');
    expect(summary).toContain('Pure veg, Live dhol');
  });

  it('generates authentic localized summaries in Hindi', () => {
    const summary = buildWhatsAppSummary(samplePlan, 'hi');
    expect(summary).toContain('विवाह समारोह');
    expect(summary).toContain('शहर: Chandigarh');
    expect(summary).toContain('बजट: ₹25,00,000');
    expect(summary).toContain('1/2 complete');
    expect(summary).toContain('महत्वपूर्ण बातें: Pure veg, Live dhol');
  });

  it('generates authentic localized summaries in Punjabi', () => {
    const summary = buildWhatsAppSummary(samplePlan, 'pa');
    expect(summary).toContain('ਵਿਆਹ ਸਮਾਗਮ');
    expect(summary).toContain('ਸ਼ਹਿਰ: Chandigarh');
    expect(summary).toContain('ਬਜਟ: ₹25,00,000');
    expect(summary).toContain('ਜ਼ਰੂਰੀ ਗੱਲਾਂ: Pure veg, Live dhol');
  });

  it('handles birthday and community events with empty non-negotiables', () => {
    const birthdayPlan: PlanState = {
      ...samplePlan,
      intake: { ...samplePlan.intake, eventType: 'birthday', nonNegotiables: [] },
    };
    const bSummary = buildWhatsAppSummary(birthdayPlan, 'en');
    expect(bSummary).toContain('Birthday Party');
    expect(bSummary).not.toContain('Key Priorities');

    const commPlan: PlanState = {
      ...samplePlan,
      intake: { ...samplePlan.intake, eventType: 'community', nonNegotiables: [] },
    };
    expect(buildWhatsAppSummary(commPlan, 'en')).toContain('Community Event');
  });
});
