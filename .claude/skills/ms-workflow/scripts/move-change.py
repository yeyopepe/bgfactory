#!/usr/bin/env python3
"""Mueve la carpeta de un change/fix entre subestados del framework ms-*.

Mueve {changesDir}/{from}/{xxxx}/ (con todo su contenido) a
{changesDir}/{to}/{xxxx}/, creando {changesDir}/{to}/ si no existe.

changesDir se lee de .claude/ms-context.json (seccion framework) salvo que
se pase explicitamente por parametro.

Imprime UNICAMENTE la ruta destino relativa a la raiz del repo en stdout
(p.ej. "src/_changes/implemented/0002"), para poder capturarla directamente
desde otro script o skill sin parsear texto extra. Cualquier error (origen
inexistente, destino ya ocupado, changesDir sin resolver...) termina con
SystemExit y un mensaje claro en stderr, sin mover nada.

Uso:
  python move-change.py --xxxx 0002 --from inProgress --to implemented
  src/_changes/implemented/0002
"""

import argparse
import json
import shutil
import sys
from pathlib import Path


def repo_root() -> Path:
    # Este script vive en {repo}/.claude/skills/ms-workflow/scripts/
    return Path(__file__).resolve().parents[4]


def load_changes_dir(root: Path) -> str:
    context_path = root / ".claude" / "ms-context.json"
    if not context_path.is_file():
        raise SystemExit(
            f"No se encuentra {context_path}. Ejecuta la skill ms-init antes de "
            "mover un change/fix."
        )

    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework")
    if not framework or not framework.get("changesDir"):
        raise SystemExit(
            f"{context_path} no tiene 'framework.changesDir'. Ejecuta la skill "
            "ms-init para completarla."
        )
    return framework["changesDir"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xxxx", required=True, help="Codigo del change/fix a mover.")
    parser.add_argument(
        "--from",
        dest="from_state",
        required=True,
        help="Subcarpeta origen de changesDir (p.ej. inProgress, implemented, closed).",
    )
    parser.add_argument(
        "--to",
        dest="to_state",
        required=True,
        help="Subcarpeta destino de changesDir (p.ej. inProgress, implemented, closed).",
    )
    parser.add_argument(
        "--changes-dir",
        help="Ruta a la carpeta de changes/fixes, relativa a la raiz del repo. "
        "Si no se indica, se lee de .claude/ms-context.json.",
    )
    args = parser.parse_args()

    root = repo_root()

    changes_dir_rel = args.changes_dir or load_changes_dir(root)
    changes_dir = root / changes_dir_rel

    source = changes_dir / args.from_state / args.xxxx
    dest_dir = changes_dir / args.to_state
    dest = dest_dir / args.xxxx

    if not source.is_dir():
        raise SystemExit(f"No existe la carpeta origen: {source}")
    if dest.exists():
        raise SystemExit(f"Ya existe una carpeta en el destino: {dest}")

    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.move(str(source), str(dest))

    print(dest.relative_to(root).as_posix())


if __name__ == "__main__":
    main()
