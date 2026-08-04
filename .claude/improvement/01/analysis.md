# Punto 1 — Flujo completo análisis → aplicación

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 1 del informe original (`.claude/improvement/auditoria-original.md`) — el de mayor impacto potencial según el propio informe.

## 0. Objetivo del punto

- Medir tokens totales de un ciclo SDD real de principio a fin.
- Identificar en qué paso del ciclo se dispara el mayor salto de contexto.
- Comprobar si el análisis funcional/técnico completo se re-inyecta en cada fase posterior.

## 1. Plan de pruebas — procedimiento

Un ciclo completo real (`ms-new → ms-how → ms-do`) no se ha ejecutado en vivo para esta medición: el coste de invocarlo de verdad para instrumentarlo sería, él mismo, un gasto de tokens considerable — y el punto 2 ya estableció que el grafo estático de invocación (`metadata.uses`) más el tamaño real de los ficheros implicados da una estimación fiable sin necesidad de ejecutar el ciclo completo. Este punto reutiliza y extiende esa metodología, añadiendo la pieza que faltaba: el tamaño real de los **documentos** que se leen en cada fase (no solo el cuerpo de las skills).

Procedimiento (script `scripts/measure_cycle_cost.py`):

1. Reconstruir qué documentos lee cada fase, a partir del propio contenido de los `SKILL.md` (no de suposiciones):
   - `ms-internal-tech-analysis` (invocada por `ms-new` y por `ms-how`) lee `architectureDocPath`, `styleBibleDocPath` y `projectGraphPath` completos, si están configurados.
   - `ms-how` lee `description.md` completo de la entrada.
   - `ms-do` lee `plan.md` completo de la entrada — y **no** vuelve a leer `description.md` (verificado leyendo su `SKILL.md`, no asumido).
2. Medir el tamaño real de esos documentos en este repo: los tres documentos técnicos compartidos (fijos, no crecen con cada cambio) y la distribución real de `description.md`/`plan.md` sobre las 116 entradas de `changes/closed` (variable, un dato por entrada histórica).
3. Cruzar eso con el grafo de invocación del punto 2 (`ms-internal-tech-analysis` se invoca 2 veces en un ciclo típico `change`/`fix`: una desde `ms-new`/`ms-fix`, otra desde `ms-how`) para calcular el coste total del ciclo y detectar el paso de mayor salto.

### Naturaleza del dato

Los tamaños de fichero son **medición directa** (`len()` sobre el contenido real). La conversión a tokens_est es **estimación** (proxy chars/4, misma limitación de los puntos 2 y 4 — sin tokenizer real disponible). El número de invocaciones por ciclo (2×) es una **estimación derivada** del grafo estático `metadata.uses`, no de una ejecución en vivo — igual que ya se documentó en el punto 2.

## 2. Resultados — dónde está el salto de contexto

| Fuente de contexto | Tamaño | Frecuencia en un ciclo típico | Origen del dato |
|---|---:|---|---|
| `architectureDocPath` (`design/docs/ARCHITECTURE.md`) | 112.633 chars (~28.158 tokens_est) | Leído por `ms-internal-tech-analysis`, hasta 2×/ciclo | Medición directa (chars) / Estimación (tokens) |
| `projectGraphPath` (`src/_graph/graph.json`) | 90.633 chars (~22.658 tokens_est) | Ídem | Medición directa / Estimación |
| `styleBibleDocPath` (`design/docs/stylebible/STYLE_BIBLE.md`) | 53.343 chars (~13.336 tokens_est) | Ídem | Medición directa / Estimación |
| `description.md` de la entrada (media real, 116 muestras) | 4.602 chars (~1.151 tokens_est) | Leído 1×/ciclo, por `ms-how` | Medición directa / Estimación |
| `plan.md` de la entrada (media real, 100 muestras) | 6.018 chars (~1.505 tokens_est) | Leído 1×/ciclo, por `ms-do` | Medición directa / Estimación |
| Cuerpos de las `SKILL.md` implicadas (`ms-new`+`ms-how`+`ms-do`+internas) | ~13.097–16.306 tokens_est (según dedup) | 1 vez cada una, ver punto 2 | Estimación (ya documentada en `.claude/improvement/02/`) |

**El salto de contexto más grande del ciclo, con diferencia, son los tres documentos técnicos compartidos** (~64.152 tokens_est por lectura completa de los tres) — no los documentos propios del cambio (`description.md`/`plan.md`, ~1.100–1.500 tokens_est de media cada uno) ni los cuerpos de las skills (~13.000–16.000 tokens_est para el ciclo entero). Un solo documento (`ARCHITECTURE.md`, 28.158 tokens_est) ya pesa más que **todas** las `SKILL.md` del ciclo juntas.

## 3. ¿Se re-inyecta el análisis completo en cada fase? — Sí, y de forma evitable

Comprobado directamente en el código de `ms-internal-tech-analysis` (no asumido): su paso 1 instruía leer los tres documentos técnicos **completos, cada vez que se invoca la skill**, sin ningún guard de "ya los leí antes en esta sesión" — a diferencia de su propio paso 0 (lectura de `.claude/ms-context.json`), que sí tenía ese guard desde el principio. Como `ms-internal-tech-analysis` se invoca típicamente 2 veces por ciclo (`ms-new`/`ms-fix` y luego `ms-how`), esto significaba **releer 256.609 caracteres (~64.152 tokens_est) de documentación que no había cambiado entre una invocación y la siguiente**, dentro de la misma sesión.

Esto es justo el patrón que el punto 1 pedía comprobar ("¿se re-inyecta el análisis técnico completo en cada fase posterior?") — la respuesta es sí, y con un peso muy superior a cualquier otro punto medido hasta ahora en esta auditoría.

**Matiz importante:** el `description.md`/`plan.md` de la propia entrada (lo específico de *este* cambio) no sufre este problema — `ms-do` ya está bien diseñado y no relee `description.md` (verificado en su `SKILL.md`, solo usa `plan.md`), y lo que `ms-internal-tech-analysis` devuelve a quien la invoca ya es un resumen sintetizado, no los documentos completos (paso 4 de su propio `SKILL.md`: "no pegues los documentos enteros ni el código tal cual"). El problema no estaba en el *handoff* entre fases (eso ya estaba bien resuelto), sino en la *lectura* repetida dentro de la misma skill interna.

## 4. Cambio aplicado

Se añadió a `ms-internal-tech-analysis/SKILL.md` paso 1 el mismo guard de caché de sesión que ya tenía el paso 0 para `ms-context.json`: si los documentos técnicos ya se leyeron antes en la sesión actual y no han cambiado, no se vuelven a leer. Comportamiento sin cambios (la skill sigue devolviendo el mismo contexto sintetizado); solo deja de pagar dos veces por la misma lectura dentro de un mismo ciclo.

**Resultado estimado:** 513.218 → 256.609 caracteres leídos en un ciclo típico de 2 invocaciones (~128.304 → ~64.152 tokens_est, **‑50%** del coste de esta fuente, el mayor ahorro absoluto de toda la auditoría hasta ahora).

**Limitación de esta cifra:** igual que en el punto 2, el ahorro por caché de sesión solo se materializa si el ciclo completo ocurre en una sola sesión continua — ver §5.

## 5. Las dos soluciones propuestas en el informe original — veredicto

| Solución propuesta | Veredicto |
|---|---|
| "Pasar solo el resumen/delta del análisis a la fase de aplicación, no el documento completo" | Ya estaba bien resuelto donde de verdad importaba: `ms-do` no relee `description.md`, y `ms-internal-tech-analysis` ya devuelve un resumen sintetizado a quien la invoca (no los documentos enteros). El problema real no era el *handoff* entre fases, sino la relectura interna dentro de `ms-internal-tech-analysis` — solucionado en §4 con un mecanismo más simple (caché de sesión) que no requiere rediseñar el formato de ningún documento. |
| "Dividir el ciclo en sub-conversaciones/tareas independientes con handoff explícito (resumen corto) en vez de una sesión continua" | **Contraindicado con la evidencia de este punto.** El ahorro de §4 (~64.152 tokens_est) solo existe si el ciclo se queda en una sesión continua — el mismo matiz ya señalado en el punto 2 para `ms-internal-workflow`/`ms-internal-tech-analysis`, pero aquí con un peso mucho mayor (documentos de arquitectura/estilo/grafo, no solo cuerpos de skill). Dividir el ciclo en sub-conversaciones forzaría releer ~64.152 tokens_est de documentación técnica en cada tramo nuevo — el efecto contrario al que busca esta propuesta. No se recomienda implementar esta solución tal como está planteada en el informe original. |

## 6. Pendiente / próximos pasos

- No se ha tocado el caso "documento muy extenso, tema acotado" (la propia skill ya prevé leer solo la parte relevante cuando el documento es muy grande, pero es una instrucción de criterio del modelo, no un mecanismo determinista de búsqueda/índice). Reducir el coste de la *primera* lectura de estos documentos (no solo evitar la segunda) requeriría algo más estructural (grep dirigido, tabla de contenidos, o dividir `ARCHITECTURE.md` en secciones cargables por separado) — no se ha abordado aquí por ser un cambio de mayor alcance y riesgo (podría hacer que la skill pase por alto contexto relevante si la búsqueda dirigida falla). Queda como posible punto futuro si el tamaño de estos documentos sigue creciendo.
- Seguir con el siguiente punto del informe.
