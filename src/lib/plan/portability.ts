import { z } from 'zod';
import type { Result } from '../schedule/types';
import { stripControlChars } from '../format';
import type { BudgetLine } from '../budget/engine';
import type { PlanState } from './propagate';
import type { PlanTask } from './types';
import type { PlanVersion } from './versions';
import type { VendorSelection } from '../vendors/types';
import { BudgetLineSchema, IntakeSchema, PlanTaskSchema, VendorSelectionSchema } from './schemas';

export const MAX_FILE_BYTES = 256 * 1024; // 256 KB max file cap

export type PortabilityError =
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_JSON'
  | 'UNSUPPORTED_FORMAT'
  | 'CHECKSUM_MISMATCH'
  | 'SCHEMA_VALIDATION_FAILED';

export interface PortabilityErrorDetail {
  readonly error: PortabilityError;
  readonly details?: string;
}

export interface JashnPackagePayload {
  readonly id: string;
  readonly intake: z.infer<typeof IntakeSchema>;
  readonly tasks: readonly PlanTask[];
  readonly budgetLines: readonly BudgetLine[];
  readonly vendorSelections: readonly VendorSelection[];
  readonly targetDays?: number;
  readonly versions?: readonly PlanVersion[];
}

export interface JashnPackageEnvelope {
  readonly format: 'jashn-event-v1';
  readonly exportedAt: string;
  readonly checksum: string;
  readonly payload: JashnPackagePayload;
}

export interface ImportedPlan {
  readonly plan: PlanState;
  readonly vendorSelections: readonly VendorSelection[];
  readonly restoredTaskCount: number;
  readonly restoredVendorCount: number;
  readonly checksumVerified: boolean;
}

const JashnPayloadSchema = z.object({
  id: z.string().min(1),
  intake: IntakeSchema,
  tasks: z.array(PlanTaskSchema),
  budgetLines: z.array(BudgetLineSchema),
  vendorSelections: z.array(VendorSelectionSchema).default([]),
  targetDays: z.number().int().min(1).optional(),
});

function calculateChecksum(payloadStr: string): string {
  let hash = 5381;
  for (let i = 0; i < payloadStr.length; i++) {
    hash = (hash * 33) ^ payloadStr.charCodeAt(i);
  }
  return `chk_${(hash >>> 0).toString(16)}`;
}

function ok<T>(value: T): Result<T, PortabilityErrorDetail> {
  return { ok: true, value };
}

function err(error: PortabilityErrorDetail): Result<never, PortabilityErrorDetail> {
  return { ok: false, error };
}

function parseJsonSafe(raw: string): Result<unknown, PortabilityErrorDetail> {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_FILE_BYTES) {
    return err({ error: 'PAYLOAD_TOO_LARGE', details: 'File exceeds 256 KB safety limit' });
  }
  try {
    return ok(JSON.parse(stripControlChars(raw)));
  } catch (e) {
    return err({
      error: 'INVALID_JSON',
      details: e instanceof Error ? e.message : 'Invalid JSON format',
    });
  }
}

function buildImportedPlan(payload: z.infer<typeof JashnPayloadSchema>): ImportedPlan {
  const plan: PlanState = {
    id: payload.id,
    intake: payload.intake,
    tasks: payload.tasks as unknown as readonly PlanTask[],
    budgetLines: payload.budgetLines as unknown as readonly BudgetLine[],
    targetDays: payload.targetDays ?? 90,
  };
  return {
    plan,
    vendorSelections: payload.vendorSelections,
    restoredTaskCount: payload.tasks.length,
    restoredVendorCount: payload.vendorSelections.length,
    checksumVerified: true,
  };
}

/**
 * Serializes a living plan into an exportable, versioned .jashn envelope (AC5, AC30).
 * Strips all transient Google Places data, guaranteeing zero PII or terms violations.
 *
 * @param plan Current living plan state
 * @param selections List of chosen vendor selections
 * @param versions Optional history trail
 * @returns Formatted JSON string ready for file download
 */
export function exportJashnFile(
  plan: PlanState,
  selections: readonly VendorSelection[] = [],
  versions?: readonly PlanVersion[],
): string {
  const sanitizedSelections = selections.map((s) => VendorSelectionSchema.parse(s));
  const payload: JashnPackagePayload = {
    id: plan.id,
    intake: plan.intake,
    tasks: plan.tasks,
    budgetLines: plan.budgetLines,
    vendorSelections: sanitizedSelections,
    targetDays: plan.targetDays,
    versions,
  };

  const payloadString = JSON.stringify(payload);
  const envelope: JashnPackageEnvelope = {
    format: 'jashn-event-v1',
    exportedAt: new Date().toISOString(),
    checksum: calculateChecksum(payloadString),
    payload,
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Validates and imports a .jashn file, checking size cap, JSON syntax, checksum, and Zod schemas (AC5, AC30).
 *
 * @param rawJson Raw string read from a uploaded .jashn file
 * @returns Result with reconstituted PlanState or typed error details
 */
export function importJashnFile(rawJson: string): Result<ImportedPlan, PortabilityErrorDetail> {
  const jsonRes = parseJsonSafe(rawJson);
  if (!jsonRes.ok) return jsonRes;
  const parsed = jsonRes.value;

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { format?: string }).format !== 'jashn-event-v1'
  ) {
    return err({
      error: 'UNSUPPORTED_FORMAT',
      details: 'Not a valid jashn-event-v1 package envelope',
    });
  }

  const rawEnvelope = parsed as { checksum?: string; payload?: unknown };
  const validation = JashnPayloadSchema.safeParse(rawEnvelope.payload);
  if (!validation.success) {
    return err({ error: 'SCHEMA_VALIDATION_FAILED', details: validation.error.message });
  }

  const expectedChecksum = calculateChecksum(JSON.stringify(validation.data));
  if (rawEnvelope.checksum !== expectedChecksum) {
    return err({ error: 'CHECKSUM_MISMATCH', details: 'Package integrity check failed.' });
  }

  return ok(buildImportedPlan(validation.data));
}
