#!/usr/bin/env python3
"""Helper for the ms-internal-graph skill: does the deterministic, structural half of
building graph.json (walking files, resolving imports, matching exported
function/class declarations, finding call sites) with plain regex + brace
counting -- no tree-sitter, no pip dependencies, stdlib only.

The one thing it deliberately does NOT do is invent "purpose" text for each
node, since that requires actually understanding the code. That's left to
whoever is calling this script (an LLM reading the file): `extract` produces
a skeleton with every node's purpose left for the caller to fill in, and
`build` merges a small {id: purpose} map back into that skeleton, so the
caller only ever has to emit that flat map instead of the full nodes/edges
JSON by hand.

Subcommands:
  extract   rutaBase -> skeleton JSON (nodes without "purpose", edges)
  build     skeleton + purposes map -> final graph.json (schema-valid)
  validate  graph.json -> structural check (dup ids, dangling edges, enums)
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_EXTENSIONS = ["js", "mjs", "cjs", "jsx", "ts", "tsx"]
DEFAULT_EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "out", "coverage"}
VALID_NODE_TYPES = {"file", "function", "class"}
VALID_RELATIONS = {"imports", "calls", "extends"}

IDENT = r"[A-Za-z_$][\w$]*"


# ---------------------------------------------------------------------------
# Masking: blank out comments and string/template contents (length-preserving)
# so brace counting and call-site regexes aren't confused by stray {, }, ( or
# ) characters that happen to appear inside a string or a template literal
# (e.g. the HTML template in editMode.js's buildForm). Quote/comment
# delimiters themselves are left untouched so positions stay meaningful.
# ---------------------------------------------------------------------------
def mask_source(text: str) -> str:
    out = list(text)
    i, n = 0, len(text)
    state = "normal"
    quote = ""
    while i < n:
        c = text[i]
        if state == "normal":
            if c == "/" and i + 1 < n and text[i + 1] == "/":
                state = "line_comment"
                i += 2
                continue
            if c == "/" and i + 1 < n and text[i + 1] == "*":
                state = "block_comment"
                i += 2
                continue
            if c in ("'", '"', "`"):
                state = "string"
                quote = c
                i += 1
                continue
            i += 1
            continue
        if state == "line_comment":
            if c == "\n":
                state = "normal"
            else:
                out[i] = " "
            i += 1
            continue
        if state == "block_comment":
            if c == "*" and i + 1 < n and text[i + 1] == "/":
                out[i] = " "
                out[i + 1] = " "
                state = "normal"
                i += 2
                continue
            if c != "\n":
                out[i] = " "
            i += 1
            continue
        if state == "string":
            if c == "\\" and i + 1 < n:
                out[i] = " "
                if text[i + 1] != "\n":
                    out[i + 1] = " "
                i += 2
                continue
            if c == quote:
                state = "normal"
                i += 1
                continue
            if c != "\n":
                out[i] = " "
            i += 1
            continue
    return "".join(out)


def find_matching_paren(masked: str, open_index: int) -> int:
    depth = 0
    i = open_index
    n = len(masked)
    while i < n:
        if masked[i] == "(":
            depth += 1
        elif masked[i] == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def find_matching_brace(masked: str, open_index: int) -> int:
    depth = 0
    i = open_index
    n = len(masked)
    while i < n:
        if masked[i] == "{":
            depth += 1
        elif masked[i] == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


_BARE_ARROW_PARAM_RE = re.compile(IDENT + r"\s*=>")


def find_next_brace_body(masked: str, from_index: int):
    """From from_index (positioned right at/before a parameter list or arrow
    param), find the next top-of-body '{' and return (body_open, body_close),
    or None if what follows isn't a brace-bodied block (e.g. an
    expression-bodied arrow, or a plain `export const x = 1;`)."""
    n = len(masked)

    def skip_ws(pos):
        while pos < n and masked[pos] in " \t\r\n":
            pos += 1
        return pos

    i = skip_ws(from_index)
    if masked[i : i + 5] == "async" and not (i + 5 < n and (masked[i + 5].isalnum() or masked[i + 5] in "_$")):
        i = skip_ws(i + 5)

    if i < n and masked[i] == "(":
        close_paren = find_matching_paren(masked, i)
        if close_paren == -1:
            return None
        i = skip_ws(close_paren + 1)
        if masked[i : i + 2] == "=>":
            i = skip_ws(i + 2)
    else:
        bare = _BARE_ARROW_PARAM_RE.match(masked, i)
        if bare:
            i = skip_ws(bare.end())

    if i < n and masked[i] == "{":
        close = find_matching_brace(masked, i)
        if close == -1:
            return None
        return i, close
    return None


@dataclass
class Decl:
    name: str
    kind: str  # "function" | "class" | "const"
    decl_start: int
    body_span: "tuple[int, int] | None"
    extends_name: "str | None" = None


@dataclass
class ImportBinding:
    local_name: str
    orig_name: str  # "*" for namespace, "default" for default import
    specifier: str


@dataclass
class FileInfo:
    rel_path: str
    text: str
    masked: str
    local_decls: dict = field(default_factory=dict)  # name -> Decl
    exported: dict = field(default_factory=dict)  # export_name -> Decl | None (None = plain data/const)
    imports: list = field(default_factory=list)  # list[ImportBinding], for call-site resolution
    import_specifiers: set = field(default_factory=set)  # every raw specifier seen, for "imports" edges
    resolved_import_files: set = field(default_factory=set)  # set[rel_path of other files]


# ---------------------------------------------------------------------------
# Per-file parsing (pass 1: no cross-file knowledge needed yet)
# ---------------------------------------------------------------------------
DECL_PATTERNS = [
    ("function", re.compile(r"\bfunction\s*\*?\s+(" + IDENT + r")\s*(?=\()")),
    ("class", re.compile(r"\bclass\s+(" + IDENT + r")(?:\s+extends\s+(" + IDENT + r"(?:\." + IDENT + r")*))?")),
    ("const", re.compile(r"\b(?:const|let|var)\s+(" + IDENT + r")\s*=")),
]

# Note: these end right at '(' (lookahead, not consumed) so
# find_next_brace_body -- which expects to start on the '(' itself -- can
# walk the parameter list with its own paren-depth counter.
EXPORT_FUNCTION_RE = re.compile(r"\bexport\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*(" + IDENT + r")?\s*(?=\()")
EXPORT_CLASS_RE = re.compile(
    r"\bexport\s+(?:default\s+)?class\s+(" + IDENT + r")?(?:\s+extends\s+(" + IDENT + r"(?:\." + IDENT + r")*))?"
)
EXPORT_CONST_RE = re.compile(r"\bexport\s+(?:const|let|var)\s+(" + IDENT + r")\s*=")
EXPORT_LIST_RE = re.compile(r"\bexport\s*\{([^}]*)\}\s*(?:from\s*['\"]([^'\"]+)['\"])?")
EXPORT_STAR_FROM_RE = re.compile(r"\bexport\s*\*\s*from\s*['\"]([^'\"]+)['\"]")

IMPORT_FROM_RE = re.compile(r"\bimport\s+(.+?)\s+from\s+['\"]([^'\"]+)['\"]")
IMPORT_SIDE_EFFECT_RE = re.compile(r"\bimport\s+['\"]([^'\"]+)['\"]")


def parse_local_decls(masked: str) -> dict:
    """Every top-level function/class/const declaration, exported or not --
    needed so `export { helper }` lists and same-file calls to non-exported
    helpers can be told apart from calls into other files."""
    decls = {}
    for kind, pattern in DECL_PATTERNS:
        for m in pattern.finditer(masked):
            name = m.group(1)
            if not name:
                continue
            if kind == "const":
                body = find_next_brace_body(masked, m.end())
                # only const-assigned-to-an-arrow-with-a-block-body behaves
                # like a function worth tracking calls into; a plain value
                # (`export const CURRENT_VERSION = '...'`) is just data.
                is_arrow_block = body is not None and "=>" in masked[m.end() : body[0]]
                if is_arrow_block:
                    decls[name] = Decl(name, "function", m.start(), body)
                else:
                    decls.setdefault(name, Decl(name, "const", m.start(), None))
                continue
            body = find_next_brace_body(masked, m.end())
            extends_name = m.group(2) if kind == "class" else None
            decls[name] = Decl(name, kind, m.start(), body, extends_name)
    return decls


def parse_exports(masked: str, local_decls: dict) -> dict:
    exported = {}

    for m in EXPORT_FUNCTION_RE.finditer(masked):
        name = m.group(1) or "default"
        decl = local_decls.get(m.group(1)) if m.group(1) else None
        if decl is None:
            body = find_next_brace_body(masked, m.end())
            decl = Decl(name, "function", m.start(), body)
        exported[name] = decl

    for m in EXPORT_CLASS_RE.finditer(masked):
        name = m.group(1) or "default"
        decl = local_decls.get(m.group(1)) if m.group(1) else None
        if decl is None:
            body = find_next_brace_body(masked, m.end())
            decl = Decl(name, "class", m.start(), body, m.group(2))
        exported[name] = decl

    for m in EXPORT_CONST_RE.finditer(masked):
        name = m.group(1)
        exported[name] = local_decls.get(name)  # Decl if arrow-block, else None (plain data)

    for m in EXPORT_LIST_RE.finditer(masked):
        names_part, from_specifier = m.group(1), m.group(2)
        for item in names_part.split(","):
            item = item.strip()
            if not item:
                continue
            if " as " in item:
                orig, exported_name = [p.strip() for p in item.split(" as ", 1)]
            else:
                orig = exported_name = item
            if from_specifier:
                # re-export from another file: no local Decl here, resolved
                # against that file's own exports in pass 2 (kept as a plain
                # name for now; if pass 2 can't resolve it it just stays data)
                exported[exported_name] = ("reexport", from_specifier, orig)
            else:
                exported[exported_name] = local_decls.get(orig)

    return exported


def parse_imports(text: str):
    bindings = []
    specifiers = set()
    for m in IMPORT_FROM_RE.finditer(text):
        clause, specifier = m.group(1).strip(), m.group(2)
        specifiers.add(specifier)
        # default + optional named: `a, { b, c }` / `a` / `* as ns` / `{ b, c }`
        default_part = clause
        named_part = None
        brace_match = re.search(r"\{([^}]*)\}", clause)
        if brace_match:
            named_part = brace_match.group(1)
            default_part = clause[: brace_match.start()].strip().rstrip(",").strip()
        star_match = re.match(r"\*\s+as\s+(" + IDENT + r")", default_part)
        if star_match:
            bindings.append(ImportBinding(star_match.group(1), "*", specifier))
            default_part = ""
        elif default_part:
            default_part = default_part.strip()
            if default_part:
                bindings.append(ImportBinding(default_part, "default", specifier))
        if named_part:
            for item in named_part.split(","):
                item = item.strip()
                if not item:
                    continue
                if " as " in item:
                    orig, local = [p.strip() for p in item.split(" as ", 1)]
                else:
                    orig = local = item
                bindings.append(ImportBinding(local, orig, specifier))
    for m in IMPORT_SIDE_EFFECT_RE.finditer(text):
        # side-effect-only import (`import './setup.js';`, no bindings) --
        # still worth an "imports" edge, just no symbols to resolve calls to.
        line_start = text.rfind("\n", 0, m.start()) + 1
        if "from" not in text[line_start : m.start()]:
            specifiers.add(m.group(1))
    return bindings, specifiers


def resolve_specifier(current_rel_path: str, specifier: str, all_rel_paths: set, extensions: list) -> "str | None":
    if not (specifier.startswith("./") or specifier.startswith("../")):
        return None  # external package / bare specifier / browser API -- not ours to graph
    current_dir = Path(current_rel_path).parent
    candidate = (current_dir / specifier).as_posix()
    candidate = candidate.replace("\\", "/")
    while candidate.startswith("./"):
        candidate = candidate[2:]
    # normalize ../ segments
    parts = []
    for part in candidate.split("/"):
        if part == "..":
            if parts:
                parts.pop()
        elif part not in ("", "."):
            parts.append(part)
    candidate = "/".join(parts)

    if candidate in all_rel_paths:
        return candidate
    if "." not in Path(candidate).name:
        for ext in extensions:
            if f"{candidate}.{ext}" in all_rel_paths:
                return f"{candidate}.{ext}"
        for ext in extensions:
            indexed = f"{candidate}/index.{ext}"
            if indexed in all_rel_paths:
                return indexed
    return None


def parse_file(rel_path: str, text: str) -> FileInfo:
    masked = mask_source(text)
    local_decls = parse_local_decls(masked)
    exported = parse_exports(masked, local_decls)
    # import specifiers live inside string literals, which mask_source blanks
    # out on purpose (see its docstring) -- parse those from the original text.
    imports, import_specifiers = parse_imports(text)
    return FileInfo(
        rel_path=rel_path,
        text=text,
        masked=masked,
        local_decls=local_decls,
        exported=exported,
        imports=imports,
        import_specifiers=import_specifiers,
    )


# ---------------------------------------------------------------------------
# Walking the tree
# ---------------------------------------------------------------------------
def collect_files(base: Path, extensions: list, exclude_dirs: set) -> "list[tuple[str, Path]]":
    exts = {e.lstrip(".").lower() for e in extensions}
    results = []
    for path in sorted(base.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lstrip(".").lower() not in exts:
            continue
        rel_parts = path.relative_to(base).parts
        if any(part in exclude_dirs for part in rel_parts[:-1]):
            continue
        rel_path = path.relative_to(base).as_posix()
        results.append((rel_path, path))
    return results


# ---------------------------------------------------------------------------
# Pass 2: cross-file resolution (imports -> node ids, call-site scanning)
# ---------------------------------------------------------------------------
def call_targets_in_span(masked_span: str, symbol_map: dict) -> set:
    found = set()
    for m in re.finditer(IDENT + r"\s*\(", masked_span):
        name = m.group(0)
        name = name[: name.index("(")].strip()
        if name in symbol_map:
            found.add(symbol_map[name])
    return found


def build_skeleton(base: Path, extensions: list, exclude_dirs: set) -> dict:
    files_on_disk = collect_files(base, extensions, exclude_dirs)
    all_rel_paths = {rel for rel, _ in files_on_disk}
    file_infos: "dict[str, FileInfo]" = {}
    for rel_path, abs_path in files_on_disk:
        text = abs_path.read_text(encoding="utf-8", errors="replace")
        file_infos[rel_path] = parse_file(rel_path, text)

    # resolve import specifiers to project files
    for info in file_infos.values():
        for specifier in info.import_specifiers:
            target_rel = resolve_specifier(info.rel_path, specifier, all_rel_paths, extensions)
            if target_rel:
                info.resolved_import_files.add(target_rel)

    # resolve `export { x } from '...'` re-exports against the source file's own exports
    for info in file_infos.values():
        for name, value in list(info.exported.items()):
            if isinstance(value, tuple) and value[0] == "reexport":
                _, specifier, orig = value
                target_rel = resolve_specifier(info.rel_path, specifier, all_rel_paths, extensions)
                resolved_decl = None
                if target_rel and target_rel in file_infos:
                    resolved_decl = file_infos[target_rel].exported.get(orig)
                    if isinstance(resolved_decl, tuple):
                        resolved_decl = None  # don't chase re-export chains further
                info.exported[name] = resolved_decl

    # global map: exported function/class node id, keyed by (file, exported_name)
    def node_id_for(rel_path: str, name: str) -> str:
        return f"{rel_path}#{name}"

    nodes = []
    edges = set()

    for rel_path, info in sorted(file_infos.items()):
        export_names = sorted(info.exported.keys())
        file_node = {"id": rel_path, "type": "file", "path": rel_path}
        if export_names:
            file_node["exports"] = export_names
        nodes.append(file_node)

    for rel_path, info in sorted(file_infos.items()):
        # local symbol table for call resolution inside this file
        symbol_map = {}
        for name, decl in info.exported.items():
            if isinstance(decl, Decl) and decl.kind in ("function", "class"):
                symbol_map[name] = node_id_for(rel_path, name)
        for binding in info.imports:
            if binding.orig_name in ("*",):
                continue  # namespace member calls (ns.fn()) aren't resolved
            target_rel = resolve_specifier(rel_path, binding.specifier, all_rel_paths, extensions)
            if not target_rel or target_rel not in file_infos:
                continue
            target_decl = file_infos[target_rel].exported.get(binding.orig_name)
            if isinstance(target_decl, Decl) and target_decl.kind in ("function", "class"):
                symbol_map[binding.local_name] = node_id_for(target_rel, binding.orig_name)

        occupied_spans = []
        for name, decl in sorted(info.exported.items()):
            if not isinstance(decl, Decl) or decl.kind not in ("function", "class"):
                continue
            this_id = node_id_for(rel_path, name)
            node = {"id": this_id, "type": decl.kind, "path": rel_path, "parent": rel_path}
            nodes.append(node)
            if decl.body_span:
                occupied_spans.append((decl.decl_start, decl.body_span[1]))
                span_text = info.masked[decl.body_span[0] : decl.body_span[1]]
                local_map = {k: v for k, v in symbol_map.items() if v != this_id}
                for target in call_targets_in_span(span_text, local_map):
                    edges.add((this_id, target, "calls"))
            if decl.kind == "class" and decl.extends_name:
                base_name = decl.extends_name.split(".")[0]
                target = symbol_map.get(base_name)
                if target:
                    edges.add((this_id, target, "extends"))

        # file-level (module top-of-scope) calls: mask out every declaration
        # span so only bootstrap-time statements remain, then scan those --
        # this is what catches main.js wiring on/renderX() calls at load time.
        top_level = list(info.masked)
        for decl in info.local_decls.values():
            if decl.body_span:
                for i in range(decl.decl_start, decl.body_span[1]):
                    if i < len(top_level):
                        top_level[i] = " "
        top_level_text = "".join(top_level)
        for target in call_targets_in_span(top_level_text, symbol_map):
            edges.add((rel_path, target, "calls"))

        for target_rel in sorted(info.resolved_import_files):
            edges.add((rel_path, target_rel, "imports"))

    edges_list = [{"source": s, "target": t, "relation": r} for s, t, r in sorted(edges, key=lambda e: (e[2], e[0], e[1]))]
    return {"basePath": None, "nodes": nodes, "edges": edges_list}


# ---------------------------------------------------------------------------
# Validation (shared by `build` and standalone `validate`)
# ---------------------------------------------------------------------------
def validate_graph(graph: dict) -> list:
    problems = []
    for key in ("generatedAt", "basePath", "nodes", "edges"):
        if key not in graph:
            problems.append(f"falta el campo obligatorio de nivel superior '{key}'")
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    ids = [n.get("id") for n in nodes]
    seen = set()
    for node_id in ids:
        if node_id in seen:
            problems.append(f"id de nodo duplicado: {node_id}")
        seen.add(node_id)

    for n in nodes:
        for req in ("id", "type", "path", "purpose"):
            if not n.get(req):
                problems.append(f"nodo {n.get('id', '<sin id>')}: falta o está vacío el campo '{req}'")
        if n.get("type") not in VALID_NODE_TYPES:
            problems.append(f"nodo {n.get('id')}: type inválido '{n.get('type')}'")

    id_set = set(seen)
    for e in edges:
        for req in ("source", "target", "relation"):
            if not e.get(req):
                problems.append(f"edge {e}: falta el campo '{req}'")
        if e.get("source") not in id_set:
            problems.append(f"edge con source desconocido: {e}")
        if e.get("target") not in id_set:
            problems.append(f"edge con target desconocido: {e}")
        if e.get("relation") not in VALID_RELATIONS:
            problems.append(f"edge {e}: relation inválida '{e.get('relation')}'")

    return problems


def summarize(graph: dict) -> str:
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    by_type = {}
    for n in nodes:
        by_type[n.get("type")] = by_type.get(n.get("type"), 0) + 1
    by_relation = {}
    for e in edges:
        by_relation[e.get("relation")] = by_relation.get(e.get("relation"), 0) + 1
    lines = [f"nodes: {len(nodes)} ({', '.join(f'{k}={v}' for k, v in sorted(by_type.items()))})"]
    lines.append(f"edges: {len(edges)} ({', '.join(f'{k}={v}' for k, v in sorted(by_relation.items()))})")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def cmd_extract(args):
    base = Path(args.base).resolve()
    if not base.is_dir():
        print(f"error: rutaBase no existe o no es una carpeta: {base}", file=sys.stderr)
        return 1
    extensions = [e.strip() for e in args.ext.split(",") if e.strip()]
    exclude_dirs = set(DEFAULT_EXCLUDE_DIRS)
    if args.exclude:
        exclude_dirs |= {e.strip() for e in args.exclude.split(",") if e.strip()}

    skeleton = build_skeleton(base, extensions, exclude_dirs)
    skeleton["basePath"] = args.base

    out_path = Path(args.out) if args.out else Path(sys.path[0]) / "graph.skeleton.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(skeleton, indent=2, ensure_ascii=False), encoding="utf-8")

    needing_purpose = [n["id"] for n in skeleton["nodes"]]
    print(summarize({"nodes": skeleton["nodes"], "edges": skeleton["edges"]}))
    print(f"skeleton escrito en: {out_path}")
    print(f"nodos que necesitan 'purpose' ({len(needing_purpose)}):")
    for node_id in needing_purpose:
        print(f"  {node_id}")
    return 0


def cmd_build(args):
    skeleton = json.loads(Path(args.skeleton).read_text(encoding="utf-8"))
    if args.purposes == "-":
        purposes = json.loads(sys.stdin.read())
    else:
        purposes = json.loads(Path(args.purposes).read_text(encoding="utf-8"))

    missing = [n["id"] for n in skeleton["nodes"] if not purposes.get(n["id"])]
    if missing:
        print("error: faltan 'purpose' para estos nodos:", file=sys.stderr)
        for node_id in missing:
            print(f"  {node_id}", file=sys.stderr)
        return 1

    nodes = []
    for n in skeleton["nodes"]:
        node = dict(n)
        node["purpose"] = purposes[n["id"]]
        nodes.append(node)

    graph = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "basePath": skeleton["basePath"],
        "nodes": nodes,
        "edges": skeleton["edges"],
    }

    problems = validate_graph(graph)
    if problems:
        print("error: el grafo no pasa la validación:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(summarize(graph))
    print(f"graph.json escrito en: {out_path}")
    return 0


def cmd_validate(args):
    graph = json.loads(Path(args.graph).read_text(encoding="utf-8"))
    problems = validate_graph(graph)
    print(summarize(graph))
    if problems:
        print(f"{len(problems)} problema(s):")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("OK: el grafo es estructuralmente válido.")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    p_extract = sub.add_parser("extract", help="Recorre rutaBase y escribe un skeleton (nodes/edges sin 'purpose').")
    p_extract.add_argument("--base", required=True, help="Ruta base del código a recorrer")
    p_extract.add_argument("--out", required=True, help="Ruta donde escribir el skeleton JSON")
    p_extract.add_argument("--ext", default=",".join(DEFAULT_EXTENSIONS), help="Extensiones a incluir, separadas por comas")
    p_extract.add_argument("--exclude", default="", help="Carpetas adicionales a excluir, separadas por comas")
    p_extract.set_defaults(func=cmd_extract)

    p_build = sub.add_parser("build", help="Fusiona un mapa {id: purpose} en el skeleton y escribe el graph.json final.")
    p_build.add_argument("--skeleton", required=True, help="Ruta del skeleton JSON generado por extract")
    p_build.add_argument("--purposes", required=True, help="Ruta a un JSON {id: purpose}, o '-' para leerlo de stdin")
    p_build.add_argument("--out", required=True, help="Ruta del graph.json final")
    p_build.set_defaults(func=cmd_build)

    p_validate = sub.add_parser("validate", help="Comprueba que un graph.json es estructuralmente válido.")
    p_validate.add_argument("--graph", required=True, help="Ruta del graph.json a comprobar")
    p_validate.set_defaults(func=cmd_validate)

    args = parser.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
