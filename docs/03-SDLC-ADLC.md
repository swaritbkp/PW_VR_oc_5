# SDLC and ADLC in one pipeline

## SDLC phases -> artifacts -> gate (python scripts/gate.py)

| Phase                                                                                        | Artifacts                                                                          | Gate passes when                               |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| discover                                                                                     | docs/00 spec with AC ids, docs/DECISIONS.md                                        | >= 10 AC ids present                           |
| design                                                                                       | docs/DESIGN.md (palette, type, layout, principles, critique), ADRs in DECISIONS.md | sections present, no TODO                      |
| build                                                                                        | src/, tests, seed engine in place                                                  | core files exist, >= 8 test files              |
| verify                                                                                       | verify.sh green, AC trace, JSDoc check, docs/SELFSCORE.md                          | every AC referenced by a test, every axis >= 9 |
| release                                                                                      | docs/DEPLOY.md with live URL and smoke results                                     | URL and smoke notes present                    |
| The agent runs `python scripts/gate.py status` at the start of every session and             |
| `python scripts/gate.py next` after finishing a phase. State lives in docs/STATE.json so any |
| session (Antigravity) resumes exactly where the last stopped.                                |

## Practices

- Definition of ready: story has AC ids and a test idea. Definition of done: typed, tested, accessible, documented, verify green.
- Test-first for lib/. Small commits using conventional messages (feat, fix, test, refactor, docs, chore).
- ADR habit: any choice between options goes in DECISIONS.md (date | decision | why | rejected).
- Traceability: AC id -> test name -> module, listed in docs/TRACEABILITY.md.
- Retro at each milestone: what slowed us, what to automate, update rules/skills.

## ADLC (Agent Development Life Cycle) for the product's LLM agents

1. Scope: each agent has a job, inputs, outputs, autonomy level (see architecture table). No side effects.
2. Design: prompt registry with semantic versions, JSON schemas, guardrails, failure behaviour.
3. Build: smallest prompt that passes evals; code owns all math.
4. Evaluate (offline, deterministic): `npm run evals` runs every golden scenario against recorded
   fixtures (or live with a key) and checks: schema valid, task graph acyclic and complete, 12-45 tasks,
   estimates ordered, lead-times sane, no URLs/phones/emails/company suffixes, language script matches,
   crunch scenario flagged, totals reconcile.
5. Deploy: Plan.meta records promptVersions, agentVersion, model. Bump version on any prompt change.
6. Observe: structured logs (latency, repair-retry rate, guardrail flags). Audit panel shows the same to the user.
7. Improve: change a prompt only with an eval diff and a prompts/CHANGELOG.md entry.

## Guardrail layers

Input: zod, length caps, control-char strip, <user_data> delimiting, injection-pattern flag (logged, not trusted).
Output: schema, banned-content regex (URL, phone, email, company suffix), numeric sanity, language check.
Grounding: every cost has a basis string; every task has a why; assumptions[] and risks[] required.
Escalation: two schema failures -> typed error to UI, never a made-up plan.

## Antigravity-specific practice

- Commands are skills: every phase is a slash command (`/jashn-discover`, `/jashn-build`, ...). Google retired legacy
  workflows on 19 Oct 2026, so nothing here lives in `.agents/workflows`.
- Before each milestone the agent produces an Implementation Plan artifact; after the last milestone a Walkthrough
  artifact with screenshots from the Antigravity browser (360px and 1280px).
- `/goal` runs the whole pipeline until evidence-based completion (see prompts/GOAL.md). Use `/plan` first.
- Rules (.agents/rules) hold invariants; skills hold procedures; docs hold the spec. Keep rules small (24 KB per file,
  20k-token aggregate budget for always-on rules).
