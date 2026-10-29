'use client';

import { Icon } from './icons';

interface SidebarHeaderProps {
  readonly isCollapsed: boolean;
  readonly setIsCollapsed: (value: boolean) => void;
}

/** Renders the sidebar header with the collapse toggle and brand. */
export function SidebarHeader({
  isCollapsed,
  setIsCollapsed,
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between h-12 px-3 bg-stone-50 border-b border-stone-200">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        className="rounded-md p-2 text-stone-500 hover:bg-stone-200 transition-colors"
      >
        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} className="w-5 h-5" />
      </button>
      {!isCollapsed && (
        <span className="font-serif font-black text-xl tracking-tight text-stone-900">Jashn</span>
      )}
    </div>
  );
}
