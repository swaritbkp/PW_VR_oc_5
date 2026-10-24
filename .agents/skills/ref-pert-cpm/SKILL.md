---
name: ref-pert-cpm
description: Reference: the PERT/CPM/Monte Carlo scheduling engine API and rules. Not a command; use for anything about timelines, critical path, float, buffer or probability.
---

# PERT / CPM

Code: src/lib/schedule (seeded, tested). Spec: docs/04. Extend, never rewrite; tests first.
computeSchedule -> Result; bufferDays (negative = crunch); probabilityOnTime is analytic and optimistic, simulate() is the cross-check, show P80 as the planning date;
applyChange + diffSchedules drive re-planning; evaluate + nextBestAction drive the Sentinel. Memoise by tasks hash; never persist derived data. Dates via src/lib/dates only.
