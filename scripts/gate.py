#!/usr/bin/env python3
"""Stage gates for the Jashn SDLC/ADLC pipeline (Antigravity 10/10 Edition).

  python scripts/gate.py status          show the current phase and every gate
  python scripts/gate.py check [phase]   run one phase's checks (default: current)
  python scripts/gate.py next            advance if the current phase passes
  python scripts/gate.py trace           every AC id in the spec is referenced by a test
  python scripts/gate.py jsdoc           every exported lib function has a JSDoc block
  python scripts/gate.py quality         enforce <=250 lines/file, <=40 lines/fn, <=4 params, complexity <=8
  python scripts/gate.py efficiency      enforce dynamic imports, memoisation and parallel GenAI calls
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
MAX_FILE_LINES = 240
MAX_FN_LINES = 40
MAX_PARAMS = 4
MAX_COMPLEXITY = 8

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
EXPORT_FN = re.compile(
    r"^export\s+(?:async\s+)?function\s+\w+|"
    r"^export\s+const\s+\w+(?:\s*:[^=]+)?\s*=\s*(?:async\s*)?(?:<[^>]+>\s*)?\("
)
FN_START = re.compile(
    r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)|"
    r"^(?:export\s+)?const\s+(\w+)(?:\s*:[^=]+)?\s*=\s*(?:async\s*)?(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::[^=]+)?=>"
)
BRANCH_TOKENS = re.compile(r"\b(if|else\s+if|for|while|case|catch)\b|\?\?|\?[^.:]|&&|\|\|")
RAW_ANY = re.compile(r":\s*any\b|<any>")


def read(rel):
    path = ROOT / rel
    return path.read_text(encoding="utf-8") if path.exists() else ""


def ac_ids():
    found = set(re.findall(r"\bAC\d+\b", read("docs/00-PRODUCT-SPEC.md")))
    return sorted(found, key=lambda s: int(s[2:]))


def test_files():
    pattern = re.compile(r"\.(test|spec)\.tsx?$")
    found = [
        p
        for base in ("src", "tests")
        if (ROOT / base).exists()
        for p in (ROOT / base).rglob("*")
        if pattern.search(p.name)
    ]
    return found + sorted((ROOT / "scripts").glob("test_*.py"))


def source_files():
    src = ROOT / "src"
    if not src.exists():
        return []
    return [
        p
        for p in sorted(src.rglob("*"))
        if p.suffix in (".ts", ".tsx") and not re.search(r"\.(test|spec)\.tsx?$", p.name)
    ]


def check_trace():
    ids = ac_ids()
    if not ids:
        return ["docs/00-PRODUCT-SPEC.md has no AC ids"]
    corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in test_files())
    return [f"no test references {i}" for i in ids if not re.search(rf"\b{i}\b", corpus)]


def run_ast_checker(arg):
    ast_script = ROOT / "scripts" / "ast_checker.mjs"
    if ast_script.exists():
        try:
            proc = subprocess.run(
                ["node", str(ast_script), arg],
                capture_output=True,
                text=True,
                cwd=ROOT,
                check=False,
            )
            return [line.strip() for line in proc.stdout.splitlines() if line.strip()]
        except Exception:
            pass
    return None


def check_jsdoc():
    ast_res = run_ast_checker("jsdoc")
    if ast_res is not None:
        return ast_res
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


def count_params(param_str):
    cleaned = param_str.strip()
    if not cleaned:
        return 0
    depth = 0
    count = 1
    for ch in cleaned:
        if ch in "<({[":
            depth += 1
        elif ch in ">)}]":
            depth -= 1
        elif ch == "," and depth == 0:
            count += 1
    return count


def check_quality():
    ast_res = run_ast_checker("quality")
    if ast_res is not None:
        return ast_res
    problems = []
    for path in source_files():
        rel = path.relative_to(ROOT)
        lines = path.read_text(encoding="utf-8").splitlines()
        if len(lines) > MAX_FILE_LINES:
            problems.append(f"{rel}: {len(lines)} lines > {MAX_FILE_LINES}")
        for idx, line in enumerate(lines):
            if RAW_ANY.search(line) and "//" not in line and "/*" not in line:
                problems.append(f"{rel}:{idx + 1} uses `any` without an inline comment")
            m = FN_START.match(line.strip())
            if not m:
                continue
            name = m.group(1) or m.group(3)
            params = m.group(2) if m.group(1) else m.group(4)
            pcount = count_params(params or "")
            if pcount > MAX_PARAMS:
                problems.append(f"{rel}:{idx + 1} {name}() has {pcount} params > {MAX_PARAMS}")
            if "{" not in line:
                continue
            depth = 0
            end_idx = idx
            complexity = 1
            for scan in range(idx, len(lines)):
                code_line = re.sub(r"//.*$", "", lines[scan])
                if scan > idx:
                    complexity += len(BRANCH_TOKENS.findall(code_line))
                depth += code_line.count("{") - code_line.count("}")
                if depth <= 0 and scan >= idx:
                    end_idx = scan
                    break
            fn_lines = end_idx - idx + 1
            if fn_lines > MAX_FN_LINES:
                problems.append(f"{rel}:{idx + 1} {name}() is {fn_lines} lines > {MAX_FN_LINES}")
            if complexity > MAX_COMPLEXITY:
                problems.append(f"{rel}:{idx + 1} {name}() complexity {complexity} > {MAX_COMPLEXITY}")
    return problems


def check_efficiency():
    problems = []
    src = ROOT / "src"
    if not src.exists():
        return problems
    all_code = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in source_files())
    if (src / "components").exists() and len(list((src / "components").rglob("*.tsx"))) >= 4:
        if "useMemo" not in all_code:
            problems.append("UI components do not use `useMemo` to memoise derived schedule/graph data")
        if "dynamic(" not in all_code and "React.lazy" not in all_code:
            problems.append("Heavy components (VendorMap / charts) must use `next/dynamic` or `React.lazy`")
    if (src / "server" / "genai").exists():
        genai_code = "\n".join(
            p.read_text(encoding="utf-8", errors="ignore") for p in (src / "server" / "genai").rglob("*.ts")
        )
        if genai_code and "Promise.all" not in genai_code:
            problems.append("src/server/genai must run parallel LLM calls via `Promise.all`")
    return problems


def check_selfscore():
    text = read("docs/SELFSCORE.md")
    scores = {
        m.group(1).strip(): float(m.group(2))
        for m in re.finditer(r"^\|\s*([A-Za-z ]+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|", text, re.M)
    }
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
    return problems + check_quality() + check_efficiency()


def check_verify(run):
    problems = check_trace() + check_jsdoc() + check_quality() + check_efficiency() + check_selfscore()
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


CHECKS = {
    "discover": check_discover,
    "design": check_design,
    "build": check_build,
    "verify": check_verify,
    "release": check_release,
}


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
    if command == "quality":
        return 0 if report("quality", check_quality()) else 1
    if command == "efficiency":
        return 0 if report("efficiency", check_efficiency()) else 1
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
