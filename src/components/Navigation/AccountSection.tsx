'use client';

import { signOut } from 'next-auth/react';
import { Icon } from './icons';

interface AccountSectionProps {
  readonly isAuthenticated: boolean;
}

function navButton(icon: string, label: string): React.JSX.Element {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg border-transparent transition-colors"
    >
      <Icon name={icon} className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}

/** Renders account, billing, themes and sign-out actions. */
export function AccountSection({
  isAuthenticated,
}: AccountSectionProps): React.JSX.Element {
  if (!isAuthenticated) {
    return (
      <div className="px-3 text-[10px] font-medium text-stone-500">
        Sign in to save celebrations across devices.
      </div>
    );
  }
  return (
    <div className="border-t border-stone-200 bg-stone-50 p-3">
      {navButton('user', 'Account')}
      {navButton('credit-card', 'Billing (Stripe)')}
      {navButton('palette', 'Workspace Themes')}
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: '/' })}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg border-transparent transition-colors"
      >
        <Icon name="log-out" className="w-4 h-4 flex-shrink-0" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
