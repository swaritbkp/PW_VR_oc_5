import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jashn - Celebration & Event Planner',
  description:
    'Date-aware, location-aware living Event Graph with PERT/CPM scheduling and Plan B resilience.',
};

/**
 * Root layout rendering global fonts, styles, and accessible skip link.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAF9F6] text-stone-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
