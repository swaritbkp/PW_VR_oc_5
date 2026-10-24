---
name: jashn-design
description: Creates the Jashn design system and wireframes with a critique pass, using Stitch MCP if connected. Use before building UI.
---
# Design
Follow docs/06 and the ref-ui-design skill.
1. If a Stitch MCP server is connected, generate 3 variants of the workspace from prompts/design-brief-stitch.md and pick one.
2. Write docs/DESIGN.md with sections: Palette, Type, Layout (ASCII wireframes for Start, Workspace, Vendors tab, Disruption
   drawer, mobile list view), Principles, Critique (what looked generic and what changed).
3. Plan the contrast token test and the template accent usage. Log decisions. Run `python scripts/gate.py next`.
