'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import {
  ClientEventSchema,
  eventStorageKey,
  mergeEvents,
  type ClientEvent,
  type SyncStatus,
} from '@/lib/plan/eventPersistence';

const OFFLINE_ERROR = 'Offline: using cached events. Changes will sync when you reconnect.';
const FETCH_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchEventsFromServer(): Promise<ClientEvent[]> {
  const response = await withTimeout(fetch(`/api/events`), FETCH_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`Server responded ${response.status}`);
  }
  const json = await response.json();
  const parsed = z.array(ClientEventSchema).safeParse(json.events ?? []);
  return parsed.success ? parsed.data : [];
}

function loadEventsFromLocalStorage(userId: string | null): ClientEvent[] {
  if (!userId) {
    return [];
  }
  try {
    const raw = localStorage.getItem(eventStorageKey(userId, 'list'));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const parsedArray = z.array(ClientEventSchema).safeParse(parsed);
    return parsedArray.success ? parsedArray.data : [];
  } catch {
    return [];
  }
}

function saveEventsToLocalStorage(userId: string | null, events: ClientEvent[]): void {
  if (!userId) {
    return;
  }
  try {
    localStorage.setItem(eventStorageKey(userId, 'list'), JSON.stringify(events));
  } catch {
    // Storage quota exceeded: persist nothing offline, server remains source of truth.
  }
}

function upsertEvent(events: ClientEvent[], event: ClientEvent): ClientEvent[] {
  return [...events.filter((e) => e.id !== event.id), event];
}

async function loadEvents(
  userId: string | null,
  setEvents: (value: ClientEvent[]) => void,
  setSyncStatus: (value: SyncStatus) => void,
  setError: (value: string | null) => void,
): Promise<void> {
  if (!userId) {
    setEvents([]);
    setSyncStatus('idle');
    setError(null);
    return;
  }
  setSyncStatus('syncing');
  setError(null);
  try {
    const serverEvents = await fetchEventsFromServer();
    const offlineEvents = loadEventsFromLocalStorage(userId);
    const merged = mergeEvents(serverEvents, offlineEvents);
    setEvents(merged);
    setSyncStatus('synced');
    if (serverEvents.length === 0 && offlineEvents.length > 0) {
      setError(OFFLINE_ERROR);
    }
  } catch {
    const offlineEvents = loadEventsFromLocalStorage(userId);
    setEvents(offlineEvents);
    setSyncStatus('offline');
    setError(
      offlineEvents.length > 0 ? OFFLINE_ERROR : 'Unable to reach the server. Working offline.',
    );
  }
}

async function syncEventToServer(event: ClientEvent, exists: boolean): Promise<void> {
  const response = await withTimeout(
    fetch(exists ? `/api/events/${event.id}` : '/api/events', {
      method: exists ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }),
    FETCH_TIMEOUT_MS,
  );
  if (!response.ok) {
    throw new Error('Server sync failed');
  }
}

async function deleteEventFromServer(id: string, events: ClientEvent[]): Promise<ClientEvent[]> {
  try {
    await withTimeout(fetch(`/api/events/${id}`, { method: 'DELETE' }), FETCH_TIMEOUT_MS);
  } catch {
    // Ignore server failure; local delete still applies offline.
  }
  return events.filter((e) => e.id !== id);
}

interface PersistenceContext {
  readonly events: ClientEvent[];
  readonly userId: string | null;
  readonly setEvents: (value: ClientEvent[]) => void;
  readonly setSyncStatus: (value: SyncStatus) => void;
  readonly setError: (value: string | null) => void;
}

async function persistEvent(context: PersistenceContext, event: ClientEvent): Promise<boolean> {
  if (!context.userId) {
    return false;
  }
  const next = upsertEvent(context.events, event);
  saveEventsToLocalStorage(context.userId, next);
  context.setEvents(next);
  const exists = context.events.some((e) => e.id === event.id);
  try {
    await syncEventToServer(event, exists);
    context.setSyncStatus('synced');
    context.setError(null);
  } catch {
    context.setSyncStatus('error');
  }
  return true;
}

async function removeEvent(context: PersistenceContext, id: string): Promise<boolean> {
  if (!context.userId) {
    return false;
  }
  const next = await deleteEventFromServer(id, context.events);
  context.setEvents(next);
  saveEventsToLocalStorage(context.userId, next);
  context.setSyncStatus('synced');
  return true;
}

/**
 * Offline-first event persistence hook.
 * Loads events from the database when a session exists, falls back to localStorage
 * when offline, and writes changes to both the database and localStorage.
 * Exposes a sync status indicator so the UI can reflect connectivity.
 *
 * @param userId - Authenticated user id, or null when unsigned
 */
export function useEventPersistence(userId: string | null) {
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const context = { events, userId, setEvents, setSyncStatus, setError };

  useEffect(() => {
    void loadEvents(userId, setEvents, setSyncStatus, setError);
  }, [userId]);

  const saveEvent = useCallback(async (event: ClientEvent) => persistEvent(context, event), [
    context,
  ]);
  const deleteEventById = useCallback(async (id: string) => removeEvent(context, id), [context]);

  return {
    events,
    syncStatus,
    error,
    saveEvent,
    deleteEvent: deleteEventById,
    isOffline: syncStatus === 'offline',
  };
}
