- **Fecha creación**: 2026-08-14

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca — el modal de propiedades del grupo (`ui/groupModal.js`, 00202) no cambia, ni las acciones "Ocultar/Mostrar"/"Añadir a etiqueta" a nivel de grupo, ni el resto del menú contextual.

**Dudas resueltas con el usuario:** durante `ms-new` se confirmaron tres puntos (ver `description.md`): (1) el "Orden" del grupo mueve el bloque completo de miembros a esa posición, consecutivizándolos; (2) grupo y miembros se muestran siempre anidados en bloque, sea cual sea la columna de ordenación activa; (3) con un filtro activo se muestra el grupo si él o algún miembro coincide, pero debajo solo los miembros que coinciden individualmente. Ninguna duda técnica adicional en esta fase.

## (b) Solución técnica

- [x] **`core/state.js` — nueva función `reorderGroupBlock(memberIds, rawTargetOrder)`.** Generalización de `reorderComponent` (línea ~119) para mover un bloque de N ids contiguos a la vez, en vez de uno solo, dentro del mismo espacio compartido `order` 1..total. Algoritmo (ver diagrama técnico):
  1. Resuelve los componentes reales de `memberIds` sobre `state.components`, ordenados ascendente por su `order` actual (preserva su orden relativo interno — no vuelve a cambiar en el resto del algoritmo).
  2. `k` = tamaño del bloque, `n` = `state.components.length`.
  3. `maxStart = Math.max(1, n - k + 1)`; `newStart = Math.min(Math.max(rawTargetOrder, 1), maxStart)`.
  4. **Sin atajo de salida anticipada por `newStart === oldStart`**: recalcula siempre, aunque la posición de arranque no cambie. Motivo: el caso de uso "consolidar miembros dispersos a consecutivos al Agrupar" (ver tarea siguiente) llama a esta función con `rawTargetOrder` = la posición mínima YA actual de los miembros, así que `newStart === oldStart` casi siempre — pero sus `order` pueden no ser consecutivos entre sí todavía. Un atajo de "si no cambia la posición no hago nada" dejaría el bloque disperso sin consecutivizar.
  5. `others` = componentes NO incluidos en `memberIds`, ordenados ascendente por su `order` actual; recompáctalos a `1..(n-k)` consecutivos, en su mismo orden relativo.
  6. Desplaza en `others` cualquier `order` (ya recompactado) `>= newStart`, sumándole `k` — hace hueco para el bloque.
  7. Asigna a los miembros del bloque (mismo orden relativo del paso 1) los valores consecutivos `newStart, newStart+1, ..., newStart+k-1`.
  8. `emit('components:changed', state.components)` una sola vez al final.

  ```mermaid
  flowchart TD
      A(("reorderGroupBlock(memberIds, rawTargetOrder)")) --> B["Resuelve los componentes de memberIds sobre state.components, ordenados ascendente por su order actual"]
      B --> C["k = tamaño del bloque · n = state.components.length"]
      C --> D["maxStart = Math.max(1, n - k + 1)"]
      D --> E["newStart = clamp(rawTargetOrder, 1, maxStart)"]
      E --> F["others = componentes NO incluidos en memberIds, ordenados ascendente por order"]
      F --> G["Recompacta others a 1..(n-k) consecutivos, en su mismo orden relativo"]
      G --> H["Desplaza en others cualquier order recompactado >= newStart, sumándole k"]
      H --> I["Asigna al bloque (mismo orden relativo del paso B) los valores newStart..newStart+k-1"]
      I --> J["emit('components:changed') una sola vez"]

      E -.->|"Sin atajo por newStart === oldStart: se recalcula siempre"| F
  ```

- [x] **`modes/edit/editMode.js` — acción "Agrupar" del menú contextual (línea ~638-649).** Antes del bucle que asigna `groupId: newGroupId`, captura `const minOrder = Math.min(...affectedComponents.map((c) => c.order));`. Después de ese bucle (y de `addGroup(...)`), llama a `reorderGroupBlock(affectedComponents.map((c) => c.id), minOrder)` — consolida a consecutivos, a partir de la posición del primero, cualquier selección de miembros dispersos por la lista.

- [x] **`modes/edit/editMode.js` — nuevo callback `onReorderGroup`.** Función `(groupId, memberIds, newOrder) => reorderGroupBlock(memberIds, newOrder)` (el `groupId` no hace falta dentro de la función misma, pero se recibe para mantener la misma forma que `onEditGroup`/`onUngroup`, que reciben el id de la fila). Añadir a la llamada de `renderComponentList(...)` (junto a `onReorder`, línea ~768).

- [x] **`ui/componentList.js` — `buildGroupRows` calcula su propio "Orden".** En vez de `order: null` (línea 63), calcular `order: Math.min(...memberComponents.map((c) => c.order))` a partir de los componentes reales de `memberIds` (hay que resolverlos desde `components`, no solo tener sus ids). Guardar también los componentes miembro ya resueltos y ordenados ascendente por su `order` (p. ej. `__members`, sustituyendo o complementando a `__memberIds`) — los necesita el resto de tareas de este fichero para renderizar los miembros justo debajo y para saber su orden relativo.

- [x] **`ui/componentList.js` — `computeDisplayedList` construye bloques contiguos en vez de una lista plana mezclada.** Reescribir para que, tras aplicar filtro/orden de columna a nivel de **bloque** (cada grupo, con el `order`/`id`/`type` ya calculado en `buildGroupRows`, o cada componente suelto sin `groupId`, cuentan como una única entidad ordenable/filtrable — los componentes que SÍ tienen `groupId` no entran directamente en este nivel), el resultado final sea un array plano en el que cada grupo va seguido inmediatamente por sus miembros (siempre por este orden, nunca intercalados con otros bloques):
  1. Construir la lista de nivel superior: `buildGroupRows(components)` + `components.filter((c) => c.groupId == null)`.
  2. Ordenar esa lista de nivel superior por `columnSort` (si está activo) o por `order` (por defecto) — mismo criterio que hoy, aplicado ahora solo a este nivel.
  3. Filtrar la lista de nivel superior: un componente suelto se incluye si `matchesFilter`/`matchesColumnFilters` de siempre; un grupo se incluye si él mismo coincide **o** si al menos uno de sus miembros coincide (nueva función, p. ej. `groupOrAnyMemberMatches(groupRow, filterText, columnFilters)`).
  4. Aplanar: por cada entrada de nivel superior ya filtrada, si es un grupo, añadir su fila y a continuación **solo los miembros que coinciden individualmente** con `matchesFilter`/`matchesColumnFilters` (ya ordenados ascendente por su propio `order`, heredado de `__members`); si es un componente suelto, añadirlo tal cual.
  - Nota: el `columnSort`/`columnFilters` de columnas como "Tipo"/"Id" NUNCA reordena a los miembros de un mismo grupo entre sí — su orden interno es siempre el de su propio campo `order`, ascendente, pase lo que pase con la columna activa (ver `description.md`, "Anidación visual: siempre en bloque").

- [x] **`ui/componentList.js` — `renderBody`, fila de grupo: celda "Orden" editable.** Sustituir la `<td class="component-list__order-cell">` vacía (línea ~147-149) por un `<input type="number">` igual que el de una fila normal (mismo `min=1`, `max=total`, mismo saneado de dígitos en `input`, mismo clamp `Math.min(Math.max(parseInt(...),1), total)` en `change`) pero que, al confirmar, llama a `onReorderGroup(component.id, component.__members.map((m) => m.id), parsed)` en vez de `onReorder`.

- [x] **`ui/componentList.js` — `renderBody`, fila de miembro: celda "Orden" deshabilitada.** En la rama de fila normal (la que hoy maneja tanto sueltos como miembros indistintamente), cuando `component.groupId != null`: añadir clase `component-list__row--member` a la `<tr>` (para el estilo de indentación/fondo, ver (d)) y `orderInput.disabled = true` — sin listener de `change` funcional (el input deshabilitado no dispara eventos, pero omite igualmente la llamada a `onReorder` por claridad). Sigue mostrando el valor real de `component.order`.

- [x] **`ui/componentList.js` — `renderComponentList`.** Añadir `onReorderGroup` al destructuring de parámetros y a `rowHandlers`, mismo patrón que `onEditGroup`/`onUngroup`.

## (c) Cambios de arquitectura [aplicado]

- **`design/docs/architecture/01-component-model.md`**, sección "Lógica de `order`": añadir que, desde 00204, un miembro de un grupo no edita su propio `order` directamente — se edita en bloque desde el "Orden" de la fila de su grupo (`core/state.js#reorderGroupBlock`, generalización de `reorderComponent` para mover N ids contiguos a la vez). Mencionar que "Agrupar" consolida automáticamente a consecutivos los `order` de los miembros seleccionados (a partir del menor de ellos) en el momento de formar el grupo.
- **`design/docs/architecture/04-modes.md`**, sección "Grupos en modo edición" (bullet "Panel 'Componentes'", ampliado en 00202): añadir que la fila de grupo tiene ahora su propio "Orden" (calculado como el mínimo de sus miembros) editable, que mueve el bloque completo; y que sus miembros se muestran siempre anidados justo debajo (indentados, con fondo distinto), nunca intercalados con el resto de filas, independientemente de la columna de ordenación activa — con la salvedad del filtro (se muestra el grupo si él o algún miembro coincide, pero solo los miembros que coinciden individualmente quedan visibles debajo).

## (d) Cambios en estilo [aplicado]

- **`design/docs/style/02-componentes-layout.md`** (o el fichero de esta carpeta que cubra patrones de tabla/lista — revisar `INDEX.md` de `design/docs/style/` al implementar): documentar la nueva clase `.component-list__row--member` (`src/styles/main.css`) — fila de miembro de grupo anidada bajo su fila de grupo: `padding-left` adicional en `.component-list__id-cell` (indentación, sin línea conectora ni icono — confirmado por el usuario sobre la maqueta) y un fondo sutil distinto al de una fila normal (mismo tono que ya usa `.component-list__row--group`/`--section-accent` como referencia de familia visual, pero un valor de fondo propio, no reutilizar el azul de selección). Añadir también la regla CSS en `src/styles/main.css`, junto a `.component-list__row--group` (línea ~141 de `componentList.js`, sección "Component list" de `main.css`).

## (e) Verificación

- [x] Formar un grupo de 2+ componentes con órdenes dispersos (p. ej. 1, 4 y 7 de un total de 8): al agruparse, sus `order` pasan a ser consecutivos a partir del menor (1, 2, 3), y el resto de componentes se recompacta sin huecos.
- [x] La fila de grupo resultante muestra un campo "Orden" editable con el valor del bloque (el menor de sus miembros).
- [x] Los miembros del grupo aparecen inmediatamente debajo de la fila de grupo, indentados y con fondo distinto, con su campo "Orden" deshabilitado mostrando su valor real — intentar editarlo no tiene efecto.
- [x] Editar el "Orden" de la fila de grupo a un valor válido dentro de rango: el bloque completo (grupo + miembros) se desplaza a esa posición, los miembros quedan consecutivos ahí manteniendo su orden relativo interno, y el resto de componentes se reordena para hacer hueco.
- [x] Editar el "Orden" de la fila de grupo a un valor fuera de rango (p. ej. mayor que el total, o que no deja hueco para todo el bloque): se ajusta automáticamente al límite más cercano que permite que el bloque completo quepa.
- [x] Con la tabla ordenada por otra columna (Id o Tipo, vía menú de cabecera): el grupo y sus miembros se siguen mostrando como bloque contiguo (miembros siempre ordenados entre sí por su propio Orden), cambiando solo la posición relativa del bloque frente a otras filas/grupos.
- [x] Con un filtro de texto que coincide con un miembro pero no con el grupo ni con el resto de miembros: se muestra la fila de grupo con solo ese miembro debajo.
- [x] Con un filtro de texto que no coincide ni con el grupo ni con ninguno de sus miembros: no se muestra nada de ese grupo.
- [x] Desagrupar: cada miembro conserva su `order` tal cual (el que tenía dentro del bloque), deja de aparecer anidado y su campo "Orden" vuelve a ser editable con normalidad.
- [x] El apilado visual en la mesa (z-index) de los miembros de un grupo tras renumerarlos sigue siendo coherente con su nuevo `order` — el de número más bajo se sigue dibujando por encima, igual que cualquier otro componente.
