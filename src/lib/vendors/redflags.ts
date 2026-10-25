export type RedFlagSeverity = 'high' | 'medium' | 'low';

export interface DetectedRedFlag {
  readonly id: string;
  readonly severity: RedFlagSeverity;
  readonly phraseMatched: string;
  readonly riskTitle: string;
  readonly explanation: string;
  readonly counterClause: string;
}

export type RiskLevel = 'safe' | 'caution' | 'high_risk';

export interface RedFlagAnalysis {
  readonly safetyScore: number;
  readonly riskLevel: RiskLevel;
  readonly flags: readonly DetectedRedFlag[];
  readonly totalFlags: number;
  readonly highSeverityCount: number;
  readonly summaryRecommendation: string;
}

interface PatternRule {
  readonly id: string;
  readonly severity: RedFlagSeverity;
  readonly regex: RegExp;
  readonly title: string;
  readonly explanation: string;
  readonly counterClause: string;
}

const RED_FLAG_RULES: readonly PatternRule[] = [
  {
    id: 'full_advance',
    severity: 'high',
    regex: /(100%(\s+\w+){0,3}\s*advance|full\s*payment\s*(before|in\s*advance))/i,
    title: '100% Upfront Advance Payment Demanded',
    explanation:
      'Paying 100% before the event leaves the host with zero financial leverage if deliverables fail.',
    counterClause:
      'Counter with industry standard: 25% booking token, 50% on-site setup check, 25% post-event signoff.',
  },
  {
    id: 'cash_only',
    severity: 'high',
    regex: /(no\s*written\s*agreement|cash\s*only|कच्चा|raw\s*cash)/i,
    title: 'Unwritten Agreement or Cash-Only Mandate',
    explanation: 'Absence of GST invoice or signed MoU deprives you of consumer legal protections.',
    counterClause:
      'Demand an itemized GST quotation and signed service agreement outlining specific deliverables.',
  },
  {
    id: 'non_refundable',
    severity: 'high',
    regex: /(non-refundable|no\s*refund|no\s*rain\s*cancellation)/i,
    title: 'Blanket Non-Refundable / No Weather Cancellation Clause',
    explanation:
      'Refusal to accommodate severe force majeure or rain imposes total financial risk onto the host.',
    counterClause:
      'Counter with: 80% refund or free date postponement if cancelled due to weather or verified force majeure.',
  },
  {
    id: 'generator_actuals',
    severity: 'medium',
    regex: /(diesel|generator)\s*(billed\s*)?at\s*actuals/i,
    title: 'Uncapped Generator / Diesel Fuel Surcharge',
    explanation: 'Open-ended fuel billing often inflates final settlement bills unexpectedly.',
    counterClause:
      'Specify a fixed generator inclusion rate or cap fuel consumption at a flat ceiling.',
  },
  {
    id: 'curfew_penalty',
    severity: 'medium',
    regex: /(curfew\s*at\s*10\s*pm|overtime\s*(penalty|fee)|hourly\s*(fine|penalty)|\/hr\s*overtime)/i,
    title: 'Aggressive Curfew / Overtime Penalty',
    explanation:
      'Hefty per-minute or hourly overtime penalties can cause disputes during celebration extensions.',
    counterClause:
      'Negotiate a 60-minute grace period before overtime kicks in at a pre-agreed hourly flat rate.',
  },
];

function scoreRiskLevel(score: number, hasHighSeverity: boolean): RiskLevel {
  if (hasHighSeverity || score < 60) return 'high_risk';
  if (score >= 85) return 'safe';
  return 'caution';
}

function buildSummary(flags: readonly DetectedRedFlag[], risk: RiskLevel): string {
  if (risk === 'safe') {
    return 'The quote appears fair and aligned with standard consumer protection best practices.';
  }
  if (risk === 'caution') {
    return `Caution advised: ${flags.length} clause(s) require negotiation before signing.`;
  }
  return `High Risk: ${flags.length} predatory clause(s) detected. Do not pay token advance without amendments.`;
}

function scanRules(text: string): {
  readonly detected: readonly DetectedRedFlag[];
  readonly deduction: number;
} {
  const detected: DetectedRedFlag[] = [];
  let deduction = 0;
  for (const rule of RED_FLAG_RULES) {
    const match = rule.regex.exec(text);
    if (match) {
      detected.push({
        id: rule.id,
        severity: rule.severity,
        phraseMatched: match[0],
        riskTitle: rule.title,
        explanation: rule.explanation,
        counterClause: rule.counterClause,
      });
      deduction += rule.severity === 'high' ? 35 : 15;
    }
  }
  return { detected, deduction };
}

/**
 * Scans vendor quote text or contract terms for predatory clauses and returns
 * safety scoring alongside actionable protective counter-clauses.
 */
export function analyzeVendorQuote(text: string): RedFlagAnalysis {
  if (!text.trim()) {
    return {
      safetyScore: 100,
      riskLevel: 'safe',
      flags: [],
      totalFlags: 0,
      highSeverityCount: 0,
      summaryRecommendation: 'Paste vendor terms or quotation to initiate safety inspection.',
    };
  }

  const { detected, deduction } = scanRules(text);
  const highSeverityCount = detected.filter((d) => d.severity === 'high').length;
  const safetyScore = Math.max(0, 100 - deduction);
  const riskLevel = scoreRiskLevel(safetyScore, highSeverityCount > 0);

  return {
    safetyScore,
    riskLevel,
    flags: detected,
    totalFlags: detected.length,
    highSeverityCount,
    summaryRecommendation: buildSummary(detected, riskLevel),
  };
}
