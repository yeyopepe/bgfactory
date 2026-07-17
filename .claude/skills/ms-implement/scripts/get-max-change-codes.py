#!/usr/bin/env python3
"""Obtiene el codigo (xxxx) mas alto existente en cada estado del framework ms-*.

Busca, por separado, el numero mas alto entre las subcarpetas puramente
numericas de {changesDir}/inProgress, {changesDir}/implemented y
{changesDir}/closed. Se usa como verificacion previa de ms-implement: si el
xxxx que se va a implementar es menor que el maximo de cualquiera de estos
tres estados, significa que se ha creado despues de otro cambio/fix mas
reciente y conviene reanalizarlo antes de implementar.

changesDir y numberWidth se leen de .claude/ms-context.json (seccion
framework) salvo que se pasen explicitamente por parametro.

Imprime UNICAMENTE un JSON en stdout con los tres codigos ya formateados con
numberWidth digitos y ceros a la izquierda, o null si ese estado no tiene
ninguna carpeta numerada:

  {"inProgress": "00003", "implemented": "00002", "closed": null}

Uso:
  python get-max-change-codes.py
"""

import argparse
import json
import re
import sys
from pathlib import Path

NUMERIC_NAME = re.compile(r"^\d+$")
STATES = ("inProgress", "implemented", "closed")


def repo_root() -> Path:
    # Este script vive en {repo}/.claude/skills/ms-implement/scripts/
    return Path(__file__).resolve().parents[4]


def load_framework_defaults(root: Path) -> dict:
    context_path = root / ".claude" / "ms-context.json"
    if not context_path.is_file():
        raise SystemExit(
            f"No se encuentra {context_path}. Ejecuta la skill ms-init antes de "
            "comprobar los codigos existentes."
        )

    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework")
    if not framework:
        raise SystemExit(
            f"{context_path} no tiene la seccion 'framework'. Ejecuta la skill "
            "ms-init para completarla."
        )
    return framework


def max_number_in(state_dir: Path) -> int | None:
    if not state_dir.is_dir():
        return None

    max_number = None
    for entry_dir in state_dir.iterdir():
        if entry_dir.is_dir() and NUMERIC_NAME.match(entry_dir.name):
            number = int(entry_dir.name)
            if max_number is None or number > max_number:
                max_number = number
    return max_number


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--changes-dir",
        help="Ruta a la carpeta de changes/fixes, relativa a la raiz del repo. "
        "Si no se indica, se lee de .claude/ms-context.json.",
    )
    parser.add_argument(
        "--number-width",
        type=int,
        help="Numero de digitos para el padding. Si no se indica, se lee de "
        ".claude/ms-context.json.",
    )
    args = parser.parse_args()

    root = repo_root()

    changes_dir_rel = args.changes_dir
    number_width = args.number_width

    if not changes_dir_rel or not number_width:
        framework = load_framework_defaults(root)
        if not changes_dir_rel:
            changes_dir_rel = framework.get("changesDir")
        if not number_width:
            number_width = framework.get("numberWidth")

    if not changes_dir_rel:
        raise SystemExit(
            "No se ha podido determinar 'changesDir' (ni por parametro ni desde "
            "ms-context.json)."
        )
    if not number_width:
        raise SystemExit(
            "No se ha podido determinar 'numberWidth' (ni por parametro ni desde "
            "ms-context.json)."
        )

    changes_dir = root / changes_dir_rel

    result = {}
    for state in STATES:
        number = max_number_in(changes_dir / state)
        result[state] = str(number).zfill(number_width) if number is not None else None

    json.dump(result, sys.stdout)
    print()


if __name__ == "__main__":
    main()
