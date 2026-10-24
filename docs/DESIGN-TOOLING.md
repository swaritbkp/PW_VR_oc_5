# Design tooling

## Google Stitch (UI design, optional)

Google's UI design tool with an MCP server, documented in Google's codelab "Design-to-Code with Antigravity and Stitch MCP"
(codelabs.developers.google.com). Create a Stitch API key and add the server in Antigravity's MCP settings exactly as the
codelab shows; do not guess the config. Then run /jashn-design: it generates 3 workspace variants from
prompts/design-brief-stitch.md and fetches the chosen one.

## Google Flow via gflow-cli (art, optional)

Integrated as a build-time art pipeline: see docs/11-FLOW-INTEGRATION.md and /jashn-assets.

## Fallback

No Stitch, no Flow: the ref-ui-design skill produces docs/DESIGN.md, the app is built from those tokens, the Event Graph
is hand-built SVG and every image slot has a CSS/SVG fallback.
