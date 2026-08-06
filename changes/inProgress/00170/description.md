- **Nombre**: Menú contextual para elementos en Modo Edición
- **Código**: 00170
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

añadir un menú contextual para todos los elementos en el modo edición con las siguientes acciones:

en una sección:
- Clonar (mismo comportamiento que el botón de la lista de elementos)
- Copiar (mismo comportamiento que el botón de la lista de elementos)
- Eliminar (mismo comportamiento ya en la tecla SUPR)

Este menú contextual funciona con todos los elementos seleccionados (se clonan todos, se copian todos o se eliminan todos)

en otra sección añadir:
- Añadir a grupo + combo con los diferentes grupos disponibles en orden alfabético. Esta acción añade todos los elementos seleccionados al grupo seleccionado, sin modificar nada más. Si algún elemento pertenecía a otros grupos previamente, eso no cambia, solo se añade un grupo más

## Descripción completa

En Modo Edición, al hacer clic con el botón derecho sobre un elemento dibujado en la mesa, se abre un menú contextual junto al cursor (el mismo tipo de menú que ya existe hoy en Modo Juego al hacer clic derecho sobre un elemento).

El menú tiene dos secciones, separadas visualmente entre sí:

**Sección 1 — acciones sobre los elementos:**
- **Clonar**: igual que el botón "Clonar" que ya existe en el listado de elementos del panel flotante.
- **Copiar**: igual que el botón "Copiar" que ya existe en ese mismo listado.
- **Eliminar**: igual que ya hace hoy pulsar la tecla SUPR (pide confirmación).

**Sección 2 — asignación a grupo:**
- **Añadir a grupo**: un desplegable con todos los grupos existentes en la partida, listados en orden alfabético. Al elegir uno, añade ese grupo a todos los elementos afectados por la acción, sin quitarles ningún otro grupo al que ya pertenecieran ni tocar ninguna otra propiedad suya.

**Alcance sobre selección múltiple**: si hay varios elementos seleccionados a la vez, cualquiera de las cuatro acciones del menú se aplica a todos ellos (se clonan todos, se copian todos, se eliminan todos, o se añaden todos al grupo elegido), no solo al elemento sobre el que se hizo clic derecho.

**A qué elemento(s) afecta el clic derecho:**
- Si el elemento sobre el que se hace clic derecho ya formaba parte de la selección múltiple actual, esa selección se mantiene tal cual y el menú actúa sobre todos sus elementos.
- Si el elemento sobre el que se hace clic derecho no estaba en la selección actual, el clic derecho lo selecciona a él en solitario (sustituyendo cualquier selección anterior, igual que ya hace un clic izquierdo normal) y el menú actúa solo sobre ese elemento.

**Casos límite:**
- Clonar/Copiar: si algún elemento de los afectados es una "Copia" vinculada a otro (las copias no se pueden clonar ni copiar de nuevo, igual que ya pasa hoy con los botones del listado), esa acción se omite silenciosamente solo para esos elementos — el resto de la selección se clona/copia con normalidad.
- Eliminar: mantiene exactamente la confirmación que ya existe hoy (aviso simple si es un único elemento, listado detallado de afectados si son varios).
- Añadir a grupo cuando todavía no existe ningún grupo creado en la partida: la opción "Añadir a grupo" aparece pero deshabilitada (no se puede desplegar ni elegir nada) hasta que exista al menos un grupo.
- Añadir a grupo cuando algún elemento seleccionado ya pertenecía a ese grupo: no pasa nada con ese elemento en concreto (no se duplica), y el resto de elementos que no lo tuvieran sí lo reciben.
- El menú contextual funciona igual independientemente de si el elemento está bloqueado para el movimiento o no — el bloqueo en Modo Edición nunca ha impedido editar, clonar, copiar, eliminar ni gestionar grupos, solo mover.

**Fuera de alcance de este cambio**: el menú contextual solo se activa haciendo clic derecho sobre la representación de un elemento en la mesa. No se activa haciendo clic derecho sobre una fila del listado de elementos del panel flotante, ni sobre una zona vacía de la mesa.

## Apuntes técnicos

- Reutilizar `ui/contextMenu.js` (`openContextMenu`), el mismo componente genérico ya usado por el menú contextual de Modo Juego (cambio 00088, `modes/play/playMode.js`). Ya soporta dos secciones (`generalItems`/`specificItems`) con separador automático entre ellas, y filas `disabled`.
- Conectar `onContextMenu` (parámetro ya existente de `ui/componentRenderer.js#renderComponentsOnTable`, hoy usado solo por `playMode.js`) en la llamada que hace `modes/edit/editMode.js#renderTable()`.
- Clonar → `core/component.js#cloneComponent` + `addComponent` (mismo camino que `editMode.js` usa hoy en `onClone` de `ui/componentList.js`). Copiar → `core/component.js#createCopy` + `addComponent` (mismo camino que `onCopy`). Ambos ya excluyen copias vinculadas por fila en el listado (`!component.copyOf`); replicar ese filtro para la selección múltiple.
- Eliminar → reutilizar `editMode.js#attemptDeleteComponents` tal cual, mismo camino que ya usa `deleteSelectedComponent()` (atajo SUPR).
- Selección múltiple ya vive en `editMode.js` como `selectedComponentIds` (`Set<string>`, estado de módulo). El criterio de "clic derecho reemplaza si el elemento no estaba en la selección" es análogo al de `toggleSelect`, pero sin toggle (siempre reemplaza si no estaba, nunca añade con Ctrl).
- Grupos: `core/state.js#getGroups()` + `core/textSort.js#sortByName` para el orden alfabético (mismo criterio que `ui/groupList.js` y la sección "Grupos" de `ui/componentModal.js`). Añadir el grupo a `grupoIds` de cada componente afectado vía `updateComponent`/`replaceComponent`, deduplicando (`grupoIds` es un array, no un Set).
- `ui/contextMenu.js#addRow` hoy solo genera icono + etiqueta + `onClick` (no soporta un `<select>` inline) — la fila "Añadir a grupo" con su desplegable puede requerir un tipo de item nuevo en ese componente compartido, o una fila propia con su propio elemento `<select>`. A decidir en `ms-how`.
- No se ha detectado ninguna incongruencia entre `design/docs/ARCHITECTURE.md` y el código real durante este análisis.
