# Using this pack in Google Antigravity

## Important change
Google retired legacy workflows on 19 Oct 2026. Slash commands now come from Agent Skills in `.agents/skills/<name>/SKILL.md`,
invoked as `/<name>`. This pack ships every command as a skill. Rules live in `AGENTS.md` and `.agents/rules/*.md`.
MCP config for the workspace is `.agents/mcp_config.json`.

## Setup (10 minutes)
1. Create an EMPTY git repo, unzip this pack into it, commit. Open the folder in Antigravity (App, IDE or CLI).
2. Customizations -> Skills: confirm the jashn-* skills are listed. Rules: AGENTS.md and the 7 rule files.
3. MCP: install "Google Developer Knowledge" from the MCP Store (lets the agent read current Maps, Places, Gemini and
   Antigravity docs). Optional: Chrome DevTools MCP. Optional: enable the `gflow` entry after logging in (docs/11).
   Optional: Google Stitch MCP for UI design (docs/DESIGN-TOOLING.md).
4. Keys in a local .env: GEMINI_API_KEY, GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_MAPS_BROWSER_KEY (restricted; see docs/09).
5. Type `/jashn-status`. Then `/plan` once if you want to review the approach.
6. Paste prompts/GOAL.md. `/goal` makes the agent keep working, auditing evidence, until every completion
   criterion is met. It does not change permissions, so approve tool prompts or pre-allow `mcp(*)` and safe shell commands.

## Slash commands (all skills)
/jashn-all        run the whole pipeline end to end (use inside /goal)
/jashn-status     show phase, gates and next step
/jashn-discover   confirm scope and acceptance criteria
/jashn-design     design system, wireframes, critique (Stitch MCP if present)
/jashn-assets     generate Flow art and wire it in
/jashn-build      build milestones M0-M8; add one, e.g. `/jashn-build M4`
/jashn-graph      build the Event Graph workspace (M3)
/jashn-vendors    build vendor discovery, map and contact (M4)
/jashn-templates  build the template gallery and intake (part of M5)
/jashn-resilience build backups, risk register and disruption simulator (M5)
/jashn-verify     run every gate and golden scenario
/jashn-evals      run and extend the offline ADLC evals
/jashn-harden     security, accessibility, efficiency, code-quality pass
/jashn-review     read-only code-quality review against the rubric
/jashn-deploy     deploy to Cloud Run and smoke test the live URL
/jashn-submit     README, self-score, LinkedIn post, final checklist

## Milestones
M0 scaffold, seed, tooling, hello-world deploy. M1 core lib. M2 GenAI planner. M3 Event Graph + Command Center.
M4 Vendor discovery. M5 Templates + resilience. M6 Living plan polish + share. M7 Assets + design polish.
M8 Evals, harden, deploy, submit.

## If something breaks
Skill not showing: check the folder is `.agents/skills/<name>/SKILL.md` with name and description. Rule ignored:
every file in `.agents/rules/` needs frontmatter with a valid `trigger`. A missing key or login is logged to
docs/BLOCKERS.md and the pipeline continues with the documented fallback.
