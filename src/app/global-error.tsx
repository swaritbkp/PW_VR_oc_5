'use client';

import React from 'react';

export interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

function GlobalErrorContent({
  message,
  digest,
  onReset,
}: {
  readonly message: string;
  readonly digest: string;
  readonly onReset: () => void;
}): React.JSX.Element {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-rose-200 text-center space-y-4"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-700 text-2xl">
        💥
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-stone-900">Application Failure</h1>
        <p className="text-xs text-stone-600">
          A critical layout failure prevented the workspace from rendering.
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
 * Global fallback error boundary for capturing catastrophic layout-level exceptions.
 * Encapsulates full HTML shell with accessible recovery controls.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps): React.JSX.Element {
  const digest = error.digest ? `Reference: ${error.digest}` : 'Ref: global-runtime-error';
  const message = error.message || 'Fatal layout error';

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAF9F6] text-stone-900 flex items-center justify-center p-6">
        <GlobalErrorContent message={message} digest={digest} onReset={reset} />
      </body>
    </html>
  );
}
