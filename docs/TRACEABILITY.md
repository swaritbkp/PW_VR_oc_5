# Traceability (agent maintains)

AC id | module(s) | test file(s)
AC1 | lib/budget/engine.ts, components/Budget/BudgetLedger.tsx, components/Budget/BudgetTableRow.tsx | lib/budget/engine.test.ts, components/Budget/BudgetLedger.test.tsx
AC2, AC21 | lib/vendors/needs.ts, places.ts, server/genai/guardrails.ts | lib/vendors/vendors.test.ts, server/genai/guardrails.test.ts, server/genai/generate.test.ts
AC3, AC4 | lib/plan/propagate.ts, lib/plan/versions.ts, components/NodeInspector/NodeEstimatesForm.tsx, components/LivingPlan/WhatIfDrawer.tsx, components/LivingPlan/VersionsPanel.tsx, components/LivingPlan/DiffChips.tsx, components/Budget/BudgetLedger.tsx | lib/plan/propagate.test.ts, lib/plan/versions.test.ts, components/NodeInspector/NodeInspector.test.tsx, components/LivingPlan/WhatIfDrawer.test.tsx, components/Budget/BudgetLedger.test.tsx
AC4 | lib/dates.ts | lib/dates.test.ts
AC5, AC30 | lib/plan/schemas.ts, lib/plan/storage.ts, server/security/rateLimit.ts, server/genai/registry.ts, components/Templates/IntakeSheet.tsx | lib/plan/schemas.test.ts, lib/plan/storage.test.ts, server/security/rateLimit.test.ts, app/api/plan/route.test.ts, components/Templates/IntakeSheet.test.tsx
AC6 | server/genai/generate.ts, app/api/plan/route.ts | server/genai/generate.test.ts, app/api/plan/route.test.ts
AC7 | components/EventGraph, components/CommandCenter, components/NodeInspector | components/EventGraph/EventGraph.test.tsx, components/CommandCenter/CommandCenter.test.tsx, components/NodeInspector/NodeInspector.test.tsx
AC9 | lib/schedule/cpm.ts, components/NodeInspector/NodeEstimatesForm.tsx | lib/schedule/cpm.test.ts, components/NodeInspector/NodeInspector.test.tsx
AC10 | lib/schedule/pert.ts, simulate.ts, components/CommandCenter | cpm.test.ts, simulate.test.ts, components/CommandCenter/CommandCenter.test.tsx
AC11 | lib/schedule/replan.ts, components/LivingPlan/WhatIfDrawer.tsx | replan.test.ts, components/LivingPlan/WhatIfDrawer.test.tsx
AC12, AC13 | lib/schedule/sentinel.ts, components/CommandCenter | sentinel.test.ts, components/CommandCenter/CommandCenter.test.tsx
AC14 | lib/ics.ts, components/Share/ShareSheet.tsx | lib/ics.test.ts, components/Share/ShareSheet.test.tsx
AC15 | server/genai/generate.ts, server/genai/registry.ts, components/Audit/AuditPanel.tsx | server/genai/generate.test.ts, server/genai/registry.test.ts, components/Audit/AuditPanel.test.tsx
AC16 | components/EventGraph/EventGraph.tsx, EventGraphList.tsx | components/EventGraph/EventGraph.test.tsx
AC17 | evals/run.ts, server/genai/guardrails.ts | evals/run.ts, server/genai/guardrails.test.ts
AC18 | lib/templates, components/Templates/TemplateGallery.tsx | lib/templates/catalog.test.ts, components/Templates/TemplateGallery.test.tsx
AC19 | lib/graph/layout.ts, components/EventGraph, components/NodeInspector | lib/graph/layout.test.ts, components/EventGraph/EventGraph.test.tsx, components/NodeInspector/NodeInspector.test.tsx
AC20 | lib/geo/cities.ts, app/api/geo/route.ts, app/api/vendors/search/route.ts, components/Vendors/VendorList.tsx | lib/geo/cities.test.ts, app/api/geo/route.test.ts, app/api/vendors/search/route.test.ts, components/Vendors/VendorList.test.tsx
AC21 | app/api/vendors/search/route.ts, app/api/vendors/details/route.ts, components/Vendors/VendorList.tsx, components/Vendors/VendorMap.tsx | app/api/vendors/search/route.test.ts, app/api/vendors/details/route.test.ts, components/Vendors/VendorList.test.tsx, components/Vendors/VendorMap.test.tsx
AC22 | lib/vendors/contact.ts, components/Vendors/ContactSheet.tsx | lib/vendors/vendors.test.ts, components/Vendors/ContactSheet.test.tsx
AC23, AC24 | lib/vendors/status.ts, lib/resilience, components/Vendors/ContactSheet.tsx | lib/vendors/vendors.test.ts, lib/resilience/resilience.test.ts, components/Vendors/ContactSheet.test.tsx
AC25, AC26 | lib/resilience, components/Resilience/DisruptionDrawer.tsx, components/Resilience/RiskRegister.tsx | lib/resilience/resilience.test.ts, components/Resilience/DisruptionDrawer.test.tsx, components/Resilience/RiskRegister.test.tsx
AC27 | app/api/vendors/search/route.ts, components/Vendors/VendorList.tsx | app/api/vendors/search/route.test.ts, components/Vendors/VendorList.test.tsx
AC28 | scripts/flow_assets.py | scripts/test_flow_assets.py
AC29 | components/EventGraph/EventGraph.tsx | components/EventGraph/EventGraph.test.tsx
AC30 | components/Vendors/ContactSheet.tsx, lib/plan/storage.ts | components/Vendors/ContactSheet.test.tsx, lib/plan/storage.test.ts
Formatting/Sanitisation | lib/format.ts | lib/format.test.ts
Security Headers | lib/security-headers.ts | lib/security-headers.test.ts
WhatsApp Summaries | lib/plan/whatsapp.ts | lib/plan/whatsapp.test.ts
Chaos Monkey Cascade Stress-Tester (AC25, AC26) | lib/resilience/chaos.ts, components/Resilience/ChaosMonkey.tsx | lib/resilience/chaos.test.ts, components/Resilience/ChaosMonkey.test.tsx
Cultural AI Negotiation Coach (AC22, AC23) | lib/vendors/negotiate.ts, components/Vendors/NegotiationCoach.tsx | lib/vendors/negotiate.test.ts, components/Vendors/NegotiationCoach.test.tsx
Smart Vendor Red-Flag Detector (AC22, AC23) | lib/vendors/redflags.ts, components/Vendors/RedFlagDetector.tsx | lib/vendors/redflags.test.ts, components/Vendors/RedFlagDetector.test.tsx
Executive Celebration Dossier Exporter (AC14, AC30) | lib/plan/dossier.ts, components/Share/DossierModal.tsx | lib/plan/dossier.test.ts, components/Share/DossierModal.test.tsx
5-Step Guided Event Journey (AC18, AC19, AC25) | lib/plan/journey.ts, components/Journey/GuidedJourneyBar.tsx | lib/plan/journey.test.ts, components/Journey/GuidedJourneyBar.test.tsx
Portable .jashn Event File (AC5, AC30) | lib/plan/portability.ts, components/Share/PortableFilePanel.tsx | lib/plan/portability.test.ts, components/Share/PortableFilePanel.test.tsx
Nano Banana Custom Art Pipeline (AC28) | scripts/generate_nanobanana_assets.mjs, assets/manifest.json, components/NodeInspector/NodeInspector.tsx | scripts/test_flow_assets.py
Celebration Budget Ledger (AC1, AC3) | components/Budget/BudgetLedger.tsx, components/Budget/BudgetTableRow.tsx | components/Budget/BudgetLedger.test.tsx
Interactive PERT Duration Editor (AC3, AC9) | components/NodeInspector/NodeEstimatesForm.tsx, lib/plan/propagate.ts | components/NodeInspector/NodeInspector.test.tsx, lib/plan/propagate.test.ts
42: AST Quality & Security Remediation (AC5, AC7, AC20, AC30) | scripts/gate.py, scripts/ast_checker.mjs, lib/security-headers.ts, app/api/vendors/search/route.ts, app/api/health/route.ts, app/layout.tsx | lib/security-headers.test.ts, app/api/vendors/search/route.test.ts, app/api/health/route.test.ts, vitest-axe audits
Agentic AI Copilot & App Navigator (AC5, AC7, AC11) | src/components/Concierge/AgentCopilot.tsx, src/lib/concierge/useAgentCopilotHandler.ts, src/lib/concierge/agentActions.ts, src/lib/security/guardrails.ts | src/components/Concierge/AgentCopilot.test.tsx, src/lib/concierge/agentActions.test.ts, src/lib/security/guardrails.test.ts
Native XLS Round-Trip Portability & 5-Layer Guardrails (AC1, AC5, AC30) | src/lib/portability/xlsPortability.ts, src/components/Budget/BudgetXlsModal.tsx, src/components/Budget/BudgetXlsSections.tsx | src/lib/portability/xlsPortability.test.ts, src/components/Budget/BudgetXlsModal.test.tsx
Live Weather Intelligence & CPM Plan Factoring (AC9, AC25, AC26) | src/lib/weather/weatherForecast.ts, src/components/Weather/WeatherForecastBar.tsx | src/lib/weather/weatherForecast.test.ts, src/components/Weather/WeatherForecastBar.test.tsx
