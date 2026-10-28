'use client';

import React, { useEffect } from 'react';

export interface ErrorBoundaryProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

function ErrorCard({
  message,
  digest,
  onReset,
}: {
  readonly message: string;
  readonly digest: string;
  readonly onReset: () => void;
}): React.JSX.Element {
  return (
    <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-rose-200 text-center space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-700 text-2xl">
        ⚠️
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-stone-900">Celebration Workspace Interrupted</h1>
        <p className="text-xs text-stone-600">
          An unexpected error occurred while processing the living plan or Event Graph.
        </p>
      </div>
      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left">
        <p className="text-[11px] font-mono text-stone-700 break-words line-clamp-2">{message}</p>
        <p className="text-[10px] text-stone-400 mt-1 font-mono">{digest}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
      >
        Reset & Recover Workspace
      </button>
    </div>
  );
}

/**
 * Root error boundary catching runtime exceptions in the celebration workspace.
 * Provides accessible alert notification and state recovery mechanism.
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps): React.JSX.Element {
  useEffect(() => {
    if (typeof console !== 'undefined' && console.error) {
      console.error('Workspace runtime exception caught by ErrorBoundary:', error);
    }
  }, [error]);

  const digest = error.digest ? `Reference: ${error.digest}` : 'Ref: client-runtime-error';
  const message = error.message || 'Unknown runtime error';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-screen flex items-center justify-center p-6 bg-[#FAF9F6] text-stone-900"
    >
      <ErrorCard message={message} digest={digest} onReset={reset} />
    </div>
  );
}
