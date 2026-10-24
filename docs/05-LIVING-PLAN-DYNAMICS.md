# How the plan changes with conditions

## Change taxonomy and deterministic effect
| Change | Effect (code) | LLM role |
|---|---|---|
| Guests +/- | per-head budget lines scale; capacity check; tasks tagged guests rescale estimates by a documented factor | trade-off wording |
| Budget +/- | scaleForBudget: locked lines fixed, others scale proportionally with a 40% floor; report what was cut | options and rationale |
| Event date moves | availableDays changes -> buffer, Sentinel, P(ready), calendar all recompute | crunch advice |
| Task started / completed | applyChange -> computeSchedule -> diff | next-step nudge draft |
| Task slips (+days) | all three estimates shift; critical path may move; diff shows who gained or lost float | vendor message draft |
| Task blocked (notBefore) | start constraint; re-plan | alternative suggestions |
| Actual spend logged | variance vs line; reforecast remaining lines | none |
| Vendor status changes | booked completes the booking task, contacted or quoted starts it; quote feeds actual spend | none |
| Vendor held as Backup | resilience score rises, R6 clears for that need | none |
| Disruption simulated | scenario effects slip booking tasks (less with a Plan B); before/after diff, never applied unless the user chooses | trade-off wording |
| Season (date or city changes) | lead-time multiplier on booking tasks, R7 alerts | none |
| City or style changes | confirmed full re-plan, locked tasks and lines preserved | regenerate |

## Dirty-set rule
Every task and budget line declares drivers (guests, budget, date, city) and scaling (per_head, fixed,
proportional). A change marks only nodes whose drivers include the changed field. Untouched nodes keep
identity and values (tested as AC3). Derived outputs (schedule, totals, alerts) are recomputed.

## Versions
Each applied change creates Version { id, parentId, change, planSnapshot, createdAt }. Undo moves the
pointer to the parent (history is never deleted), cap 20. Baseline vs current finish is shown as schedule variance.

## Sentinel (the proactive layer)
Runs on load and after every change; no server needed. Rules: R1 critical task must start within 3 days,
R2 task overdue, R3 negative buffer, R4 low confidence (<80 percent warn, <50 critical), R5 near-critical
tasks. Budget rules B1 line at 90 percent spent, B2 unallocated gap, B3 line outside sanity band.
Output: ranked alerts with ruleId, severity, data params; the UI turns params into plain-language copy.
Next-best-action: ready task with least slack. Proactivity beyond the open tab: .ics export with VALARM
reminders at latest-start dates and a WhatsApp reminder text. (Stretch: Cloud Scheduler plus push.)
The LLM never decides severity; it only drafts messages on request.
