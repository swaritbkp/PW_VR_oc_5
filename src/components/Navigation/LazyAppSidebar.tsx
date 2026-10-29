'use client';

import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';
import type React from 'react';

/**
 * Lazily mounts the collapsible multi-event sidebar off the critical path.
 * `ssr: false` keeps the sidebar's client code out of Route `/` First Load JS.
 * The SessionProvider is also lazy-loaded so it does not bloat the root route.
 */
const LazyAppSidebarInner = dynamic(
  () => import('./AppSidebar').then((mod) => mod.AppSidebar),
  { ssr: false },
);

/** Lazily mounts the collapsible sidebar off the critical path. */
export default function LazyAppSidebar(): React.JSX.Element {
  return (
    <SessionProvider>
      <LazyAppSidebarInner />
    </SessionProvider>
  );
}
