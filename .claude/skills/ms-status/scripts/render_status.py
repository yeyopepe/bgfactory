#!/usr/bin/env python3
"""Renderiza el informe completo de /ms-status a partir de STATUS.template.md.

Reutiliza collect_status.collect() para reunir todos los datos (estados,
totales por tipo, subStatus de inProgress, avisos) y aplica el mapeo
completo descrito en el paso 2 de SKILL.md sobre la plantilla
STATUS.template.md, igual que filter_status.py ya hace para el modo de un
solo estado -- asi el modelo que invoca este script no gasta tokens
mapeando campos ni redactando las listas, solo pega la salida tal cual.

La plantilla define, ademas de los placeholders escalares de la tabla,
cuatro patrones de fila reutilizables y tres secciones opcionales que se
eliminan enteras (cabecera incluida) cuando no aplican:

  <!-- ROW_ENTRY: ... -->    fila de "implementando"/"pendientes" (xxxx/nombre/tipo)
  <!-- EMPTY_ENTRY: ... -->  texto si una de esas dos listas esta vacia
  <!-- ROW_FAST: ... -->     fila de "cambios fast implementados"
  <!-- ROW_IDEA: ... -->     fila de "ideas en todo/"
  <!-- ROW_AVISO: ... -->    fila de "avisos"
  <!-- EMPTY_IDEAS: ... -->  texto si no hay ninguna idea en todo/

  <!-- SECTION:sinDescripcion --> ... <!-- /SECTION:sinDescripcion -->
  <!-- SECTION:fast --> ... <!-- /SECTION:fast -->
  <!-- SECTION:avisos --> ... <!-- /SECTION:avisos -->

La seccion "Cambios fast implementados" se omite por defecto aunque haya
entradas fast: solo se incluye si se pasa --show-fast (usar unicamente
cuando el usuario la pida explicitamente).

No escribe nada en disco: imprime el markdown final por stdout.

Uso:
  python render_status.py
  python render_status.py --changes-dir changes
  python render_status.py --show-fast
"""

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from collect_status import collect, load_changes_dir, repo_root  # noqa: E402

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "STATUS.template.md"

FECHA_RE = re.compile(r"\*\*Fecha\*\*\s*[:—-]\s*(.+)")

ROW_RE_TEMPLATE = r"<!--\s*{name}:\s*(.+?)\s*-->\n?"
SECTION_RE_TEMPLATE = r"<!--\s*SECTION:{name}\s*-->\n?(.*?)<!--\s*/SECTION:{name}\s*-->\n?"


def extract_fecha(entry_dir: Path) -> str:
    description_path = entry_dir / "description.md"
    if description_path.is_file():
        text = description_path.read_text(encoding="utf-8")
        match = FECHA_RE.search(text)
        if match:
            return match.group(1).strip()
        return datetime.fromtimestamp(description_path.stat().st_mtime).strftime("%Y-%m-%d")
    return datetime.fromtimestamp(entry_dir.stat().st_mtime).strftime("%Y-%m-%d")


def extract_marker(template_text: str, name: str) -> str:
    match = re.search(ROW_RE_TEMPLATE.format(name=name), template_text)
    if not match:
        raise SystemExit(f"La plantilla {TEMPLATE_PATH} no tiene el marcador {name}.")
    return match.group(1)


def strip_markers(text: str, *names: str) -> str:
    for name in names:
        text = re.sub(ROW_RE_TEMPLATE.format(name=name), "", text)
    return text


def apply_section(text: str, name: str, keep: bool) -> str:
    pattern = re.compile(SECTION_RE_TEMPLATE.format(name=name), re.DOTALL)
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"La plantilla {TEMPLATE_PATH} no tiene la seccion {name}.")
    replacement = match.group(1) if keep else ""
    return pattern.sub(replacement, text)


def entry_lines(entries: list[dict], row_template: str, empty_template: str) -> str:
    if not entries:
        return empty_template
    return "\n".join(
        row_template.format(xxxx=entry["code"], nombre=entry["name"] or "(sin nombre)", tipo=entry["type"])
        for entry in entries
    )


def render(result: dict, changes_dir: Path, show_fast: bool = False) -> str:
    states = result["states"]
    totals = result["totalsByType"]

    def state_count(state: str, type_: str) -> int:
        return states.get(state, {}).get("byType", {}).get(type_, 0)

    template_text = TEMPLATE_PATH.read_text(encoding="utf-8")

    row_entry = extract_marker(template_text, "ROW_ENTRY")
    empty_entry = extract_marker(template_text, "EMPTY_ENTRY")
    row_fast = extract_marker(template_text, "ROW_FAST")
    row_idea = extract_marker(template_text, "ROW_IDEA")
    row_aviso = extract_marker(template_text, "ROW_AVISO")
    empty_ideas = extract_marker(template_text, "EMPTY_IDEAS")

    # Las lineas de marcador (ROW_*/EMPTY_*) contienen sus propios
    # placeholders literales ({xxxx}, {código}...) que no forman parte de
    # los kwargs del format() final: hay que quitarlas del texto ANTES de
    # aplicar secciones y formatear, o format() fallaria con KeyError.
    template_text = strip_markers(
        template_text, "ROW_ENTRY", "EMPTY_ENTRY", "ROW_FAST", "ROW_IDEA", "ROW_AVISO", "EMPTY_IDEAS"
    )

    in_progress_entries = states.get("inProgress", {}).get("entries", [])
    to_implement = [e for e in in_progress_entries if e["subStatus"] == "listo_para_implementar"]
    pending = [e for e in in_progress_entries if e["subStatus"] == "descrito"]
    sin_descripcion = [e for e in in_progress_entries if e["subStatus"] == "sin_descripcion"]

    implemented_entries = states.get("implemented", {}).get("entries", [])
    closed_entries = states.get("closed", {}).get("entries", [])
    fast_entries = [e for e in implemented_entries if e["type"] == "fast"] + [
        e for e in closed_entries if e["type"] == "fast"
    ]

    todo_entries = states.get("todo", {}).get("entries", [])

    body = apply_section(template_text, "sinDescripcion", keep=bool(sin_descripcion))
    body = apply_section(body, "fast", keep=show_fast and bool(fast_entries))
    body = apply_section(body, "avisos", keep=bool(result["warnings"]))

    body = body.format(
        fechaGeneracion=datetime.now().strftime("%Y-%m-%d"),
        todoTotal=states.get("todo", {}).get("total", 0),
        inProgressChange=state_count("inProgress", "change"),
        inProgressFix=state_count("inProgress", "fix"),
        inProgressTotal=states.get("inProgress", {}).get("total", 0),
        implementedChange=state_count("implemented", "change"),
        implementedFix=state_count("implemented", "fix"),
        implementedFast=state_count("implemented", "fast"),
        implementedTotal=states.get("implemented", {}).get("total", 0),
        closedChange=state_count("closed", "change"),
        closedFix=state_count("closed", "fix"),
        closedFast=state_count("closed", "fast"),
        closedTotal=states.get("closed", {}).get("total", 0),
        changeTotal=totals.get("change", 0),
        fixTotal=totals.get("fix", 0),
        fastTotal=totals.get("fast", 0),
        totalTotal=result["grandTotal"],
        toImplementTotal=len(to_implement),
        filasImplementar=entry_lines(to_implement, row_entry, empty_entry),
        pendingTotal=len(pending),
        filasPendientes=entry_lines(pending, row_entry, empty_entry),
        toCloseTotal=states.get("implemented", {}).get("total", 0),
        filasSinDescripcion=", ".join(e["code"] for e in sin_descripcion),
        filasFast="\n".join(
            row_fast.format(código=e["code"], nombre=e["name"] or "(sin nombre)", fecha=extract_fecha(changes_dir / ("implemented" if e in implemented_entries else "closed") / e["code"]))
            for e in fast_entries
        ),
        filasIdeas=(
            "\n".join(row_idea.format(codigo=e["code"], idea=e["name"] or "(sin idea)") for e in todo_entries)
            if todo_entries
            else empty_ideas
        ),
        filasAvisos="\n".join(row_aviso.format(aviso=w) for w in result["warnings"]),
    )

    return body.rstrip("\n") + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--changes-dir",
        help="Ruta a {changesDir} relativa a la raiz del repo. Si no se indica, "
        "se lee de .claude/ms-context.json.",
    )
    parser.add_argument(
        "--show-fast",
        action="store_true",
        help="Incluye la seccion 'Cambios fast implementados'. Omitida por defecto: "
        "solo pasar este flag cuando el usuario la pida explicitamente.",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()
    changes_dir = load_changes_dir(root, args.changes_dir)
    result = collect(changes_dir)
    print(render(result, changes_dir, show_fast=args.show_fast))


if __name__ == "__main__":
    main()
