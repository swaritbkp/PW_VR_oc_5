# Scoring rubric and evidence plan

Known axes (from your scored submission): Code Quality, Security, Efficiency, Testing,
Accessibility, Problem Statement Alignment. Last run: 95 / 100 / 95 / 100 / 100 / 100.
Code Quality and Efficiency are where points were lost, so they get numeric gates below.

| Axis | Target | Evidence the agent must be able to point to |
|---|---|---|
| Problem Statement Alignment | 100 | Budget, timeline, vendor checklist, ideas for wedding, birthday, community; PERT/CPM schedule; living plan; golden scenarios 1-3 demoable |
| Code Quality | 100 | Gates in 30-quality: fn <= 40 lines, complexity <= 8, file <= 250 lines, <= 4 params, JSDoc on lib exports, no magic numbers, Result types, no cycles, no dead code (knip), prettier clean, eslint 0 warnings |
| Efficiency | 100 | Perf tests (2000-task CPM < 250 ms, 2000-run Monte Carlo < 500 ms), parallel LLM calls, caches with caps, memoised derived data, dynamic-imported charts, bundle report, no N+1 renders |
| Testing | 100 | >= 90% line / 85% branch on lib, AC-tagged tests (gate.py trace), golden scenarios, injection tests, component tests, evals offline suite |
| Security | 100 | Server-only key, zod everywhere, guardrails, injection tests, rate limit with bounded memory, CSP + headers, secret scan, no dangerouslySetInnerHTML |
| Accessibility | 100 | vitest-axe on every screen, contrast token test (>= 4.5:1), keyboard tests, aria-live, reduced motion, 360px, chart text alternatives |

Narrative (LinkedIn/README) is separate and still matters: use /submit.

Before each submission run /verify and /harden, fill docs/SELFSCORE.md (0-10 per axis, file evidence),
fix anything below 9, then `python scripts/gate.py check verify`.
