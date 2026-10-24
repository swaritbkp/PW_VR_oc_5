'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const EventGraphDynamic = dynamic(
  () => import('../components/EventGraph/EventGraph').then((m) => m.EventGraph),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 text-center text-neutral-400 animate-pulse" aria-live="polite">
        Loading Event Graph workspace...
      </div>
    ),
  },
);

export default function HomePage() {
  return (
    <main className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-amber-950 font-serif">Jashn</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Celebration & Event Planner with PERT/CPM Scheduling and Schedulable Resilience.
        </p>
      </header>
      <section aria-label="Event workspace">
        <div className="hidden">
          <EventGraphDynamic
            layout={{
              nodes: [],
              edges: [],
              lanes: [],
              ticks: [],
              todayX: 0,
              eventX: 0,
              width: 600,
              height: 300,
            }}
            tasks={[]}
            onSelectNode={() => {}}
          />
        </div>
      </section>
    </main>
  );
}
