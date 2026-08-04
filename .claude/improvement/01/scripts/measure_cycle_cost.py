#!/usr/bin/env python3
"""
Mide el coste (estimado, proxy chars/4) de un ciclo SDD completo
ms-new -> ms-how -> ms-do en este repo, distinguiendo:

  - Coste de los cuerpos de las SKILL.md implicadas (reutiliza el mismo
    proxy que .claude/improvement/02/scripts/measure_skills.py).
  - Coste de los documentos tecnicos compartidos (architectureDocPath,
    styleBibleDocPath, projectGraphPath) leidos por ms-internal-tech-analysis,
    con y sin el guard de cache de sesion (antes/despues del cambio de este
    punto).
  - Distribucion real de tamano de description.md/plan.md en cambios
    cerrados (changes/closed), para saber si esos documentos son un coste
    significativo frente a los docs tecnicos compartidos.

Uso:
    python .claude/improvement/01/scripts/measure_cycle_cost.py
"""
import glob
import json
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def tok_est(chars: int) -> int:
    return round(chars / 4)


def doc_size(path: str) -> int:
    p = ROOT / path
    return len(p.read_text(encoding="utf-8", errors="ignore")) if p.is_file() else 0


def main():
    context = json.loads((ROOT / ".claude/ms-context.json").read_text(encoding="utf-8"))
    docs_tech = context["framework"]["docs"]["tech"]

    arch = doc_size(docs_tech["architectureDocPath"])
    style = doc_size(docs_tech["styleBibleDocPath"])
    graph = doc_size(docs_tech["projectGraphPath"])
    tech_docs_total_chars = arch + style + graph

    print("== Documentos tecnicos compartidos (leidos por ms-internal-tech-analysis paso 1) ==")
    print(f"architectureDocPath: {arch:>8} chars ({tok_est(arch):>6} tokens_est)")
    print(f"styleBibleDocPath:   {style:>8} chars ({tok_est(style):>6} tokens_est)")
    print(f"projectGraphPath:    {graph:>8} chars ({tok_est(graph):>6} tokens_est)")
    print(f"TOTAL por lectura completa: {tech_docs_total_chars} chars ({tok_est(tech_docs_total_chars)} tokens_est)")
    print()

    # Invocaciones tipicas de ms-internal-tech-analysis en un ciclo completo
    # "implementar ya" (ms-new -> ms-how -> ms-do): una desde ms-new (paso 1,
    # "Fuente de la verdad"), otra desde ms-how (paso 3.4). Ver
    # .claude/improvement/02/analysis.md para el grafo de invocacion completo.
    invocations = 2
    before = tech_docs_total_chars * invocations
    after = tech_docs_total_chars * 1  # con el guard de cache de sesion de este punto
    print(f"== Coste en un ciclo completo ({invocations} invocaciones de ms-internal-tech-analysis) ==")
    print(f"Antes (sin cache de sesion): {before} chars ({tok_est(before)} tokens_est)")
    print(f"Despues (con cache de sesion, 1 lectura real): {after} chars ({tok_est(after)} tokens_est)")
    print(f"Ahorro: {before - after} chars ({tok_est(before) - tok_est(after)} tokens_est)")
    print()

    # description.md / plan.md reales en changes/closed
    desc_sizes = [len(open(f, encoding="utf-8", errors="ignore").read())
                  for f in glob.glob(str(ROOT / "changes/closed/*/description.md"))]
    plan_sizes = [len(open(f, encoding="utf-8", errors="ignore").read())
                  for f in glob.glob(str(ROOT / "changes/closed/*/plan.md"))]

    def stats(name, xs):
        print(f"{name}: n={len(xs)} min={min(xs)} max={max(xs)} media={statistics.mean(xs):.0f} "
              f"mediana={statistics.median(xs):.0f} (media tokens_est={tok_est(statistics.mean(xs))})")

    print("== description.md / plan.md reales en changes/closed (116 entradas) ==")
    stats("description.md (chars)", desc_sizes)
    stats("plan.md (chars)", plan_sizes)
    print()
    print("Nota: description.md lo lee ms-how en su paso 3.1 (necesario, es el alcance")
    print("funcional). plan.md lo lee ms-do en su paso 2 (necesario, son las")
    print("instrucciones de implementacion). ms-do NO relee description.md.")


if __name__ == "__main__":
    main()
