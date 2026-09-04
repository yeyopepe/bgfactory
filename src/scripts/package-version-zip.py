#!/usr/bin/env python3
"""
Empaqueta en un unico ZIP el contenido publicable de una version ya preparada
en previo-sdd/versions/<version>/.

El ZIP resultante se llama bgfactory_v<version>.zip y contiene:
  - changelog.md            (en la raiz del comprimido; OPCIONAL, se omite si no existe)
  - features.zip            (en la raiz; copiado de docs/features.zip)
  - los ficheros sueltos de files/*  (en la raiz)
  - la carpeta files/samples/ integra  (como samples/ dentro del comprimido)

El ZIP final se guarda en la propia carpeta previo-sdd/versions/<version>/.

No requiere Node.js. Ejecutar desde cualquier sitio:
    python src/scripts/package-version-zip.py <version>

Ejemplo:
    python src/scripts/package-version-zip.py 1.0b1
"""

import argparse
import sys
import zipfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SRC_DIR = SCRIPT_DIR.parent
REPO_ROOT = SRC_DIR.parent
VERSIONS_DIR = REPO_ROOT / 'previo-sdd' / 'versions'


def parse_args():
    parser = argparse.ArgumentParser(
        description='Empaqueta el contenido publicable de previo-sdd/versions/<version>/ en <version>.zip',
    )
    parser.add_argument(
        'version',
        help='Identificador de la version (nombre de la carpeta en previo-sdd/versions/), p.ej. 1.0b1',
    )
    return parser.parse_args()


def collect_entries(version_dir):
    """
    Devuelve una lista de (ruta_origen, nombre_en_zip).
    Los ficheros sueltos van a la raiz del zip; la carpeta files/samples/
    se replica integra bajo samples/.
    Aborta si falta alguno de los elementos obligatorios.
    """
    entries = []

    # changelog.md es opcional: una version sin cambios funcionales que registrar
    # no lo lleva. Si existe, se incluye en la raiz del zip; si no, se omite.
    changelog = version_dir / 'changelog.md'
    if changelog.is_file():
        entries.append((changelog, 'changelog.md'))

    features_zip = version_dir / 'docs' / 'features.zip'
    if not features_zip.is_file():
        raise SystemExit(f'No se encontro docs/features.zip: {features_zip}')
    entries.append((features_zip, 'features.zip'))

    files_dir = version_dir / 'files'
    if not files_dir.is_dir():
        raise SystemExit(f'No existe la carpeta files/: {files_dir}')
    file_children = sorted(p for p in files_dir.iterdir() if p.is_file())
    if not file_children:
        raise SystemExit(f'La carpeta files/ no tiene ningun fichero suelto: {files_dir}')
    for child in file_children:
        entries.append((child, child.name))

    # files/samples/ integra -> samples/ dentro del zip.
    samples_dir = files_dir / 'samples'
    if not samples_dir.is_dir():
        raise SystemExit(f'No existe la carpeta files/samples/: {samples_dir}')
    sample_files = sorted(p for p in samples_dir.rglob('*') if p.is_file())
    if not sample_files:
        raise SystemExit(f'La carpeta files/samples/ esta vacia: {samples_dir}')
    for sample in sample_files:
        arcname = Path('samples') / sample.relative_to(samples_dir)
        entries.append((sample, arcname.as_posix()))

    # Comprobacion de colisiones de nombre dentro del zip.
    seen = {}
    for source, arcname in entries:
        if arcname in seen:
            raise SystemExit(
                f"Colision de nombre en el zip: '{arcname}' "
                f"({seen[arcname]} y {source})"
            )
        seen[arcname] = source

    return entries


def main():
    args = parse_args()
    version = args.version

    version_dir = VERSIONS_DIR / version
    if not version_dir.is_dir():
        raise SystemExit(f'No existe la carpeta de version: {version_dir}')

    entries = collect_entries(version_dir)

    out_path = version_dir / f'bgfactory_v{version}.zip'
    # Si ya existe un zip previo con ese nombre, no lo metemos dentro de si mismo.
    if out_path.exists():
        out_path.unlink()

    with zipfile.ZipFile(out_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for source, arcname in entries:
            zf.write(source, arcname)

    print(f'ZIP generado en {out_path}')
    for _, arcname in entries:
        print(f'  incluido: {arcname}')


if __name__ == '__main__':
    main()
