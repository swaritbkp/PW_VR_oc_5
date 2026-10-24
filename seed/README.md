# Verified seed code
113 passing tests, strict TypeScript, about 99% statement and 96% branch coverage across scheduling (PERT, CPM, Monte Carlo, replan, sentinel),
dates, templates (12), vendors (Places adapter, ranking, contact, status), resilience (seasonality, disruptions, risk register), graph layout and ICS.
At M0, after scaffolding the Next.js app:
  cp -r seed/src/. src/
  cp seed/config/vitest.config.ts .
Install: npm i -D vitest @vitest/coverage-v8 typescript. Keep the tests green; extend them, never weaken them.
