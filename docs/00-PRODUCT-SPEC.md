# Jashn - Product Spec v3 (Challenge 5: Celebration & Event Planner)

## Brief

A GenAI planning assistant for weddings, birthdays and community events: budgets, timelines, vendor
checklists, personalised ideas. Deployed and functional. Scored on Code Quality, Security, Efficiency,
Testing, Accessibility and Problem Statement Alignment.

## The friction

Planning is hard because everything is coupled and uncertain. Guests move food, venue and gifts. The date
cannot move but vendors slip. Season, weather and city change what is possible. Families coordinate on
WhatsApp with no single source of truth, and nobody has a Plan B until something breaks.

## One line

Jashn is a living Event Graph: pick a contemporary template, set the date and place, and work on one visual
graph that knows the calendar, finds real vendors nearby, and shows what happens if something goes wrong.

## The main artifact: the Event Graph

Everything the user does happens on one canvas (see docs/08). Nodes are tasks, positioned by calendar date and
grouped in lanes. The critical chain is a bold ribbon to the event-day marker. Each node shows its dates, its
float, its status, its chosen vendor and a Plan B badge. Select a node to see vendors near the event on a map,
contact them, hold backups, and simulate disruptions.

## Why PERT and CPM

An event is a project with a fixed deadline, dependencies and uncertain durations. CPM gives the critical path
and float. PERT gives P(ready on time). Monte Carlo gives P50/P80/P90. Season multiplies booking lead times.

## Wedge

1. One date-aware, location-aware graph as the workspace, with critical path, float and P(ready).
2. Real vendors near the event for every need, on a map and list, selectable and contactable in one tap.
3. Resilience built in: Plan B vendors, a risk register by season, a disruption simulator, a resilience score.
4. Contemporary starter templates (12) so no one begins from a blank page.
5. Living plan: any change re-plans only what is affected, with diff, undo and a proactive Sentinel.
6. Trust: the LLM proposes; code computes every number, date and alert. Vendors come only from Google Places.
7. India fit: INR, lakh formatting, north-India seasons and festivals, WhatsApp, English/Hindi/Punjabi.

## Personas

Priya (Chandigarh, sister's wedding, 300 guests, INR 25L). Rohan (Ludhiana, son's 5th birthday, 40 guests,
INR 40k, two weeks out). Mrs Kaur (Mohali RWA secretary, society Lohri, 150 residents, INR 60k pooled).

## MVP scope

1. Template gallery (12) with Flow art and a Start blank option. Intake: type, template, city, date, guests,
   budget, style notes, up to 5 non-negotiables, language.
2. Event Graph workspace (docs/08) with node inspector, date and location context, backup badges.
3. Vendor discovery for every need (docs/09): map + list, select, contact, status, quote, backup.
4. Resilience (docs/10): season profile, risk register, disruption simulator, resilience score.
5. Command Center: countdown, P(ready) gauge, health strip, Next action, Sentinel alerts R1-R7.
6. Living plan (docs/05): what-if, execution events, versions and undo, budget ledger.
7. Share: WhatsApp summary, print view, .ics with reminders. Audit panel.

## Non-goals (state in README as deliberate scoping)

Payments, in-app booking, collaboration, native app, runtime image generation, scraping.

## Stretch (locked until the final gate is green)

Day-of run sheet, RSVP counter, shareable read-only link, Firestore sync, crash-cost optimiser, live weather
forecast for events within 14 days, earned-value health score.

## Acceptance criteria (every AC must appear in at least one test name)

- AC1 Totals reconcile to the budget within INR 1, else a visible over/under banner with the gap.
- AC2 No fabricated facts: vendors only from Places results; costs show a basis and are labelled estimates.
- AC3 Rebalance touches only nodes whose drivers changed; diff shown; undo restores the previous plan exactly.
- AC4 Date earlier than the critical path allows -> crunch mode with shortfall days and what to compress first.
- AC5 Hostile free text (injection, HTML, 10k chars) cannot alter behaviour, leak prompts or break rendering.
- AC6 LLM failure or timeout -> clear retry state; never a silent fake plan.
- AC7 Keyboard-only usable, labelled, AA contrast, 360px layout, reduced motion respected.
- AC8 scripts/verify.sh green and the README documents architecture and decisions.
- AC9 CPM: correct critical path and float; cycles, dangling deps, duplicates, bad estimates rejected.
- AC10 PERT probability and Monte Carlo P50/P80/P90 shown with their assumptions.
- AC11 Task slipped, blocked, started or completed re-plans, recomputes the critical path and shows a diff.
- AC12 Sentinel alerts are deterministic, ranked, and cite rule id and data.
- AC13 A next-best-action is always shown until the plan is complete.
- AC14 Calendar export (.ics) has latest-start dates and reminders.
- AC15 Audit panel lists prompt versions, agent version, model and validation outcomes.
- AC16 Every chart and the graph has a text alternative or table view and is keyboard reachable.
- AC17 `npm run evals` passes offline and covers all golden scenarios.
- AC18 The gallery shows 12 templates; choosing one builds a valid schedulable graph.
- AC19 The Event Graph is the home workspace: nodes positioned by date, lanes by category, dates on nodes, list view at 360px.
- AC20 The graph is location aware: the event city and map centre drive vendor search for every node with a need.
- AC21 Vendor search runs server-side through Places; the key never reaches the client; Google attribution shown.
- AC22 Select and contact: shortlist, call, WhatsApp (mobile numbers only), directions, website, first message in en/hi/pa; a human sends.
- AC23 Vendor status updates the plan: booked completes the booking task, contacted starts it, with a diff.
- AC24 A vendor held as Backup raises the resilience score and clears the R6 alert for that need.
- AC25 Disruption simulator shows before/after on the graph, days lost, buffer, P(ready) and event-at-risk, with and without a Plan B.
- AC26 Seasonality stretches booking lead times in peak months and raises R7 alerts (monsoon, fog, heat, peak) for north-India cities.
- AC27 Vendor search degrades gracefully: no key or quota -> Maps deep-link search and manual vendor entry.
- AC28 Flow art pipeline is optional: valid manifest, committed assets, CSS/SVG fallback, alt text, no runtime dependency.
- AC29 Graph keyboard navigation: arrows follow edges, Enter opens the inspector, Escape closes it.
- AC30 Stored data holds only placeId and user-entered vendor fields; Places content is refetched, not persisted.
