import { describe, expect, it } from 'vitest';
import { formatInr, formatInrRange, formatLakh, stripControlChars } from './format';

describe('format helpers', () => {
  it('formats positive and negative Indian Rupees with en-IN commas', () => {
    expect(formatInr(0)).toBe('₹0');
    expect(formatInr(500)).toBe('₹500');
    expect(formatInr(2500000)).toBe('₹25,00,000');
    expect(formatInr(10000000)).toBe('₹1,00,00,000');
    expect(formatInr(-50000)).toBe('-₹50,000');
  });

  it('formats rupee ranges', () => {
    expect(formatInrRange(1500000, 2500000)).toBe('₹15,00,000 – ₹25,00,000');
  });

  it('formats compact Indian denominations (Lakh, Crore, Thousand)', () => {
    expect(formatLakh(2500000)).toBe('₹25L');
    expect(formatLakh(2550000)).toBe('₹25.5L');
    expect(formatLakh(15000000)).toBe('₹1.5Cr');
    expect(formatLakh(40000)).toBe('₹40k');
    expect(formatLakh(500)).toBe('₹500');
    expect(formatLakh(-2500000)).toBe('-₹25L');
  });

  it('strips dangerous control characters while preserving valid whitespace', () => {
    const dirty = 'Hello\u0000\u0007 World\n\tSpecial';
    expect(stripControlChars(dirty)).toBe('Hello World\n\tSpecial');
  });
});
