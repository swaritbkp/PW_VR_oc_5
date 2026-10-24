---
name: ref-code-quality
description: Reference: concrete refactoring moves for the Code Quality and Efficiency gates. Not a command; use during hardening.
---
# Code quality playbook
Long function -> extract named steps. High complexity -> lookup tables or early returns. Many params -> one options object. Magic numbers -> named constants with units. Throwing in lib -> Result.
Duplicate logic -> one pure helper with a test. Cross-layer import -> move down to lib/. Cycles -> extract shared types. Unused export -> delete (knip).
Efficiency: memoise by hash, cap every cache, never recompute Monte Carlo, dynamic-import map and charts, stable props, parallel independent LLM calls, no work in render. Measure with perf tests and the build's First Load JS table.
