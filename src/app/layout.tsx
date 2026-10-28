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
        <a href="#main-workspace" className="skip-link">
          Skip to main celebration workspace
        </a>
        {children}
      </body>
    </html>
  );
}
