# Punto 3 — Solapamiento y ambigüedad de triggers

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 3 del informe original (`.claude/improvement/auditoria-original.md`).

## 0. Objetivo del punto

- Listar pares de skills cuyas descripciones coinciden en las mismas palabras clave.
- Simular 5-10 peticiones típicas y contar cuántas `SKILL.md` "plausiblemente relevantes" se activan por petición.

## 1. Plan de pruebas — procedimiento

1. **Solapamiento léxico** (script `scripts/description_overlap.py`): índice de Jaccard entre las palabras significativas de la `description` de cada par de las 11 skills, descartando stopwords y el "vocabulario de framework" que aparece por diseño en casi todas (`ms-*`, `changesDir`, `trigger`, etc. — solapar en esas palabras no es ambigüedad real).
2. **Filtrado por skills realmente candidatas a enrutamiento**: de las 11 skills, 2 (`ms-internal-workflow`, `ms-internal-tech-analysis`) tienen `user-invocable: false` — nunca pueden ser el resultado de una petición directa del usuario (verificado en el punto 2), así que un solapamiento léxico con ellas no es un riesgo de ambigüedad real. Quedan 9 skills candidatas de verdad.
3. **Simulación de peticiones típicas**: 9 peticiones (dentro del rango 5-10 que pide el punto), mezclando prompts reales tomados de `changes/closed/*/description.md` (para partir de casos reales, no inventados) y prompts construidos específicamente para poner a prueba los pares con mayor solapamiento léxico del paso 1. Para cada una, razono qué skill(s) son plausiblemente relevantes según su `description` actual.

### Naturaleza del dato

El índice de Jaccard es **medición directa** (cálculo determinista sobre texto, sin proxy de tamaño). La simulación de peticiones es **estimación cualitativa** — un juicio razonado sobre qué dispararía el enrutamiento real, no una ejecución en vivo del enrutador de Claude Code sobre cada prompt (eso exigiría 9 turnos nuevos reales solo para confirmarlo, un coste no justificado dado que el propio contenido de las descriptions ya permite razonar el resultado con confianza razonable).

## 2. Resultados — solapamiento léxico

Top 10 pares por índice de Jaccard (tabla completa en `data/description_overlap_output.txt`):

| Skill A | Skill B | Jaccard | ¿Ambas son candidatas reales de enrutamiento? |
|---|---|---:|---|
| `ms-do` | `ms-how` | 0.20 | Sí, pero secuenciales (trigger de una exige que la otra ya haya actuado) |
| `ms-fix` | `ms-new` | 0.19 | **Sí — par de mayor riesgo real** |
| `ms-fast` | `ms-internal-tech-analysis` | 0.14 | No (la 2ª no es invocable por el usuario) |
| `ms-fix` | `ms-how` | 0.13 | Sí, pero secuenciales |
| `ms-new` | `ms-todo` | 0.12 | Sí, riesgo bajo (ver §3, prompt 3) |
| `ms-do` | `ms-new` | 0.12 | Sí, pero secuenciales |
| `ms-how` | `ms-new` | 0.12 | Sí, pero secuenciales |
| `ms-internal-workflow` | `ms-new` | 0.11 | No |
| `ms-fast` | `ms-fix` | 0.10 | **Sí — segundo par de riesgo real** |
| `ms-do` | `ms-internal-tech-analysis` | 0.10 | No |

## 3. Resultados — simulación de 9 peticiones típicas

| # | Petición | Origen | Skill(s) plausiblemente relevantes | ¿Ambigüedad real? |
|---|---|---|---|---|
| 1 | *"cuando arrastro un elemento en el modo edición, al soltarlo me abre siempre la ventana de configuración. Solo debe abrir la configuración si hago doble clic"* | Real (`changes/closed/00004`) | `ms-fix` | No — comportamiento roto, encaja sin ambigüedad |
| 2 | *"arregla el texto del botón de guardar, pone 'Guradar' con una errata"* | Construida (pareja `ms-fast`/`ms-fix`) | `ms-fast`, `ms-fix` | **Sí** — un typo es a la vez "cambio trivial" y "algo roto" |
| 3 | *"algún día estaría bien poder exportar la partida a PDF, apúntalo"* | Construida (pareja `ms-new`/`ms-todo`) | `ms-todo` (fuerte, por "apúntalo"), `ms-new` (débil) | Baja — la frase de disparo de `ms-todo` es explícita y gana con claridad |
| 4 | *"un nuevo elemento tipo dado para crear y añadir a la mesa..."* | Real (`changes/closed/00020`) | `ms-new` | No |
| 5 | *"cambia el color de fondo del panel lateral a gris claro"* | Construida (pareja `ms-fast`/`ms-new`) | `ms-fast` (fuerte, "estilo puntual" es ejemplo explícito), `ms-new` (débil) | Baja |
| 6 | *"¿cuántos cambios quedan pendientes de implementar?"* | Construida | `ms-status` | No |
| 7 | *"impleméntalo ya"* (tras escribirse un `plan.md` en el turno anterior) | Construida | `ms-do` | No (depende de contexto de conversación, no solo de la description) |
| 8 | *"configura este framework para que funcione con este repo"* | Construida | `ms-init` | No |
| 9 | *"actualiza el grafo de dependencias del proyecto"* | Construida (pareja `ms-do`/`ms-internal-graph`) | `ms-internal-graph` (fuerte, trigger explícito), `ms-do` (débil, solo si hay una implementación en curso) | Baja |

**Resultado agregado: 2 de 9 peticiones (22%) tienen ambigüedad real entre dos skills igualmente plausibles** (#2 y, en menor medida, #5); las otras 7 resuelven a una única skill con confianza razonable, o la ambigüedad léxica queda resuelta por una frase de disparo explícita más fuerte que el resto de la descripción (#3, #9).

## 4. Hallazgos concretos y cambios aplicados

### 4.1 `ms-fast` escalaba siempre a `ms-new`, incluso para bugs no triviales

Encontrado directamente al investigar el prompt #2 de la simulación (§3): `ms-fast` ya contempla explícitamente que un bug puede no ser trivial (paso 1: *"No es, ni de lejos, un bug cuya causa raíz haya que investigar"*), pero su paso 2 (qué hacer si no califica) invocaba **siempre** `ms-new` — nunca `ms-fix` — sin importar si lo que no calificaba era un bug o una funcionalidad nueva. Es decir: pedir `/ms-fast` para un bug que resulta no ser trivial acababa documentado como `change` en vez de `fix`, perdiendo el acotamiento estricto que `ms-fix` aplica (*"cambio mínimo, sin ampliar alcance"*).

**Cambio aplicado:** el paso 2 de `ms-fast` ahora invoca `ms-fix` cuando lo que no calificaba era un bug, y `ms-new` para el resto de casos — igual que ya anticipaba (sin implementarlo) su propio párrafo introductorio (*"debe decirlo y redirigir a `ms-new` o `ms-fix`"*, ya presente antes de este cambio pero no cumplido por el paso 2). `description` y `metadata.uses` actualizados a juego.

### 4.2 Referencias obsoletas a skills renombradas (`ms-change` → `ms-new`, `ms-initialize` → `ms-init`)

Encontrado al revisar en detalle `ms-fix/SKILL.md` para el hallazgo anterior: su cuerpo redirigía dos veces a una skill llamada `ms-change`, que no existe en este framework (la skill real es `ms-new` — parece un nombre previo a un renombrado que no se propagó del todo). Búsqueda del mismo patrón en el resto del framework encontró 3 apariciones más de nombres obsoletos, todas en `ms-init/schema.json` (`ms-change` una vez, `ms-initialize` tres veces — el nombre real es `ms-init`). Este `schema.json` lo lee `ms-init` (y opcionalmente `ms-how`/`ms-internal-graph`) como parte de su propio proceso, así que estas referencias obsoletas quedaban expuestas a cualquier skill que consultara el schema.

Una referencia a un nombre de skill que no existe no puede resolverse — en el mejor caso Claude lo nota por contexto y usa el nombre correcto igualmente, en el peor induce una invocación fallida o una confusión real sobre qué skill usar. Es exactamente el tipo de ambigüedad de nombre que este punto busca detectar, aunque no viniera de un solapamiento léxico entre dos descriptions válidas sino de una referencia rota.

**Cambio aplicado:** corregidas las 5 apariciones (`ms-fix/SKILL.md` ×2, `ms-init/schema.json` ×3) al nombre real de la skill correspondiente.

## 5. Pares de riesgo identificados pero no modificados

| Par | Motivo para no tocar |
|---|---|
| `ms-new` / `ms-todo` (prompt #3) | La frase de disparo de `ms-todo` ("apuntar"/"dejar anotada") es suficientemente específica y no se solapa con la de `ms-new` en la práctica — el solapamiento léxico (0.12) viene de vocabulario compartido ("idea", "nueva") que no compite de verdad por la misma petición |
| `ms-fast` / `ms-new` (prompt #5) | Ya bien resuelto: la propia lista de ejemplos de `ms-fast` ("un ajuste de estilo aislado") cubre este caso sin ambigüedad práctica |
| `ms-do` / `ms-internal-graph` (prompt #9) | El disparo de `ms-do` para el grafo depende de contexto de conversación (una implementación en curso), no compite por igual con el trigger explícito y autónomo de `ms-internal-graph` |
| `ms-do` / `ms-how` / `ms-new` (pares secuenciales, Jaccard 0.11-0.20) | El solapamiento léxico es alto porque cada skill nombra a la siguiente de la cadena en su propia description (es información útil, no ambigüedad) — sus triggers son secuenciales por diseño (`ms-how` exige "ya documentado por ms-new/ms-fix", `ms-do` exige "ya planificado por ms-how"), no compiten por la misma petición de un usuario |

No se propone fusionar ninguna skill en una sola con sub-modos (segunda solución del informe original): el solapamiento sistemático que justificaría esa fusión no aparece en los datos — los pares de mayor Jaccard son, o bien secuenciales por diseño (no ambiguos en la práctica), o bien uno de los dos no es una skill invocable por el usuario.

## 6. Propuestas del informe original — veredicto

| Solución propuesta | Veredicto |
|---|---|
| Diferenciar descripciones con casos de uso concretos y mutuamente excluyentes | Aplicado donde se encontró ambigüedad real (§4.1, `ms-fast` ↔ `ms-fix`/`ms-new`) |
| Fusionar skills redundantes en una sola con sub-modos, si el solapamiento es sistemático | No aplica — no hay solapamiento sistemático en los datos (§5) |

## 7. Pendiente / próximos pasos

- Seguir con el siguiente punto del informe.
