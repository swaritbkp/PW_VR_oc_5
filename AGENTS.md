# AGENTS.md - Jashn (PromptWars Challenge 5: Celebration & Event Planner)
Single source of truth for Google Antigravity. Rules: .agents/rules. Procedures: .agents/skills (slash commands).

## Mission
Ship a deployed, secure, tested, accessible, modern GenAI app whose main workspace is a date-aware, location-aware
Event Graph: templates to start from, real nearby vendors to select and contact, Plan B backups and a disruption
simulator, PERT/CPM scheduling, and a living plan. Scored on Code Quality, Security, Efficiency, Testing,
Accessibility, Problem Statement Alignment. Target 100 on each.

## Start of every session
1. `python scripts/gate.py status` - current phase (state in docs/STATE.json). Resume; never restart finished phases.
2. Read docs/00 to docs/12 as needed. Run `/jashn-status` if unsure what is next.

## Non-negotiables
1. GenAI is load-bearing: real Gemini calls, structured output, no hard-coded plans.
2. LLM proposes, code decides: arithmetic, dates, CPM/PERT, layout, risk ranking, alerts are pure tested functions.
3. No fabricated facts: vendors only from Google Places results; the LLM adds no vendor names, phones, prices or reviews.
4. Secrets server-only. The single public key is NEXT_PUBLIC_MAPS_BROWSER_KEY (referrer- and API-restricted).
5. zod at every boundary. User text is untrusted data.
6. Failure is honest: clear error and retry, never a silent fake result. Fallbacks are explicit.
7. Quality gates are hard limits (rules/30-quality). Mobile-first, keyboard-usable, AA contrast, text alternatives.

## Autonomy protocol
- Never stop to ask. Choose the simplest reasonable option, log it in docs/DECISIONS.md, continue.
- Missing key, login, quota or outage: apply the documented fallback, log it in docs/BLOCKERS.md, continue.
- Seed code in seed/ is verified (113 tests). Copy it in at M0 and extend with tests first. Never weaken its tests.
- Each milestone: Implementation Plan artifact -> tests first -> implement -> scripts/verify.sh green -> commit ->
  update docs/TRACEABILITY.md -> `python scripts/gate.py next` when a phase completes.
- Prefer deleting code to adding code. No dependency without a reason in DECISIONS.md.
- Before using any Google API (Places, Maps JS, GenAI SDK) read the current docs via the Google Developer Knowledge
  MCP if connected; never rely on memory for model ids, field masks, package names or pricing tiers.
