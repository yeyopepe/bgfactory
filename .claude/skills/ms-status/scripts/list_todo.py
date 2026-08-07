#!/usr/bin/env python3
"""Lista completa de ideas de {changesDir}/todo/, para /ms-status todo.

A diferencia de collect_status.py (que da un JSON con todos los estados),
este script devuelve solo las ideas de 'todo', ya renderizadas en markdown
segun la plantilla STATUS.todo.template.md (no un JSON) -- asi el modelo
que invoca este script no necesita redactar el listado el mismo ni truncar
nada, solo pegar la salida tal cual.

Reutiliza parse_todo_description de collect_status.py para extraer el texto
completo (sin truncar) de la seccion '## Idea' de cada description.md. Si
una idea no tiene esa seccion (o no tiene description.md), la fila lo dice
explicitamente en vez de omitir la entrada.

No escribe nada en disco: imprime el markdown final por stdout.

Uso:
  python list_todo.py
  python list_todo.py --changes-dir changes
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from collect_status import load_changes_dir, parse_todo_description, repo_root  # noqa: E402

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "STATUS.todo.template.md"

ROW_IDEA_RE = re.compile(r"<!--\s*ROW_IDEA:\s*(.+?)\s*-->\n?")
EMPTY_TEMPLATE_RE = re.compile(r"<!--\s*EMPTY_TEMPLATE:\s*(.+?)\s*-->\n?")


def collect_todo(changes_dir: Path) -> list[dict]:
    todo_dir = changes_dir / "todo"
    if not todo_dir.is_dir():
        return []

    entries = []
    for entry_dir in sorted(p for p in todo_dir.iterdir() if p.is_dir()):
        description_path = entry_dir / "description.md"
        idea = None
        if description_path.is_file():
            idea = parse_todo_description(description_path).get("idea")
        entries.append({"code": entry_dir.name, "idea": idea})
    return entries


def render_report(entries: list[dict]) -> str:
    template_text = TEMPLATE_PATH.read_text(encoding="utf-8")
    row_match = ROW_IDEA_RE.search(template_text)
    empty_match = EMPTY_TEMPLATE_RE.search(template_text)
    if not row_match or not empty_match:
        raise SystemExit(
            f"La plantilla {TEMPLATE_PATH} no tiene los marcadores "
            "ROW_IDEA/EMPTY_TEMPLATE esperados."
        )
    row_template = row_match.group(1)
    empty_template = empty_match.group(1)

    body = ROW_IDEA_RE.sub("", template_text)
    body = EMPTY_TEMPLATE_RE.sub("", body)
    body = body.rstrip("\n") + "\n"

    if entries:
        filas = "\n".join(
            row_template.format(
                code=entry["code"],
                idea=entry["idea"] if entry["idea"] else "*(sin sección '## Idea' en description.md)*",
            )
            for entry in entries
        )
    else:
        filas = empty_template

    from datetime import datetime

    return body.format(fechaGeneracion=datetime.now().strftime("%Y-%m-%d"), filas=filas)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--changes-dir",
        help="Ruta a {changesDir} relativa a la raiz del repo. Si no se indica, "
        "se lee de .claude/ms-context.json.",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()
    changes_dir = load_changes_dir(root, args.changes_dir)
    entries = collect_todo(changes_dir)
    print(render_report(entries))


if __name__ == "__main__":
    main()
