#!/usr/bin/env python3
"""Valida el estado de los dos ficheros de configuracion del framework ms-*.

El framework se apoya en dos ficheros (ver schema.json y context.schema.json,
en esta misma carpeta):

  1. .claude/ms-context.json -- puntero FIJO, siempre en la misma ruta,
     solo con el campo 'workFolder'. Existe para poder localizar el fichero
     2 sin depender de conocer workFolder de antemano.
  2. {workFolder}/framework/context.json -- fichero real de configuracion
     del proyecto (framework.*, project, skillModels).

'framework' ya no tiene ningun campo obligatorio propio en context.schema.json
salvo su propia presencia. Por tanto lo unico que determina si el framework
esta inicializado es que el puntero exista con 'workFolder' y que el fichero
de contenido exista con la seccion 'framework'.

No decide nada por si mismo (no crea ni completa ningun fichero) -- solo
determina que falta, para que ms-init sepa si debe preguntar el cuestionario
completo, solo lo que falta, o nada.

Imprime UNICAMENTE un JSON en stdout:

  {"pointerExists": true, "workFolder": "/", "contextPath": "framework/context.json",
   "contextExists": true, "hasFramework": true, "missingRequired": [], "complete": true}
  {"pointerExists": false, "workFolder": null, "contextPath": null,
   "contextExists": false, "hasFramework": false, "missingRequired": [], "complete": false}

Uso:
  python check-context.py
"""

import json
import sys
from pathlib import Path

ALWAYS_REQUIRED = ()


def repo_root() -> Path:
    # Este script vive en {repo}/.claude/skills/ms-init/scripts/
    return Path(__file__).resolve().parents[4]


def resolve_context_path(root: Path, work_folder_rel: str) -> Path:
    work_folder_rel = work_folder_rel or "/"
    work_root = root if work_folder_rel in ("/", "") else root / work_folder_rel
    return work_root / "framework" / "context.json"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()
    pointer_path = root / ".claude" / "ms-context.json"

    if not pointer_path.is_file():
        result = {
            "pointerExists": False,
            "workFolder": None,
            "contextPath": None,
            "contextExists": False,
            "hasFramework": False,
            "missingRequired": list(ALWAYS_REQUIRED),
            "complete": False,
        }
        json.dump(result, sys.stdout, ensure_ascii=False)
        print()
        return

    pointer = json.loads(pointer_path.read_text(encoding="utf-8"))
    work_folder = pointer.get("workFolder", "/")
    context_path = resolve_context_path(root, work_folder)

    if not context_path.is_file():
        result = {
            "pointerExists": True,
            "workFolder": work_folder,
            "contextPath": context_path.relative_to(root).as_posix(),
            "contextExists": False,
            "hasFramework": False,
            "missingRequired": list(ALWAYS_REQUIRED),
            "complete": False,
        }
        json.dump(result, sys.stdout, ensure_ascii=False)
        print()
        return

    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework") or {}
    has_framework = bool(context.get("framework"))

    missing = [field for field in ALWAYS_REQUIRED if field not in framework]

    result = {
        "pointerExists": True,
        "workFolder": work_folder,
        "contextPath": context_path.relative_to(root).as_posix(),
        "contextExists": True,
        "hasFramework": has_framework,
        "missingRequired": missing,
        # Sin campos obligatorios propios en 'framework' (todos tienen
        # default o son opcionales), "completo" significa que la seccion
        # 'framework' existe en el fichero de contenido.
        "complete": has_framework and not missing,
    }
    json.dump(result, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
