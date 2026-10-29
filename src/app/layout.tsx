import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import LazyAppSidebar from '@/components/Navigation/LazyAppSidebar';

export const metadata: Metadata = {
  title: 'Jashn - Celebration & Event Planner',
  description:
    'Date-aware, location-aware living Event Graph with PERT/CPM scheduling and Plan B resilience.',
};

/**
 * Root layout rendering global fonts, styles, the collapsible navigation sidebar,
 * and an accessible skip link. Stays a Server Component; the sidebar mounts on
 * the client after hydration.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAF9F6] text-stone-900">
        <a href="#main-workspace" className="skip-link">
          Skip to main celebration workspace
        </a>
        <div className="flex">
          <LazyAppSidebar />
          <div className="flex-1 pl-16 lg:pl-64 pt-8 pb-12 min-h-screen" id="app-workspace">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
