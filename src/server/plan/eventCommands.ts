import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '../db/prisma';
import { EventRecord, toEventRecord } from './eventQueries';

const EVENT_TITLE_MAX = 120;

export const EventInputSchema = z.object({
  title: z.string().trim().min(1).max(EVENT_TITLE_MAX),
  date: z.string().datetime().optional().nullable(),
  budgetInr: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
  metadata: z.custom<Prisma.InputJsonValue>((value) => isJsonObject(value), {
    message: 'metadata must be a JSON object',
  }).default({}),
});

export type EventInput = z.infer<typeof EventInputSchema>;

function isJsonObject(value: unknown): value is Record<string, Prisma.InputJsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toInputJson(value: Prisma.JsonValue | null | undefined): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toInputJson);
  }
  const record: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, val] of Object.entries(value)) {
    record[key] = toInputJson(val);
  }
  return record;
}

/** Creates a new event scoped to the authenticated user. */
export async function createEvent(userId: string, input: EventInput): Promise<EventRecord | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }
  const validated = EventInputSchema.parse(input);
  const event = await prisma.event.create({
    data: {
      userId,
      title: validated.title,
      date: validated.date ?? null,
      budgetInr: validated.budgetInr ?? null,
      status: validated.status ?? 'ACTIVE',
      metadata: validated.metadata,
    },
    select: {
      id: true, userId: true, title: true, date: true, budgetInr: true,
      status: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });
  return toEventRecord(event);
}

/** Updates an event only if it belongs to the authenticated user. */
export async function updateEvent(
  id: string,
  userId: string,
  input: EventInput,
): Promise<EventRecord | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }
  const validated = EventInputSchema.parse(input);
  const existing = await prisma.event.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!existing || existing.userId !== userId || existing.status === 'DELETED') {
    return null;
  }
  const event = await prisma.event.update({
    where: { id },
    data: {
      title: validated.title,
      date: validated.date ?? null,
      budgetInr: validated.budgetInr ?? null,
      status: validated.status ?? existing.status,
      metadata: validated.metadata,
    },
    select: {
      id: true, userId: true, title: true, date: true, budgetInr: true,
      status: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });
  return toEventRecord(event);
}

/** Soft-deletes an event only if it belongs to the authenticated user. */
export async function deleteEvent(id: string, userId: string): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) {
    return false;
  }
  const existing = await prisma.event.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!existing || existing.userId !== userId || existing.status === 'DELETED') {
    return false;
  }
  await prisma.event.update({ where: { id }, data: { status: 'DELETED' } });
  return true;
}

/** Duplicates an existing event under the same user, preserving metadata payload. */
export async function duplicateEvent(id: string, userId: string): Promise<EventRecord | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }
  const existing = await prisma.event.findUnique({
    where: { id },
    select: { userId: true, title: true, metadata: true, status: true },
  });
  if (!existing || existing.userId !== userId || existing.status === 'DELETED') {
    return null;
  }
  const duplicated = await prisma.event.create({
    data: {
      userId,
      title: `${existing.title} (Copy)`,
      date: null,
      budgetInr: null,
      status: 'ACTIVE',
      metadata: toInputJson(existing.metadata),
    },
    select: {
      id: true, userId: true, title: true, date: true, budgetInr: true,
      status: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });
  return toEventRecord(duplicated);
}
