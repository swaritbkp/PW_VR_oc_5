import { Prisma } from '@prisma/client';
import { getPrisma } from '../db/prisma';

export type EventRecord = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly date: string | null;
  readonly budgetInr: number | null;
  readonly status: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

interface PrismaEventView {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly date: Date | null;
  readonly budgetInr: number | null;
  readonly status: string;
  readonly metadata: Prisma.JsonValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

function isJsonObject(value: unknown): value is Record<string, Prisma.InputJsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toJsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return isJsonObject(value) ? value : {};
}

/** Maps a Prisma event row to the serialized event record shape. */
export function toEventRecord(event: PrismaEventView): EventRecord {
  return {
    id: event.id,
    userId: event.userId,
    title: event.title,
    date: event.date ? event.date.toISOString() : null,
    budgetInr: event.budgetInr,
    status: event.status,
    metadata: toJsonRecord(event.metadata),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

/** Returns all non-deleted events for the authenticated user, newest first. */
export async function listEvents(userId: string): Promise<EventRecord[]> {
  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }
  const events = await prisma.event.findMany({
    where: { userId, status: { not: 'DELETED' } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, userId: true, title: true, date: true, budgetInr: true,
      status: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });
  return events.map(toEventRecord);
}

/** Returns a single event only if it belongs to the authenticated user. */
export async function getEvent(id: string, userId: string): Promise<EventRecord | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true, userId: true, title: true, date: true, budgetInr: true,
      status: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });
  if (!event || event.userId !== userId || event.status === 'DELETED') {
    return null;
  }
  return toEventRecord(event);
}
