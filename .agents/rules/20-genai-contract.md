---
trigger: model_decision
description: 'Apply when writing or changing Gemini calls, prompts, schemas, guardrails, evals or template adaptation.'
---

# GenAI contract

- Official Google GenAI SDK, JSON response schema, temperature <= 0.4, 30 s timeout, one repair retry.
- The model adapts a chosen template: tasks with three-point estimates and dependencies, cost RANGES with a basis,
  ideas, risks, assumptions. Never totals, dates, floats, critical flags or vendor facts.
- Prompts live in a versioned registry (id, semver, build()). Plan.meta records promptVersions, agentVersion, model.
- Guardrails reject URLs, phone numbers, emails and company-suffix names (Pvt, Ltd, LLP, Studios) in model output.
- Two parallel calls: core (tasks + budget) and extras (ideas + questions). Extras may fail without failing the plan.
- Output language follows intake.language (en/hi/pa); ids and numbers stay machine-readable.
- Still invalid after one repair: typed error to the UI. No fake plan.
