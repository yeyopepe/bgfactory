# Punto 6 — Resultados de las pruebas

Sin cambio de código implementado en este punto: la comprobación concluyó que la reutilización de análisis previos ya está bien resuelta en el diseño actual (`plan.md` como resumen ejecutable), y que el único hueco real (versionado/diff de `plan.md`) no tiene datos que justifiquen su coste de implementación (ver `analysis.md` §4-5).

Columna **Origen del dato**: todo este punto es **inspección directa** del código de las skills (qué documento lee cada una) — no hay proxy de tamaño ni estimación de tokens involucrados, salvo donde se cita una cifra ya calculada en el punto 1.

## Qué lee cada skill (inspección directa del código)

| Skill | Documento que lee | ¿Completo o resumen derivado? | Origen del dato |
|---|---|---|---|
| `ms-do` | `plan.md` (no `description.md`) | Resumen derivado — estructura fija de 4 secciones | Inspección directa de `ms-do/SKILL.md` |
| `ms-how` | `description.md` completo | Documento original, pero es el único consumidor que lo necesita completo | Inspección directa de `ms-how/SKILL.md` |
| `ms-internal-tech-analysis` (a quien la invoca) | Devuelve resumen sintetizado, nunca documentos/código en bruto | Resumen derivado | Inspección directa de `ms-internal-tech-analysis/SKILL.md`, paso 4 |

## Tamaño real de `plan.md` (el "resumen ejecutable" ya existente)

| Métrica | Valor | Origen del dato |
|---|---:|---|
| `plan.md` — mediana (100 muestras reales de `changes/closed`) | 5.147 caracteres (~1.505 tokens_est) | Medición directa, ya calculada en `.claude/improvement/01/results.md` |

## Intento de medición abandonado

| Qué se intentó medir | Por qué se abandonó | Origen del dato |
|---|---|---|
| Frecuencia de regeneración completa de `plan.md` en las 116 entradas de `changes/closed`, vía `git log --follow` | El historial de git de este repo no es fiable para esto: `--follow` produce coincidencias erróneas entre ficheros de entradas distintas y no relacionadas, y sin `--follow` gran parte del historial previo aparece colapsado en un único commit de reorganización | Verificado directamente (ver ejemplo en `analysis.md` §4: `00001` y `00005`, de contenido no relacionado, aparecen con idéntico historial) |

## Propuestas del informe original — verificación

| Propuesta | Resultado | Origen del dato |
|---|---|---|
| Resumen estructurado corto para consumo por otra skill | Ya implementado (`plan.md`) | Inspección directa |
| Versionar análisis y aplicar solo el diff | No implementado; no se recomienda sin más evidencia de frecuencia | Inspección directa + intento de medición sin datos fiables |

## Recomendaciones de uso

- **No construir un mecanismo de versionado/diff para `plan.md` sin antes tener datos reales de frecuencia.** El coste de esa infraestructura (guardar versiones anteriores, calcular y aplicar deltas) no está justificado con la evidencia actual — sería trabajo especulativo. Si en el futuro se quiere decidir esto con datos, la vía más fiable es instrumentar la propia skill `ms-how` (no el historial de git, ver arriba) para registrar cuándo el usuario elige "regenerar desde cero" frente a "mantener el actual" en su paso 2.
- **Al ampliar una entrada ya documentada (`ms-new`/`extend-entry.md`), confiar en que el flujo ya es delta-consciente** — no hace falta pedir explícitamente "solo documenta lo nuevo", la skill ya está instruida para centrarse en la ampliación y no repetir el análisis desde cero.
- **Si se añade una nueva skill de aplicación al framework en el futuro**, seguir el mismo patrón ya verificado aquí: que consuma el resumen estructurado (`plan.md` o equivalente), no el análisis funcional en bruto — es el patrón que ya evita el problema que este punto buscaba detectar.
