# UX and visual design brief (graph-first)

## Intent
Modern, sleek and graphical, calm and trustworthy. The Event Graph is the hero. Spend boldness in one place:
the Critical Ribbon running to the event-day marker. Everything else stays quiet.

## Process (mandatory, from the ui-design-system skill)
1. If a Stitch MCP is connected, generate 3 variants of the workspace from prompts/design-brief-stitch.md.
2. Write docs/DESIGN.md: Palette, Type, Layout (ASCII wireframes), Principles. 3. Critique against the defaults list,
revise, record the changes in a Critique section. 4. Implement tokens (CSS variables + Tailwind theme).
5. Open the app in the Antigravity browser at 360px and 1280px, screenshot, critique again.

## Screens
1. Start: template gallery (12 cards with Flow art or SVG fallback, guests and budget ranges, best months chip).
   Filter by event type. "Start blank" is secondary.
2. Intake sheet: city (search), date, guests stepper, lakh-formatted budget, notes, language. Shows season hint.
3. Workspace (home): top bar with title, countdown, city chip, P(ready) gauge, resilience score. Centre: Event Graph.
   Right: Node inspector (tabs Plan, Vendors, Backups, Risks). Bottom dock on mobile. "Map" toggles a split view.
4. Vendors tab: map above, list below. Cards: name, rating, distance, price level, status chip, actions
   (Shortlist, Call, WhatsApp, Directions, Website, Set as backup). Google attribution visible.
5. Disruption drawer: pick a scenario; the graph shows ghost nodes of the old plan and the new plan; metrics
   for days lost, buffer, P(ready), event-at-risk; toggle "with my backups".
6. What-if drawer: sliders for guests, budget, date with ghost bars; apply, diff chips, undo.
7. Budget, Share, Audit as secondary tabs.

## Graph behaviour
Pan and zoom (buttons plus pinch), fit-to-date-range, today and event markers, P80 marker. Selecting a node
highlights its dependency chain. Below 480px render a vertical timeline list instead of the canvas.

## Visual language
Semantic roles: critical, buffer, done, at-risk, neutral, brand, backup (dashed). Never colour alone: add pattern,
icon or label. Pick a distinctive palette and typeface pair for this subject; avoid the generic defaults in the
skill. next/font with Devanagari and Gurmukhi coverage. Contrast pairs asserted in a test (>= 4.5:1 text,
>= 3:1 graphics). Light and dark via prefers-color-scheme. Template accent colours come from the catalogue.

## Motion
One orchestrated moment: when a template is chosen, the ribbon draws to the event marker. User-triggered motion
answers actions: bars slide on what-if, ghost nodes crossfade on disruption, diff chips fade in.
prefers-reduced-motion disables all of it.

## Copy
Sentence case, active voice, plain words. Buttons name the action. Errors say what happened and how to fix it.
Empty states invite an action and use the Flow empty-state art. Vendors are "options near you", never endorsements.

## Accessibility of the graph
role=application on the canvas with an accessible name; nodes are focusable buttons with labels (task, dates,
float, status); arrow keys follow edges; Enter opens the inspector; Escape closes; "View as list" toggle always available.
