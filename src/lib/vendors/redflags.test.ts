import { describe, expect, it } from 'vitest';
import { analyzeVendorQuote } from './redflags';

describe('AC23 Smart Vendor Contract & Red-Flag Detector', () => {
  it('flags 100% advance demand with high severity and provides counter-clause', () => {
    const quote = 'Payment terms: 100% advance required 14 days before the celebration.';
    const analysis = analyzeVendorQuote(quote);

    expect(analysis.riskLevel).toBe('high_risk');
    expect(analysis.safetyScore).toBeLessThan(70);
    const flag = analysis.flags.find((f) => f.id === 'full_advance');
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('high');
    expect(flag?.counterClause).toMatch(/25%|milestone/);
  });

  it('scans 3-part predatory clause dropping safety score to exactly 20/100', () => {
    const predatory =
      'Vendor demands 100% non-refundable cash advance 60 days prior with no rain cancellation clause and Rs 50,000/hr overtime penalty';
    const analysis = analyzeVendorQuote(predatory);

    expect(analysis.riskLevel).toBe('high_risk');
    expect(analysis.safetyScore).toBe(20);
    expect(analysis.flags.length).toBe(3);
    expect(analysis.flags.some((f) => f.id === 'full_advance')).toBe(true);
    expect(analysis.flags.some((f) => f.id === 'non_refundable')).toBe(true);
    expect(analysis.flags.some((f) => f.id === 'curfew_penalty')).toBe(true);
  });

  it('flags unwritten/cash-only arrangements as severe risk', () => {
    const quote = 'No written agreement needed, raw cash only (कच्चा) on venue entry.';
    const analysis = analyzeVendorQuote(quote);

    expect(analysis.highSeverityCount).toBeGreaterThan(0);
    expect(analysis.riskLevel).toBe('high_risk');
    const flag = analysis.flags.find((f) => f.id === 'cash_only');
    expect(flag).toBeDefined();
  });

  it('flags uncapped generator/diesel and overtime curfew fees', () => {
    const quote =
      'Diesel for generator billed at actuals with no cap. Sound curfew at 10 PM sharp with heavy hourly fine.';
    const analysis = analyzeVendorQuote(quote);

    expect(analysis.flags.some((f) => f.id === 'generator_actuals')).toBe(true);
    expect(analysis.flags.some((f) => f.id === 'curfew_penalty')).toBe(true);
  });

  it('rates a fair, balanced agreement with a high safety score', () => {
    const quote =
      'Agreement: 20% booking token, 60% on arrival, 20% post-event signoff. Free food tasting included. Standard weather cancellation refund.';
    const analysis = analyzeVendorQuote(quote);

    expect(analysis.riskLevel).toBe('safe');
    expect(analysis.safetyScore).toBeGreaterThanOrEqual(90);
    expect(analysis.flags.length).toBe(0);
  });

  it('handles empty input gracefully', () => {
    const analysis = analyzeVendorQuote('');
    expect(analysis.riskLevel).toBe('safe');
    expect(analysis.safetyScore).toBe(100);
    expect(analysis.flags.length).toBe(0);
  });
});
