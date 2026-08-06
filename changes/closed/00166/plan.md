- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

Fuera de alcance (no se toca en este fix):
- La lógica de borrado de recursos (`isResourceInUse`, `attemptDeleteResource`) y su confirmación no cambian.
- No se añade ninguna forma de renombrar un recurso ya existente desde `ui/resourceModal.js` para que dispare esta misma detección — el fix cubre solo el momento de **añadir** un recurso nuevo (subida de fichero/varios/carpeta), tal como pide la petición original.
- No se cambia el criterio de qué hace único a un recurso (sigue siendo el `id`); el nombre sigue sin ser una clave técnica, solo se compara para decidir cuándo avisar.

Dudas resueltas (ya cerradas en la validación de `description.md`/maqueta con el usuario, sin preguntas adicionales durante esta planificación):
- El diálogo de confirmación cubre tanto un único duplicado (subida de un fichero) como varios a la vez (subida múltiple o de carpeta), listando los nombres en conflicto en el segundo caso — confirmado en la maqueta `design_confirmacion-recurso-duplicado.html`.
- En subida múltiple/carpeta, cancelar el diálogo de confirmación omite solo los ficheros en conflicto; los que no tienen conflicto de nombre se añaden con normalidad (ya reflejado en `description.md`).

Criterio de coincidencia de nombre: igual que ya usa el proyecto para ordenar recursos por nombre (`core/textSort.js`, `sortByName`, `localeCompare` con `sensitivity: 'base'`) — insensible a mayúsculas y a tildes. La extensión del fichero no forma parte de la comparación (el campo `name` de un recurso ya se guarda sin extensión).

## (b) Solución técnica

1. **`src/core/resource.js`** — añadir `findResourceByName(name, resources)`, que recorre `resources` y devuelve el primero cuyo `name` coincida con `name` usando el mismo criterio insensible a mayúsculas/tildes que `core/textSort.js` (`localeCompare(..., 'es', { sensitivity: 'base' })`), o `null` si no hay coincidencia. Centraliza el criterio de "mismo nombre" en un único sitio, reutilizable tanto por la subida de un fichero como por la de varios/carpeta.

2. **`src/ui/resourceReplaceConfirmModal.js`** (nuevo) — modal de confirmación, siguiendo el mismo esqueleto y patrón de callbacks que `ui/importConfirmModal.js` (`onAccept`/`onCancel`, cierre por click fuera equivalente a cancelar) y el mismo lenguaje visual de cabecera/aviso que otros modales de confirmación del proyecto:
   - `openResourceReplaceConfirmModal({ names, onAccept, onCancel })`.
   - Si `names.length === 1`: cabecera "Recurso duplicado" y mensaje `Ya existe un recurso llamado "{name}". Si continúas, se reemplazará su contenido. Los componentes que ya lo usan pasarán a mostrar el recurso nuevo.`
   - Si `names.length > 1`: cabecera "Recursos duplicados", mensaje introductorio (`{n} de los ficheros seleccionados coinciden con recursos ya existentes en la galería:`), lista `<ul>` con cada nombre, y mensaje de cierre (`Si continúas, se reemplazará su contenido. El resto de ficheros sin conflicto se añadirán con normalidad.`) — contenido calcado de la maqueta ya validada, `design_confirmacion-recurso-duplicado.html`.
   - Botones "Cancelar" (`btn-cancel`, invoca `onCancel`) y "Reemplazar" (`btn-accept`, invoca `onAccept`), mismas clases CSS ya existentes (`modal-overlay`, `modal`, `modal__header`, `modal__content`, `modal__footer`, `btn-cancel`, `btn-accept`) — no hace falta CSS nuevo.

3. **`src/modes/edit/editMode.js`** — reestructurar `loadResourceFromFile(file)` (~líneas 205-218) y sus tres llamadores (~líneas 224-286) para separar la detección de duplicado (síncrona, antes de leer el fichero) de la creación/lectura en sí:
   - Extraer de `loadResourceFromFile` la parte de validación+lectura en una función que, dado un `file` ya resuelto "sin conflicto" o "con reemplazo confirmado", hace lo que hoy hace la función completa (leer `dataUrl`, convertir a WebP, `createResource`/`addResource`), añadiendo un modo opcional de reemplazo: si se le pasa el `id` de un recurso existente, usar `replaceResource(id, ...)` en vez de `addResource(...)` (conservando ese `id`, igual que ya hace `replaceResource` para componentes/otros recursos existentes).
   - Nueva función síncrona `resolveResourceConflict(fileName, resources)` que, dado el nombre resultante (`fileName` sin extensión) y la lista actual de `getResources()`, devuelve el recurso existente coincidente (vía `findResourceByName`) o `null`.
   - **Vía "Subir fichero" (único)**: tras validar la extensión, si `resolveResourceConflict` encuentra coincidencia, abrir `openResourceReplaceConfirmModal({ names: [name] })` — en `onAccept`, completar la carga en modo reemplazo (mismo `id` del recurso existente); en `onCancel`, no hacer nada (el fichero no se añade, sin ningún otro aviso, tal como pide la petición). Si no hay coincidencia, comportamiento actual sin cambios.
   - **Vía "Subir varios ficheros" y "Subir carpeta"**: antes de lanzar las lecturas en paralelo, recorrer la lista de ficheros válidos (ya filtrados por extensión) en orden y, para cada uno, resolver el conflicto contra una copia local de `getResources()` que se va actualizando con los nombres ya "reservados" por ficheros anteriores del mismo lote (para cubrir el caso límite de dos ficheros del propio lote con el mismo nombre: el segundo se trata también como duplicado, esta vez contra el primero). Separar los ficheros en `sinConflicto` (se procesan igual que hoy, en paralelo con `Promise.all`) y `conflictivos` (nombre + recurso existente al que reemplazarían).
     - Si `conflictivos` está vacío, seguir exactamente igual que hoy.
     - Si no está vacío, mostrar un único `openResourceReplaceConfirmModal({ names: conflictivos.map(c => c.name) })` tras completar la carga de `sinConflicto`: en `onAccept`, cargar también todos los `conflictivos` en modo reemplazo (en paralelo, mismo patrón `Promise.all`); en `onCancel`, no cargarlos. En ambos casos, terminar mostrando `openBatchUploadSummaryModal` con el recuento ya existente (`added`, `skippedFormat`, `skippedSubfolderCount` en el caso de carpeta) más `added` incluyendo los reemplazados aceptados — no hace falta una categoría nueva en ese resumen: un recurso reemplazado cuenta igual que uno añadido a efectos de ese recuento, ya que el usuario ya ha visto y confirmado el reemplazo en el diálogo anterior.
   - Los omitidos por formato (`skippedFormat`) no cambian: la detección de conflicto de nombre ocurre solo entre los ficheros que ya pasaron la validación de extensión.

## (d) Cambios en estilo

No aplica: el nuevo modal reutiliza íntegramente clases ya existentes en `design/docs/stylebible/STYLE_BIBLE.md` (`modal-overlay`, `modal`, `modal__header`, `modal__content`, `modal__footer`, `btn-cancel`, `btn-accept`) sin introducir ninguna clase ni convención visual nueva.
