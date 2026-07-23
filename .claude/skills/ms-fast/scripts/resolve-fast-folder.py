#!/usr/bin/env python3
"""Resuelve el nombre de carpeta para un cambio 'fast' de ms-fast.

Construye 'fast-{titulo-en-kebab-case}_{yyyyMMdd}' a partir de un titulo en
texto libre: pasa a minusculas, quita acentos/diacriticos, sustituye
cualquier caracter que no sea [a-z0-9] por guiones, colapsa guiones
repetidos y recorta los de los extremos. Si ya existe una carpeta con ese
nombre exacto bajo {changesDir}/implemented/ (dos cambios fast de titulo
parecido el mismo dia), anade un sufijo numerico ('-2', '-3'...) hasta que
no colisione.

changesDir se lee de .claude/ms-context.json (seccion framework) salvo que
se pase explicitamente por parametro.

Imprime UNICAMENTE el nombre de carpeta resuelto en stdout (p.ej.
"fast-corrige-texto-boton-guardar_20260723"), para poder capturarlo
directamente desde la skill sin parsear texto extra.

Uso:
  python resolve-fast-folder.py --title "Corrige texto botón Guardar"
  fast-corrige-texto-boton-guardar_20260723
"""

import argparse
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
DASH_COLLAPSE_RE = re.compile(r"-{2,}")


def repo_root() -> Path:
    # Este script vive en {repo}/.claude/skills/ms-fast/scripts/
    return Path(__file__).resolve().parents[4]


def load_changes_dir(root: Path, override: str | None) -> Path:
    if override:
        return root / override

    context_path = root / ".claude" / "ms-context.json"
    if not context_path.is_file():
        raise SystemExit(
            f"No se encuentra {context_path}. Ejecuta la skill ms-init antes de "
            "resolver una carpeta de cambio fast."
        )
    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework")
    if not framework or not framework.get("changesDir"):
        raise SystemExit(
            f"{context_path} no tiene 'framework.changesDir'. Ejecuta ms-init "
            "para completarlo."
        )
    return root / framework["changesDir"]


def slugify(title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title.lower())
    without_accents = "".join(c for c in normalized if not unicodedata.combining(c))
    slug = NON_ALNUM_RE.sub("-", without_accents)
    slug = DASH_COLLAPSE_RE.sub("-", slug).strip("-")
    return slug


def resolve_folder_name(implemented_dir: Path, title: str, day: date) -> str:
    slug = slugify(title)
    if not slug:
        raise SystemExit(f"El titulo '{title}' no produce ningun slug valido.")

    base_name = f"fast-{slug}_{day.strftime('%Y%m%d')}"

    if not implemented_dir.is_dir() or not (implemented_dir / base_name).exists():
        return base_name

    suffix = 2
    while (implemented_dir / f"{base_name}-{suffix}").exists():
        suffix += 1
    return f"{base_name}-{suffix}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", required=True, help="Nombre corto del cambio fast.")
    parser.add_argument(
        "--changes-dir",
        help="Ruta a {changesDir} relativa a la raiz del repo. Si no se indica, "
        "se lee de .claude/ms-context.json.",
    )
    parser.add_argument(
        "--date",
        help="Fecha a usar en formato YYYY-MM-DD (por defecto, hoy). Solo para "
        "pruebas o reconstrucciones puntuales.",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()
    changes_dir = load_changes_dir(root, args.changes_dir)
    implemented_dir = changes_dir / "implemented"

    day = date.fromisoformat(args.date) if args.date else date.today()

    print(resolve_folder_name(implemented_dir, args.title, day))


if __name__ == "__main__":
    main()
