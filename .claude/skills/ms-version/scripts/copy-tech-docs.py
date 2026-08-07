#!/usr/bin/env python3
"""Copia la documentacion tecnica vigente a una entrega (skill ms-version).

Copia, carpeta completa (todos sus ficheros, incluyendo su INDEX.md), cada
una de las rutas configuradas en framework.docs.tech.architectureDocDir y
framework.docs.tech.styleBibleDocDir de .claude/ms-context.json a
{workFolder}/versions/{xxxx}/docs/<nombre-de-la-carpeta>/. Las que no esten
configuradas se omiten sin error (igual que el resto del framework trata
estos dos campos opcionales).

Imprime UNICAMENTE un JSON en stdout con las carpetas copiadas, para que la
skill lo use al confirmar al usuario:

  {"copied": ["design/docs/architecture", "design/docs/style"], "skipped": []}

Uso:
  python copy-tech-docs.py --xxxx 00001
"""

import argparse
import json
import shutil
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
            "copiar documentacion tecnica."
        )

    context = json.loads(context_path.read_text(encoding="utf-8"))
    framework = context.get("framework")
    if not framework:
        raise SystemExit(
            f"{context_path} no tiene la seccion 'framework'. Ejecuta la skill "
            "ms-init para completarla."
        )
    return framework


def resolve_versions_dir(root: Path, work_folder_rel: str) -> Path:
    work_folder_rel = work_folder_rel or "/"
    work_root = root if work_folder_rel in ("/", "") else root / work_folder_rel
    return work_root / "versions"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xxxx", required=True, help="Codigo de la version que se esta preparando.")
    parser.add_argument(
        "--work-folder",
        help="Ruta a workFolder relativa a la raiz del repo. Si no se indica, "
        "se lee de .claude/ms-context.json (default '/').",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    root = repo_root()
    framework = load_framework(root)
    work_folder_rel = args.work_folder or framework.get("workFolder", "/")
    versions_dir = resolve_versions_dir(root, work_folder_rel)

    version_docs_dir = versions_dir / args.xxxx / "docs"
    if not version_docs_dir.is_dir():
        raise SystemExit(
            f"No existe {version_docs_dir}. Ejecuta primero init-version-folder.py "
            "para crear la carpeta de la version."
        )

    tech_docs = (framework.get("docs") or {}).get("tech") or {}
    candidates = {
        "architectureDocDir": tech_docs.get("architectureDocDir"),
        "styleBibleDocDir": tech_docs.get("styleBibleDocDir"),
    }

    copied: list[str] = []
    skipped: list[str] = []

    for field, doc_dir_rel in candidates.items():
        if not doc_dir_rel:
            skipped.append(field)
            continue

        source_dir = root / doc_dir_rel
        if not source_dir.is_dir():
            raise SystemExit(
                f"'{field}' apunta a {source_dir}, pero esa carpeta no existe."
            )

        dest_dir = version_docs_dir / source_dir.name
        if dest_dir.exists():
            shutil.rmtree(dest_dir)
        shutil.copytree(source_dir, dest_dir)
        copied.append(doc_dir_rel)

    json.dump({"copied": copied, "skipped": skipped}, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
