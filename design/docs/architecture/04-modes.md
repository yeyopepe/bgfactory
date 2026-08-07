# Modo juego vs modo edición

Ambos modos **comparten el mismo modelo de datos**: la lista de componentes en `core/state.js`. No hay dos modelos distintos — modo edición crea/modifica componentes con `core/component.js`, modo juego lee esos mismos componentes para mostrarlos/usarlos en la partida.

- `ui/editModeToggle.js` implementa flujo de entrar/salir (no selector de dos opciones) sobre `core/state.js` (`mode: 'play' | 'edit'`): `renderEnterEditButton` (modo juego, botón "Entrar en modo edición") y `renderEditToolbar` (modo edición, franja fija superior con "Salir del modo edición"). Ambas operan sobre `setMode()`/evento `mode:changed` de `core/state.js`, sin cambios en esa capa.
- Cambio de modo emite `mode:changed`; `main.js` vuelve a renderizar la pantalla activa (`modes/play/playMode.js` o `modes/edit/editMode.js`).

## Modo edición: mesa y paneles

`modes/edit/editMode.js` renderiza mesa infinita (pan/zoom) con componentes dibujados directamente sobre ella (`ui/componentRenderer.js`, seleccionables con click), más panel flotante "Componentes" (anclado esquina superior derecha, colapsable) con listado en tabla (columnas Id/Tipo/Acciones) y modal de edición (`ui/componentModal.js`).

- Botón "Editar" del listado, o click sobre representación en mesa, abren la misma modal.
- Botón "Eliminar" del listado borra directamente, pidiendo confirmación previa (borrado no disponible haciendo click en la mesa).
- Botón "+ Añadir componente" abre modal vacía para crear uno nuevo.

**Selección múltiple con Ctrl**: click sobre fila de tabla o representación en mesa invoca `toggleSelect(component, event)`, que gestiona conjunto de ids seleccionados (`selectedComponentIds`, `Set<string>`, estado en memoria, no persistido) en vez de un único id.

- Clic normal reemplaza la selección completa por ese único elemento (o la vacía si ya era el único seleccionado).
- Ctrl+clic (o Cmd+clic) añade o quita ese elemento sin tocar el resto.
- Mesa y listado resaltan con el mismo contorno discontinuo (`--selected`) todos los elementos del conjunto a la vez.
- Solo "Eliminar" se generaliza a selección múltiple: con más de un elemento seleccionado, SUPR o botón "Eliminar" de cualquier fila de la selección abren `ui/bulkDeleteConfirmModal.js` (enumera id y tipo de cada elemento) en vez del `confirm()` nativo de un único componente (que se sigue usando si solo hay uno seleccionado).
- Redimensionado solo se ofrece con selección de exactamente un elemento.
- Arrastrar uno de varios seleccionados los mueve a todos en bloque, manteniendo distancias relativas (calculado en `editMode.js` a partir del delta del componente arrastrado).

`modes/play/playMode.js` renderiza la misma mesa infinita, con componentes de cualquier tipo dibujados genéricamente vía `ui/componentRenderer.js`. Mantiene su propio estado de selección transitorio a nivel de módulo (`selectedComponentId`, fuera de `renderPlayMode` para sobrevivir a remontados por `components:changed`), ligado al menú contextual de click derecho: reutiliza la clase `--selected` por tipo (`ui/componentRenderer.js`, parámetro `selectedIds`, pasado como conjunto de un único elemento o vacío) sin usar `onToggleSelect` (click izquierdo no cambia su comportamiento). No muestra listado aparte.

## Menú contextual de componente en modo juego

Click derecho sobre un componente en `modes/play/playMode.js` invoca `onContextMenu` (parámetro de `renderComponentsOnTable`, ver `05-ui-layer.md`) para seleccionarlo y abrir `ui/contextMenu.js` (`openContextMenu`) junto al cursor.

- Si `component.accionClickDerecho === 'ninguno'`: el callback retorna sin hacer nada (ni selecciona, ni abre el menú).
- Si `'menuContextual'`: abre el menú con una fila general "Bloquear"/"Desbloquear" que alterna `component.bloqueado` (patrón `replaceComponent`/`updateComponent`) — toggle binario sobre el campo de 3 valores: "Bloquear" fija `'juego'`, "Desbloquear" fija `'ninguno'` (independiente del valor previo).
- Menú admite bloque de acciones específicas por tipo (`specificItems`), separado del general por línea divisoria solo si el bloque no está vacío (ver `'mazo'` en `02-component-types.md`).

## Menú contextual de elemento en modo edición

`modes/edit/editMode.js` conecta también `onContextMenu` en su llamada a `renderComponentsOnTable` (`handleComponentContextMenu`), a diferencia de `playMode.js`, sin condicionarlo a `accionClickDerecho` ni a `bloqueado` (ambos campos no restringen nada en este modo).

- Click derecho sobre componente ya en `selectedComponentIds` deja la selección intacta; si no formaba parte, la reemplaza por ese único elemento (mismo criterio de reemplazo que `toggleSelect`, sin toggle).
- Menú actúa siempre sobre el conjunto resultante (`affectedComponents`):
  - Sección general: "Clonar" (`core/component.js#cloneComponent` + `addComponent`, uno a uno) y "Copiar" (mismo patrón con `createCopy`) — ambas deshabilitadas si ningún elemento afectado es clonable (todos con `copyOf`), omitiendo en silencio los que sí lo tengan en selección mixta. "Eliminar" reutiliza `attemptDeleteComponents` (mismo camino que SUPR).
  - Sección específica: fila "Añadir a grupo" — `<select>` (tipo de fila de `ui/contextMenu.js`, ver `05-ui-layer.md`) con grupos existentes (`getGroups()` + `core/textSort.js#sortByName`); al elegir uno, añade su id a `grupoIds` de cada elemento afectado que no lo tuviera (sin tocar el resto de `grupoIds`), muestra `showToast('Grupo añadido')`. Sin ningún grupo en la partida, fila deshabilitada.

## Indicadores visuales en modo edición

- **Candado**: `editMode.js` pasa `showLockIndicator: true` a `renderComponentsOnTable`, que superpone insignia sobre componente con `bloqueado !== 'ninguno'`. En modo juego no se pasa (bloqueo solo se percibe vía menú contextual).
- **Oculto**: `editMode.js` pasa `showHiddenIndicator: true`, insignia en esquina inferior derecha (convive con candado) sobre componente con `oculto` activo. En modo juego no hace falta indicador: `playMode.js` filtra directamente los componentes ocultos antes de renderizar.
- **Copia**: `editMode.js` pasa `showCopyIndicator: true`, tercera insignia (esquina inferior izquierda, fondo `var(--error)`, ver `design/docs/style/01-tokens-visual.md`) sobre componente con `copyOf` no nulo. `ui/componentRenderer.js` añade clase `is-copy` (junto a `--selectable`) usada por `main.css` para pintar en rojo (en vez de azul) el contorno de selección/hover y el fondo de `.component-id-label`. En modo juego no se pasa `showCopyIndicator`.

**Arrastre restringido en modo edición**: `editMode.js` pasa `canMove: (component) => component.bloqueado !== 'todos'` a `renderComponentsOnTable` — componente con `bloqueado: 'todos'` no se arrastra tampoco en modo edición, aunque sigue editable/redimensionable/eliminable. `playMode.js` usa `canMove: (component) => component.bloqueado === 'ninguno'` (arrastre en Modo Juego solo si no hay ningún bloqueo activo).

## Cartas dentro de un mazo

A diferencia de `oculto` (solo filtrado en modo juego), carta referenciada por `properties.cartaIds` de un `'mazo'` (`core/deck.js`, `getCartaIdsEnAlgunMazo`) no se dibuja en la mesa en **ningún** modo — ambos modos la excluyen de la lista pasada a `renderComponentsOnTable`. Sigue apareciendo en el panel flotante de Componentes (sin filtrar), única vía para localizarla/editarla sin sacarla del mazo. En modo edición, arrastrar selección compuesta enteramente por cartas hasta solapar un mazo ofrece añadirlas todas a él (ver `'mazo'`, `02-component-types.md`).

## Panel "Recursos" (modo edición)

`editMode.js` monta segunda ventana flotante "Recursos" (`ui/resourceList.js`), independiente de "Componentes" (posición/ancho/colapso propios, `resourcePanelState`), solo en modo edición.

- Botón "+ Añadir recurso" despliega menú (`createAddMenu`) con tres opciones, cada una abriendo un `<input type="file">` oculto (mismo `accept` de extensiones combinadas):
  - "Subir fichero" (único fichero).
  - "Subir varios ficheros" (`multiple`).
  - "Subir carpeta" (`multiple` + `webkitdirectory`, filtra por `file.webkitRelativePath.split('/').length === 2` para quedarse con el primer nivel).
- Los tres handlers validan extensión (`core/resource.js`, `resourceTypeForFileName`) y reutilizan función interna `loadResourceFromFile(file, { id, replace })` (lee y da de alta vía `createResource`/`addResource`, o `replaceResource` si `{ replace: true }`).
- **Aviso de nombre duplicado**: antes de leer cada fichero válido, comprueba si ya existe recurso con ese nombre (`core/resource.js`, `findResourceByName`, insensible a mayúsculas/tildes).
  - Vía un único fichero: si hay coincidencia, abre `ui/resourceReplaceConfirmModal.js` antes de continuar — confirma reemplaza conservando `id`; cancela no añade nada.
  - Vías de varios ficheros/carpeta: separan ficheros sin conflicto (procesados en paralelo, `Promise.all`) de los que sí tienen (incluye colisiones entre ficheros del propio lote, resueltas contra el primero). Si hay conflicto, un único `openResourceReplaceConfirmModal` lista todos los nombres duplicados antes de completar la carga como reemplazo; sin conflicto se añaden con normalidad.
- Al terminar, siempre `ui/batchUploadSummaryModal.js` (`openBatchUploadSummaryModal`) con recuento de añadidos (incluye reemplazados) y, si los hay, detalle de omitidos por formato (tabla) y por estar en subcarpeta (recuento); carpeta sin ningún fichero válido avisa con `showErrorModal`.
- Tabla siempre ordenada alfabéticamente por nombre (`core/textSort.js` → `sortByName`, insensible a mayúsculas/tildes), aplicado dentro de `renderBody` (cubre listado completo y resultado filtrado por cuadro de texto).
- Botón "Editar" abre `ui/resourceModal.js`. Botón "Eliminar" (lista o modal) comprueba primero `isResourceInUse` — si está en uso, bloquea el borrado con aviso; si no, pide confirmación estándar y elimina. Ambos puntos de borrado comparten la misma función interna en `editMode.js`.

## Panel "Grupos" (modo edición)

`editMode.js` monta tercera ventana flotante "Grupos" (`ui/groupList.js`), independiente de las otras dos (posición/ancho/colapso propios, `groupPanelState`), apilada por defecto debajo de "Recursos", solo en modo edición. Sin columna "Tipo" (grupos no tienen tipo) y sin acción de clonar.

- Mismo redimensionado de columna (`columnWidths` en `groupPanelState`, `ui/tableColumnResize.js`) y mismo cuadro de filtro de texto libre (estado de módulo `filterText`, busca por `name`/`id`) que "Componentes"/"Recursos".
- Orden por defecto (sin ordenación de columna activa): alfabético por nombre (`sortByName`), mismo criterio que "Recursos" y la sección "Grupos" de `ui/componentModal.js`.
- Columna "Elementos": muestra por cada grupo `getComponentsUsingGroup(group.id, components).length` (mismo criterio que el borrado de un grupo en uso), recalculado en cada repintado. `renderGroupList` recibe `components` como tercer argumento posicional (entre `groups` y el objeto de callbacks), propagado desde `editMode.js` con `getComponents()` — el remontado completo de `renderEditMode()` ante `components:changed`/`groups:changed` ya lo mantiene actualizado. Participa en el menú de cabecera de columna, igual que "Nombre".
- El grupo no tiene representación visual propia en la mesa, pero su fila **sí es seleccionable**: click en cualquier punto de la fila (fuera de botones de acción, `stopPropagation`) invoca `onSelectGroup`/`selectGroup`, que sustituye por completo `selectedComponentIds` por los ids de `getComponentsUsingGroup(group.id, components)` — deselecciona antes lo existente; a diferencia de `toggleSelect`, este reemplazo es siempre incondicional, sin toggle ni modo aditivo Ctrl. Miembro que sea carta guardada dentro de un `'mazo'` (`core/deck.js#getCartaIdsEnAlgunMazo`) se saca primero a la mesa con `core/state.js#sacarCartaDeMazo` antes de quedar seleccionado (cartas del mismo mazo aparecen apiladas en su zona de revelado, sin reparto especial). Miembros seleccionados se resaltan en mesa y en Componentes igual que cualquier selección múltiple manual. La fila de grupo se resalta con `:focus` (`.group-list__row`) mientras conserve el foco real del navegador — se apaga al mover el foco fuera, sin estado JS de "grupo activo".
- Botón "+ Añadir grupo" abre `ui/groupModal.js` en modo alta (sin `group`, sin "Eliminar"); botón "Editar" de cada fila abre la misma modal en modo edición (con `group`, "Nombre" prellenado, botón "Eliminar" adicional). Botón "Eliminar" (lista o modal) comprueba primero si el grupo está en uso (`getComponentsUsingGroup`, mira `grupoIds` en cualquier tipo de componente): si no lo está, pide confirmación estándar (`confirm()`) y elimina (`removeGroup`); si lo está, abre `ui/groupDeleteConfirmModal.js` con la lista de elementos afectados (id y tipo) — al aceptar, se borra el grupo y cada elemento afectado pierde solo ese id de su `grupoIds` (conserva cualquier otro grupo que tuviera; queda "Sin grupo" solo si era el único); al cancelar no se hace nada. Ambos puntos de borrado comparten función interna `attemptDeleteGroup` en `editMode.js`, que acepta callback `onDeleted` para que `ui/groupModal.js` se cierre a sí misma tras el borrado asíncrono (a diferencia de `ui/resourceModal.js`, cuyo contrato de borrado es síncrono al apoyarse en `confirm()` nativo).

## Menú de ordenación y filtrado de cabecera de columna

Patrón común a las tres tablas de modo edición (Componentes, Recursos, Grupos). Pulsar el nombre de cualquier columna (todas menos "Acciones"; en Componentes, "Orden" solo ordena, no filtra) abre `ui/columnHeaderMenu.js` (`openColumnHeaderMenu`): desplegable con "Ordenar A..Z"/"Ordenar Z..A" (toggle: pulsar la ya activa la apaga) y, si la columna es filtrable, `<select>` con los valores distintos de esa columna sobre la lista completa sin filtrar, más "Todos" por defecto.

- A diferencia de `ui/resourceList.js#createAddMenu` (`position: absolute`), este menú usa `position: fixed` insertado en `document.body` (mismo mecanismo que `ui/contextMenu.js`) porque el `<th>` que lo abre vive dentro de contenedores con `overflow: auto`/`overflow: hidden` que recortarían un `position: absolute`.
- `ui/tableColumnMenu.js` (`attachColumnMenu`) conecta cada `<th data-col>` con el menú, calcula valores distintos por columna, pinta el indicador (`.column-header-menu__indicator`) en cabeceras presentes en `columnDefs`.
- Cada tabla mantiene su propio estado transitorio de módulo (no persistido): `columnSort` (`{ column, direction } | null`, una única ordenación activa, excluyente entre columnas de esa tabla) y `columnFilters` (`{ [column]: valor }`, acumulables en AND con el cuadro de filtro de texto libre existente).
- `core/textSort.js` añade `compareValues(a, b)` (numérico si ambos `number`, si no `localeCompare` insensible a mayúsculas/tildes) como comparador genérico, sin tocar `sortByName` (orden por defecto de Recursos/Grupos sin columna ordenada).
- El indicador se inserta siempre, con el modificador `.column-header-menu__indicator--active` marcando el único caso con algo realmente aplicado. Las tres funciones `renderBody` de `ui/componentList.js`/`ui/resourceList.js`/`ui/groupList.js` construyen siempre `<table>`+`<thead>` antes de comprobar si la lista está vacía, sustituyendo solo el `<tbody>` por fila de mensaje (`colspan` a todas las columnas) en ese caso — así la cabecera (y el menú de columna) no desaparece con la lista vacía.

## Refresco de UI y estado transitorio de módulo

Cualquier alta/edición/borrado de componente en modo edición emite `components:changed`, que dispara refresco (`main.js` vuelve a invocar `renderEditMode()` por completo). Por eso `modes/edit/editMode.js` mantiene la selección como estado a nivel de módulo, fuera de `renderEditMode` — si no, se perdería en cada movimiento/redimensionado/edición, no solo al recargar la página.

Colapso del panel, posición/ancho/alto (arrastre/redimensionado) y ancho de columnas viven en `core/state.js` (`panelState`, ver `06-persistence-build.md`) porque sí se persisten en el autoguardado. Redimensionado del panel (`ui/resizeHandle.js`, `axis: 'both'` mientras expandido) sin límite máximo de ancho/alto, solo mínimo (mínimo de alto deja ver cabecera de tabla + una fila) y no salir del borde derecho/inferior de la pantalla; panel colapsado (sin zona de listado visible) vuelve a redimensionado solo horizontal (`axis: 'x'`).

## Título de cabecera editable

El `<h1>` de `index.html` (vacío en el fichero fuente, `ui/appTitle.js` lo rellena en runtime) muestra el texto libre guardado en `core/state.js` (`appTitle`, ver `06-persistence-build.md`) seguido siempre de la versión (`v.NNNNN`, formateada por `core/appTitle.js` → `formatVersion()` a partir de `CURRENT_VERSION` — distinto del formato de `footer#app-version`, que muestra `CURRENT_VERSION` sin punto; ambos formatos conviven sin unificarse).

- Solo en modo edición el texto libre es editable: click sobre el `h1` lo convierte en `<input>` in-place (estado transitorio `editing`, variable de módulo de `ui/appTitle.js`, no persistido), confirmado con `blur`/Enter llamando a `setAppTitle()` — valor vacío revierte sin llamar a `setAppTitle()`.
- La versión nunca es editable, en ningún modo.
- Nombre de fichero por defecto de "Guardar" y "Exportar" (`ui/editModeToggle.js`) es el título completo (`getFullAppTitle(getAppTitle())`).
- JSON ligero de "Exportar" (`core/persistence.js` → `buildComponentsExport`) incluye el `appTitle` actual; al "Importar" (`parseImportedComponents`), ese título solo se aplica (`setAppTitle`) si el fichero lo trae y el modo de importación elegido es "Sobrescribir todo el juego" — en "Añadir a lo existente" el título de la partida en curso no se toca.

## Orden de apilado (z-index) de los paneles flotantes

`modes/edit/editMode.js` mantiene `panelStackOrder`, variable de módulo (fuera de `renderEditMode`) con claves `'component'`/`'resource'`/`'group'` ordenadas de abajo a arriba.

- Cada uno de los tres contenedores de panel (`listContainer`/`resourceListContainer`/`groupListContainer`) tiene listener de `mousedown` en fase de captura que llama a `bringPanelToFront(key, panelsByKey)`: mueve esa clave al final de `panelStackOrder` y reaplica `z-index` de los tres contenedores (`applyPanelStackOrder`, valor `15 + índice`) para que el interactuado quede siempre por encima.
- El `z-index: 15` fijo que tenían antes los tres contenedores en `main.css` se ha quitado: ese valor lo asigna siempre `applyPanelStackOrder` inline.
- Transitorio, no vive en `core/state.js` ni se persiste: al recargar vuelve siempre al orden por defecto (`['component', 'resource', 'group']`).
