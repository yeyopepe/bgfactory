# Punto 11 — Iteración en generación de documentos largos

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 11 del informe original (`.claude/improvement/auditoria-original.md`).

## 0. Objetivo del punto

- Revisar si las skills de análisis siguen el patrón `outline → secciones → revisión` y cuántas llamadas intermedias genera cada informe.

## 1. Plan de pruebas — procedimiento

Inspección directa de las skills que generan documentos largos en el framework: `ms-internal-workflow` (`description.md`), `ms-how` (`plan.md`) y `ms-init` (primera versión de `ARCHITECTURE.md`/`STYLE_BIBLE.md`). Búsqueda explícita en el texto de todas las `SKILL.md` de vocabulario asociado al patrón `outline → secciones → revisión` (`outline`, `esquema`, `borrador`, `primera versión`, `iterativ*`, `sección por sección`) para no depender solo de una lectura manual y poder verificar negativos con confianza. Cruce con el tamaño real de los documentos generados (ya medido en el punto 1) para valorar si, de existir ese patrón en algún punto, estaría justificado por el umbral de longitud que el propio informe propone.

### Naturaleza del dato

Inspección directa del código de las skills (grep + lectura) — no hay proxy de tamaño ni estimación de tokens en este punto, salvo la cita a cifras ya calculadas en el punto 1.

## 2. Resultados

Ninguna skill del framework usa un patrón `outline → secciones → revisión`:

| Skill | Documento que genera | Patrón usado |
|---|---|---|
| `ms-internal-workflow` (acción `create`) | `description.md` | Escritura directa en un único paso, siguiendo la plantilla fija `description.template.md` (paso `create.2`: "Crea... Sigue exactamente la plantilla") |
| `ms-how` | `plan.md` | Escritura directa en un único paso, con 4 secciones fijas ("Escribe `plan.md` con exactamente estas cuatro secciones") |
| `ms-init` | Primera versión de `ARCHITECTURE.md`/`STYLE_BIBLE.md` | Escritura directa de una "primera versión reducida" (deliberadamente mínima, no completa) en un único paso — el único otro resultado de la búsqueda de vocabulario, y tampoco es un patrón iterativo: es justo lo contrario, una versión corta de una sola vez |

La búsqueda de vocabulario asociado al patrón (`outline`, `esquema` como estructura de documento, `borrador`, `iterativ*`, `sección por sección`) no encontró ningún caso real en las 11 `SKILL.md` — los dos únicos resultados de "esquema" se refieren al JSON Schema de `ms-context.json`, no a un esquema de documento.

**Único punto de iteración real encontrado**, y es de naturaleza distinta a la que preocupa este punto: `ms-new`/`ms-fix` validan la propuesta visual (`design_*.html`/diagrama Mermaid) con el usuario y, si pide cambios, "ajusta el fichero... y vuelve a presentarlo hasta que lo confirme" — es un bucle de confirmación humana sobre una maqueta visual, no una auto-revisión del propio modelo sobre el texto del documento. No genera llamadas intermedias de "redactar borrador → revisar → redactar de nuevo" salvo que el usuario pida explícitamente un cambio.

## 3. ¿Estaría justificado el patrón iterativo por el tamaño de los documentos?

El informe propone reservar el patrón iterativo solo para documentos que superen un umbral de longitud. Con los datos reales de tamaño ya medidos en el punto 1 (`.claude/improvement/01/results.md`):

| Documento | Mediana real | Máximo real observado (116/100 muestras) |
|---|---:|---:|
| `description.md` | 3.907 caracteres (~977 tokens_est) | 24.018 caracteres (~6.005 tokens_est) — `changes/closed/00072` |
| `plan.md` | 5.147 caracteres (~1.287 tokens_est) | 15.123 caracteres (~3.781 tokens_est) — `changes/closed/00087` |

Ni siquiera el documento más grande jamás generado en este repo (24.018 caracteres) se acerca a un tamaño que requiera un patrón iterativo por limitación técnica — un modelo puede generar ese volumen de texto perfectamente en una sola respuesta. El patrón `outline → secciones → revisión` solo se justifica por encima de umbrales mucho mayores (documentos de decenas de miles de tokens), muy por encima de lo que este framework genera en la práctica.

## 4. Conclusión

No hay nada que corregir: el framework nunca adoptó el patrón caro (`outline → secciones → revisión`) que este punto busca detectar y acotar. Genera los documentos largos en un único paso, con plantillas de estructura fija, independientemente de su tamaño — que es exactamente el comportamiento que el informe recomienda para "documentos de tamaño moderado", y los documentos reales de este framework nunca superan ese rango.

## 5. Propuestas del informe original — veredicto

| Solución propuesta | Veredicto |
|---|---|
| Reducir a un único paso para informes de tamaño moderado | **Ya es el comportamiento actual** — ninguna skill usa un patrón multi-paso |
| Reservar el patrón iterativo solo para documentos que superen un umbral de longitud | No aplica: no existe ningún caso, ni siquiera al tamaño máximo real observado, que se acerque al umbral donde ese patrón se justificaría (§3) |

## 6. Pendiente / próximos pasos

- Si en el futuro `description.md`/`plan.md` empezaran a crecer sistemáticamente mucho más allá de lo observado aquí (decenas de miles de caracteres), valdría la pena revisar este punto de nuevo con datos actualizados.
- Seguir con el siguiente punto del informe.
