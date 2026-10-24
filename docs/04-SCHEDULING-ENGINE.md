# Scheduling engine (PERT + CPM + Monte Carlo)

Seed implementation (tested): seed/src/lib/schedule/*. Extend, do not rewrite. Tests first.

## Model

Task { id, name, optimistic, mostLikely, pessimistic (days), dependsOn[], notBefore?, started?, done? }
Plan start = today (day 0). The event date is the deadline: availableDays = days(today -> event).
Event day itself is a zero-duration milestone task that depends on everything else.
All date math uses date-only strings and Date.UTC (no local-time arithmetic, no DST or IST surprises).

## Formulas

PERT expected te = (o + 4m + p) / 6 ; sigma = (p - o) / 6
Forward pass: ES = max(notBefore, max EF of deps); EF = ES + te
Backward pass: LF = min LS of successors (sinks: project duration); LS = LF - te
Total float = LS - ES ; critical = float <= epsilon (and not done)
Buffer = availableDays - projectDuration (negative = crunch)
Effective latest start for the calendar = LS + buffer
P(ready) = Phi((availableDays - projectDuration) / sigma_chain) (analytic, optimistic)
Monte Carlo: triangular(o, m, p) per task, 2000 seeded runs -> P(ready), P50, P80, P90 durations.
Show P80 as "plan for this date" and say which method produced each number.

## Edge cases the tests already cover

cycles, self-dependency, duplicate ids, dangling deps, estimates not ordered, empty plan,
completed tasks (zero duration, never critical), notBefore, all-done plan, buffer sign.

## Crunch mode (buffer < 0)

Show shortfall days. Rank critical tasks by what can be compressed: parallelise, drop optional tasks,
buy time (pay for faster vendor), or move the date. LLM may phrase options; code verifies the new
schedule by re-running computeSchedule on the proposed change and shows the recovered days.

## Task generation contract (LLM)

12-45 tasks, ids stable and unique, each with category, three-point estimate in days, dependsOn,
why, optional flag, drivers (which intake fields scale it). Reference skeletons live in the
event-planning-domain skill. The LLM never returns dates, floats, or critical flags.
