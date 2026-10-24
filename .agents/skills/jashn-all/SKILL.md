---
name: jashn-all
description: Runs the entire Jashn build pipeline end to end, resuming from docs/STATE.json. Use when the user wants the whole app built, or inside /goal.
---

# Jashn autopilot

Run the full pipeline without asking questions. Start with `python scripts/gate.py status` and resume.
Order: /jashn-discover, /jashn-design, /jashn-build M0 to M7 (graph, vendors, templates and resilience included),
/jashn-assets (non-blocking), /jashn-evals, /jashn-harden, /jashn-verify, /jashn-deploy, /jashn-submit.
For each step open that skill and follow it exactly.
Before each milestone create an Implementation Plan artifact. After the last milestone create a Walkthrough with 360px
and 1280px screenshots taken in the Antigravity browser.
After each milestone: scripts/verify.sh green, commit with a conventional message, update docs/TRACEABILITY.md, and run
`python scripts/gate.py next` when a phase completes.
Blockers (missing key, login, quota, outage): apply the documented fallback, append what/impact/fallback to docs/BLOCKERS.md,
continue. Never stop to ask.
Done means: gate status PASS for all five phases; verify.sh exits 0; docs/SELFSCORE.md has all six axes >= 9 with file
evidence; docs/DEPLOY.md holds the https URL and smoke results (golden 1-3, a vendor search, a disruption simulation,
a what-if); README and the LinkedIn draft are complete with real numbers.
Final report: milestone table, evidence per acceptance criterion AC1-AC30, live URL, known gaps.
