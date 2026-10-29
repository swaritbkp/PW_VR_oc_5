import type React from 'react';

/** Authentication error page shown when sign-in fails. */
export default function AuthErrorPage(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-6 text-center">
      <div className="rounded-2xl glass p-8 max-w-md w-full">
        <h2 className="text-display font-black text-2xl text-stone-900 mb-2">Sign-in error</h2>
        <p className="text-stone-600 mb-6">
          We could not complete sign-in. Check your provider configuration and try again.
        </p>
        <a
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800"
        >
          <span>←</span>
          <span>Try again</span>
        </a>
      </div>
    </div>
  );
}
