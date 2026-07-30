#!/usr/bin/env bash
# Mide el tamano real de stdout de cada script de los skills ms-*, ejecutandolos
# con argumentos representativos contra el estado real del repo.
#
# Los de solo lectura se ejecutan tal cual. Los que mutan estado real
# (sync-skill-models.py, move-change.py) se ejecutan en modo seguro
# (--dry-run, o contra una carpeta de changes de mentira en /tmp) para no
# tocar el repo. Ver .claude/improvement/04/analysis.md #1 para el criterio
# de seguridad de cada uno.
#
# Uso: bash .claude/improvement/04/scripts/measure_script_output.sh [dir_salida]
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

OUT="${1:-/tmp/ms-status-output-audit}"
mkdir -p "$OUT"

measure() {
  local label="$1"; shift
  local outfile="$OUT/${label}.txt"
  "$@" > "$outfile" 2>&1 || true
  local chars lines
  chars=$(wc -c < "$outfile")
  lines=$(wc -l < "$outfile")
  printf '%-45s %10s chars %6s lines\n' "$label" "$chars" "$lines"
}

echo "== scripts de solo lectura, ejecutados contra el repo real =="
measure "check-context" python3 .claude/skills/ms-init/scripts/check-context.py
measure "get-max-change-codes" python3 .claude/skills/ms-how/scripts/get-max-change-codes.py
measure "next-change-number" python3 .claude/skills/ms-internal-workflow/scripts/next-change-number.py
measure "new-todo-code" python3 .claude/skills/ms-todo/scripts/new-todo-code.py
measure "resolve-fast-folder" python3 .claude/skills/ms-fast/scripts/resolve-fast-folder.py --title "prueba de auditoria punto 4"
measure "sync-skill-models-dry-run" python3 .claude/skills/ms-init/scripts/sync-skill-models.py --dry-run
measure "collect_status" python3 .claude/skills/ms-status/scripts/collect_status.py
measure "render_status" python3 .claude/skills/ms-status/scripts/render_status.py
measure "render_status-show-fast" python3 .claude/skills/ms-status/scripts/render_status.py --show-fast
measure "filter_status-closed" python3 .claude/skills/ms-status/scripts/filter_status.py closed

echo
echo "== ms_graph.py extract, contra src/ real (escribe skeleton en \$OUT, no en el repo) =="
measure "ms_graph-extract" python3 .claude/skills/ms-internal-graph/scripts/ms_graph.py extract \
  --base src --out "$OUT/graph.skeleton.json" --exclude "_graph,changes"

echo
echo "== move-change.py, contra una carpeta de changes de mentira (no toca el repo) =="
SANDBOX="$OUT/move_change_sandbox"
rm -rf "$SANDBOX"
mkdir -p "$SANDBOX/inProgress/9999"
echo "dummy" > "$SANDBOX/inProgress/9999/description.md"
measure "move-change" python3 .claude/skills/ms-internal-workflow/scripts/move-change.py \
  --xxxx 9999 --from inProgress --to implemented --changes-dir "$SANDBOX"
rm -rf "$SANDBOX"

echo
echo "Salidas completas guardadas en: $OUT"
