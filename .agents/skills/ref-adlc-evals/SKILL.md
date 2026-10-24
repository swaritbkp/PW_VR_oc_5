---
name: ref-adlc-evals
description: Reference: offline deterministic evals for the product's LLM agents. Not a command; use when changing prompts, schemas or templates.
---

# ADLC evals

evals/run.ts loads docs/07 scenarios and all 12 templates, runs generate against fixtures (or live with --live) and checks: schema valid; buildOrder ok; 12-45 tasks;
estimates ordered and p <= 365; no URL, phone, email, company suffix or vendor-looking names; language script share for hi/pa; crunch flagged; totals reconcile.
Exit non-zero on failure. --record writes fixtures. A prompt change needs an eval diff and a CHANGELOG entry.
