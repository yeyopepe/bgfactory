# Punto 2 — Resultados de las pruebas

Cambio evaluado: recorte de la `description` de `ms-status` (commit `7a85dd6`), sin tocar cuerpo ni comportamiento.

Procedimiento: ver `analysis.md` §2. Snapshots crudos en `data/before.json` (estado del commit anterior a `7a85dd6`) y `data/after.json` (estado tras el cambio), generados con `scripts/measure_skills.py`.

Columna **Origen del dato**: indica si el valor es una **estimación** (proxy `chars/4`, sin tokenizer real disponible en este entorno — ver limitación en `analysis.md` §2.2) o una **medición directa** (conteo exacto, sin proxy).

## Métricas del cambio implementado

| Métrica | Antes | Después | Δ | Origen del dato | Método |
|---|---:|---:|---:|---|---|
| `description` de `ms-status` — caracteres | 1.085 | 626 | ‑459 (‑42,3 %) | Medición directa | `len(description)` sobre el frontmatter parseado |
| `description` de `ms-status` — tokens | 271 | 156 | ‑115 (‑42,4 %) | **Estimación** (proxy chars/4) | `scripts/measure_skills.py` |
| Impuesto fijo por tarea — suma `description` de las 11 skills `ms-*` | 1.478 | 1.363 | ‑115 (‑7,8 %) | **Estimación** (proxy chars/4) | `scripts/measure_skills.py`, campo `totals.description_tokens_est` |
| Cuerpo de `ms-status` (coste solo si se invoca) | 1.668 | 1.668 | 0 | **Estimación** (proxy chars/4) | Sin cambios — control de que el recorte no tocó el cuerpo |
| Gran total teórico (11 `SKILL.md` + todos sus auxiliares, si se invocaran todas) | 48.743 | 48.629 | ‑114 | **Estimación** (proxy chars/4) | `scripts/measure_skills.py`, campo `totals.grand_total_tokens_est` |

## Propuestas descartadas — verificación de que no requieren cambio

| Propuesta | Comprobación realizada | Resultado | Origen del dato |
|---|---|---|---|
| #1 — excluir skills internas del listado de enrutamiento | Tabla de comportamiento de `disable-model-invocation`/`user-invocable` contrastada contra la documentación oficial de Claude Code | No implementable con el frontmatter actual (ver `analysis.md` §4, fila 1) | Documentación oficial (`code.claude.com/docs/en/skills`), no estimación |
| #2 y #3 — evitar reinvocación de `ms-internal-workflow`/`ms-internal-tech-analysis` en un mismo ciclo | Comprobado que ninguna de las dos usa `$ARGUMENTS` en el cuerpo (contenido renderizado idéntico en cada invocación) + comportamiento de dedup documentado por Anthropic | Ya resuelto automáticamente por el harness dentro de una sesión continua; no requiere cambio | Documentación oficial + inspección directa del cuerpo de ambos `SKILL.md` (no estimación) |

## Dato de contexto — coste de un ciclo completo (no accionado en este punto)

Cálculo estático a partir de `metadata.uses` de cada `SKILL.md` (cadena `ms-new → ms-how → ms-do`, caso "implementar ya"). Relevante para el punto 8 del informe, incluido aquí porque surgió al medir "cuántas skills se usan realmente" (§0 del objetivo de este punto).

| Escenario | Tokens de cuerpo del ciclo completo | Origen del dato |
|---|---:|---|
| Sin deduplicación (p.ej. cada fase en una sesión distinta) | ~16.306 | **Estimación** (suma manual de `body_tokens_est` por skill según la cadena `metadata.uses`, proxy chars/4) |
| Con deduplicación del harness (ciclo completo en una sola sesión, comportamiento por defecto hoy) | ~13.097 | **Estimación** (mismo cálculo, descontando la 2ª invocación de `ms-internal-workflow` y `ms-internal-tech-analysis` según el comportamiento documentado) |

Ninguna de las dos cifras de esta última tabla ha sido medida en una ejecución real del ciclo (no se ha invocado `ms-new`/`ms-how`/`ms-do` en vivo para este punto) — quedan como estimación derivada del grafo estático, pendientes de contraste si se aborda el punto 8.
