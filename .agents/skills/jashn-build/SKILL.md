---
name: jashn-build
description: Builds Jashn milestone by milestone (M0 to M8) with verify gates, tests first. Use to build everything or one milestone, e.g. /jashn-build M4.
---
# Build
If the user named a milestone, do only that one; otherwise continue from `python scripts/gate.py status`.
For each: Implementation Plan artifact -> tests first -> implement -> scripts/verify.sh green -> DECISIONS.md -> commit.
M0 Scaffold Next.js + TypeScript + Tailwind (check current docs), copy seed (`cp -r seed/src/. src/`, `cp seed/config/vitest.config.ts .`),
   install tooling (vitest, coverage-v8, jsdom, testing-library, vitest-axe, zod, eslint plugins, prettier, knip, madge, the Google
   GenAI SDK and Maps loader, verifying package names in docs), scripts (lint, test, evals), security headers, /api/health, hello-world Cloud Run deploy.
M1 Core lib: budget engine, plan schemas (zod), propagate, versions, format (INR), WhatsApp summary, storage. AC1, AC3, AC4, AC30.
M2 GenAI planner: prompt registry, guardrails, template adaptation, /api/plan, rate limit, injection tests, evals harness. AC2, AC5, AC6, AC15, AC17.
M3 Event Graph + Command Center (/jashn-graph). AC7, AC16, AC19, AC29.
M4 Vendors (/jashn-vendors). AC20 to AC24, AC27.
M5 Templates + resilience (/jashn-templates, /jashn-resilience). AC18, AC25, AC26.
M6 Living plan polish: what-if, versions UI, Sentinel R1-R7, next action, share (WhatsApp, print, .ics), language. AC10 to AC14.
M7 Design polish, assets wiring (/jashn-assets), motion, empty states. AC28, AC7.
M8 Evals, harden, deploy, submit. AC8, AC17.
