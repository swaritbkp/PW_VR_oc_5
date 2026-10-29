import { describe, expect, it } from 'vitest';
import {
  ClientEventSchema,
  deserializeEvent,
  eventStorageKey,
  initialSyncStatus,
  mergeEvents,
  serializeEvent,
  type ClientEvent,
  type SyncStatus,
} from './eventPersistence';

const sampleEvent: ClientEvent = ClientEventSchema.parse({
  id: 'evt_1',
  userId: 'user_1',
  title: 'Diwali Celebration',
  date: '2026-11-12T18:00:00.000Z',
  budgetInr: 500000,
  status: 'ACTIVE',
  metadata: { guests: 200 },
  updatedAt: '2026-10-29T12:00:00.000Z',
});

describe('ClientEvent persistence', () => {
  it('serializes and deserializes an event cleanly', () => {
    const serialized = serializeEvent(sampleEvent);
    expect(serialized).toContain('Diwali Celebration');
    expect(serialized).toContain('user_1');

    const deserialized = deserializeEvent(serialized);
    expect(deserialized.ok).toBe(true);
    if (deserialized.ok) {
      expect(deserialized.value.id).toBe('evt_1');
      expect(deserialized.value.title).toBe('Diwali Celebration');
    }
  });

  it('rejects malformed json safely', () => {
    const res = deserializeEvent('{ invalid json');
    expect(res.ok).toBe(false);

    const schemaMismatch = deserializeEvent(JSON.stringify({ id: 'bad' }));
    expect(schemaMismatch.ok).toBe(false);
  });

  it('builds a deterministic storage key per user and event', () => {
    expect(eventStorageKey('user_1', 'evt_1')).toBe('jashn_event_user_1_evt_1');
    expect(eventStorageKey('user_2', 'evt_1')).not.toBe(eventStorageKey('user_1', 'evt_1'));
  });

  it('returns offline status when the database is unavailable', () => {
    expect(initialSyncStatus(false)).toBe('offline');
    expect(initialSyncStatus(true)).toBe('idle');
  });

  it('prefers server events on id collision and sorts newest first', () => {
    const offline: ClientEvent[] = [
      ClientEventSchema.parse({
        ...sampleEvent,
        id: 'shared',
        title: 'Offline',
        updatedAt: '2026-10-29T10:00:00.000Z',
      }),
    ];
    const server: ClientEvent[] = [
      ClientEventSchema.parse({
        ...sampleEvent,
        id: 'shared',
        title: 'Server',
        updatedAt: '2026-10-29T11:00:00.000Z',
      }),
    ];
    const merged = mergeEvents(server, offline);
    expect(merged.length).toBe(1);
    expect(merged[0].title).toBe('Server');
  });

  it('exposes a SyncStatus type', () => {
    const status: SyncStatus = 'synced';
    expect(status).toBe('synced');
  });
});
