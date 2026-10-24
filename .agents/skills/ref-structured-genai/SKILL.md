---
name: ref-structured-genai
description: Reference: reliable Gemini structured output with zod, repair retry, guardrails, prompt versioning and injection defence. Not a command.
---
# Structured GenAI
zod schema first; JSON response schema derived. System prompt holds rules only; user text only inside <user_data>. Low temperature, timeout, safeParse, one repair call,
then a typed error. Guardrails after parse: banned patterns, numeric sanity, language script check, DAG validity via buildOrder, no vendor facts. Prompts in a versioned
registry; log version, latency, repair flag, never the prompt. Fake-client tests: valid, invalid-once, invalid-twice, timeout, injection, banned content.
