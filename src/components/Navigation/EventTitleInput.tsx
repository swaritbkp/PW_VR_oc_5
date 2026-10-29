'use client';

import { useState } from 'react';
import { Icon } from './icons';
import type { ClientEvent } from '@/lib/plan/eventPersistence';

const MAX_TITLE_LENGTH = 40;

interface EventTitleInputProps {
  readonly userId: string | null;
  readonly onCreate: (event: ClientEvent) => void;
}

/** Renders the new-celebration title input and create action. */
export function EventTitleInput({
  userId,
  onCreate,
}: EventTitleInputProps): React.JSX.Element {
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (!userId) {
      return;
    }
    const value = title.trim();
    if (!value) {
      return;
    }
    setTitle('');
    onCreate({
      id: `evt_${Date.now()}`,
      userId,
      title: value.slice(0, MAX_TITLE_LENGTH),
      date: null,
      budgetInr: null,
      status: 'ACTIVE',
      metadata: {},
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <label className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-stone-600 rounded-lg border border-stone-200 bg-stone-50">
      <Icon name="plus" className="w-3 h-3 text-amber-600" />
      <input id="new-event-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New celebration" className="flex-1 border-none px-1 text-xs" maxLength={MAX_TITLE_LENGTH} />
      <button type="button" onClick={handleCreate} disabled={!userId} className="ml-2 py-1 px-2 text-xs font-semibold text-white bg-amber-600 rounded-md disabled:opacity-50 hover:bg-amber-700">Create</button>
    </label>
  );
}
