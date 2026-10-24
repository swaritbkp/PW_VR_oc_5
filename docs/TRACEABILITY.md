# Traceability (agent maintains)

AC id | module(s) | test file(s)
AC1 | lib/budget/engine.ts | lib/budget/engine.test.ts
AC2, AC21 | lib/vendors/needs.ts, places.ts, server/genai/guardrails.ts | lib/vendors/vendors.test.ts, server/genai/guardrails.test.ts, server/genai/generate.test.ts
AC3, AC4 | lib/plan/propagate.ts, lib/plan/versions.ts | lib/plan/propagate.test.ts, lib/plan/versions.test.ts
AC4 | lib/dates.ts | lib/dates.test.ts
AC5, AC30 | lib/plan/schemas.ts, lib/plan/storage.ts, server/security/rateLimit.ts, server/genai/registry.ts | lib/plan/schemas.test.ts, lib/plan/storage.test.ts, server/security/rateLimit.test.ts, app/api/plan/route.test.ts
AC6 | server/genai/generate.ts, app/api/plan/route.ts | server/genai/generate.test.ts, app/api/plan/route.test.ts
AC7 | components/EventGraph, components/CommandCenter, components/NodeInspector | components/EventGraph/EventGraph.test.tsx, components/CommandCenter/CommandCenter.test.tsx, components/NodeInspector/NodeInspector.test.tsx
AC9 | lib/schedule/cpm.ts | lib/schedule/cpm.test.ts
AC10 | lib/schedule/pert.ts, simulate.ts, components/CommandCenter | cpm.test.ts, simulate.test.ts, components/CommandCenter/CommandCenter.test.tsx
AC11 | lib/schedule/replan.ts | replan.test.ts
AC12, AC13 | lib/schedule/sentinel.ts, components/CommandCenter | sentinel.test.ts, components/CommandCenter/CommandCenter.test.tsx
AC14 | lib/ics.ts | lib/ics.test.ts
AC15 | server/genai/generate.ts, server/genai/registry.ts | server/genai/generate.test.ts, server/genai/registry.test.ts
AC16 | components/EventGraph/EventGraph.tsx, EventGraphList.tsx | components/EventGraph/EventGraph.test.tsx
AC17 | evals/run.ts, server/genai/guardrails.ts | evals/run.ts, server/genai/guardrails.test.ts
AC18 | lib/templates | lib/templates/catalog.test.ts
AC19 | lib/graph/layout.ts, components/EventGraph, components/NodeInspector | lib/graph/layout.test.ts, components/EventGraph/EventGraph.test.tsx, components/NodeInspector/NodeInspector.test.tsx
AC20 | lib/geo/cities.ts, app/api/geo/route.ts, app/api/vendors/search/route.ts, components/Vendors/VendorList.tsx | lib/geo/cities.test.ts, app/api/geo/route.test.ts, app/api/vendors/search/route.test.ts, components/Vendors/VendorList.test.tsx
AC21 | app/api/vendors/search/route.ts, app/api/vendors/details/route.ts, components/Vendors/VendorList.tsx, components/Vendors/VendorMap.tsx | app/api/vendors/search/route.test.ts, app/api/vendors/details/route.test.ts, components/Vendors/VendorList.test.tsx, components/Vendors/VendorMap.test.tsx
AC22 | lib/vendors/contact.ts, components/Vendors/ContactSheet.tsx | lib/vendors/vendors.test.ts, components/Vendors/ContactSheet.test.tsx
AC23, AC24 | lib/vendors/status.ts, lib/resilience, components/Vendors/ContactSheet.tsx | lib/vendors/vendors.test.ts, lib/resilience/resilience.test.ts, components/Vendors/ContactSheet.test.tsx
AC25, AC26 | lib/resilience | resilience.test.ts
AC27 | app/api/vendors/search/route.ts, components/Vendors/VendorList.tsx | app/api/vendors/search/route.test.ts, components/Vendors/VendorList.test.tsx
AC28 | scripts/flow_assets.py | scripts/test_flow_assets.py
AC29 | components/EventGraph/EventGraph.tsx | components/EventGraph/EventGraph.test.tsx
AC30 | components/Vendors/ContactSheet.tsx, lib/plan/storage.ts | components/Vendors/ContactSheet.test.tsx, lib/plan/storage.test.ts
Formatting/Sanitisation | lib/format.ts | lib/format.test.ts
Security Headers | lib/security-headers.ts | lib/security-headers.test.ts
WhatsApp Summaries | lib/plan/whatsapp.ts | lib/plan/whatsapp.test.ts
