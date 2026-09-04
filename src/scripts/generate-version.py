#!/usr/bin/env python3
"""
Empaqueta una version OFICIAL entregable de BG Factory.

Flujo:
  1. Pide por consola la version oficial en formato x.y.z.
  2. Lanza build.py (que incrementa el contador interno de src/data/version.js
     y genera src/_output/versions/index-vXXXXX.html).
  3. Copia ese fichero recien generado.
  4. Sustituye en la copia la version interna por la oficial x.y.z,
     conservando el prefijo 'v' que espera el codigo: core/appTitle.js hace
     `v.${CURRENT_VERSION.slice(1)}`, es decir, descarta el primer caracter.
     Por eso CURRENT_VERSION debe seguir empezando por 'v' (-> 'v0.9.0'),
     para que el titulo quede 'v.0.9.0' y no 'v..9.0'.
       - <title>BG Factory v.XXXXX</title>   -> <title>BG Factory v.x.y.z</title>
       - const CURRENT_VERSION = 'vXXXXX';   -> const CURRENT_VERSION = 'vx.y.z';
  5. Guarda el resultado en
     src/_output/versions/official/vx.y.z/bgfactory-x.y.z.html
     (una subcarpeta por version oficial, donde tambien se deja el changelog).
  6. Copia junto al HTML los dos README del repo (README.md y README.es.md),
     para que formen parte del entregable oficial de esa version.

No requiere Node.js. Ejecutar desde cualquier sitio:
    python src/scripts/generate-version.py
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SRC_DIR = SCRIPT_DIR.parent
REPO_ROOT = SRC_DIR.parent
BUILD_SCRIPT = SCRIPT_DIR / 'build.py'
BUILD_OUTPUT_DIR = SRC_DIR / '_output' / 'versions'
OFFICIAL_DIR = SRC_DIR / '_output' / 'versions' / 'official'

# README del repo (dos idiomas) que se incluyen en cada version oficial.
README_FILES = ('README.md', 'README.es.md')

OFFICIAL_VERSION_PATTERN = re.compile(r'^\d+\.\d+\.\d+$')


def ask_official_version():
    while True:
        raw = input('Version oficial a empaquetar (formato x.y.z): ').strip()
        if OFFICIAL_VERSION_PATTERN.match(raw):
            return raw
        print(f"  '{raw}' no es un formato valido. Usa numeros: p.ej. 1.4.0")


def read_current_build_version():
    """Lee la CURRENT_VERSION actual (vNNNNN) de src/data/version.js."""
    version_js = SRC_DIR / 'data' / 'version.js'
    content = version_js.read_text(encoding='utf-8')
    m = re.search(r"CURRENT_VERSION\s*=\s*'(v\d+)'", content)
    if not m:
        raise SystemExit("src/data/version.js no tiene una CURRENT_VERSION con formato 'vNNNNN'.")
    return m.group(1)


def run_build():
    print('> Lanzando build.py ...')
    result = subprocess.run(
        [sys.executable, str(BUILD_SCRIPT)],
        capture_output=True,
        text=True,
    )
    sys.stdout.write(result.stdout)
    sys.stderr.write(result.stderr)
    if result.returncode != 0:
        raise SystemExit(f'build.py fallo con codigo {result.returncode}.')


def rewrite_version(html, build_version, official_version):
    """
    Sustituye la version interna del bundle por la oficial.

    build_version    -> 'v00236'  (lo que build.py acaba de escribir)
    official_version -> '0.9.0'   (lo que ha pedido el usuario)

    Se conserva el prefijo 'v' en CURRENT_VERSION porque appTitle.js hace
    CURRENT_VERSION.slice(1); asi el titulo queda 'v.0.9.0'.
    """
    build_digits = build_version[1:]  # '00236'
    official_v = f'v{official_version}'  # 'v0.9.0'

    replacements = [
        # <title>BG Factory v.00236</title>  ->  ... v.0.9.0
        (f'v.{build_digits}', f'v.{official_version}'),
        # const CURRENT_VERSION = 'v00236';  ->  'v0.9.0'
        (f"'{build_version}'", f"'{official_v}'"),
    ]

    for old, new in replacements:
        if old not in html:
            raise SystemExit(
                f"No se encontro el fragmento de version '{old}' en el bundle generado."
            )
        html = html.replace(old, new)

    return html


def main():
    official_version = ask_official_version()

    run_build()

    build_version = read_current_build_version()  # p.ej. 'v00236' (ya incrementada)
    built_file = BUILD_OUTPUT_DIR / f'index-{build_version}.html'
    if not built_file.is_file():
        raise SystemExit(f'No existe el fichero generado esperado: {built_file}')

    html = built_file.read_text(encoding='utf-8')
    html = rewrite_version(html, build_version, official_version)

    version_dir = OFFICIAL_DIR / f'v{official_version}'
    version_dir.mkdir(parents=True, exist_ok=True)
    out_path = version_dir / f'bgfactory-{official_version}.html'
    out_path.write_text(html, encoding='utf-8', newline='\n')

    copied_readmes = copy_readmes(version_dir)

    print(f'\nPaquete oficial generado en {out_path}')
    print(f'  (a partir del build interno {build_version})')
    for readme_path in copied_readmes:
        print(f'  README incluido: {readme_path}')


def copy_readmes(version_dir):
    """Copia los README del repo (dos idiomas) junto al HTML oficial."""
    copied = []
    for name in README_FILES:
        source = REPO_ROOT / name
        if not source.is_file():
            raise SystemExit(f'No se encontro el README esperado en la raiz del repo: {source}')
        dest = version_dir / name
        shutil.copyfile(source, dest)
        copied.append(dest)
    return copied


if __name__ == '__main__':
    main()
