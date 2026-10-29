'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEventPersistence } from './useEventPersistence';
import { useMediaQuery } from './useMediaQuery';
import type { ClientEvent } from '@/lib/plan/eventPersistence';
import { EventList } from './EventList';
import { CreateEvent } from './CreateEvent';
import { SyncStatusBadge } from './SyncStatusBadge';
import { AccountSection } from './AccountSection';
import { SidebarHeader } from './SidebarHeader';

async function archiveEvent(
  deleteEvent: (id: string) => Promise<boolean>,
  activeEventId: string | null,
  setActiveEventId: React.Dispatch<React.SetStateAction<string | null>>,
  id: string,
): Promise<void> {
  if (window.confirm('Archive this celebration? It can be restored from settings.')) {
    await deleteEvent(id);
    if (activeEventId === id) {
      setActiveEventId(null);
    }
  }
}

/** Renders the collapsible multi-event navigation sidebar. */
export function AppSidebar(): React.JSX.Element {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isCollapsed, setIsCollapsed] = useState(!isDesktop);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const session = useSession();
  const status = session?.status ?? 'loading';
  const userId = session?.data?.user?.id ?? null;
  const { events, syncStatus, error, saveEvent, deleteEvent } = useEventPersistence(userId);
  const isAuthenticated = status === 'authenticated';
  const sidebarClass = `fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-r border-stone-200/60 ${isCollapsed ? 'w-16' : 'w-64'}`;

  const handleSwitch = useCallback((id: string) => setActiveEventId(id), []);
  const handleDelete = useCallback(
    (id: string) => void archiveEvent(deleteEvent, activeEventId, setActiveEventId, id),
    [deleteEvent, activeEventId, setActiveEventId],
  );
  const handleCreate = useCallback((event: ClientEvent) => { void saveEvent(event); setActiveEventId(event.id); }, [saveEvent]);

  return (
    <aside className={sidebarClass} aria-label="Main navigation">
      <div className="flex h-full flex-col">
        <SidebarHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-3" aria-label="My Celebrations">
          {!isCollapsed && (
            <>
              <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">My Celebrations</h2>
              <EventList events={events} activeEventId={activeEventId} onSwitch={handleSwitch} onDelete={handleDelete} />
              {isAuthenticated && <CreateEvent userId={userId} onCreate={handleCreate} />}
              <SyncStatusBadge syncStatus={syncStatus} error={error} isAuthenticated={isAuthenticated} />
            </>
          )}
        </nav>
        <AccountSection isAuthenticated={isAuthenticated} />
      </div>
    </aside>
  );
}
