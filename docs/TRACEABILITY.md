# Traceability (agent maintains)
AC id | module(s) | test file(s)
AC2, AC21 | lib/vendors/needs.ts, places.ts | lib/vendors/vendors.test.ts
AC4 | lib/dates.ts | lib/dates.test.ts
AC9 | lib/schedule/cpm.ts | lib/schedule/cpm.test.ts
AC10 | lib/schedule/pert.ts, simulate.ts | cpm.test.ts, simulate.test.ts
AC11 | lib/schedule/replan.ts | replan.test.ts
AC12, AC13 | lib/schedule/sentinel.ts | sentinel.test.ts
AC14 | lib/ics.ts | lib/ics.test.ts
AC18 | lib/templates | lib/templates/catalog.test.ts
AC19 | lib/graph/layout.ts | lib/graph/layout.test.ts
AC22 | lib/vendors/contact.ts | vendors.test.ts
AC23, AC24 | lib/vendors/status.ts, lib/resilience | vendors.test.ts, resilience.test.ts
AC25, AC26 | lib/resilience | resilience.test.ts
AC28 | scripts/flow_assets.py | scripts/test_flow_assets.py
(add the remaining ACs as they are implemented)
