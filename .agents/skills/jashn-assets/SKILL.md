---
name: jashn-assets
description: Generates and wires Google Flow art (template covers, hero, empty states) through gflow-cli, non-blocking. Use after the design phase or when art is missing.
---

# Assets (Flow)

Read docs/11 and the ref-flow-assets skill.

1. `python scripts/flow_assets.py check` and `plan`.
2. If `gflow --help` works and the user is logged in, run `python scripts/flow_assets.py generate` (images only). If gflow is
   missing or login fails, log docs/BLOCKERS.md and stop here: the UI uses CSS/SVG fallbacks.
3. Wire images with next/image (explicit size, alt from the manifest, priority only on the hero) and the fallback gradient
   from the template accent. Add a README line that art is AI-generated.
4. `python scripts/flow_assets.py check` again. Never block on art.
