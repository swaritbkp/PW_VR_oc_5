---
trigger: always_on
---

# Core rules

- Simplest scalable solution first. One idea per module, small pure functions, explicit types.
- TypeScript strict. No `any` without a comment. No dead code, commented-out code or TODO left behind.
- Names read like the domain: computeSchedule, layoutEventGraph, simulateDisruption, rankVendors.
- Never claim something works without running it. Evidence beats confidence.
- Record every choice between options in docs/DECISIONS.md (date | decision | why | rejected).
