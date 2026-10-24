---
name: jashn-graph
description: Builds the Event Graph workspace: canvas, node inspector, command center, list view and keyboard navigation. Use for milestone M3.
---

# Event Graph (M3)

Read docs/08 and ref-event-graph. Use layoutEventGraph (seeded). Build: EventGraph canvas (SVG, pan/zoom, markers, critical ribbon,
badges), NodeInspector (Plan, Vendors, Backups, Risks tabs, vendors wired in M4), CommandCenter (countdown, P(ready) gauge with P80,
health strip, NextAction, AlertsPanel), vertical list view below 480px, "View as list" toggle, keyboard navigation, URL hash state.
Tests: layout wiring, keyboard nav, vitest-axe, 360px snapshot. Screenshot in the Antigravity browser at 360 and 1280.
