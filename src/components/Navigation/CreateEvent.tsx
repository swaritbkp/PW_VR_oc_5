'use client';

import { EventTitleInput } from './EventTitleInput';
import type { ClientEvent } from '@/lib/plan/eventPersistence';

interface CreateEventProps {
  readonly userId: string | null;
  readonly onCreate: (event: ClientEvent) => void;
}

/** Renders the new-celebration creation input wired to persistence. */
export function CreateEvent({ userId, onCreate }: CreateEventProps): React.JSX.Element {
  return (
    <div className="px-3 mb-2">
      <EventTitleInput userId={userId} onCreate={onCreate} />
    </div>
  );
}
