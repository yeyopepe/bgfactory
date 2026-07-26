#!/usr/bin/env python3
"""
Genera la version entregable ofuscada del prototipo.

1. Ejecuta build.py, que produce src/_output/versions/index-vXXXX.html
   (un unico fichero HTML autocontenido).
2. Extrae el bloque <script> con el bundle JS embebido por build.py.
3. Ofusca ese bundle con el javascript-obfuscator vendorizado en
   src/scripts/vendor/javascript-obfuscator.browser.js (via obfuscate_bundle.js)
   para dificultar la lectura del codigo fuente en el entregable.
4. Reinserta el bundle ofuscado en el HTML y escribe el resultado en
   src/_output/versions/index-vXXXX_editor.obf.html.

Requiere Node.js disponible en el PATH. No hace falta npm/npx ni conexion a
internet: el obfuscator esta vendorizado en el repo.
"""

import re
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SRC_DIR = SCRIPT_DIR.parent
BUILD_SCRIPT = SCRIPT_DIR / 'build.py'
OBFUSCATE_SCRIPT = SCRIPT_DIR / 'obfuscate_bundle.js'
VERSIONS_DIR = SRC_DIR / '_output' / 'versions'

BUNDLE_SCRIPT_PATTERN = re.compile(r'(<script>\n)(.*?)(\n {2}</script>\n</body>)', re.DOTALL)


def run_build():
    result = subprocess.run(
        [sys.executable, str(BUILD_SCRIPT)],
        cwd=str(SRC_DIR),
        capture_output=True,
        text=True,
    )
    print(result.stdout, end='')
    if result.returncode != 0:
        print(result.stderr, end='', file=sys.stderr)
        raise SystemExit(result.returncode)

    match = re.search(r'Build generado en (.+\.html)', result.stdout)
    if not match:
        raise SystemExit('No se pudo determinar el fichero generado por build.py.')
    return Path(match.group(1).strip())


def obfuscate_js(js_code):
    input_path = VERSIONS_DIR / '_bundle_tmp.js'
    output_path = VERSIONS_DIR / '_bundle_tmp.obf.js'
    input_path.write_text(js_code, encoding='utf-8')

    try:
        result = subprocess.run(
            ['node', str(OBFUSCATE_SCRIPT), str(input_path), str(output_path)],
            capture_output=True,
            text=True,
            shell=(sys.platform == 'win32'),
        )
        if result.returncode != 0:
            print(result.stdout, end='')
            print(result.stderr, end='', file=sys.stderr)
            raise SystemExit('javascript-obfuscator fallo al ofuscar el bundle.')

        return output_path.read_text(encoding='utf-8')
    finally:
        input_path.unlink(missing_ok=True)
        output_path.unlink(missing_ok=True)


def main():
    built_path = run_build()
    html = built_path.read_text(encoding='utf-8')

    match = BUNDLE_SCRIPT_PATTERN.search(html)
    if not match:
        raise SystemExit(f'No se encontro el bloque <script> del bundle en {built_path}.')

    bundle_js = match.group(2)
    obfuscated_js = obfuscate_js(bundle_js)

    obfuscated_html = html[:match.start()] + match.group(1) + obfuscated_js + match.group(3) + html[match.end():]

    output_path = built_path.with_name(built_path.stem + '_editor.obf.html')
    output_path.write_text(obfuscated_html, encoding='utf-8', newline='\n')

    print(f'Build ofuscado generado en {output_path}')


if __name__ == '__main__':
    main()
