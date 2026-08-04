#!/usr/bin/env python3
"""
Mide el tamano (en caracteres y en tokens estimados) de cada SKILL.md del
framework ms-* y de sus ficheros auxiliares (templates, schemas, scripts).

Uso:
    python .claude/improvement/02/scripts/measure_skills.py [--skills-dir DIR] [--json OUT.json]

Sirve como procedimiento repetible para comparar "antes/despues" de un
cambio en las skills (punto 2 de la auditoria de tokens): se ejecuta antes
de tocar nada, se guarda la salida, se aplica el cambio, se vuelve a
ejecutar y se comparan los totales.

IMPORTANTE - naturaleza de la metrica:
Los "tokens_est" de este script son una ESTIMACION (proxy chars/4), no un
recuento real del tokenizer de Anthropic/Claude. En este entorno no hay
acceso de red al tokenizer real (proxy de salida bloquea la descarga de
encodings), asi que se usa esta heuristica estandar como aproximacion
consistente para comparaciones relativas entre skills y entre versiones
de la misma skill. No tomar los valores absolutos como tokens reales de
la API de Anthropic.
"""
import argparse
import glob
import json
import os
import re
import sys


def tok_est(text: str) -> int:
    """Proxy sin tokenizer real: heuristica chars/4 para texto tecnico ES/EN
    con markdown/code. Ver nota de cabecera sobre su naturaleza de estimacion."""
    return round(len(text) / 4)


def parse_frontmatter(raw: str):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.DOTALL)
    if not m:
        return "", raw
    fm_raw, body = m.group(1), m.group(2)
    desc_m = re.search(r"^description:\s?(.*)$", fm_raw, re.MULTILINE)
    description = desc_m.group(1) if desc_m else ""
    return description, body


def measure_skill(skill_dir: str):
    skill_name = os.path.basename(skill_dir.rstrip("/"))
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.exists(skill_md):
        return None

    raw = open(skill_md, encoding="utf-8").read()
    description, body = parse_frontmatter(raw)

    aux_detail = []
    for f in glob.glob(os.path.join(skill_dir, "**", "*"), recursive=True):
        if os.path.isfile(f) and os.path.basename(f) != "SKILL.md":
            content = open(f, encoding="utf-8", errors="ignore").read()
            aux_detail.append({
                "file": os.path.relpath(f, skill_dir),
                "tokens_est": tok_est(content),
                # los .py bajo scripts/ normalmente se EJECUTAN (Bash), no se
                # leen -> no cuentan como coste de contexto salvo que el
                # SKILL.md instruya explicitamente a leerlos (ver analysis.md)
                "kind": "script" if f.endswith(".py") else "data/template",
            })

    return {
        "skill": skill_name,
        "description_chars": len(description),
        "description_tokens_est": tok_est(description),
        "body_tokens_est": tok_est(body),
        "full_skillmd_tokens_est": tok_est(raw),
        "aux_files_tokens_est": sum(a["tokens_est"] for a in aux_detail),
        "aux_files_count": len(aux_detail),
        "aux_detail": aux_detail,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skills-dir", default=".claude/skills",
                     help="Carpeta con las skills ms-* (default: .claude/skills)")
    ap.add_argument("--json", default=None, help="Ruta opcional para volcar el detalle en JSON")
    args = ap.parse_args()

    if not os.path.isdir(args.skills_dir):
        print(f"No existe la carpeta de skills: {args.skills_dir}", file=sys.stderr)
        sys.exit(1)

    skill_dirs = sorted(
        os.path.join(args.skills_dir, d)
        for d in os.listdir(args.skills_dir)
        if os.path.isdir(os.path.join(args.skills_dir, d))
    )

    results = [r for r in (measure_skill(d) for d in skill_dirs) if r]
    results.sort(key=lambda r: -r["full_skillmd_tokens_est"])

    total_desc = sum(r["description_tokens_est"] for r in results)
    total_full = sum(r["full_skillmd_tokens_est"] for r in results)
    total_aux = sum(r["aux_files_tokens_est"] for r in results)

    print(f"{'skill':28s} {'desc_tok':>9s} {'body_tok':>9s} {'skillmd_tok':>12s} {'aux_tok':>9s} {'#aux':>5s}")
    for r in results:
        print(f"{r['skill']:28s} {r['description_tokens_est']:9d} {r['body_tokens_est']:9d} "
              f"{r['full_skillmd_tokens_est']:12d} {r['aux_files_tokens_est']:9d} {r['aux_files_count']:5d}")

    print()
    print(f"TOTAL descripciones (impuesto fijo por tarea, todas las skills): {total_desc} tokens_est")
    print(f"TOTAL cuerpos SKILL.md (coste adicional solo si se invocan):    {total_full - total_desc} tokens_est")
    print(f"TOTAL ficheros auxiliares (coste solo si se leen, ver kind):    {total_aux} tokens_est")
    print(f"GRAN TOTAL (11 skills + todos sus aux, cota superior teorica):  {total_full + total_aux} tokens_est")

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({
                "results": results,
                "totals": {
                    "description_tokens_est": total_desc,
                    "body_tokens_est": total_full - total_desc,
                    "aux_tokens_est": total_aux,
                    "grand_total_tokens_est": total_full + total_aux,
                },
            }, f, indent=2, ensure_ascii=False)
        print(f"\nDetalle volcado en {args.json}")


if __name__ == "__main__":
    main()
