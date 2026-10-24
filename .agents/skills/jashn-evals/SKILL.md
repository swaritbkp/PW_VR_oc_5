---
name: jashn-evals
description: Runs and extends the offline ADLC evals for the product's LLM agents. Use when prompts, schemas or templates change.
---

# Evals

Read docs/03 (ADLC) and ref-adlc-evals. Run `npm run evals`. Ensure every golden scenario and every template has a fixture and
deterministic checks. If prompts changed: record with a live key, review the diff, bump the prompt version, add prompts/CHANGELOG.md, rerun offline.
