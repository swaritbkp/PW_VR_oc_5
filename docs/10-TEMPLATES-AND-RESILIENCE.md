# Templates, seasonality and resilience

Seeded and tested: src/lib/templates/_, src/lib/resilience/_.

## Templates (12, contemporary)

Wedding: Phulkari courtyard, Intimate morning ceremony, Boho garden, Retro Bollywood sangeet.
Birthday: Dino explorer, Space adventure, Pastel pool, Mini chef.
Community: Lohri bonfire, Eco Diwali mela, Gurpurab langar and kirtan, Holi with organic colours.
Each has tagline, style keywords, guest and budget ranges, outdoor flag, best months, accent colour, cover art
(Flow or SVG fallback), extra tasks, removals, duration scaling and the disruption ids it should have a Plan B for.
buildTemplateTasks returns a valid network with exactly one event-day sink. The Planner adapts a template to the
intake (guests, budget, notes) instead of inventing a plan from nothing.

## Seasonality (heuristic, labelled as such)

north-india region: peak Nov-Feb (lead x1.4, price x1.25), shoulder Oct, Apr, May (x1.15, x1.1), monsoon Jul-Sep,
fog Dec-Jan, heat May-Jun. Other regions: neutral. applyLeadMultiplier stretches booking tasks only. seasonAlerts
raises R7 (monsoon and heat for outdoor, fog, peak season). Extend regions with Places administrative-area data.

## Risk register and Plan B

13 scenarios (venue cancels, caterer no-show, photographer unavailable, decorator delay, music cancel, entertainer
no-show, power cut, rain, fog, heat, permit denied, guest surge, date pulled forward). Each has likelihood
(season-adjusted), impact, the backup needs that cover it, effects (slip days without and with a backup) and flags
(event-day risk, budget impact, available-days change).
rankRisks orders by exposure. resilienceScore = share of coverable exposure already covered by held backups.
backupAlerts (R6) warns for critical booking tasks with no backup. simulateDisruption re-plans with and without the
user's backups and returns before/after duration, buffer, P(ready), diff and event-at-risk.

## UX

Risks tab lists the ranked register with the Plan B in plain words, a "Hold a backup" shortcut that opens vendor
search for the needed vendor, and a Simulate button. The workspace header shows the resilience score.
