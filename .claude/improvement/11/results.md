# Punto 11 — Resultados de las pruebas

Sin cambio de código implementado en este punto: ninguna skill del framework usa el patrón `outline → secciones → revisión` que este punto busca detectar y acotar (ver `analysis.md`).

Columna **Origen del dato**: **inspección directa** del código de las skills (grep + lectura) en todos los casos; las cifras de tamaño de documento son citas a mediciones ya hechas en el punto 1.

## Búsqueda del patrón en las 11 `SKILL.md`

| Skill | ¿Usa `outline → secciones → revisión`? | Origen del dato |
|---|---|---|
| `ms-internal-workflow` (`description.md`) | No — escritura directa en un único paso, plantilla fija | Inspección directa |
| `ms-how` (`plan.md`) | No — escritura directa en un único paso, 4 secciones fijas | Inspección directa |
| `ms-init` (primera versión de docs técnicos) | No — versión reducida de una sola vez | Inspección directa |
| Resto de skills (no generan documentos largos) | No aplica | Inspección directa |
| Búsqueda de vocabulario (`outline`, `esquema` de documento, `borrador`, `iterativ*`, `sección por sección`) en las 11 `SKILL.md` | 0 coincidencias reales (los 2 resultados de "esquema" son sobre JSON Schema, no sobre estructura de documento) | Inspección directa (grep) |

## Tamaño real de los documentos, contra el umbral que propone el informe

| Documento | Mediana | Máximo real observado | Origen del dato |
|---|---:|---:|---|
| `description.md` | 3.907 caracteres (~977 tokens_est) | 24.018 caracteres (~6.005 tokens_est) | Medición directa, ya calculada en `.claude/improvement/01/` |
| `plan.md` | 5.147 caracteres (~1.287 tokens_est) | 15.123 caracteres (~3.781 tokens_est) | Medición directa, ya calculada en `.claude/improvement/01/` |

Ni el máximo real observado se acerca al umbral donde un patrón iterativo se justificaría por limitación técnica de generación.

## Propuestas del informe original — verificación

| Propuesta | Resultado | Origen del dato |
|---|---|---|
| Reducir a un único paso para informes de tamaño moderado | Ya es el comportamiento actual en las 3 skills que generan documentos largos | Inspección directa |
| Reservar el patrón iterativo solo para documentos que superen un umbral de longitud | No aplica — no hay ningún caso real que se acerque a ese umbral | Medición directa (tamaños del punto 1) |

## Recomendaciones de uso

- **Si se añade en el futuro una nueva skill que genere documentos largos**, mantener el mismo patrón ya verificado aquí: escritura directa de una sola vez con estructura de secciones fija, sin outline previo ni fases de revisión intermedias — es lo que ya usan `ms-internal-workflow`, `ms-how` e `ms-init`, y evita por diseño el problema que este punto busca detectar.
- **No confundir el bucle de confirmación visual de `ms-new`/`ms-fix`** (ajustar un `design_*.html` o diagrama si el usuario pide cambios) **con el patrón iterativo de este punto** — son cosas distintas: uno es validación humana de una maqueta, el otro sería auto-revisión del modelo sobre el texto de un documento. El primero es necesario y deseable; el segundo es el que este punto buscaba evitar, y no existe en este framework.
