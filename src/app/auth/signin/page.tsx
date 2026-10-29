'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useSignIn } from './useSignIn';

export const dynamic = 'force-dynamic';

function AuthInput({
  id,
  type,
  value,
  onChange,
}: {
  readonly id: string;
  readonly type: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}): React.JSX.Element {
  const label = id === 'email' ? 'Email' : 'Password';
  return (
    <>
      <label className="block text-xs font-semibold text-stone-600">{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={id}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none"
      />
    </>
  );
}

/** Renders the email/password sign-in form. */
export function SignInForm(): React.JSX.Element {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    submitting,
    handleSubmit,
  } = useSignIn();
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl glass-strong w-full max-w-md">
      <h2 className="text-display font-black text-2xl text-stone-900">Sign in to Jashn</h2>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-3">
        <AuthInput id="email" type="email" value={email} onChange={setEmail} />
        <AuthInput id="password" type="password" value={password} onChange={setPassword} />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2.5 rounded-lg font-semibold text-white transition-colors ${
          submitting ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800'
        }`}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-[11px] text-stone-500 text-center">
        New to Jashn? Create an account to save celebrations across devices.
      </p>
    </form>
  );
}

/** Renders the sign-in page, redirecting already-authenticated users home. */
export default function SignInPage(): React.JSX.Element | null {
  const session = useSession();
  const status = session?.status ?? 'loading';
  useEffect(() => {
    if (status === 'authenticated') {
      window.location.href = '/';
    }
  }, [status]);
  if (status === 'loading') {
    return null;
  }
  return (
    <SessionProvider>
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4">
        <SignInForm />
      </div>
    </SessionProvider>
  );
}
