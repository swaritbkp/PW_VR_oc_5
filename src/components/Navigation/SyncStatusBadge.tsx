'use client';

interface SyncStatusBadgeProps {
  readonly syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  readonly error: string | null;
  readonly isAuthenticated: boolean;
}

/** Renders the persistence sync status indicator and any offline error. */
export function SyncStatusBadge({
  syncStatus,
  error,
  isAuthenticated,
}: SyncStatusBadgeProps): React.JSX.Element | null {
  if (!isAuthenticated) {
    return null;
  }
  if (error) {
    return (
      <div className="px-3 mb-3 rounded-lg bg-amber-50/50 border border-amber-200 text-[10px] text-amber-800">
        {error}
      </div>
    );
  }
  return (
    <div className="px-3 mb-1 flex items-center gap-1.5 text-[10px]">
      <span className={`w-1.5 h-1.5 rounded-full ${statusColor(syncStatus)}`} />
      <span className="font-medium text-stone-500">{syncStatus === 'offline' ? 'Offline' : 'Synced'}</span>
    </div>
  );
}

function statusColor(syncStatus: string): string {
  if (syncStatus === 'synced') {
    return 'bg-green-500';
  }
  if (syncStatus === 'offline') {
    return 'bg-amber-500';
  }
  return 'bg-stone-400';
}
