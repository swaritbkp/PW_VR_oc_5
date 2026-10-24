---
name: jashn-harden
description: Security, accessibility, efficiency and code-quality hardening against the six scoring axes. Use before submission.
---
# Harden
1. Security: hostile inputs, headers, rate-limit memory bound, key restrictions documented, secrets in git and .next output, Places content not persisted.
2. Accessibility: vitest-axe on all screens, keyboard walkthrough of the graph, 360px, contrast test, chart tables.
3. Efficiency: perf tests, First Load JS report, memoisation, dynamic imports (map, charts), cache caps, parallel LLM calls.
4. Code quality: scan against rules/30-quality; split long functions, remove dead code (knip), add JSDoc, fix cycles (madge).
5. Write docs/SELFSCORE.md as `| Axis | Score |` rows for the six axes (0-10) with file evidence; fix any below 9.
