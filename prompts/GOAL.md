# Paste this into Antigravity (after /jashn-status, optionally after /plan)

/goal Build and ship Jashn per AGENTS.md by running the /jashn-all procedure until ALL of these are true and evidenced:
1) `python scripts/gate.py status` shows PASS for discover, design, build, verify and release.
2) `scripts/verify.sh` exits 0, with lib coverage >= 90% lines and 85% branches.
3) docs/SELFSCORE.md scores Code Quality, Security, Efficiency, Testing, Accessibility and Problem Statement Alignment all >= 9, each with file evidence.
4) Every acceptance criterion AC1 to AC30 appears in a passing test (`python scripts/gate.py trace`).
5) docs/DEPLOY.md contains the live https URL and smoke results for golden scenarios 1 to 3, a vendor search, a disruption simulation and a what-if with undo.
6) README.md and prompts/linkedin-post.md are complete with real numbers, including the AI-art disclosure.
Rules: never stop to ask questions; log assumptions in docs/DECISIONS.md and blockers in docs/BLOCKERS.md with the fallback you applied;
never weaken a test to pass; read current Google docs before using Places, Maps JS or the GenAI SDK.
