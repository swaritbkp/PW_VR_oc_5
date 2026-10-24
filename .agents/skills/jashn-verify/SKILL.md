---
name: jashn-verify
description: Runs every Jashn quality gate and walks the golden scenarios, reporting only observed evidence. Use after any milestone or before submission.
---

# Verify

Run scripts/verify.sh and fix root causes (never weaken tests) until green. Run `python scripts/gate.py trace`.
Walk docs/07 scenarios 1-27: report PASS or FAIL with test names or browser steps. Observed facts only.
