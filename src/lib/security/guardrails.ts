export interface InjectionCheckResult {
  readonly isInjection: boolean;
  readonly patternMatched?: string;
  readonly reason?: string;
}

export interface PiiRedactResult {
  readonly text: string;
  readonly hasPii: boolean;
  readonly redactedTypes: readonly string[];
}

export interface SafetyCheckResult {
  readonly isUnsafe: boolean;
  readonly category?: string;
  readonly reason?: string;
}

export interface DomainBounds {
  readonly guests?: number;
  readonly budgetInr?: number;
  readonly quoteInr?: number;
}

export interface GuardrailValidation {
  readonly ok: boolean;
  readonly sanitizedText: string;
  readonly error?: string;
  readonly isInjection: boolean;
  readonly isUnsafe: boolean;
  readonly hasPii: boolean;
  readonly piiTypes: readonly string[];
}

const INJECTION_PATTERNS: readonly { readonly pattern: RegExp; readonly label: string }[] = [
  { pattern: /ignore\s+(all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|prompts|directions)/i, label: 'instruction_override' },
  { pattern: /disregard\s+(all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|prompts)/i, label: 'instruction_override' },
  { pattern: /system\s*prompt/i, label: 'system_prompt_leak' },
  { pattern: /reveal\s+(?:api\s*key|secret|system|token|password|instructions)/i, label: 'secret_leak' },
  { pattern: /you\s+are\s+now\s+(?:dan|developer|jailbroken|unrestricted|god\s*mode)/i, label: 'jailbreak' },
  { pattern: /bypass\s+(?:rules|filters|safety|guardrails)/i, label: 'safety_bypass' },
  { pattern: /\[system\]|<system>|<user_data>|<\/user_data>|\[assistant\]/i, label: 'role_injection' },
  { pattern: /<script|javascript:|onload\s*=|onerror\s*=/i, label: 'xss_payload' },
  { pattern: /DROP\s+TABLE|SELECT\s+.*\s+FROM|UNION\s+SELECT/i, label: 'sql_injection' },
];

const UNSAFE_PATTERNS: readonly { readonly pattern: RegExp; readonly category: string }[] = [
  { pattern: /keylogger|ransomware|ddos\s*attack|reverse\s*shell|exploit\s*kit/i, category: 'malware' },
  { pattern: /tax\s*evasion|money\s*laundering|hawala|fake\s*gst\s*invoice/i, category: 'financial_fraud' },
  { pattern: /suicide|self-harm|kill\s*myself|bomb\s*recipe|make\s*weapons/i, category: 'harmful_content' },
];

const PII_RULES: readonly { readonly pattern: RegExp; readonly type: string }[] = [
  { pattern: /\b(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, type: 'phone' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, type: 'email' },
  { pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, type: 'pan' },
  { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, type: 'aadhaar' },
  { pattern: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}\b/gi, type: 'gstin' },
  { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, type: 'card' },
  { pattern: /\b[A-PR-WYa-pr-wy][1-9]\d{6}\b/g, type: 'passport' },
];

export const BOUNDS_LIMITS = {
  maxInputLength: 1500,
  minGuests: 1,
  maxGuests: 5000,
  minBudgetInr: 1000,
  maxBudgetInr: 500000000,
  minQuoteInr: 1000,
  maxQuoteInr: 100000000,
};

function normalizeHomoglyphs(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u0430]/g, 'a')
    .replace(/[\u0435]/g, 'e')
    .replace(/[\u0456\u0457\u0406\u0407]/g, 'i')
    .replace(/[\u043E]/g, 'o')
    .replace(/[\u0441]/g, 'c')
    .replace(/[\u0440]/g, 'p');
}

/** Detects prompt injection, instruction overrides, XSS and jailbreaks. */
export function detectPromptInjection(input: string): InjectionCheckResult {
  const normalized = normalizeHomoglyphs(input);
  for (const item of INJECTION_PATTERNS) {
    if (item.pattern.test(input) || item.pattern.test(normalized)) {
      return { isInjection: true, patternMatched: item.label, reason: `Adversarial pattern: ${item.label}` };
    }
  }
  return { isInjection: false };
}

/** Scrubs Indian phone numbers, emails, PANs, and Aadhaar identifiers. */
export function redactPii(input: string): PiiRedactResult {
  let text = input;
  const redactedTypes: string[] = [];
  for (const rule of PII_RULES) {
    if (rule.pattern.test(text)) {
      redactedTypes.push(rule.type);
      text = text.replace(rule.pattern, '[REDACTED_PII]');
    }
  }
  return { text, hasPii: redactedTypes.length > 0, redactedTypes };
}

/** Intercepts non-event malicious, exploit, or hazardous text requests. */
export function detectOffTopicOrUnsafe(input: string): SafetyCheckResult {
  for (const item of UNSAFE_PATTERNS) {
    if (item.pattern.test(input)) {
      return { isUnsafe: true, category: item.category, reason: `Harmful category: ${item.category}` };
    }
  }
  return { isUnsafe: false };
}

interface BoundSpec {
  readonly val?: number;
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

function checkSingleBound(spec: BoundSpec): string | null {
  if (spec.val === undefined) return null;
  if (spec.val < spec.min || spec.val > spec.max) {
    return `${spec.label} must be between ${spec.min} and ${spec.max}`;
  }
  return null;
}

/** Validates domain bounds for guests, budget, and quotes. */
export function validateDomainBounds(bounds: DomainBounds): { readonly ok: boolean; readonly error?: string } {
  const specs: readonly BoundSpec[] = [
    { val: bounds.guests, min: BOUNDS_LIMITS.minGuests, max: BOUNDS_LIMITS.maxGuests, label: 'Guest count' },
    { val: bounds.budgetInr, min: BOUNDS_LIMITS.minBudgetInr, max: BOUNDS_LIMITS.maxBudgetInr, label: 'Budget' },
    { val: bounds.quoteInr, min: BOUNDS_LIMITS.minQuoteInr, max: BOUNDS_LIMITS.maxQuoteInr, label: 'Quote' },
  ];
  for (const s of specs) {
    const err = checkSingleBound(s);
    if (err) return { ok: false, error: err };
  }
  return { ok: true };
}

/** Clamps numeric parameters safely within celebration domain limits. */
export function clampDomainBounds(bounds: DomainBounds): DomainBounds {
  return {
    guests: bounds.guests !== undefined
      ? Math.max(BOUNDS_LIMITS.minGuests, Math.min(BOUNDS_LIMITS.maxGuests, bounds.guests))
      : undefined,
    budgetInr: bounds.budgetInr !== undefined
      ? Math.max(BOUNDS_LIMITS.minBudgetInr, Math.min(BOUNDS_LIMITS.maxBudgetInr, bounds.budgetInr))
      : undefined,
    quoteInr: bounds.quoteInr !== undefined
      ? Math.max(BOUNDS_LIMITS.minQuoteInr, Math.min(BOUNDS_LIMITS.maxQuoteInr, bounds.quoteInr))
      : undefined,
  };
}

/** Sanitizes and truncates input text to safe character limits. */
export function sanitizeInputText(text: string, maxLength = BOUNDS_LIMITS.maxInputLength): string {
  const stripped = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return stripped.length > maxLength ? stripped.slice(0, maxLength) : stripped;
}

/** Unified pipeline evaluating prompt injection, harmful intent, and scrubbing PII. */
export function runGuardrailPipeline(input: string): GuardrailValidation {
  const sanitized = sanitizeInputText(input);
  const injection = detectPromptInjection(sanitized);
  if (injection.isInjection) {
    return {
      ok: false, sanitizedText: sanitized, error: injection.reason,
      isInjection: true, isUnsafe: false, hasPii: false, piiTypes: [],
    };
  }
  const unsafe = detectOffTopicOrUnsafe(sanitized);
  if (unsafe.isUnsafe) {
    return {
      ok: false, sanitizedText: sanitized, error: unsafe.reason,
      isInjection: false, isUnsafe: true, hasPii: false, piiTypes: [],
    };
  }
  const pii = redactPii(sanitized);
  return {
    ok: true, sanitizedText: pii.text,
    isInjection: false, isUnsafe: false, hasPii: pii.hasPii, piiTypes: pii.redactedTypes,
  };
}
