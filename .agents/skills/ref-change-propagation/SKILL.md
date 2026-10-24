---
name: ref-change-propagation
description: Reference: dirty-set re-planning, versions, undo and diffs for the living plan. Not a command; use for what-if and execution events.
---
# Change propagation
Read docs/05. Every task and budget line declares drivers and scaling; propagate(plan, change) returns { plan, dirtyIds, diff } and touches only dirty ids (AC3).
Versions are append-only with a parent pointer; undo moves the pointer; cap 20. Locked lines and non-negotiables are never modified by a re-plan.
Vendor status and disruption simulations feed the same pipeline. Simulations are previews until the user applies them.
