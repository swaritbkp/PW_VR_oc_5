'use client';

import { Icon } from './icons';
import type { ClientEvent } from '@/lib/plan/eventPersistence';

const MAX_TITLE_LENGTH = 40;

function eventLabel(title: string): string {
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH)}…` : title;
}

interface SidebarItemProps {
  readonly event: ClientEvent;
  readonly active: boolean;
  readonly onSwitch: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

/** Renders a single switchable celebration row with a delete action. */
export function SidebarItem({
  event,
  active,
  onSwitch,
  onDelete,
}: SidebarItemProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSwitch(event.id)}
        aria-pressed={active}
        className={`flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          active
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'text-stone-600 hover:bg-stone-100 border-transparent'
        }`}
      >
        <Icon name="calendar" className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{eventLabel(event.title)}</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(event.id)}
        aria-label={`Delete ${event.title}`}
        className="w-8 h-8 rounded-md p-0 text-stone-400 hover:bg-stone-200 hover:text-stone-900 transition-colors"
      >
        <Icon name="trash" className="w-3.5 h-3.5" />
        <span className="sr-only">Delete {event.title}</span>
      </button>
    </div>
  );
}
