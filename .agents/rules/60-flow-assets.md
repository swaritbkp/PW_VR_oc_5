---
trigger: model_decision
description: 'Apply when generating, validating or wiring art assets from Google Flow (gflow-cli).'
---

# Flow assets

- Build-time only. The app never calls Flow. Assets are committed. Every image has a CSS/SVG fallback and alt text.
- Use scripts/flow_assets.py (idempotent, validated, tested). Prefer it over the gflow MCP for repeatable runs.
- Images are free; video spends credits and needs --allow-video. gflow is unofficial and may break: on failure log
  docs/BLOCKERS.md and continue with fallbacks. Never block submission on art.
- Prompts: no third-party IP, brands or real people; no text in images. Label art as AI-generated in the README.
