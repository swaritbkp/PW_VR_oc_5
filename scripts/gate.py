#!/usr/bin/env python3
"""Stage gates for the Jashn SDLC/ADLC pipeline (Antigravity).

  python scripts/gate.py status          show the current phase and every gate
  python scripts/gate.py check [phase]   run one phase's checks (default: current)
  python scripts/gate.py next            advance if the current phase passes
  python scripts/gate.py trace           every AC id in the spec is referenced by a test
  python scripts/gate.py jsdoc           every exported lib function has a JSDoc block
Add --run to include scripts/verify.sh in the verify phase.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHASES = ["discover", "design", "build", "verify", "release"]
STATE = ROOT / "docs" / "STATE.json"
MIN_AXIS_SCORE = 9
MIN_AC_IDS = 30
MIN_TEST_FILES = 12
AXES = ["Code Quality", "Security", "Efficiency", "Testing", "Accessibility", "Problem Statement Alignment"]
DESIGN_SECTIONS = ["## Palette", "## Type", "## Layout", "## Principles", "## Critique"]
CORE_FILES = [
    "package.json",
    "src/lib/schedule/cpm.ts",
    "src/lib/graph/layout.ts",
    "src/lib/templates/catalog.ts",
    "src/lib/vendors/places.ts",
    "src/lib/resilience/disruptions.ts",
    "src/lib/budget/engine.ts",
    "src/app/api/plan/route.ts",
    "src/app/api/vendors/search/route.ts",
]
EXPORT_FN = re.compile(r"^export\s+(?:async\s+)?function\s+\w+|^export\s+const\s+\w+\s*=\s*(?:async\s*)?\(")


def read(rel):
    path = ROOT / rel
    return path.read_text(encoding="utf-8") if path.exists() else ""


def ac_ids():
    found = set(re.findall(r"\bAC\d+\b", read("docs/00-PRODUCT-SPEC.md")))
    return sorted(found, key=lambda s: int(s[2:]))


def test_files():
    pattern = re.compile(r"\.(test|spec)\.tsx?$")
    found = [p for base in ("src", "tests") if (ROOT / base).exists() for p in (ROOT / base).rglob("*") if pattern.search(p.name)]
    return found + sorted((ROOT / "scripts").glob("test_*.py"))


def check_trace():
    ids = ac_ids()
    if not ids:
        return ["docs/00-PRODUCT-SPEC.md has no AC ids"]
    corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in test_files())
    return [f"no test references {i}" for i in ids if not re.search(rf"\b{i}\b", corpus)]


def check_jsdoc():
    problems = []
    lib = ROOT / "src" / "lib"
    if not lib.exists():
        return problems
    for path in sorted(lib.rglob("*.ts")):
        if path.name.endswith(".test.ts") or path.name == "types.ts":
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        for i, line in enumerate(lines):
            if EXPORT_FN.match(line):
                prev = next((x.strip() for x in reversed(lines[:i]) if x.strip()), "")
                if not prev.endswith("*/"):
                    problems.append(f"{path.relative_to(ROOT)}:{i + 1} exported function lacks JSDoc")
    return problems


def check_selfscore():
    text = read("docs/SELFSCORE.md")
    scores = {m.group(1).strip(): float(m.group(2)) for m in re.finditer(r"^\|\s*([A-Za-z ]+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|", text, re.M)}
    problems = []
    for axis in AXES:
        if axis not in scores:
            problems.append(f"docs/SELFSCORE.md missing axis {axis}")
        elif scores[axis] < MIN_AXIS_SCORE:
            problems.append(f"{axis} self-score {scores[axis]} < {MIN_AXIS_SCORE}")
    return problems


def check_discover(_run):
    problems = []
    if len(ac_ids()) < MIN_AC_IDS:
        problems.append(f"spec needs at least {MIN_AC_IDS} acceptance criteria ids")
    if not read("docs/DECISIONS.md").strip():
        problems.append("docs/DECISIONS.md missing")
    return problems


def check_design(_run):
    text = read("docs/DESIGN.md")
    problems = [f"docs/DESIGN.md missing section {h}" for h in DESIGN_SECTIONS if h not in text]
    if "TODO" in text:
        problems.append("docs/DESIGN.md still contains TODO")
    return problems


def check_build(_run):
    problems = [f"missing {rel}" for rel in CORE_FILES if not (ROOT / rel).exists()]
    if len(test_files()) < MIN_TEST_FILES:
        problems.append(f"need at least {MIN_TEST_FILES} test files")
    return problems


def check_verify(run):
    problems = check_trace() + check_jsdoc() + check_selfscore()
    if run and subprocess.run(["bash", "scripts/verify.sh"], cwd=ROOT).returncode != 0:
        problems.append("scripts/verify.sh failed")
    return problems


def check_release(_run):
    text = read("docs/DEPLOY.md")
    problems = []
    if "https://" not in text:
        problems.append("docs/DEPLOY.md needs the live https URL")
    if "smoke" not in text.lower():
        problems.append("docs/DEPLOY.md needs smoke test results")
    return problems


CHECKS = {"discover": check_discover, "design": check_design, "build": check_build, "verify": check_verify, "release": check_release}


def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"phase": PHASES[0], "passed": []}


def save_state(state):
    state["updated"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def report(phase, problems):
    print(f"[{'PASS' if not problems else 'FAIL'}] {phase}")
    for p in problems:
        print(f"       - {p}")
    return not problems


def main(argv):
    run = "--run" in argv
    args = [a for a in argv if a != "--run"]
    command = args[0] if args else "status"
    state = load_state()
    if command == "trace":
        return 0 if report("trace", check_trace()) else 1
    if command == "jsdoc":
        return 0 if report("jsdoc", check_jsdoc()) else 1
    if command == "status":
        print(f"current phase: {state['phase']}   passed: {', '.join(state['passed']) or 'none'}")
        for phase in PHASES:
            report(phase, CHECKS[phase](False))
        return 0
    if command == "check":
        phase = args[1] if len(args) > 1 else state["phase"]
        return 0 if report(phase, CHECKS[phase](run)) else 1
    if command == "next":
        phase = state["phase"]
        if not report(phase, CHECKS[phase](run)):
            return 1
        state["passed"] = sorted(set(state["passed"] + [phase]), key=PHASES.index)
        nxt = PHASES.index(phase) + 1
        state["phase"] = PHASES[min(nxt, len(PHASES) - 1)]
        save_state(state)
        print(f"advanced to: {state['phase']}" if nxt < len(PHASES) else "all phases passed")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
