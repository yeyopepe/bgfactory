# Punto 3 — Resultados de las pruebas

Cambios evaluados: (1) `ms-fast` redirige a `ms-fix` o `ms-new` según corresponda al escalar (antes siempre `ms-new`); (2) corrección de 5 referencias obsoletas a nombres de skills que ya no existen (`ms-change`→`ms-new`, `ms-initialize`→`ms-init`).

Procedimiento: ver `analysis.md` §1. Script reproducible: `scripts/description_overlap.py`. Salida cruda en `data/description_overlap_output.txt`.

Columna **Origen del dato**: **medición directa** para el índice de Jaccard (cálculo determinista sobre texto); **estimación cualitativa** para la simulación de peticiones (juicio razonado, no ejecución en vivo del enrutador).

## Solapamiento léxico — top pares

| Skill A | Skill B | Jaccard | ¿Riesgo real de ambigüedad? | Origen del dato |
|---|---|---:|---|---|
| `ms-do` | `ms-how` | 0.20 | No — secuenciales | Medición directa |
| `ms-fix` | `ms-new` | 0.19 | **Sí** | Medición directa |
| `ms-fast` | `ms-internal-tech-analysis` | 0.14 | No — la 2ª no es invocable por el usuario | Medición directa |
| `ms-fix` | `ms-how` | 0.13 | No — secuenciales | Medición directa |
| `ms-new` | `ms-todo` | 0.12 | Bajo — trigger de `ms-todo` suficientemente específico | Medición directa |
| `ms-fast` | `ms-fix` | 0.10 | **Sí** | Medición directa |

Tabla completa (55 pares) en `data/description_overlap_output.txt`.

## Simulación de 9 peticiones típicas

| # | Petición | Skills plausibles | ¿Ambigüedad real? | Origen del dato |
|---|---|---|---|---|
| 1 | Bug real de modal al arrastrar (`changes/closed/00004`) | `ms-fix` | No | Estimación cualitativa (prompt real) |
| 2 | "arregla el typo del botón 'Guradar'" | `ms-fast`, `ms-fix` | **Sí** | Estimación cualitativa |
| 3 | "apúntalo para más adelante" (exportar a PDF) | `ms-todo` (fuerte), `ms-new` (débil) | Baja | Estimación cualitativa |
| 4 | Nuevo elemento "dado" (`changes/closed/00020`) | `ms-new` | No | Estimación cualitativa (prompt real) |
| 5 | "cambia el color del panel lateral" | `ms-fast` (fuerte), `ms-new` (débil) | Baja | Estimación cualitativa |
| 6 | "¿cuántos cambios quedan pendientes?" | `ms-status` | No | Estimación cualitativa |
| 7 | "impleméntalo ya" (con `plan.md` recién escrito) | `ms-do` | No | Estimación cualitativa |
| 8 | "configura el framework en este repo" | `ms-init` | No | Estimación cualitativa |
| 9 | "actualiza el grafo de dependencias" | `ms-internal-graph` (fuerte), `ms-do` (débil) | Baja | Estimación cualitativa |

**Resultado agregado: 2 de 9 peticiones (22%) con ambigüedad real** (#2 principalmente) — el resto resuelve a una única skill o tiene un desempate claro por frase de disparo explícita.

## Hallazgos y cambios

| Hallazgo | Cambio aplicado | Origen del dato |
|---|---|---|
| `ms-fast` escalaba siempre a `ms-new`, incluso cuando lo no-trivial era un bug | Paso 2 ahora invoca `ms-fix` o `ms-new` según el caso; `description` y `metadata.uses` actualizados | Inspección directa del código (surgido de la simulación #2) |
| 5 referencias a nombres de skill obsoletos (`ms-change`, `ms-initialize`) en `ms-fix/SKILL.md` y `ms-init/schema.json` | Corregidas a los nombres reales (`ms-new`, `ms-init`) | Inspección directa (grep de verificación tras el hallazgo anterior) |

## Propuestas del informe original — verificación

| Propuesta | Resultado | Origen del dato |
|---|---|---|
| Diferenciar descripciones con casos de uso concretos y mutuamente excluyentes | Aplicado donde había ambigüedad real (`ms-fast`↔`ms-fix`/`ms-new`) | — |
| Fusionar skills redundantes con sub-modos si el solapamiento es sistemático | No aplica — no hay solapamiento sistemático (los pares de mayor Jaccard son secuenciales o involucran una skill no invocable por el usuario) | Medición directa (tabla de arriba) |

## Recomendaciones de uso

- **Al renombrar una skill en el futuro, buscar todas sus referencias en el resto del framework antes de darlo por terminado** — este punto encontró referencias obsoletas de un renombrado (`ms-change`→`ms-new`, `ms-initialize`→`ms-init`) que llevaban tiempo sin corregirse, escondidas dentro de prosa (no solo en `metadata.uses`, que sí se mantiene a mano). Un grep del nombre antiguo sobre `.claude/skills/` es suficiente y barato — hacerlo como último paso de cualquier renombrado futuro.
- **Si se añade una nueva skill de aplicación rápida (al estilo `ms-fast`) en el futuro**, aplicar el mismo patrón de escalado consciente del tipo de entrada (bug → `ms-fix`, resto → `ms-new`) desde el principio, en vez de asumir un único destino de escalado.
- **Los pares con alto solapamiento léxico entre skills secuenciales de la misma cadena (`ms-new`→`ms-how`→`ms-do`) son esperables y no requieren acción** — vienen de que cada una nombra a la siguiente en su propia description, información útil para el usuario, no ambigüedad de enrutamiento.
