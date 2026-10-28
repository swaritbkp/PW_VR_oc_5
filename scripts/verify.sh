#!/usr/bin/env bash
set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1
step() { printf '\n== %s\n' "$1"; }
step "install";          [ -d node_modules ] || npm ci
step "format";           npx prettier --check .
step "lint";             npm run lint --if-present -- --max-warnings 0
step "typecheck";        npx tsc --noEmit
step "tests + coverage"; npx vitest run --coverage
step "dead code";        npx knip
step "import cycles";    npx madge --circular --ts-config tsconfig.json --extensions ts,tsx src
step "jsdoc on lib exports"; python3 scripts/gate.py jsdoc
step "code quality limits";  python3 scripts/gate.py quality
step "efficiency checks";    python3 scripts/gate.py efficiency
step "script tests";     python3 -m unittest discover -s scripts -p "test_*.py"
step "art manifest";     python3 scripts/flow_assets.py check
step "offline evals";    npm run evals --if-present
step "build";            npm run build
step "secret scan"
if grep -RInE "AIza[0-9A-Za-z_-]{30,}|-----BEGIN (RSA |EC )?PRIVATE KEY" \
   --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude=verify.sh . ; then
  echo "FAIL: possible secret committed"; exit 1; fi
step "banned patterns"
if grep -RIn "dangerouslySetInnerHTML" src ; then echo "FAIL: dangerouslySetInnerHTML"; exit 1; fi
bad=$(grep -RInE "NEXT_PUBLIC_[A-Z_]*(KEY|SECRET|TOKEN)" src .env.example | grep -v "NEXT_PUBLIC_MAPS_BROWSER_KEY" || true)
if [ -n "$bad" ]; then echo "$bad"; echo "FAIL: public secret var (only NEXT_PUBLIC_MAPS_BROWSER_KEY is allowed)"; exit 1; fi
if grep -RIn "GOOGLE_PLACES_API_KEY\|GEMINI_API_KEY" src/components src/app --include="*.tsx" 2>/dev/null | grep -v "api/" ; then
  echo "FAIL: server key referenced in client code"; exit 1; fi
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
echo; echo "ALL GREEN"
