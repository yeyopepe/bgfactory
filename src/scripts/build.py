#!/usr/bin/env python3
"""
Genera la version entregable del prototipo: un unico fichero HTML
autocontenido (JS, CSS, imagenes y fuentes incrustados) a partir de los
modulos ES separados en /src. No requiere Node.js.

1. Recorre el grafo de imports ES a partir de src/main.js.
2. Transforma cada modulo (quita import/export, los sustituye por un
   mini sistema require/module.exports en tiempo de ejecucion).
3. Incrusta como data URIs cualquier imagen/fuente referenciada desde
   src/styles/main.css (url(...)) o desde src/index.html (<img>, <link>,
   <source>), reescribiendo las referencias.
4. Concatena los modulos transformados + un runtime minimo + el CSS
   (ya con los assets incrustados) dentro de una copia de src/index.html.
5. Escribe el resultado en src/_output/versions/index-vXXXX.html, con XXXX
   el numero de CURRENT_VERSION en src/data/version.js.
"""

import base64
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SRC_DIR = SCRIPT_DIR.parent
VERSIONS_DIR = SRC_DIR / '_output' / 'versions'
ENTRY_MODULE = 'main.js'

MIME_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
}


def get_mime_type(extension):
    return MIME_TYPES.get(extension.lower(), 'application/octet-stream')


def to_data_uri(rel_asset_path):
    full_path = (SRC_DIR / rel_asset_path).resolve()
    if not full_path.is_file():
        return None

    data = full_path.read_bytes()
    b64 = base64.b64encode(data).decode('ascii')
    mime = get_mime_type(full_path.suffix)
    return f'data:{mime};base64,{b64}'


CSS_URL_PATTERN = re.compile(r'url\(\s*([\'"]?)((?!data:|https?://|//)[^\'")]+)\1\s*\)')


def embed_css_asset_urls(css_content, css_base_dir):
    def replace(m):
        path = m.group(2)
        rel_asset = f'{css_base_dir}/{path}' if css_base_dir else path
        data_uri = to_data_uri(rel_asset)
        if data_uri is None:
            return m.group(0)
        return f'url("{data_uri}")'

    return CSS_URL_PATTERN.sub(replace, css_content)


HTML_ASSET_PATTERN = re.compile(
    r'(<(?:img|link|source)\b[^>]*?\b(?:src|href)=")((?!data:|https?://|//|#)[^"]+)(")'
)


def embed_html_asset_refs(html_content):
    def replace(m):
        data_uri = to_data_uri(m.group(2))
        if data_uri is None:
            return m.group(0)
        return f'{m.group(1)}{data_uri}{m.group(3)}'

    return HTML_ASSET_PATTERN.sub(replace, html_content)


def resolve_module_path(current_rel_path, specifier):
    current_dir = str(Path(current_rel_path).parent)
    base_abs = SRC_DIR / current_dir if current_dir != '.' else SRC_DIR
    full_path = (base_abs / specifier).resolve()
    src_full = SRC_DIR.resolve()
    rel_path = str(full_path.relative_to(src_full))
    return rel_path.replace('\\', '/')


IMPORT_PATTERN = re.compile(r"""import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?""")
EXPORT_FUNCTION_PATTERN = re.compile(r'export\s+function\s+(\w+)')
EXPORT_CONST_PATTERN = re.compile(r'export\s+const\s+(\w+)')

order = []
visited = set()


def visit_module(rel_path):
    if rel_path in visited:
        return
    visited.add(rel_path)

    content = (SRC_DIR / rel_path).read_text(encoding='utf-8')
    for m in IMPORT_PATTERN.finditer(content):
        specifier = m.group(2)
        dep_rel_path = resolve_module_path(rel_path, specifier)
        visit_module(dep_rel_path)

    order.append(rel_path)


visit_module(ENTRY_MODULE)

# La version del entregable es un contador automatico e independiente de
# cualquier codigo de change/fix: build.py lee la CURRENT_VERSION actual de
# src/data/version.js, la incrementa en 1 y guarda el resultado ahi mismo,
# antes de empaquetar los modulos para que el bundle incruste ya el valor
# incrementado (data/version.js se lee como cualquier otro modulo mas abajo).
version_js_path = SRC_DIR / 'data' / 'version.js'
version_js_content = version_js_path.read_text(encoding='utf-8')
version_match = re.search(r"CURRENT_VERSION\s*=\s*'v(\d+)'", version_js_content)
if not version_match:
    raise SystemExit(
        "src/data/version.js no tiene una CURRENT_VERSION con formato 'vNNNN'."
    )
digits = len(version_match.group(1))
new_version_number = int(version_match.group(1)) + 1
version = str(new_version_number).zfill(digits)
version_js_content = version_js_content[:version_match.start(1)] + version + version_js_content[version_match.end(1):]
version_js_path.write_text(version_js_content, encoding='utf-8', newline='\n')

bundle_parts = []

for rel_path in order:
    content = (SRC_DIR / rel_path).read_text(encoding='utf-8')

    export_names = []

    def replace_export_function(m):
        export_names.append(m.group(1))
        return f'function {m.group(1)}'

    content = EXPORT_FUNCTION_PATTERN.sub(replace_export_function, content)

    def replace_export_const(m):
        export_names.append(m.group(1))
        return f'const {m.group(1)}'

    content = EXPORT_CONST_PATTERN.sub(replace_export_const, content)

    def replace_import(m, current_rel_path=rel_path):
        names = m.group(1)
        specifier = m.group(2)
        dep_rel_path = resolve_module_path(current_rel_path, specifier)
        return f"const {{ {names} }} = require('{dep_rel_path}');"

    content = IMPORT_PATTERN.sub(replace_import, content)

    export_assignments = '\n'.join(f'module.exports.{name} = {name};' for name in export_names)

    wrapped = f"""__modules['{rel_path}'] = function(module, exports, require) {{
{content}
{export_assignments}
}};"""
    bundle_parts.append(wrapped)

RUNTIME = """var __modules = {};
var __cache = {};
function require(path) {
  if (__cache[path]) { return __cache[path].exports; }
  var module = { exports: {} };
  __cache[path] = module;
  __modules[path](module, module.exports, require);
  return module.exports;
}"""

bundle_js = RUNTIME + '\n' + '\n'.join(bundle_parts) + f"\nrequire('{ENTRY_MODULE}');"

CSS_REL_PATH = 'styles/main.css'
css = (SRC_DIR / CSS_REL_PATH).read_text(encoding='utf-8')
css = embed_css_asset_urls(css, str(Path(CSS_REL_PATH).parent))

html = (SRC_DIR / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'\s*<link rel="stylesheet" href="styles/main.css" />', '', html)
html = re.sub(r'\s*<script type="module" src="main.js"></script>', '', html)
html = embed_html_asset_refs(html)
html = html.replace('</title>', f'</title>\n  <style>\n{css}\n  </style>')
html = html.replace('</body>', f'  <script>\n{bundle_js}\n  </script>\n</body>')
html = html.replace(' (dev)</title>', '</title>')

if '{VERSION}' not in html:
    raise SystemExit(
        "src/index.html no tiene el marcador '{VERSION}' en el <title>. "
        "Añadelo antes de generar el entregable."
    )
html = html.replace('{VERSION}', f'v.{version}')

VERSIONS_DIR.mkdir(parents=True, exist_ok=True)
output_path = VERSIONS_DIR / f'index-v{version}.html'
output_path.write_text(html, encoding='utf-8', newline='\n')

print(f'Build generado en {output_path}')
