---
name: ref-flow-assets
description: Reference: the gflow-cli art pipeline, its risks and fallbacks. Not a command; use when touching generated art.
---

# Flow assets

Read docs/11. scripts/flow_assets.py is idempotent (assets/lock.json), validated (no IP, alt text, aspect) and tested with a fake runner. Exit 14 = use real Chrome login; exit 23 = layout drift,
upgrade gflow-cli. Images only by default; video needs --allow-video. Build-time only; fallbacks always present.
