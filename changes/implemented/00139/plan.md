- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- Sin dudas técnicas pendientes: el análisis de `description.md` ya deja resueltas todas las decisiones de alcance necesarias (selector con checkboxes, mensaje de borrado ajustado, botón "Sacar" sin cambios, migración silenciosa) y la maqueta visual valida el encaje de la sección "Grupos" como `fieldset` con borde.
- Fuera de alcance: no se toca la lógica de selección de elementos por fila del panel "Grupos" (cambio 00130) ni la columna "Elementos" (cambio 00107) más allá de que su fuente de datos (`getComponentsUsingGroup`) pase a mirar un array — su comportamiento observable no cambia.
- Fuera de alcance: no se añade ninguna indicación visual de a qué grupo(s) pertenece un elemento en la mesa ni en el panel de Componentes — sigue sin representación visual propia fuera de la modal y del panel "Grupos", igual que hoy.

## (b) Solución técnica

1. **`src/core/component.js`** — cambiar el campo de `grupoId = null` (parámetro y propiedad) a `grupoIds = []` en `createComponent`. En `syncCopyWithOriginal`, sincronizar `copy.grupoIds = [...original.grupoIds]` (copia superficial del array, no la misma referencia) en vez de `grupoId: original.grupoId`.

2. **`src/core/group.js`** — `getComponentsUsingGroup(groupId, components)` pasa a filtrar con `component.grupoIds.includes(groupId)` en vez de `component.grupoId === groupId`. El resto de consumidores (`groupList.js`, `groupModal.js`, `selectGroup` en `editMode.js`) no necesitan cambios: ya delegan en esta función.

3. **`src/core/fichaMigration.js`** — `migrateFichaComponent` pasa a fijar `grupoIds: []` en vez de `grupoId: null` en el componente resultante (mismo criterio: la migración de `ficha`→`carta` no intenta preservar ninguna asociación de grupo/mazo antigua).

4. **`src/core/state.js`** — sustituir la migración `migrateDeckIdToGrupo` y añadir una nueva, manteniendo el mismo criterio "best-effort, nunca bloquea el arranque" del resto de migraciones de esta función:
   - Nueva `migrateGrupoIdToGrupoIds(components)`: para cada componente que todavía tenga la propiedad escalar `grupoId` (formato anterior a este cambio) y no tenga ya `grupoIds` como array, la convierte: `component.grupoIds = component.grupoId != null ? [component.grupoId] : []`, y borra `grupoId`. Cubre las partidas guardadas con el modelo de un único grupo.
   - `migrateDeckIdToGrupo(components)` actualizada: si `properties.deckId` está presente, añade ese id a `component.grupoIds` (creando el array si no existe, sin duplicar si ya estuviera) en vez de asignar un escalar, y borra `deckId` de `properties` igual que hoy.
   - Orden en `loadComponents`: `migrateFichas` (ya deja `grupoIds: []` fijado) → `migrateGrupoIdToGrupoIds` (normaliza cualquier componente restante con `grupoId` escalar a array) → `migrateDeckIdToGrupo` (ahora puede asumir que `grupoIds` ya es siempre un array) → `migrateBloqueado`.

5. **`src/ui/componentModal.js`** (sección "Grupo" de la pestaña Generales, líneas ~307-403) — sustituir el `<select>` único por una sección con borde y título, siguiendo el patrón ya usado en la propia modal para secciones informativas (`fieldset.modal__section` + `legend.modal__section-title`, sin checkbox de activación entera — ver "Interacciones programadas" en la misma modal, y sección 12.6 de `STYLE_BIBLE.md`):
   - `groupSection` (`fieldset.modal__section`) con `legend` "Grupos".
   - Dentro, un `<input type="checkbox">` + `<label>` por cada grupo existente (`getGroups()`), marcado si `workingComponent.grupoIds.includes(group.id)`; al cambiar, añade/quita ese id de `workingComponent.grupoIds`.
   - Al final, la fila "+ Crear nuevo grupo…" reutilizando la lógica ya existente de `newGroupInput`/`newGroupCreateBtn`/`newGroupError` (misma validación de nombre con `isGroupNameTaken`), con la diferencia de que al crear el grupo se añade su id a `workingComponent.grupoIds` (no lo sustituye) y se vuelve a pintar la lista de checkboxes con el nuevo grupo ya marcado.
   - Función `populateGroupCheckboxes()` sustituye a `populateGroupSelect()`, reconstruyendo la lista completa de checkboxes (se reutiliza también al volver de "Pegar estilo", ver tarea 6).

6. **`src/ui/componentModal.js`** (Copiar/Pegar estilo de "Generales", líneas ~1056-1116) — al copiar, `data.generales.grupoIds = [...workingComponent.grupoIds]` y `data.generales.grupoNames = workingComponent.grupoIds.map((id) => getGroups().find((g) => g.id === id)?.name).filter(Boolean)` (sustituyen a `grupoId`/`grupoName`, solo para el mensaje de error si algún grupo ya no existe al pegar). Al pegar, `workingComponent.grupoIds = [...clip.generales.grupoIds]` y se llama a `populateGroupCheckboxes()` en vez de `populateGroupSelect()`.

7. **`src/core/styleClipboard.js`** — `validateStyleClipboardForPaste`: donde hoy comprueba `clip.generales.grupoId` contra `groups`, pasa a iterar `clip.generales.grupoIds` (si existe) y añadir una incidencia por cada id que ya no exista en `groups`, usando el nombre correspondiente de `clip.generales.grupoNames` para el mensaje (mismo formato de incidencia que hoy, una fila por grupo ausente en vez de una sola).

8. **`src/core/importMerge.js`**:
   - `remapComponentRefs`: donde hoy remapea `component.grupoId` a través de `groupIdMap`, pasa a mapear cada elemento de `component.grupoIds` (`component.grupoIds.map((id) => groupIdMap.has(id) ? groupIdMap.get(id) : id)`).
   - En el bucle de `finalComponents` (líneas ~240-269) que autocrea grupos ausentes o vincula a uno existente con el mismo nombre: pasa a iterar sobre cada id de `component.grupoIds` en vez de un único `grupoId`, aplicando la misma lógica (vincular al existente con mismo nombre, o crear el grupo automáticamente) por cada id ausente, sustituyendo ese id concreto dentro del array (no todo el array) cuando haya que vincularlo a un id ya existente, y generando una fila de informe por cada id procesado — igual que hoy genera una fila por componente/recurso ausente.

9. **`src/modes/edit/editMode.js`**:
   - `attemptDeleteGroup` (línea ~300): al borrar un grupo en uso, en vez de `updateComponent(component, { grupoId: null })` sobre cada componente afectado, quitar solo ese id del array: `updateComponent(component, { grupoIds: component.grupoIds.filter((id) => id !== group.id) })`. El componente conserva cualquier otro grupo que tuviera.
   - `onRemoveFromGroup` dentro de `renderGroupPanel` (línea ~523): mismo cambio — `grupoIds: component.grupoIds.filter((id) => id !== g.id)` en vez de `grupoId: null`.
   - `selectGroup` no necesita cambios: ya usa `getComponentsUsingGroup`, que queda corregida en la tarea 2.

10. **`src/ui/groupDeleteConfirmModal.js`** — ajustar el texto del mensaje (línea 25), de "se eliminará el grupo y esos elementos quedarán sin grupo asignado" a algo del estilo "se eliminará el grupo y esos elementos perderán la pertenencia a este grupo" (sin afirmar que quedan sin ningún grupo, ya que pueden conservar otros). Ajustar también el comentario de cabecera del fichero (líneas 1-5), que documenta ese mismo texto.

11. **`src/ui/groupList.js`** / **`src/ui/groupModal.js`** — sin cambios: ya delegan por completo en `getComponentsUsingGroup` (columna "Elementos", lista de elementos de la ventana de edición) y en el callback `onRemoveFromGroup` (botón "Sacar") que recibe la skill llamante, corregido en la tarea 9.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:

- Actualizar el comentario del modelo de datos de componente (línea 72 aprox.) de `grupoId: string | null, // id de un grupo... (cambio 00105)` a algo como `grupoIds: string[], // ids de los grupos de core/state.js (getGroups()) a los que pertenece el componente, [] si a ninguno (cambio 00105, generalizado a varios a la vez en el cambio 00139)`.
- En la sección 4.1 ("Modelo de datos de grupo"), actualizar la frase que describe el desplegable "Grupo" de la pestaña "Generales" (línea 179 y alrededores) para reflejar que ahora es una sección con lista de checkboxes de selección múltiple, no un desplegable de selección única.
- Actualizar la descripción del bloque "Generales" de Copiar/Pegar estilo (línea 231 y alrededores) para mencionar `grupoIds`/`grupoNames` (plural) en vez de `grupoId`/`grupoName`.
- Actualizar la nota sobre la fusión de importaciones (línea 299 aprox.) para reflejar que la autocreación de un grupo ausente se evalúa por cada grupo referenciado por un componente (puede haber varios), no uno solo.
