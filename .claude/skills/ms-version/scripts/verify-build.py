#!/usr/bin/env python3
"""Verifica el resultado de un build ejecutado por ms-version.

Tras ejecutar 'buildCommand' (que ya incrementa 'versionVariable' dentro de
'versionFilePath'), este script hace de forma determinista y gratis en
tokens las tres comprobaciones que si no habria que hacer a mano releyendo
ficheros:

  1. Relee 'versionVariable' en 'versionFilePath' para saber que version se
     genero.
  2. Resuelve 'buildOutputPath' sustituyendo '{version}' por ese valor y
     comprueba que el fichero existe.
  3. Si el fichero de salida es texto legible, comprueba que el valor de
     version aparece literalmente dentro (evita un build que se quedo con
     la version anterior "cacheada").

versionFilePath, versionVariable y buildOutputPath se leen de
.claude/ms-context.json (seccion framework) salvo que se pasen
explicitamente por parametro.

Imprime UNICAMENTE un JSON en stdout:

  {"version": "v00041", "outputPath": "src/_output/versions/index-v00041.html",
   "outputExists": true, "versionFoundInOutput": true}

Uso:
  python verify-build.py
"""

import argparse
import json
import re
import sys
from pathlib import Path


def repo_root() -> Path:
    # Este script vive en {repo}/.claude/skills/ms-version/scripts/
    return Path(__file__).resolve().parents[4]


def load_framework(root: Path) -> dict:
    context_path = root / ".claude" / "ms-context.json"
    if not context_path.is_file():
        raise SystemExit(
            f"No se encuentra {context_path}. Ejecuta la skill ms-init antes de "
            "verificar un build."
        )
    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework")
    if not framework:
        raise SystemExit(
            f"{context_path} no tiene la seccion 'framework'. Ejecuta ms-init "
            "para completarla."
        )
    return framework


def extract_version(version_file: Path, version_variable: str) -> str:
    if not version_file.is_file():
        raise SystemExit(f"No existe el fichero de version: {version_file}")

    text = version_file.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(version_variable) + r"\s*=\s*['\"]([^'\"]+)['\"]"
    )
    match = pattern.search(text)
    if not match:
        raise SystemExit(
            f"No se ha encontrado '{version_variable}' asignada con comillas en "
            f"{version_file}."
        )
    return match.group(1)


def check_output(output_path: Path, version: str) -> tuple[bool, bool | None]:
    exists = output_path.is_file()
    if not exists:
        return False, None

    try:
        content = output_path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return True, None

    return True, version in content


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--version-file",
        help="Ruta a versionFilePath relativa a la raiz del repo. Si no se "
        "indica, se lee de .claude/ms-context.json.",
    )
    parser.add_argument(
        "--version-variable",
        help="Nombre de versionVariable. Si no se indica, se lee de "
        ".claude/ms-context.json.",
    )
    parser.add_argument(
        "--build-output",
        help="Plantilla de buildOutputPath (con '{version}') relativa a la raiz "
        "del repo. Si no se indica, se lee de .claude/ms-context.json.",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()

    version_file_rel = args.version_file
    version_variable = args.version_variable
    build_output_rel = args.build_output

    if not version_file_rel or not version_variable or not build_output_rel:
        framework = load_framework(root)
        version_file_rel = version_file_rel or framework.get("versionFilePath")
        version_variable = version_variable or framework.get("versionVariable")
        build_output_rel = build_output_rel or framework.get("buildOutputPath")

    missing = [
        name
        for name, value in (
            ("versionFilePath", version_file_rel),
            ("versionVariable", version_variable),
            ("buildOutputPath", build_output_rel),
        )
        if not value
    ]
    if missing:
        raise SystemExit(
            "Faltan campos de versionado en .claude/ms-context.json (o por "
            f"parametro): {', '.join(missing)}. Ejecuta ms-init para completarlos."
        )

    version = extract_version(root / version_file_rel, version_variable)
    output_path = root / build_output_rel.replace("{version}", version)
    output_exists, version_found = check_output(output_path, version)

    result = {
        "version": version,
        "outputPath": str(output_path.relative_to(root)),
        "outputExists": output_exists,
        "versionFoundInOutput": version_found,
    }
    json.dump(result, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
