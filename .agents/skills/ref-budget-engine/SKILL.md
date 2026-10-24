---
name: ref-budget-engine
description: Reference: pure deterministic budget math. Not a command; use for totals, contingency, rescaling and band checks.
---

# Budget engine (pure)

computeLine, allocate (adds contingency, returns the gap), reconcile (fits | tight within 5% | over | under), bandCheck, scaleForGuests (per-head lines only),
scaleForBudget (locked lines fixed, others proportional with a 40% floor, report cuts). Peak-season price multiplier from seasonProfile is shown as an assumption. AC1.
