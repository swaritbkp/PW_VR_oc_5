---
trigger: always_on
---

# Quality gates (hard limits; verify.sh and gate.py enforce what they can)

- Function <= 40 lines. Cyclomatic complexity <= 8. File <= 250 lines. Parameters <= 4 (else one options object).
- JSDoc on every exported function in src/lib. Named exports. No default exports except Next.js files.
- No magic numbers outside named constants (allow 0, 1, 2, 100). Fallible lib functions return Result, not throw.
- lib/ is pure. No circular imports (madge). No unused exports (knip). prettier clean. eslint 0 warnings.
- Tests: lib coverage >= 90 lines / 85 branches. Test names carry AC ids (AC1..AC30). Test-first for lib.
- Efficiency: memoise derived data by hash, cap every cache, dynamic-import the map and charts, report First Load JS (< 170 kB).
- Accessibility: vitest-axe on every screen, contrast token test, keyboard tests, aria-live for results.
- UI states always: empty, loading (skeleton + aria-live), error (retry), success.
