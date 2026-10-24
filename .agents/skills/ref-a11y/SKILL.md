---
name: ref-a11y
description: Reference: accessibility and low-end mobile checklist with automated tests. Not a command.
---

# Accessibility

vitest-axe on every screen. tokens.test computes WCAG contrast for every pair (>= 4.5:1 text, >= 3:1 graphics). Labels on every control, fieldset/legend, visible focus, logical tab order, aria-live=polite for
progress and diffs, 44px targets, 360px without horizontal scroll, prefers-reduced-motion, lang follows plan language, 200% text zoom, skeleton loaders, small payload, graph keyboard map.
