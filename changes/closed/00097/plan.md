- **Código**: 00097
- **Tipo**: change

## (a) Anotaciones funcionales

Fuera de alcance:
- No se introduce ningún mecanismo de sincronización genérico reutilizable para otros fines (p. ej. plantillas): la sincronización copia↔original es específica de este tipo de vínculo.
- No se permite cadena de copias (copia de una copia): esto se garantiza solo ocultando los botones "Copiar"/"Clonar" en la fila de una copia en el panel (capa UI), sin validación adicional en `core`, mismo criterio que otras reglas de la app resueltas solo en la capa UI (p. ej. unicidad de `id`, ver `ARCHITECTURE.md` sección 4).

Dudas resueltas con el usuario (ya reflejadas en `description.md`):
- P: ¿Se sincroniza el id al renombrar el original? R: Sí, se renombran todas las copias vinculadas conservando el sufijo `-COPY-XXX`.
- P: ¿Se sincroniza el estado de bloqueado? R: No, es independiente por copia.
- P: ¿Afecta una interacción sobre una copia al original? R: No, cada copia es una entidad independiente para movimiento/bloqueo/interacción de juego.

## (b) Solución técnica

1. **`core/component.js` — campo `copyOf` y helpers de copia**:
   - Añadir `copyOf: null` al objeto devuelto por `createComponent()` (parámetro opcional `copyOf = null` en la firma, igual que el resto de campos).
   - Añadir una tabla local `NON_SYNCED_PROPERTY_KEYS` que mapea `type` → array de claves de `properties` que son "estado de interacción de juego" y por tanto nunca se sincronizan: `{ dado: ['resultadoActual'], carta: ['caraActual'] }`. Los demás tipos (`texto`, `tablero`, `documento`) no tienen entrada (todas sus `properties` son de configuración/diseño y se sincronizan).
   - Añadir `nextCopyId(originalId, components)`: recorre `components`, se queda con los que tengan `copyOf === originalId`, extrae de su `id` el sufijo `-COPY-(\d{3})` con una regexp, y devuelve `${originalId}-COPY-${primerHueco}` con el primer entero libre (1..n) formateado a 3 dígitos con ceros a la izquierda — mismo patrón que `nextCloneId`, pero basado en `copyOf` en vez de en el propio `id` (evita la fragilidad ya señalada en los apuntes técnicos de `description.md`).
   - Añadir `createCopy(component, components)`: análogo a `cloneComponent`, devuelve `{ ...component, id: nextCopyId(component.id, components), copyOf: component.id, properties: { ...component.properties }, x: component.x + 30, y: component.y + 30, order: null }`. Al ser un spread superficial del original en el momento de crear la copia, los campos independientes (`bloqueado`, etc.) parten del valor actual del original pero quedan desacoplados a partir de ahí — mismo criterio que ya usa `cloneComponent`.
   - Añadir `renameCopyId(copyId, oldOriginalId, newOriginalId)`: `newOriginalId + copyId.slice(oldOriginalId.length)` — sustituye solo el prefijo, conservando el sufijo `-COPY-XXX` tal cual (usado al renombrar el id de un original con copias).
   - Añadir `syncCopyWithOriginal(copy, original)`: devuelve el `copy` con estos campos sustituidos por los del `original` — `type`, `name`, `image`, `width`, `height`, `mostrarTooltip`, `subirAlMoverInteractuar` — y `properties` reconstruido como la unión de "las propiedades sincronizables del original" (todas menos las de `NON_SYNCED_PROPERTY_KEYS[original.type]`) más "las propiedades no sincronizables ya presentes en la copia" (las de `NON_SYNCED_PROPERTY_KEYS[copy.type]`, tomadas de `copy.properties`, para no perder p. ej. el `resultadoActual` propio de esa copia de dado). `x`, `y`, `order`, `bloqueado` y el resto de campos de la copia no se tocan.

2. **`core/state.js` — enganchar la sincronización y el borrado en cascada**:
   - Importar `syncCopyWithOriginal` y `renameCopyId` de `core/component.js`.
   - Modificar `replaceComponent(id, updatedComponent)`: tras sustituir la entrada en `state.components`, si `updatedComponent.copyOf` es `null`/`undefined` (es decir, se acaba de modificar un original, no una copia), recorrer el resto de `state.components` y, para cada uno con `copyOf === id` (el id *antiguo*, el que tenía antes de esta actualización — cubre también el caso de renombrado), sustituirlo por el resultado de `syncCopyWithOriginal(copia, updatedComponent)`; si además `updatedComponent.id !== id` (el id ha cambiado), aplicar también `copyOf: updatedComponent.id` y `id: renameCopyId(copia.id, id, updatedComponent.id)` sobre ese resultado. Todo esto antes del único `emit('components:changed', ...)` ya existente al final de la función (no se añade ningún emit nuevo).
   - Modificar `removeComponent(id)`: antes de filtrar, calcular el conjunto de ids a eliminar como `{ id } ∪ { c.id : c.copyOf === id }` (borrado en cascada de las copias vinculadas al original que se elimina) y filtrar `state.components` excluyendo ese conjunto completo, en vez de excluir solo `id`. El resto de la función (`compactOrders` + `emit`) no cambia. Si el componente eliminado es a su vez una copia (tiene su propio `copyOf`), el conjunto adicional queda vacío (ninguna copia puede tener copias, ver (a)) y el comportamiento es el borrado simple ya existente.

3. **`ui/componentList.js` — columna "Copia" y acciones condicionadas por fila**:
   - Añadir `'copia'` a `COMPONENT_LIST_COLUMNS` (orden: `['orden', 'id', 'tipo', 'copia', 'acciones']`, igual que en la maqueta `design_panel-componentes-columna-copia.html`) y `copia: 'Copia'` a `headLabels`.
   - En `renderBody`, añadir la celda de la nueva columna entre `tipo` y `acciones`: texto `'✓'` si `component.copyOf` es truthy, celda vacía en caso contrario (mismo lenguaje visual ya usado para marcar éxito en `ui/batchUploadSummaryModal.js`, sin introducir CSS nuevo).
   - Añadir un nuevo parámetro `onCopy` a `renderBody`/`renderComponentList` (propagado igual que `onClone`), que crea el botón "Copiar" en la columna de Acciones.
   - Condicionar la aparición de los botones "Clonar" y "Copiar" (no la de "Editar"/"Eliminar", que siguen apareciendo siempre) a que la fila **no** sea una copia: envolver la creación de esos dos botones con `if (onClone && !component.copyOf)` / `if (onCopy && !component.copyOf)` en vez del actual `if (onClone)`.

4. **`modes/edit/editMode.js` — conectar creación de copia y modal reducida**:
   - Importar `createCopy` de `../../core/component.js`.
   - En `renderList()`, añadir `onCopy: (component) => { const copy = createCopy(component, getComponents()); addComponent(copy); }` junto a `onClone` (mismo patrón: crear y añadir de inmediato, sin modal previa).
   - Modificar `openEditModalFor(component)`: si `component.copyOf` es truthy, en vez de `openComponentModal(...)`, invocar la nueva `openCopyComponentModal({ component, onDelete: ... })` (ver tarea 5) con el mismo `onDelete` ya usado en el resto de la función (borra y limpia `selectedComponentId` si coincide). Si `component.copyOf` es falsy, el comportamiento no cambia. Como `onSelect: openEditModalFor` en `renderTable()` y `onEdit: openEditModalFor` en `renderList()` ya reutilizan esta misma función, tanto el click/doble-click sobre la representación en la mesa como el botón "Editar" de la fila quedan cubiertos sin tocar esos dos puntos de llamada.
   - `openAddModal()` no necesita cambios: un componente recién creado nunca tiene `copyOf`.

5. **Nuevo módulo `ui/copyComponentModal.js` — modal reducida de una copia**:
   - Exporta `openCopyComponentModal({ component, onDelete })`. Reutiliza las clases ya existentes `.modal-overlay`/`.modal`/`.modal__header`/`.modal__content`/`.modal__footer`/`.btn-eliminar`/`.btn-cancel`/`.btn-accept` (mismo lenguaje visual que `ui/componentModal.js`, sin CSS nuevo), sin pestañas.
   - Contenido: un campo de solo lectura con el `id` de la copia, un aviso informativo (texto fijo indicando que es una copia sincronizada con otro elemento — mismo tono que el resto de avisos de la app, p. ej. `ui/resourceList.js`) y un campo de solo lectura con `component.copyOf` (id del original).
   - Pie: botón "Eliminar" (con el mismo `confirm(`¿Eliminar el componente "${component.id}"?`)` ya usado en el resto de la app) que invoca `onDelete(component)` y cierra la modal; "Cancelar" y "Aceptar" simplemente cierran la modal sin más acción (no hay nada editable que confirmar).
   - Cierre al hacer click fuera del modal, mismo patrón que `openComponentModal` (`mousedownOnOverlay`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 ("Modelo de datos de componente"):
- Añadir `copyOf: string | null` al bloque de campos generales del modelo de componente, con su semántica (id del componente original si este componente es una "Copia" vinculada; `null` en el resto de casos).
- Documentar el nuevo mecanismo de sincronización copia→original: qué campos/propiedades se sincronizan y cuáles quedan siempre independientes por copia (posición, orden, `bloqueado`, y las claves de `properties` marcadas como "estado de interacción de juego" por tipo — `resultadoActual` en `'dado'`, `caraActual` en `'carta'`), dónde vive la lógica (`core/component.js`: `createCopy`/`nextCopyId`/`renameCopyId`/`syncCopyWithOriginal`; `core/state.js`: enganchado en `replaceComponent`/`removeComponent`), y el borrado en cascada al eliminar un original.
- Documentar el nuevo `ui/copyComponentModal.js` (modal reducida sin pestañas para una copia) junto a la entrada ya existente de `ui/componentModal.js`, y la nueva columna "Copia" / botón "Copiar" de `ui/componentList.js` junto a la entrada de "Clonar" ya documentada en la sección 5.
