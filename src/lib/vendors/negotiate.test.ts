import { describe, expect, it } from 'vitest';
import { formulateNegotiation } from './negotiate';

describe('AC22 Cultural AI Vendor Negotiation Coach', () => {
  const baseContext = {
    vendorName: 'Royal Haveli Banquets',
    category: 'venue',
    city: 'Chandigarh',
    originalQuoteInr: 500000,
    guestCount: 300,
    eventDate: '2026-12-14',
  };

  it('generates English formal pitch with off-peak leverage', () => {
    const res = formulateNegotiation({
      ...baseContext,
      tactic: 'off_peak',
      language: 'en',
    });

    expect(res.tactic).toBe('off_peak');
    expect(res.language).toBe('en');
    expect(res.targetDiscountPct).toBeGreaterThanOrEqual(15);
    expect(res.estimatedSavingsInr).toBe(
      baseContext.originalQuoteInr * (res.targetDiscountPct / 100),
    );
    expect(res.targetOfferInr).toBe(baseContext.originalQuoteInr - res.estimatedSavingsInr);
    expect(res.pitchScript).toContain('Royal Haveli Banquets');
    expect(res.pitchScript).toContain('Chandigarh');
    expect(res.talkingPoints.length).toBeGreaterThan(0);
    expect(res.counterClauseRecommendation.length).toBeGreaterThan(0);
  });

  it('generates culturally authentic Hindi pitch with milestone staging', () => {
    const res = formulateNegotiation({
      ...baseContext,
      tactic: 'milestone_stagger',
      language: 'hi',
    });

    expect(res.language).toBe('hi');
    expect(res.pitchScript).toMatch(/नमस्ते|प्रणाम/);
    expect(res.pitchScript).toContain('Royal Haveli Banquets');
    expect(res.counterClauseRecommendation).toMatch(/माइलस्टोन|एडवांस/);
  });

  it('generates culturally authentic Punjabi pitch with volume guarantee', () => {
    const res = formulateNegotiation({
      ...baseContext,
      tactic: 'volume_guarantee',
      language: 'pa',
    });

    expect(res.language).toBe('pa');
    expect(res.pitchScript).toContain('ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ');
    expect(res.pitchScript).toContain('300');
  });

  it('handles value_add tactic focusing on complimentary inclusions', () => {
    const res = formulateNegotiation({
      ...baseContext,
      tactic: 'value_add',
      language: 'en',
    });

    expect(res.tactic).toBe('value_add');
    expect(res.pitchScript.toLowerCase()).toMatch(/complimentary|value-added|inclusion/);
  });
});
