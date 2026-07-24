#!/usr/bin/env python3
"""Valida .claude/ms-context.json contra los campos obligatorios de schema.json.

'changesDir' es el unico campo obligatorio de 'framework' (ver schema.json).

No decide nada por si mismo (no crea ni completa el fichero) -- solo
determina que campos obligatorios faltan, para que ms-init sepa si debe
preguntar el cuestionario completo, solo lo que falta, o nada.

Imprime UNICAMENTE un JSON en stdout:

  {"exists": true, "hasFramework": true, "missingRequired": [], "complete": true}
  {"exists": false, "hasFramework": false, "missingRequired": ["changesDir"], "complete": false}

Uso:
  python check-context.py
"""

import argparse
import json
import sys
from pathlib import Path

ALWAYS_REQUIRED = ("changesDir",)


def repo_root() -> Path:
    # Este script vive en {repo}/.claude/skills/ms-init/scripts/
    return Path(__file__).resolve().parents[4]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--context-path",
        help="Ruta a ms-context.json relativa a la raiz del repo. Por defecto "
        ".claude/ms-context.json.",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()
    context_path = root / (args.context_path or ".claude/ms-context.json")

    if not context_path.is_file():
        result = {
            "exists": False,
            "hasFramework": False,
            "missingRequired": list(ALWAYS_REQUIRED),
            "complete": False,
        }
        json.dump(result, sys.stdout, ensure_ascii=False)
        print()
        return

    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework") or {}

    missing = [field for field in ALWAYS_REQUIRED if field not in framework]

    result = {
        "exists": True,
        "hasFramework": bool(context.get("framework")),
        "missingRequired": missing,
        "complete": not missing,
    }
    json.dump(result, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
