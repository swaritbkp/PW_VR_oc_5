# Architecture (simplest scalable first)

## Stack (log any change in docs/DECISIONS.md)

Next.js App Router + TypeScript strict + Tailwind. Route handlers are the backend. Gemini through the official
Google GenAI SDK with JSON-schema output (model id from GEMINI_MODEL; verify the current id in Google's docs).
Places API (New) for vendors, Maps JavaScript API for the map. zod at every boundary. vitest (+ coverage-v8,
jsdom, testing-library, vitest-axe). eslint (typescript-eslint strict), prettier, knip, madge. Deploy: Cloud Run.
Charts and the graph are hand-rolled SVG (no chart library) for bundle size and accessibility control.
Centralized runtime settings are governed by `src/lib/config/settings.ts` with Zod validation and safe offline fallbacks.

## Layers (madge enforces direction)

lib/ (pure: no React, fetch or env) <- server/ (SDK, Places, settings, rate limit) <- app/ + components/
UI never imports server/. lib/ imports only lib/.
Centralized configuration model in `lib/config/settings.ts` isolates `process.env` access from application routes.

## Keys and secrets

GEMINI_API_KEY and GOOGLE_PLACES_API_KEY are server-only (Secret Manager on Cloud Run).
All environment configuration is mediated through `src/lib/config/settings.ts`, eliminating scattered `process.env` reads.
NEXT_PUBLIC_MAPS_BROWSER_KEY is the one public key, by design: restrict it to your HTTP referrers AND to the
Maps JavaScript API only, and cap quota. verify.sh allows only that exact name. No other NEXT_PUBLIC key.

## Reliability, Caching & Resilience

- **Bounded LRU Eviction**: In-memory server caches (`src/server/security/rateLimit.ts`, `src/app/api/vendors/search/route.ts`) enforce `MAX_CACHE_ENTRIES = 256` with deterministic TTL sweeps and oldest-key eviction.
- **Canary Leak Detection**: Post-LLM output sanitizer (`src/lib/security/guardrails.ts`) scans for `JASHN_SYSTEM_CANARY_9F2A` to prevent system prompt extraction.
- **App Router Error Boundaries**: `src/app/error.tsx` and `src/app/global-error.tsx` provide accessible alert semantics (`role="alert"`) and state recovery.
- **Accessibility & Contrast**: `src/app/globals.css` provides `@media (prefers-contrast: more)`, `@media (prefers-reduced-motion: reduce)`, and keyboard `.skip-link`.

## LLM proposes, code decides

| Concern                                                                                                                | Owner               |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Template adaptation, task estimates, dependencies, cost ranges, ideas, trade-off wording, vendor questions             | LLM (schema-bound)  |
| Critical path, float, buffer, P(ready), Monte Carlo, totals, dates, graph layout, risk ranking, alerts, vendor ranking | Code (pure, tested) |
| Which vendors exist, their address, rating, location, phone                                                            | Google Places only  |

## Modules (seeded and tested modules marked *)

lib/dates*, lib/ics*, lib/schedule* (types, pert, cpm, simulate, replan, sentinel), lib/plan/types*,
lib/templates* (skeletons, catalog), lib/vendors* (types, needs, places, rank, contact, status),
lib/resilience* (seasonality, disruptions, resilience), lib/graph* (layout), lib/budget (engine),
lib/plan (schemas, propagate, versions, whatsapp), lib/format, lib/viz (donut, gauge scales).
server/genai (client, prompts registry, guardrails, generate, advise, draft), server/places (client, cache),
server/security (rateLimit, sanitize, headers).
app/api: plan, advise, geo, vendors/search, vendors/details, health.
components: TemplateGallery, IntakeSheet, EventGraph (canvas), NodeInspector, VendorMap, VendorList,
VendorCard, ContactSheet, BackupPanel, RiskRegister, DisruptionDrawer, WhatIfDrawer, DiffChips,
CommandCenter, AlertsPanel, NextAction, BudgetViz, ShareSheet, AuditPanel, DataTableToggle.

## Agents inside the product (ADLC inventory)

| Agent                                                      | Kind | Job                                                           | Autonomy                               |
| ---------------------------------------------------------- | ---- | ------------------------------------------------------------- | -------------------------------------- |
| Planner                                                    | LLM  | adapt a template to the intake: tasks, estimates, cost ranges | advisory, schema-bound                 |
| Scheduler                                                  | code | CPM, PERT, Monte Carlo, replan                                | deterministic                          |
| Budgeter                                                   | code | allocate, reconcile, rescale                                  | deterministic                          |
| Scout                                                      | code | build Places queries, rank and filter results                 | deterministic, read-only               |
| Resilience analyst                                         | code | season profile, risk ranking, disruption simulation           | deterministic                          |
| Sentinel                                                   | code | alerts R1-R7, next-best-action                                | deterministic, runs on load and change |
| Advisor                                                    | LLM  | trade-offs, crunch advice, questions to ask a vendor          | advisory only                          |
| Drafter                                                    | LLM  | vendor messages                                               | copy-only, the human sends             |
| No agent acts in the world. Humans call, message and book. |

## Data flow

Template + intake -> zod -> sanitize -> Planner (2 parallel calls: core, extras) -> zod (one repair) ->
guardrails -> engines -> Plan -> Event Graph. Node select -> /api/vendors/search (Places) -> rank -> map + list.
Vendor status or what-if or disruption -> propagate -> engines -> diff -> Version -> Sentinel.

## Persistence

localStorage (zod-validated, versioned): intake, tasks, versions (cap 20), VendorSelection[] (placeId, need,
status, quote, note). Derived data and Places content are never stored (AC30).

## Efficiency design

Two parallel LLM calls; memoise schedule and layout by tasks hash; Monte Carlo capped at 2000 runs and memoised;
Places search per need on demand with a short in-memory server cache and a lean field mask; details fetched lazily;
map loaded with dynamic import; next/font; SVG only; First Load JS target < 170 kB per route (report it).

## Ops

/api/health reports config presence, never secrets. Structured logs with request id, latency and outcome; no
prompt bodies, notes, or place content.
