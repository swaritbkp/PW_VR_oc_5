'use client';

import { SidebarItem } from './SidebarItem';
import type { ClientEvent } from '@/lib/plan/eventPersistence';

interface EventListProps {
  readonly events: readonly ClientEvent[];
  readonly activeEventId: string | null;
  readonly onSwitch: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

/** Renders the list of switchable celebrations with per-item delete actions. */
export function EventList({
  events,
  activeEventId,
  onSwitch,
  onDelete,
}: EventListProps): React.JSX.Element {
  return (
    <>
      {events.map((event) => (
        <SidebarItem
          key={event.id}
          event={event}
          active={activeEventId === event.id}
          onSwitch={onSwitch}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
