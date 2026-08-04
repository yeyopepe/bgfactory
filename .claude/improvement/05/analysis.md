# Punto 5 — Patrón de re-lectura tras ediciones

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 5 del informe original (`.claude/improvement/auditoria-original.md`).

## 0. Objetivo del punto

- Contar cuántas veces se repite `view` (lectura) de un mismo archivo dentro de una tarea de aplicación con múltiples cambios.
- Verificar si se usa `str_replace` puntual o reescritura completa del archivo.

## 1. Por qué este punto no usa el mismo método que los puntos 1/2/4

Los puntos anteriores median **artefactos estáticos** (tamaño de ficheros, tamaño de salida de scripts) — reproducibles con un script en cualquier momento. Este punto mide **comportamiento del propio agente al editar** (cuántas veces relee un fichero, si usa edición puntual o reescritura completa), que no queda registrado en ningún fichero del repo — no hay logs de sesiones anteriores de `ms-do` disponibles para auditar retroactivamente. No se ha ejecutado un ciclo `ms-do` nuevo en vivo específicamente para este punto (habría supuesto tocar código real de `src/` solo para instrumentar la medición, un coste y un riesgo no justificados para lo que ya se puede comprobar por otras dos vías más baratas).

En su lugar, el plan de pruebas combina:

1. **Inspección estática de `ms-do/SKILL.md`**: ¿la propia skill da alguna instrucción sobre cómo editar (agrupar cambios, evitar relecturas, preferir ediciones puntuales)? — Comprobado leyendo su paso 2 ("Implementar"): no dice nada al respecto, solo "Ejecuta cada tarea... con tu proceso normal de ingeniería (editar código, verificar que compila / pasan los tests si los hay)". El patrón de edición no está gobernado por la skill, sino por el comportamiento por defecto del propio agente/harness.
2. **Inspección de las reglas del harness que gobiernan ese comportamiento por defecto**, ya que son las que de verdad deciden esto en cualquier tarea de aplicación, no solo en `ms-do`. Verificado en las instrucciones de sistema de este propio agente (no son específicas de este repo, aplican a cualquier sesión de Claude Code):
   - *"Prefer editing existing files to creating new ones."*
   - *"Prefer the Edit tool for modifying existing files — it only sends the diff."* (herramienta `Edit`, equivalente a `str_replace`)
   - *"Do NOT re-read a file you just edited to verify — Edit/Write would have errored if the change failed, and the harness tracks file state for you."*
3. **Auto-auditoría de esta misma sesión**: esta conversación ya ha editado varios ficheros reales del repo con múltiples cambios cada uno (puntos 1, 2 y 4) — es una muestra real de comportamiento de edición, aunque con una salvedad importante de representatividad (ver §3).

### Naturaleza del dato

El recuento de llamadas de lectura/edición de §2 es **medición directa** (recuento exacto de las herramientas usadas en esta sesión, reconstruido de la transcripción, no una estimación de tamaño). No hay proxy de tokens implicado en este punto.

## 2. Resultados — auto-auditoría de esta sesión

| Fichero | Lecturas (`Read`) | Ediciones puntuales (`Edit`) | Reescrituras completas (`Write`, fichero ya existente) | Nota |
|---|---:|---:|---:|---|
| `ms-status/SKILL.md` | 2 (1 inicial + 1 antes del punto 4, tras un salto de varios turnos) | 5 | 0 | La 2ª lectura es defendible (confirmar estado tras un hueco largo entre puntos), pero no era estrictamente necesaria según el propio tracking del harness |
| `ms-new/SKILL.md` | 1 | 3 | 0 | 3 ediciones agrupadas sin releer entre medias |
| `ms-internal-tech-analysis/SKILL.md` | 1 | 1 | 0 | — |
| `todo-mode.md`, `extend-entry.md` (ficheros nuevos) | 0 | — | — (creados con `Write`, no reescritura de algo existente) | El tool `Write` no exige `Read` previo para ficheros nuevos — no aplica a este punto |

**Ninguna edición de esta sesión sobre un fichero ya existente usó reescritura completa (`Write`)** — las 9 ediciones sobre `ms-status`/`ms-new`/`ms-internal-tech-analysis` usaron todas `Edit` (equivalente a `str_replace`), incluso cuando varias ediciones caían sobre el mismo fichero en el mismo punto (agrupadas sin releer entre medias, como pide la solución propuesta en el informe). El único caso de relectura fue una vez, por precaución, tras un hueco temporal entre puntos de la auditoría — no un patrón de "editar → releer → editar → releer" repetido dentro de una misma tarea.

## 3. Limitación de representatividad

Esta auto-auditoría mide ediciones sobre `SKILL.md`/Markdown (el propio trabajo de esta auditoría), no una tarea real de `ms-do` sobre código de la aplicación (`src/`, JS). El comportamiento del agente (uso de `Edit` vs `Write`, evitar relecturas) es el mismo con independencia del tipo de fichero — no depende de si es Markdown o JavaScript — por lo que la muestra es válida como evidencia del comportamiento por defecto, pero no sustituye una observación directa de un `ms-do` real si en algún momento se quisiera verificar con más rigor (quedaría como prueba pendiente, ver §5).

## 4. Conclusión

Los dos comportamientos que este punto quería detectar (relectura repetida tras editar, reescritura completa en vez de edición puntual) **ya están desalentados por defecto a nivel de plataforma** (instrucciones de sistema del propio Claude Code), no dependen de que `ms-do` los repita en su `SKILL.md`. Añadir esa instrucción a `ms-do` sería redundante — tokens de más en su cuerpo por un comportamiento que el agente ya sigue por defecto, exactamente el tipo de bloat que esta auditoría busca eliminar, no añadir.

## 5. Propuestas del informe original — veredicto

| Solución propuesta | Veredicto |
|---|---|
| Agrupar todos los cambios de un archivo en una sola pasada de ediciones antes de re-verificar | Ya es el comportamiento por defecto (verificado en §2: 3 ediciones agrupadas sobre `ms-new/SKILL.md` sin releer entre medias) — no requiere cambio en ninguna skill |
| Preferir `str_replace` sobre reescritura completa siempre que el cambio sea parcial | Ya es el comportamiento por defecto (verificado en §2: 0 reescrituras completas sobre ficheros existentes en toda la sesión) — no requiere cambio en ninguna skill |

## 6. Pendiente / próximos pasos

- Si se quiere verificar este punto con más rigor sobre código real (no Markdown), habría que ejecutar un `ms-do` real sobre una entrada de `changes/inProgress` con `plan.md` ya escrito y auditar su transcripción — no se ha hecho aquí por ser una acción de mayor alcance (tocar código de producción de `src/` con el único fin de instrumentar esta medición) sin que el usuario lo haya pedido explícitamente.
- Seguir con el siguiente punto del informe.
