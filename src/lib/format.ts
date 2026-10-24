const LAKH = 100_000;
const CRORE = 10_000_000;
const THOUSAND = 1_000;
const DECIMAL_BASE = 10;

/**
 * Formats an amount in Indian Rupees using the en-IN numbering system (e.g. ₹25,00,000).
 */
export function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(abs);
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Formats a range of Indian Rupee amounts (e.g. ₹15,00,000 – ₹25,00,000).
 */
export function formatInrRange(min: number, max: number): string {
  return `${formatInr(min)} – ${formatInr(max)}`;
}

/**
 * Formats an amount into human-friendly Indian denominations (e.g. ₹25L, ₹1.5Cr, ₹40k, ₹500).
 */
export function formatLakh(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  if (abs >= CRORE) {
    const cr = Math.round((abs / CRORE) * DECIMAL_BASE) / DECIMAL_BASE;
    return `${isNegative ? '-' : ''}₹${cr}Cr`;
  }
  if (abs >= LAKH) {
    const lk = Math.round((abs / LAKH) * DECIMAL_BASE) / DECIMAL_BASE;
    return `${isNegative ? '-' : ''}₹${lk}L`;
  }
  if (abs >= THOUSAND) {
    const k = Math.round((abs / THOUSAND) * DECIMAL_BASE) / DECIMAL_BASE;
    return `${isNegative ? '-' : ''}₹${k}k`;
  }
  return formatInr(amount);
}

/**
 * Strips ASCII and Unicode control characters from untrusted user text, preserving standard whitespace.
 */
export function stripControlChars(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}
