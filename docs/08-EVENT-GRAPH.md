# The Event Graph (main artifact)

Pure layout: src/lib/graph/layout.ts (seeded, tested). Components only draw what it returns.

## What the user sees
- X axis is the calendar from today to the event date, with ticks (daily, weekly, fortnightly, monthly by length),
  a today marker, an event marker and a P80 marker. Y axis is lanes by category (planning, venue, permits, food,
  decor, media, entertainment, attire, invites, logistics, event day).
- Nodes are tasks. Width is expected duration (minimum readable width). Milestones are small diamonds.
- Edges are dependencies. The critical chain is a bold continuous ribbon; float shows as a soft tail.
- Node badges: status (not started, started, done), vendor chip (chosen vendor name), Plan B (dashed ring) when a
  backup is held, risk dot when a ranked risk touches this node.
- Node text: name, start date, must-start-by date, float in days (negative shown as "behind by N days").

## Date aware
Nodes carry start, end and must-start-by dates from the schedule plus buffer. Season stretches booking nodes.
Changing the date moves the event marker and re-lays the graph. Crunch mode paints the shortfall.

## Location aware
The event city and map centre are part of the plan. A node with a vendor need opens vendors near that centre
(docs/09). Distance to the venue is shown where a venue is booked. Region drives the season profile.

## Flexible
Edit a node: estimates, dependencies (pick from a list), optional flag, add or remove tasks, mark started or done,
slip or block. Every edit goes through applyChange or propagate, produces a diff, and is undoable.

## Backups and disruptions
Per vendor need: hold backups (status Backup). In the Risks tab: ranked risk register for this date, place and
event type. "Simulate" runs simulateDisruption with and without the user's backups and draws ghost nodes of the
old plan against the new plan. Nothing is applied unless the user taps "Switch to Plan B".

## Interaction spec
Select node -> inspector. Arrow keys follow edges (right = successor, left = predecessor, up/down = neighbour in
lane). Enter opens inspector, Escape closes. Pan and zoom buttons plus pinch. "View as list" and "Fit to dates".
Selection and zoom live in the URL hash for sharing a view.

## Performance and accessibility
SVG with <= 60 nodes, memoised layout by tasks hash, no layout work in render. role=application with an accessible
name; each node is a focusable button with a full label; list view is the always-available alternative (AC16, AC29).
Below 480px show a vertical timeline list grouped by week.
