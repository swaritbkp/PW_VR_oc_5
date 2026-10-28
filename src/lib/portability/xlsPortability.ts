import type { BudgetLine } from '../budget/engine';
import type { TaskCategory } from '../plan/types';
import { detectPromptInjection, redactPii } from '../security/guardrails';

export interface XlsParseResult {
  readonly ok: boolean;
  readonly lines?: readonly BudgetLine[];
  readonly error?: string;
  readonly guardrailLog?: readonly string[];
}

const CATEGORY_MAP: Readonly<Record<string, TaskCategory>> = {
  venue: 'venue', food: 'food', catering: 'food', decor: 'decor',
  media: 'media', photography: 'media', entertainment: 'entertainment',
  permits: 'permits', logistics: 'logistics', planning: 'planning',
};

function escapeXml(str: string): string {
  const safe = str.replace(/^[=+\-@\t\r]/, "'$&");
  return safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface BudgetExportSource {
  readonly lines?: readonly BudgetLine[];
  readonly guests?: number;
  readonly city?: string;
  readonly budgetLines?: readonly BudgetLine[];
  readonly intake?: { readonly guests: number; readonly city: string };
}

function resolveExportData(source: BudgetExportSource): { lines: readonly BudgetLine[]; guests: number; city: string } {
  if (source.intake && source.budgetLines) {
    return { lines: source.budgetLines, guests: source.intake.guests, city: source.intake.city };
  }
  return {
    lines: source.lines ?? [],
    guests: source.guests ?? 250,
    city: source.city ?? 'celebration',
  };
}

/**
 * Generates an Excel-compatible SpreadsheetML 2003 XML workbook string from a plan's budget lines.
 */
export function exportPlanBudgetToXls(source: BudgetExportSource): string {
  const { lines, guests } = resolveExportData(source);
  const rows = lines.map((l) => {
    const total = l.unit === 'per_head' ? l.rateInr * guests : l.rateInr;
    return `    <Row>
      <Cell><Data ss:Type="String">${escapeXml(l.category)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(l.name)}</Data></Cell>
      <Cell><Data ss:Type="String">${l.unit}</Data></Cell>
      <Cell><Data ss:Type="Number">${l.rateInr}</Data></Cell>
      <Cell><Data ss:Type="Number">${l.unit === 'per_head' ? guests : 1}</Data></Cell>
      <Cell><Data ss:Type="Number">${total}</Data></Cell>
    </Row>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Budget Ledger">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Item</Data></Cell>
        <Cell><Data ss:Type="String">PricingMode</Data></Cell>
        <Cell><Data ss:Type="String">UnitRateInr</Data></Cell>
        <Cell><Data ss:Type="String">Quantity</Data></Cell>
        <Cell><Data ss:Type="String">TotalInr</Data></Cell>
      </Row>
${rows}
    </Table>
  </Worksheet>
</Workbook>`;
}

/**
 * Triggers browser download of the plan's budget ledger as an Excel-compatible .xls file.
 */
export function downloadBudgetXls(source: BudgetExportSource): void {
  if (typeof window === 'undefined') return;
  const { city } = resolveExportData(source);
  const content = exportPlanBudgetToXls(source);
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jashn-budget-${city.toLowerCase()}-${Date.now()}.xls`;
  a.click();
  if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
}

function checkSecurityLayers(content: string): string | null {
  if (content.length > 262144) return '🛡️ XLS Guardrail Intercepted: File size exceeds 256 KB limit';
  if (/<!ENTITY|<!DOCTYPE|<script|javascript:|onerror=/i.test(content)) {
    return '🛡️ XLS Guardrail Intercepted: XXE or Unsafe Script Blocked';
  }
  return null;
}

function parseXmlCells(rowXml: string): string[] {
  const cells: string[] = [];
  const re = /<Data[^>]*>([\s\S]*?)<\/Data>/gi;
  let match: RegExpExecArray | null = re.exec(rowXml);
  while (match !== null) {
    cells.push(match[1].trim());
    match = re.exec(rowXml);
  }
  return cells;
}

function parseXlsRows(content: string): string[][] {
  if (content.includes('<Row')) {
    const rows: string[][] = [];
    const rowRe = /<Row[^>]*>([\s\S]*?)<\/Row>/gi;
    let match: RegExpExecArray | null = rowRe.exec(content);
    while (match !== null) {
      const cells = parseXmlCells(match[1]);
      if (cells.length > 0) rows.push(cells);
      match = rowRe.exec(content);
    }
    return rows;
  }
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((l) => (l.includes('\t') ? l.split('\t') : l.split(','))).map((r) => r.map((c) => c.trim()));
}

interface RowValidationResult {
  readonly line?: BudgetLine;
  readonly error?: string;
  readonly piiRedacted?: boolean;
}

function checkCellSafety(row: string[]): string | null {
  for (const cell of row) {
    if (/^[=+\-@\t\r]/.test(cell)) {
      return '🛡️ XLS Guardrail Intercepted: Spreadsheet Formula / Macro Injection Blocked';
    }
    if (detectPromptInjection(cell).isInjection) {
      return '🛡️ XLS Guardrail Intercepted: Prompt Injection Blocked';
    }
  }
  return null;
}

function parseUnit(raw?: string): 'fixed' | 'per_head' {
  if (!raw) return 'fixed';
  const val = raw.toLowerCase();
  return val.includes('head') || val.includes('guest') ? 'per_head' : 'fixed';
}

function parseBudgetRate(raw?: string): number | null {
  if (!raw) return null;
  const parsed = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(100000000, Math.max(100, parsed));
}

function validateAndMapRow(row: string[], idx: number): RowValidationResult {
  const safetyErr = checkCellSafety(row);
  if (safetyErr) return { error: safetyErr };

  const rawCat = (row[0] || 'entertainment').toLowerCase();
  const category = CATEGORY_MAP[rawCat] ?? 'entertainment';
  const rawName = row[1] || `Budget Item ${idx}`;
  const piiRes = redactPii(rawName);
  const unit = parseUnit(row[2]);
  const rateInr = parseBudgetRate(row[3]);
  if (rateInr === null) return {};

  return {
    line: {
      id: `xls_item_${category}_${idx}`,
      category,
      name: piiRes.text,
      unit,
      rateInr,
      quantity: 1,
      drivers: unit === 'per_head' ? ['guests', 'budget'] : ['budget'],
      notes: 'Imported from XLS budget spreadsheet',
    },
    piiRedacted: piiRes.hasPii,
  };
}

function collectValidLines(dataRows: string[][]): { lines: BudgetLine[]; error?: string; piiCount: number } {
  const lines: BudgetLine[] = [];
  let piiCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const res = validateAndMapRow(dataRows[i], i + 1);
    if (res.error) return { lines: [], error: res.error, piiCount };
    if (res.line) lines.push(res.line);
    if (res.piiRedacted) piiCount++;
  }
  return { lines, piiCount };
}

function validateRowLimits(rows: string[][]): string | null {
  if (rows.length < 2) return 'XLS spreadsheet must contain a header and at least one item row';
  if (rows.length > 200) return 'XLS spreadsheet exceeds 200 row capacity';
  return null;
}

/**
 * Parses, sanitizes and validates an Excel-compatible .xls spreadsheet through a 5-layer security guardrail pipeline.
 */
export function parseAndValidateBudgetXls(xlsContent: string): XlsParseResult {
  const securityError = checkSecurityLayers(xlsContent);
  if (securityError) return { ok: false, error: securityError };

  const rows = parseXlsRows(xlsContent);
  const limitError = validateRowLimits(rows);
  if (limitError) return { ok: false, error: limitError };

  const firstHeader = rows[0]?.[0]?.toLowerCase() ?? '';
  const dataRows = firstHeader.includes('category') ? rows.slice(1) : rows;
  const { lines, error, piiCount } = collectValidLines(dataRows);
  if (error) return { ok: false, error };
  if (lines.length === 0) return { ok: false, error: 'No valid numeric budget rows could be parsed' };

  const logs = piiCount > 0 ? [`[🛡️ ${piiCount} PII Instances Auto-Redacted on XLS Import]`] : [];
  return { ok: true, lines, guardrailLog: logs };
}
