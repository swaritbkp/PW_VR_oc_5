import { z } from 'zod';
import { stripControlChars } from '../format';
import type { Result } from '../schedule/types';

const MAX_EVENT_TITLE = 120;
const EVENT_STORAGE_PREFIX = 'jashn_event_';

/** Client-side event schema for offline-first persistence. */
export const ClientEventSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().transform(stripControlChars).pipe(z.string().min(1).max(MAX_EVENT_TITLE)),
  date: z.string().optional().nullable(),
  budgetInr: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).default('ACTIVE'),
  metadata: z.record(z.string(), z.unknown()).default({}),
  updatedAt: z.string(),
});

export type ClientEvent = z.infer<typeof ClientEventSchema>;

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

/** Storage key for a single event under a user. */
export function eventStorageKey(userId: string | null, eventId: string): string {
  return `${EVENT_STORAGE_PREFIX}${userId ?? 'unknown'}_${eventId}`;
}

/** Serializes a validated client event to JSON string for offline persistence. */
export function serializeEvent(event: ClientEvent): string {
  const sanitized = ClientEventSchema.parse(event);
  return JSON.stringify(sanitized);
}

/** Deserializes and validates a JSON string from offline persistence. */
export function deserializeEvent(rawJson: string): Result<ClientEvent, string> {
  try {
    const raw = JSON.parse(rawJson);
    const parsed = ClientEventSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
    }
    return { ok: true, value: parsed.data };
  } catch {
    return { ok: false, error: 'Malformed event JSON payload' };
  }
}

/** Returns the initial sync status before any database round-trip. */
export function initialSyncStatus(isDatabaseAvailable: boolean): SyncStatus {
  return isDatabaseAvailable ? 'idle' : 'offline';
}

/** Merges server and offline events, preferring the server record on id collision. */
export function mergeEvents(
  serverEvents: readonly ClientEvent[],
  offlineEvents: readonly ClientEvent[],
): ClientEvent[] {
  const byId = new Map<string, ClientEvent>();
  for (const event of offlineEvents) {
    byId.set(event.id, event);
  }
  for (const event of serverEvents) {
    byId.set(event.id, event);
  }
  return Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
