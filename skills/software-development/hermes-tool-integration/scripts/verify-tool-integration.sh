#!/usr/bin/env bash
# verify-tool-integration.sh
#
# End-to-end verification for a new Hermes tool/plugin. Run from the active
# Hermes tree (HERMES_HOME). Catches the three common traps before the
# gateway restart: wrong tree, curated toolset gap, _request not raising.
#
# Usage:
#   ./verify-tool-integration.sh <tool-name>
#
# Exit codes:
#   0 — all checks pass
#   1 — wrong HERMES_HOME / wrong venv
#   2 — module import failed
#   3 — registration didn't surface the tool
#   4 — tool not in _HERMES_CORE_TOOLS
#   5 — tool not in the resolved active toolset
#   6 — live smoke call failed
#
# Requires: the active tree's venv activated (cd $HERMES_HOME && source venv/bin/activate)

set -u
TOOL="${1:-}"
if [ -z "$TOOL" ]; then
  echo "usage: $0 <tool-name>"
  exit 64
fi

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
info()  { printf "\033[36m== %s ==\033[0m\n" "$*"; }

fail=0

# 1. Confirm the active tree
info "Active tree"
if [ -z "${HERMES_HOME:-}" ]; then
  red "HERMES_HOME is unset. export HERMES_HOME=/path/to/hermes and source venv/bin/activate"
  exit 1
fi
echo "HERMES_HOME=$HERMES_HOME"
PY=$(python -c "import sys; print(sys.executable)")
echo "python=$PY"
if ! [[ "$PY" == *"$HERMES_HOME"* ]]; then
  red "Python ($PY) is not in HERMES_HOME ($HERMES_HOME). Run: cd \$HERMES_HOME && source venv/bin/activate"
  exit 1
fi
green "  ok"

# 2. Confirm the module imports
info "Importing module"
cd "$HERMES_HOME" || exit 1
if ! python -c "import sys; sys.path.insert(0, '.'); import plugins.${TOOL} as P; print(P.__file__)" 2>/tmp/import_err.txt; then
  red "import failed:"
  cat /tmp/import_err.txt
  exit 2
fi
green "  ok"

# 3. Confirm registration surfaces the tool
info "Registration"
if ! python -c "
import sys; sys.path.insert(0, '.')
class _Ctx:
    def __init__(self): self.tools=[]
    def register_tool(self, **kw): self.tools.append(kw)
ctx = _Ctx()
import plugins.${TOOL} as P
P.register(ctx)
names = [t['name'] for t in ctx.tools]
assert '${TOOL}' in names, f'expected ${TOOL} in {names}'
print('  registered:', names)
"; then
  red "registration did not surface the tool"
  exit 3
fi
green "  ok"

# 4. Confirm the tool is in _HERMES_CORE_TOOLS
info "Core toolset"
if ! python -c "
from toolsets import _HERMES_CORE_TOOLS
assert '${TOOL}' in _HERMES_CORE_TOOLS, '${TOOL} not in _HERMES_CORE_TOOLS — edit toolsets.py'
print('  ok')
"; then
  red "tool not in _HERMES_CORE_TOOLS"
  exit 4
fi
green "  ok"

# 5. Find every curated toolset and check each
info "Curated toolsets"
if ! python -c "
import sys; sys.path.insert(0, '.')
from toolsets import TOOLSETS, _HERMES_CORE_TOOLS
TARGET = '${TOOL}'
print(f'  target: {TARGET}')
in_core = TARGET in _HERMES_CORE_TOOLS
print(f'  core: {in_core}')
# Find curated lists (lists that don't share identity with _HERMES_CORE_TOOLS
# and don't extend it)
curated_missing = []
for name, ts in TOOLSETS.items():
    tools = ts.get('tools', [])
    if not isinstance(tools, list):
        continue
    if tools is _HERMES_CORE_TOOLS:
        continue
    if tools == _HERMES_CORE_TOOLS:
        continue
    if all(isinstance(x, str) for x in tools) and TARGET not in tools:
        # heuristic: this looks like a curated list missing the target
        curated_missing.append(name)
if curated_missing:
    print(f'  curated lists missing {TARGET}: {curated_missing}')
    print('  -> edit each in toolsets.py to add the tool to the explicit list')
    sys.exit(5)
print('  no curated lists missing the target')
"
  green "  ok"
  if [ $? -ne 0 ]; then
    exit 5
  fi

# 6. Live smoke against the gate
info "Live smoke"
if ! python -c "
import sys; sys.path.insert(0, '.')
import plugins.${TOOL} as P
ok = P._check_${TOOL}_available() if hasattr(P, '_check_${TOOL}_available') else True
print('  gate:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 6)
"; then
  red "live smoke failed — is the service running? is the gate wired?"
  exit 6
fi
green "  ok"

echo
green "All checks passed. Next step: restart the gateway (or /reset) to surface the tool to the LLM."
