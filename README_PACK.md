# Jashn pack v3 (Antigravity only) - quick start

1. Create an EMPTY git repo, unzip this pack into it, `git add -A && git commit -m "chore: add antigravity pack"`.
2. Open the folder in Google Antigravity. Check Customizations: skills `jashn-*` and the rules are listed.
3. MCP Store: install Google Developer Knowledge. Optional: enable `gflow` in .agents/mcp_config.json after `gflow auth login` (docs/11).
4. Copy .env.example to .env and add GEMINI_API_KEY, GOOGLE_PLACES_API_KEY and a referrer-restricted NEXT_PUBLIC_MAPS_BROWSER_KEY (docs/09).
5. Type `/jashn-status`, then paste prompts/GOAL.md. The agent builds, verifies, deploys and prepares your submission.
   Full guide: docs/12-ANTIGRAVITY-SETUP.md. Spec: docs/00-PRODUCT-SPEC.md.
