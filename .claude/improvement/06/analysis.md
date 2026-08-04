# Punto 6 — Reutilización de análisis previos

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 6 del informe original (`.claude/improvement/auditoria-original.md`). Solapa parcialmente con lo ya verificado en el punto 1 (§3 de `.claude/improvement/01/analysis.md`) — este punto lo retoma en detalle y añade la pieza que faltaba: la reutilización *entre* re-análisis de una misma entrada, no solo entre fases de un mismo ciclo.

## 0. Objetivo del punto

- Comprobar si la skill de aplicación relee el análisis funcional/técnico completo o solo la parte que le atañe.
- Revisar si hay versión "resumen ejecutable" del análisis pensada para consumo por otra skill.

## 1. Plan de pruebas — procedimiento

Inspección directa (no ejecución en vivo) de qué documento consume cada skill y cómo se genera, siguiendo la cadena real `ms-new`/`ms-fix` → `ms-how` → `ms-do` + el caso de re-análisis (`ms-new` sobre una entrada ya existente, `ms-how` sobre un `plan.md` ya existente). Adicionalmente, se intentó medir con qué frecuencia se regenera `plan.md`/`description.md` de una misma entrada usando el historial de `git log` sobre las 116 entradas de `changes/closed` — intento que se abandonó por falta de fiabilidad de los datos (ver §4).

### Naturaleza del dato

Todo lo de este punto es **inspección directa del código de las skills** (lectura de `SKILL.md`), no estimación de tamaño ni proxy de tokens — las preguntas del punto son sobre *qué* se lee, no *cuánto*.

## 2. Resultados — ¿la skill de aplicación relee el análisis completo?

| Skill | Qué lee | ¿Es el documento completo original, o un resumen derivado? |
|---|---|---|
| `ms-do` (aplicación) | `plan.md` — **no** vuelve a leer `description.md` (verificado en su `SKILL.md`, paso 2: solo menciona `plan.md`) | Resumen derivado: `plan.md` es un documento estructurado de 4 secciones fijas ((a) Anotaciones funcionales, (b) Solución técnica, (c) Cambios de arquitectura, (d) Cambios de estilo), escrito por `ms-how` específicamente para que `ms-do` lo ejecute — no el análisis funcional en bruto |
| `ms-how` (planificación) | `description.md` completo | Es el documento original — pero es el único consumidor que necesita el alcance funcional completo para diseñar la solución técnica, así que no es un caso de "re-inyección" evitable |
| `ms-internal-tech-analysis` (motor de exploración técnica, invocado por `ms-new`/`ms-fix`/`ms-how`/`ms-fast`) | Documentación técnica + código real | Devuelve a quien la invoca un **resumen sintetizado** (su propio paso 4: *"no pegues los documentos enteros ni el código tal cual"*) — no los documentos ni el código explorado |

**Respuesta a la primera pregunta del punto: no, `ms-do` no relee el análisis completo — ya consume solo la parte que le atañe (`plan.md`), un resumen derivado y no el `description.md` original.** Este patrón ya estaba bien resuelto antes de esta auditoría.

## 3. ¿Existe ya un "resumen ejecutable" pensado para consumo por otra skill?

Sí, y es exactamente el mecanismo que el informe original propone como solución (*"generar, junto al análisis completo, un resumen estructurado corto... pensado para ser leído por la skill de aplicación"*) — el framework ya lo tiene implementado de fondo con `plan.md`:

- Formato fijo y acotado (4 secciones, ver §2), no prosa libre — apto para que `ms-do` lo ejecute sin tener que interpretar contexto adicional.
- Las secciones (c)/(d) son explícitamente *opcionales, solo si aplican* (`ms-how/SKILL.md`, paso 3.5: *"si no aplica... omite esta sección por completo"*) — no hay boilerplate de relleno cuando no hace falta.
- `ms-internal-tech-analysis` sigue el mismo principio un nivel más abajo: su salida hacia quien la invoca ya es un resumen, nunca el material en bruto.

No hace falta implementar nada aquí — la solución que pide el informe ya existe en el diseño actual del framework.

## 4. ¿Se versiona el análisis y se aplica solo el diff entre versiones?

Aquí sí hay una diferencia real con lo que propone el informe, en dos sitios distintos:

- **`ms-new` sobre una entrada ya en `inProgress`** (`extend-entry.md`, paso 2): *"Aplica el mismo análisis... pero centrado en lo que se pide añadir o modificar ahora sobre lo ya documentado, no desde cero."* — esto **ya es delta-consciente por instrucción**, aunque no exista un mecanismo formal de versionado/diff: no repite el análisis funcional completo, solo la ampliación.
- **`ms-how` sobre una entrada cuyo `plan.md` ya existe** (`ms-how/SKILL.md`, paso 2): ofrece una elección binaria — regenerar `plan.md` **desde cero** (sobrescribiéndolo entero) o mantener el actual tal cual. No hay una vía intermedia de "aplicar solo el diff de lo que cambió en `description.md` desde la última vez que se planificó".

Se intentó medir la frecuencia real de regeneración de `plan.md` usando `git log --follow` sobre las 116 entradas de `changes/closed`, para saber si merece la pena resolver este segundo caso. El intento se abandonó: `git log --follow` producía coincidencias claramente erróneas entre ficheros de entradas distintas y no relacionadas (p.ej. `changes/closed/00001/description.md` y `changes/closed/00005/description.md` — dos cambios de contenido completamente distinto — aparecían con el mismo historial de commits), y sin `--follow` gran parte del historial anterior a una reorganización del repo aparece colapsado en un único commit masivo ("00048"). No hay una fuente fiable en este repo para medir con qué frecuencia se regenera `plan.md` desde cero en la práctica.

## 5. Conclusión

- La parte del punto que más impacto tendría (relectura completa en la skill de aplicación) **ya estaba resuelta** — no hace falta ningún cambio.
- El "resumen ejecutable" que propone el informe **ya existe** (`plan.md`) — no hace falta ningún cambio.
- El único hueco real (regeneración completa de `plan.md` en vez de diff parcial) **no tiene datos fiables que justifiquen su coste de implementación** frente al beneficio: `plan.md` es un documento modesto (mediana ~5.147 caracteres / ~1.505 tokens_est, dato del punto 1), la regeneración completa ya está gated tras una confirmación explícita del usuario (no ocurre en silencio ni automáticamente), y no hay evidencia de que sea un caso frecuente. Implementar un mecanismo de versionado/diff real (guardar versiones anteriores, calcular y aplicar el delta) sería una pieza de infraestructura no trivial para un ahorro que, con los datos disponibles, no se puede cuantificar como significativo. No se recomienda implementar sin más evidencia.

## 6. Propuestas del informe original — veredicto

| Solución propuesta | Veredicto |
|---|---|
| Generar, junto al análisis completo, un resumen estructurado corto pensado para consumo por otra skill | **Ya implementado** — es exactamente lo que es `plan.md` (§3) |
| Versionar análisis y aplicar solo el diff entre versiones | **No implementado, y no se recomienda sin más evidencia** — el caso donde aplicaría (regeneración de `plan.md`) ya está delta-consciente donde es barato hacerlo (`ms-new`/`extend-entry.md`) y gated por confirmación donde no lo está (`ms-how`); no hay datos fiables de frecuencia que justifiquen el coste de construir versionado real (§4) |

## 7. Pendiente / próximos pasos

- Si en el futuro se quiere revisar la frecuencia real de regeneración de `plan.md`, haría falta una fuente de datos distinta al historial de git de este repo (p.ej. instrumentar la propia skill para que registre cuándo se elige "regenerar desde cero" frente a "mantener el actual").
- Seguir con el siguiente punto del informe.
