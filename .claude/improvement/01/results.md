# Punto 1 — Resultados de las pruebas

Cambio evaluado: añadir a `ms-internal-tech-analysis/SKILL.md` (paso 1) un guard de caché de sesión para los tres documentos técnicos compartidos, igual al que ya tenía su paso 0 para `ms-context.json`.

Procedimiento: ver `analysis.md` §1. Script reproducible: `scripts/measure_cycle_cost.py`. Salida cruda capturada en `data/cycle_cost_output.txt`.

Columna **Origen del dato**: **medición directa** para tamaños de fichero reales; **estimación** para la conversión a tokens (proxy chars/4, sin tokenizer real disponible en este entorno) y para el número de invocaciones por ciclo (derivado del grafo estático `metadata.uses` del punto 2, no de una ejecución en vivo).

## Documentos técnicos compartidos (los que causan el hallazgo)

| Documento | Caracteres | Tokens_est | Origen del dato |
|---|---:|---:|---|
| `design/docs/ARCHITECTURE.md` | 112.633 | 28.158 | Medición directa (chars) / Estimación (tokens) |
| `src/_graph/graph.json` | 90.633 | 22.658 | Medición directa / Estimación |
| `design/docs/stylebible/STYLE_BIBLE.md` | 53.343 | 13.336 | Medición directa / Estimación |
| **Total por lectura completa** | **256.609** | **64.152** | Medición directa / Estimación |

## Coste del ciclo completo `ms-new → ms-how → ms-do`, antes/después

| Métrica | Antes | Después | Δ | Origen del dato |
|---|---:|---:|---:|---|
| Lecturas de documentos técnicos compartidos (2 invocaciones de `ms-internal-tech-analysis`/ciclo) | 513.218 chars (~128.304 tokens_est) | 256.609 chars (~64.152 tokens_est, 1 lectura real) | ‑256.609 chars (‑50 %, ‑64.152 tokens_est) | Medición directa (tamaño de fichero) + Estimación (nº invocaciones, tokens) |
| Cuerpos de `SKILL.md` del ciclo (`ms-new`+`ms-how`+`ms-do`+internas) | ~13.097–16.306 tokens_est | Sin cambio en este punto (ver `.claude/improvement/02/`) | 0 | Estimación (ya documentada en el punto 2) |
| `description.md` de la entrada (media real, 116 muestras) | 4.602 chars (~1.151 tokens_est), 1 lectura/ciclo | Sin cambio — ya se leía una sola vez, por `ms-how` | 0 | Medición directa / Estimación |
| `plan.md` de la entrada (media real, 100 muestras) | 6.018 chars (~1.505 tokens_est), 1 lectura/ciclo | Sin cambio — `ms-do` ya no releía `description.md` | 0 | Medición directa / Estimación |

## Comparativa de magnitud (por qué este es el hallazgo de mayor impacto de la auditoría hasta ahora)

| Fuente de contexto | Tokens_est | Origen del dato |
|---|---:|---|
| Documentos técnicos compartidos, 1 lectura (tras el cambio) | ~64.152 | Medición directa (chars) / Estimación (tokens) |
| Documentos técnicos compartidos, 2 lecturas (antes del cambio) | ~128.304 | Medición directa / Estimación |
| Cuerpos de todas las `SKILL.md` del ciclo completo | ~13.097–16.306 | Estimación (punto 2) |
| `description.md` + `plan.md` de la entrada, juntos | ~2.656 | Medición directa / Estimación |
| Impuesto fijo de `description` por tarea (las 11 skills `ms-*`) | 1.363 | Estimación (punto 2) |

Un solo documento (`ARCHITECTURE.md`) pesa ya más que la suma de los cuerpos de las 11 `SKILL.md` del framework completo (28.158 vs. ~22.800 tokens_est, dato del punto 2).

## Propuestas del informe original — verificación

| Propuesta | Resultado | Origen del dato |
|---|---|---|
| Pasar solo resumen/delta del análisis a la fase de aplicación | Ya resuelto donde importaba (verificación por inspección directa de `ms-do`/`ms-internal-tech-analysis` paso 4) — el problema real estaba en la relectura interna, no en el handoff. Solucionado con caché de sesión, más simple que rediseñar el formato del análisis | Inspección directa del código de las skills, no estimación |
| Dividir el ciclo en sub-conversaciones independientes | **Contraindicado** — perdería el ahorro de ~64.152 tokens_est de este mismo cambio en cada tramo nuevo | Estimación derivada de la tabla de arriba |

## Recomendaciones de uso

- **El ciclo `ms-new → ms-how → ms-do` debe mantenerse en una sola sesión continua siempre que sea posible** — esta recomendación ya se había anotado en el punto 2 (por la deduplicación de `ms-internal-workflow`/`ms-internal-tech-analysis`), pero este punto encuentra un motivo mucho más importante para seguirla: sin sesión continua, se pierde el ahorro de ~64.152 tokens_est de este cambio, no solo el de los cuerpos de skill (mucho menor). Si hace falta cortar la conversación entre fases, ser consciente de que la siguiente fase pagará una relectura completa de `ARCHITECTURE.md`/`STYLE_BIBLE.md`/`graph.json`.
- **Si `ARCHITECTURE.md`, `STYLE_BIBLE.md` o `graph.json` crecen significativamente más de aquí en adelante** (ya son grandes: 112K/53K/90K caracteres), vale la pena revisar si `ms-internal-tech-analysis` necesita un mecanismo de lectura dirigida (grep/índice) en vez de "leer completo, o la parte relevante si es muy extenso" — hoy esa decisión depende del criterio del modelo en cada invocación, no de un mecanismo determinista. No se ha implementado en este punto por ser un cambio de mayor alcance y riesgo (ver `analysis.md` §6).
- **Si se edita `ARCHITECTURE.md`/`STYLE_BIBLE.md`/`graph.json` a mitad de una sesión** (p.ej. el propio `ms-do` los actualiza en su paso 2.1/4), el guard de caché de sesión de este cambio asume que no han cambiado desde la última lectura — si en algún momento se detecta que una skill sigue usando una versión desactualizada de estos documentos dentro de la misma sesión tras haberlos editado, hay que revisar este guard (no se ha encontrado evidencia de que esto ocurra en el flujo actual, ya que `ms-do` es quien los edita y ninguna skill posterior del mismo ciclo vuelve a invocar `ms-internal-tech-analysis` después de `ms-do`).
