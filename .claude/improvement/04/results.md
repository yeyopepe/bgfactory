# Punto 4 — Resultados de las pruebas

Cambio evaluado: reordenar `ms-status/SKILL.md` para que `collect_status.py` solo se ejecute en el modo `todo`, en vez de siempre como primer paso.

Procedimiento: ver `analysis.md` §1. Script reproducible: `scripts/measure_script_output.sh` (ejecuta los 11 scripts contra el estado real del repo, en modo seguro para los que mutan estado). Salidas completas capturadas en `data/raw_outputs/`.

Columna **Origen del dato**: los tamaños en caracteres son **medición directa** (stdout real de cada script contra el repo real, sin proxy). La conversión a tokens_est es **estimación** (proxy chars/4, misma limitación que el punto 2 — sin tokenizer real disponible en este entorno).

## Verificación de los 10 scripts sin problema

| Script | Salida | Caracteres | Tokens_est | Origen del dato |
|---|---|---:|---:|---|
| `check-context.py` | JSON de una línea | 80 | 20 | Medición directa (chars) / Estimación (tokens) |
| `get-max-change-codes.py` | JSON de una línea | 64 | 16 | Medición directa / Estimación |
| `next-change-number.py` | Un string | 6 | 2 | Medición directa / Estimación |
| `new-todo-code.py` | Un string | 6 | 2 | Medición directa / Estimación |
| `resolve-fast-folder.py` | Un string | 42 | 11 | Medición directa / Estimación |
| `sync-skill-models.py --dry-run` | Una línea de resumen | 64 | 16 | Medición directa / Estimación |
| `move-change.py` | Una ruta | 77 | 19 | Medición directa / Estimación |
| `ms_graph.py extract` (60 ficheros reales de `src/`) | Resumen + lista de 186 ids | 6.492 | 1.623 | Medición directa / Estimación — verificado como justificado, no waste (ver `analysis.md` §3) |
| `render_status.py` | Informe final en markdown | 1.313 | 328 | Medición directa / Estimación — es el resultado que se pide |
| `filter_status.py closed` (116 entradas reales) | Listado final en markdown | 34.310 | 8.578 | Medición directa / Estimación — es el resultado que se pide |

## Hallazgo y cambio: `collect_status.py`

`collect_status.py` (JSON completo, 34.343 caracteres / ~8.586 tokens_est con los datos reales de este repo — 1.133 líneas) se ejecutaba siempre como paso 1, pero solo el modo `todo` de `ms-status` usa su salida.

| Modo de `/ms-status` | Antes (scripts ejecutados y leídos) | Después | Δ caracteres | Δ tokens_est | Origen del dato |
|---|---|---|---:|---:|---|
| Informe general (sin argumentos) | `collect_status.py` (34.343) + `render_status.py` (1.313) = 35.656 | `render_status.py` (1.313) | ‑34.343 (‑96,3 %) | ‑8.586 | Medición directa (chars) / Estimación (tokens) |
| `<estado>` (p.ej. `closed`) | `collect_status.py` (34.343) + `filter_status.py closed` (34.310) = 68.653 | `filter_status.py closed` (34.310) | ‑34.343 (‑50,0 %) | ‑8.586 | Medición directa (chars) / Estimación (tokens) |
| `todo` | `collect_status.py` (34.343) | `collect_status.py` (34.343) — sin cambio, es el único modo que lo necesita | 0 | 0 | — |

El caso de mayor impacto es el informe general (`/ms-status` sin argumentos, el uso más habitual de la skill): pasa de leer 35.656 caracteres para producir un informe de 1.313, a leer directamente esos 1.313 — una reducción del 96,3 % en ese modo.

**Nota sobre representatividad:** estas cifras dependen del volumen de datos de `changes/` (116 entradas `closed` en este repo). En un repo con menos historial el ahorro absoluto sería menor, pero el porcentaje de desperdicio (~96% en el informe general) es estructural — viene de ejecutar un script cuya salida no se usa, no del tamaño de los datos — y se mantendría igual de alto independientemente del volumen.

## Propuestas del informe original — verificación

| Propuesta | Resultado | Origen del dato |
|---|---|---|
| Añadir flags de salida silenciosa/mínima a los scripts | No aplica: los scripts pequeños ya son mínimos (medido arriba), los grandes son el resultado pedido, no ruido | Medición directa de los 10 scripts sin problema |
| Redirigir salidas verbosas a fichero y mostrar solo resumen/exit code | Ya aplicado en `ms_graph.py extract` (skeleton completo a fichero, solo resumen + lista mínima por stdout); no se encontró ningún otro script grande que le faltara este patrón | Inspección directa del código fuente de los 11 scripts |

## Recomendaciones de uso

- **Si se añade un nuevo modo a `ms-status`** (o una nueva skill que reutilice `collect_status.py`/`filter_status.py`/`render_status.py`), decide primero si de verdad necesita el JSON completo de `collect_status.py` o si le basta con un script más específico — antes de conectarlo al paso 1 por comodidad. El propio patrón que causó este hallazgo (usar el script "genérico" porque ya estaba ahí, aunque el modo concreto no necesitara casi nada de su salida) es fácil de repetir sin querer.
- **Al depurar o extender `ms-status` manualmente**, recuerda que desde este cambio `collect_status.py` ya no se ejecuta por defecto: si necesitas ver el JSON completo de diagnóstico, ejecútalo explícitamente (`python .claude/skills/ms-status/scripts/collect_status.py`) en vez de asumir que ya se ha generado como parte del flujo normal.
