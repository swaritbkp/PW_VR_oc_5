# Google Flow integration (gflow-cli): build-time art

## What it is, honestly
gflow-cli is an UNOFFICIAL, alpha, reverse-engineered Python CLI (and MCP server) for Google Flow. It drives a
headed Chrome profile on your own Google account. Automation is subject to Google's terms, the page layout can
change without notice, Veo video generation spends your Flow credits (images are reported free), and the MIT
licence covers the tool's code only, not Flow output. Use it knowingly, with your own account.

## How Jashn uses it safely
Flow produces static art only, at build time, committed to the repo. The running app never calls Flow, CI never
needs it, and every image has a CSS/SVG fallback, so a Flow outage cannot break a build or the demo (AC28).
Label the art as AI-generated in the README.

## What it generates (assets/manifest.json, 19 entries)
12 template covers (ids match the catalogue art ids), a hero image, a social card, 3 empty-state illustrations,
a backup-plan illustration, and an optional teaser video (disabled; needs --allow-video).
Style prefix: flat editorial, warm light, no text, no logos, no real people. Prompts avoid third-party IP and brands
(validated). Every asset has alt text (validated, >= 20 characters).

## Setup (once)
uv tool install gflow-cli
uv tool run --from gflow-cli playwright install chromium
gflow auth login --browser chrome     (must be real Chrome; other browsers fail with exit 14)

## Commands
python scripts/flow_assets.py plan                  print the gflow commands, change nothing
python scripts/flow_assets.py generate              generate missing or stale images (idempotent via assets/lock.json)
python scripts/flow_assets.py generate --only ID    one asset; add --force to redo it
python scripts/flow_assets.py check [--strict]      validate manifest and files
Slash command: /jashn-assets. It runs the plan, then generate, then wires the images into the UI.

## MCP (optional, exploratory)
.agents/mcp_config.json ships a disabled `gflow` entry using stdio (`gflow mcp run`). Antigravity supports stdio and
Streamable HTTP servers, so use `gflow mcp run`, not `gflow serve` (HTTP+SSE is not supported by Antigravity).
Enable it after `gflow auth login`. List the server's tools before use; do not assume tool names. Prefer the script
for deterministic, idempotent runs.

## Failure handling
Exit 14: log in with real Chrome. Exit 23: Flow layout drift, run `uv tool upgrade gflow-cli`. First run takes
30 to 90 seconds. On any failure the pipeline stops loudly and the UI keeps its fallback art. Log it in docs/BLOCKERS.md
and continue; art is never a blocker for submission.

## Image handling in the app
Use next/image with explicit width and height, alt text from the manifest, priority only on the hero. Keep each
image under about 150 kB after optimisation. Fallback: template accent gradient plus an inline SVG motif.
