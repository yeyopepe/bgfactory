# Diseño técnico — Prototipo digital "Errantes"

## 1. Objetivo y restricciones

El prototipo digital debe:

- Funcionar en cualquier navegador moderno.
- Ser **portable**: el entregable es un único fichero HTML autocontenido (JS y CSS incrustados, cualquier librería externa embebida en el propio fichero). Debe poder abrirse con doble clic (`file://`), sin servidor ni instalación.
- No depender de Node.js ni de ninguna herramienta de build compleja: el proceso de generación del entregable usa Python, ya disponible sin instalación adicional.

El código fuente, en cambio, se mantiene organizado en ficheros y capas separadas dentro de `/src` para facilitar el mantenimiento. Un script de build (`src/scripts/build.py`) transforma ese código fuente en un fichero único versionado bajo `src/_output/versions/`.

## 2. Arquitectura por capas

```
core/    → estado de la aplicación, modelo de datos (componentes y recursos), bus de eventos, persistencia y exportación a fichero
modes/   → modo juego (play) y modo edición (edit), cada uno con su propia carpeta
ui/      → elementos de interfaz reutilizables entre modos
data/    → datos de versión de la app y recursos por defecto de la galería
main.js  → bootstrap: conecta las capas anteriores
```

Dependencias entre capas (flecha = "depende de"):

```
modes/* ──▶ ui/* ──▶ core/*
modes/* ──────────▶ core/*
main.js ──▶ data/*, ui/*, modes/*, core/*
```

`core` no depende de ninguna otra capa. `ui` solo depende de `core` (lee/escribe estado). `modes` compone `ui` y `core` para construir cada pantalla. `main.js` es el único punto que conoce y conecta todas las capas.

Comunicación entre capas: el estado (`core/state.js`) es la única fuente de verdad; los cambios se notifican mediante un bus de eventos simple (`core/eventBus.js`, `emit`/`on`) para que la UI se vuelva a renderizar sin acoplar los módulos entre sí.

## 3. Modo juego vs modo edición

Ambos modos **comparten el mismo modelo de datos**: la lista de componentes en `core/state.js`. No hay dos modelos distintos para "editar" y "jugar" — el modo edición crea/modifica componentes con `core/component.js`, y el modo juego lee esos mismos componentes para mostrarlos/usarlos en la partida.

- `ui/editModeToggle.js` implementa un flujo de entrar/salir (no un selector de dos opciones) sobre `core/state.js` (`mode: 'play' | 'edit'`), con dos funciones: `renderEnterEditButton`, que en modo juego muestra el botón "Entrar en modo edición"; y `renderEditToolbar`, que en modo edición muestra una franja fija en la parte superior con el botón "Salir del modo edición". Ambas operan siempre sobre `setMode()` / evento `mode:changed` de `core/state.js`, sin cambios en esa capa.
- Al cambiar de modo se emite `mode:changed`, y `main.js` vuelve a renderizar la pantalla activa (`modes/play/playMode.js` o `modes/edit/editMode.js`).
- `modes/edit/editMode.js` ahora es funcional: renderiza una mesa infinita (pan/zoom) con los componentes dibujados directamente sobre ella (vía `ui/componentRenderer.js`, seleccionables con click para editar), y un panel flotante (anclado en la esquina superior derecha de la mesa, colapsable) con el listado de componentes en formato tabla (columnas Id/Tipo/Acciones) con acciones de alta/edición/borrado, y una modal de edición (`ui/componentModal.js`) para crear/modificar componentes. El botón "Editar" del listado, o hacer click sobre la representación de un componente en la mesa, abren la misma modal; el botón "Eliminar" del listado lo borra directamente, pidiendo confirmación previa (el borrado no está disponible haciendo click en la mesa); el botón "+ Añadir componente" abre la modal vacía para crear uno nuevo. Al hacer click sobre una fila de la tabla (selección única con toggle, estado en memoria, no persistido) se resalta con un contorno discontinuo la representación del componente correspondiente sobre la mesa. `modes/play/playMode.js` renderiza la misma mesa infinita, con los componentes "texto" dibujados sobre ella (sin interacción de selección), y ya no muestra ningún listado aparte.
- `modes/edit/editMode.js` monta además una segunda ventana flotante, "Recursos" (`ui/resourceList.js`), independiente de la de Componentes (posición/ancho/colapso propios, `resourcePanelState`), solo en modo edición. El botón "+ Añadir recurso" abre el selector de fichero del sistema (input oculto, extensiones de imagen y tipografía combinadas); según la extensión elegida (`core/resource.js`, `resourceTypeForFileName`) se crea directamente un recurso del tipo correspondiente (sin modal de alta) o se avisa si el formato no está soportado. El botón "Editar" abre `ui/resourceModal.js`; el botón "Eliminar" (en la lista o dentro de la modal) comprueba primero si el recurso está en uso (`isResourceInUse`) — si lo está, bloquea el borrado con un aviso; si no, pide confirmación estándar y lo elimina. Ambos puntos de borrado comparten la misma función interna en `editMode.js`.
- Cualquier alta/edición/borrado de un componente en modo edición emite `components:changed`, que dispara el refresco de la UI (`main.js` vuelve a invocar `renderEditMode()` por completo). Por eso `modes/edit/editMode.js` mantiene la selección como estado a nivel de módulo, fuera de la función `renderEditMode` — de lo contrario se perdería cada vez que se mueve/redimensiona/edita cualquier componente, no solo al recargar la página. El colapso del panel y su posición/ancho (arrastre/redimensionado), en cambio, viven en `core/state.js` (`panelState`, ver sección 6.1) porque sí se persisten en el autoguardado.

## 4. Modelo de datos de componente

Modelo genérico y extensible, pensado para no requerir cambios estructurales cuando se definan los tipos concretos de componente (cartas, tokens, tablero, tracks...):

```js
{
  id: string,          // identificador único (generado con crypto.randomUUID(), pero ahora editable por el usuario en la modal)
  type: string,         // libre, p.ej. "carta", "token", "tablero", "texto"
  name: string,
  properties: object,   // pares clave-valor libres, específicos de cada tipo
  image: string | null, // referencia a un recurso en /src/img, opcional
  x: number,             // posición en el mundo de la mesa, en píxeles
  y: number,             // posición en el mundo de la mesa, en píxeles
  width: number | null,  // ancho en píxeles, null = automático según contenido
  height: number | null, // alto en píxeles, null = automático según contenido
  bloqueado: boolean,    // si el componente NO se puede mover en modo juego (true por defecto)
}
```

`createComponent()` inicializa `x`/`y` a `0` por defecto; al crear un componente desde el modo edición se le asigna una posición inicial que no se solapa con los componentes ya existentes. `width`/`height` se inicializan a `null` (tamaño automático según contenido) y solo se fijan explícitamente cuando el usuario redimensiona el componente desde modo edición (ver `ui/componentRenderer.js` en la sección 5). `bloqueado` se inicializa a `true` y solo es editable desde la pestaña "Generales" de `ui/componentModal.js`; controla si `modes/play/playMode.js` habilita el arrastre de ese componente en modo juego (habilitado cuando **no** está marcado — ver sección 5, `ui/componentRenderer.js`).

`core/component.js` expone `createComponent()` y `updateComponent()` como única vía para construir/modificar componentes, evitando que cada capa maneje la forma del objeto directamente. El `id` sigue siendo generado por `createComponent()`, pero ahora puede ser editado por el usuario desde `ui/componentModal.js` con validación de no-vacío y unicidad (la validación se hace en la capa UI, no en `core/component.js`, siguiendo la separación de responsabilidades). Cuando el juego necesite tipos con reglas propias, se puede añadir validación/esquema por `type` sin romper componentes existentes.

### Tipos de componente implementados

- **`'texto'`**: primer tipo concreto. Propiedades específicas en la modal:
  - `contenido` (string): texto que se muestra
  - `tamañoFuente` (number): tamaño en píxeles
  - `colorTexto` (string, color hex): color del texto (negro por defecto)
  - `colorFondo` (string, color hex o vacío): color de fondo, transparente si vacío (por defecto)

## 4.1 Modelo de datos de recurso (galería)

Modelo de "recurso de la galería" (imagen o tipografía usada por la partida), independiente del modelo de componente:

```js
{
  id: string,        // identificador único (crypto.randomUUID())
  name: string,       // nombre visible en la lista, editable
  type: 'imagen' | 'tipografia',
  dataUrl: string,    // contenido del fichero embebido como data URI (autocontenido, igual que el resto del estado)
  fileName: string,   // nombre original del fichero (usado para deducir el nombre inicial y el formato de fuente)
  mimeType: string,   // tipo MIME del fichero original
}
```

`core/resource.js` expone `createResource()`/`updateResource()` (mismo patrón que `core/component.js`), `resourceTypeForFileName(fileName)` (deduce el tipo a partir de la extensión, `null` si no está soportada: `png/jpg/jpeg/gif/svg/webp` → imagen, `ttf/otf/woff/woff2` → tipografía) e `isResourceInUse(resourceId, components)`. Ningún componente puede todavía "usar" un recurso (no hay conexión entre `component.image`/`properties` y la galería): esta última función ya recorre `component.image` y los valores de `component.properties` buscando una coincidencia con el id del recurso, pero hoy siempre da `false` — queda lista para que un cambio futuro conecte el consumo de recursos sin tocarla.

`core/state.js` mantiene una segunda colección independiente de la de componentes: `resources` (con `getResources`/`addResource`/`replaceResource`/`removeResource`/`loadResources`, evento `resources:changed`) y un segundo `panelState` propio para la ventana de Recursos (`resourcePanelState`, mismo shape `{ collapsed, position, width }`, evento `resourcePanelState:changed`). También mantiene un flag `resourcesSeeded` (`getResourcesSeeded`/`markResourcesSeeded`/`loadResourcesSeeded`, sin evento propio — se persiste junto al resto) que recuerda si los recursos por defecto ya se sembraron alguna vez en este guardado, para no reponerlos si el usuario los borra a propósito.

`data/defaultResources.js` exporta `DEFAULT_RESOURCES`, los 3 recursos con los que arranca cualquier sesión totalmente nueva (sin guardado ni semilla embebida): un icono SVG y dos tipografías, sembrados en `main.js` (`seedDefaultResources()`) junto al componente de texto de ejemplo. Un guardado o semilla ya existente pero anterior a esta funcionalidad (`resourcesSeeded` ausente o `false`) también recibe estos 3 recursos una única vez, vía `backfillDefaultResourcesIfNeeded()` — ver sección 6.1.

## 5. Capa UI — módulos reutilizables

Módulos de UI que se reutilizan entre modos (`modes/play` y `modes/edit`) sin conocimiento directo del modelo de datos:

- **`ui/table.js`**: mesa infinita con capacidad de pan (arrastrar) y zoom (rueda del ratón). Crea una estructura con dos elementos: `el` (la superficie completa a insertar en el DOM) y `worldEl` (contenedor interior donde cada modo añade su contenido). Completamente genérico — no conoce componentes, solo proporciona una superficie interactiva. La posición y zoom son puramente visuales, no persistidos en `localStorage` ni en el fichero exportado (se reinician al recargar la página) — pero sí se mantienen como estado de módulo (`cameraX`/`cameraY`/`zoom`, fuera de `createInfiniteTable`) para sobrevivir a los remontados completos de la mesa que provoca cada repintado de pantalla (`main.js` vuelve a invocar `createInfiniteTable` en cada `components:changed`/`mode:changed`); como solo hay una mesa activa a la vez (modo juego y modo edición son excluyentes), un único estado de cámara compartido es suficiente. Por el mismo motivo, expone también `fitToBounds(bounds, { padding = 60 })`: reencuadra la cámara de forma instantánea (sin transición) para que la caja `{ minX, minY, maxX, maxY }` recibida quede visible con margen, capado a `minZoom`/`maxZoom`, o vuelve a la vista neutra (`cameraX = cameraY = 0`, `zoom = 1`) si se le pasa `null` — la caja la calcula siempre el caller (`getComponentsBounds` de `ui/componentRenderer.js`), `table.js` sigue sin leer `state.js` ni conocer componentes.
- **`ui/resizeHandle.js`**: utilidad genérica y reutilizable que implementa el patrón estándar de redimensionado de la app (manejador de esquina inferior derecha). Expone `attachResizeHandle(hostEl, { axis = 'both', getSize, clamp, onResize, onResizeEnd })`: añade a `hostEl` un `div.resize-handle` y engancha mousedown/mousemove/mouseup sobre `document`, calculando el tamaño propuesto según `axis` (`'x'`, `'y'` o `'both'`), pasándolo por `clamp()` (límites decididos por quien la usa) y llamando a `onResize(size)` en cada movimiento (aplicación en vivo) y a `onResizeEnd(size)` una vez al soltar (para que el caller decida qué persistir). No conoce componentes ni límites propios — reutilizada por `ui/componentList.js` (panel) y `ui/componentRenderer.js` (cajas de texto).
- **`ui/componentRenderer.js`**: a diferencia de `ui/table.js`, sí conoce el modelo de componente. Expone también `getComponentsBounds(components)`, que devuelve la caja envolvente `{ minX, minY, maxX, maxY }` de todos los componentes (o `null` si no hay ninguno), usando los mismos valores por defecto que el propio renderizado (`x`/`y` a `100` y `width`/`height` al mínimo `40×24px` si no están fijados) — pensada para alimentar `fitToBounds` de `ui/table.js` desde `ui/editModeToggle.js`. Expone además `renderComponentsOnTable(worldEl, components, { onSelect, onToggleSelect, selectedId = null, onMove, onResize, canMove = () => true } = {})`, que limpia y vuelve a dibujar cada componente soportado (de momento solo `'texto'`) sobre el `worldEl` de la mesa, posicionado según su propio `x`/`y` y dimensionado según `width`/`height` si están fijados (si son `null`, tamaño automático según contenido; siempre con `overflow: hidden`); si se pasa `onSelect`, el doble-click sobre la representación la abre en la modal (`onSelect(component)`); si se pasa `onToggleSelect`, un único click la selecciona/deselecciona (toggle, invoca `onToggleSelect(component)`) — el mismo estado de selección que ya activaba la fila del panel; si `component.id === selectedId`, se le añade la clase `text-box--selected` (contorno discontinuo de resaltado) y, si se pasa `onResize`, un manejador de redimensionado (`ui/resizeHandle.js`, ambos ejes, mínimo 40×24px, sin máximo) que solo cambia el espacio ocupado, nunca `tamañoFuente`; si se pasa `onMove` y `canMove(component)` devuelve `true` (por defecto siempre `true`, preservando el comportamiento anterior), cada componente se vuelve arrastrable de forma individual (clase `text-box--movable`, cursor de arrastre; arrastre en pantalla convertido a coordenadas del mundo dividiendo por el zoom actual de la mesa), invocando `onMove(component, x, y)` al soltar con la posición final. Reutilizado por `modes/play/playMode.js` (con `onMove`/`canMove`, este último limitando el arrastre a los componentes con `bloqueado !== true`; sin `onSelect`/`onToggleSelect`/`onResize`) y `modes/edit/editMode.js` (con los cuatro originales, sin restringir `canMove`; `onToggleSelect` comparte la misma función `toggleSelect` que usa la fila del panel, para que seleccionar desde la mesa o desde el panel sea equivalente).
- **`ui/componentModal.js`**: modal de creación/edición de componentes con dos tabs ("Generales" y "Específicas"). Tab "Generales": campo `id` editable con validación en vivo (no-vacío y único), y checkbox "Bloqueado" (con `ui/helpIcon.js` asociado) que fija `component.bloqueado`. Tab "Específicas": contenido que varía según `component.type` — para `'texto'` muestra campos para contenido, tamaño de fuente, color de texto y color de fondo. Pie con botones "Cancelar" y "Aceptar" (deshabilitado si el id no es válido). Reutilizable para alta y edición.
- **`ui/helpIcon.js`**: componente genérico de ayuda contextual, reutilizable en cualquier punto de la app. Expone `createHelpIcon({ text, html })` (parámetros mutuamente excluyentes), que devuelve un `span.help-icon` con "?" y decide automáticamente su comportamiento: si `text` tiene menos de 200 caracteres, muestra un tooltip (`span.help-icon__tooltip`) al pasar el ratón por encima; en cualquier otro caso (`html` presente, o `text` con 200 caracteres o más), el click abre una ventana modal reutilizando el mismo patrón visual `modal-overlay`/`modal` de `ui/componentModal.js` (con botón "Cerrar"), insertando el contenido vía `textContent` (`text`) o `innerHTML` (`html`). No conoce el modelo de componente ni ningún dominio concreto. Reutilizado inicialmente por `ui/componentModal.js` (ayuda del checkbox "Bloqueado").
- **`ui/editModeToggle.js`**: expone `renderModeSwitcher` (botón "Entrar en modo edición" en modo juego) y `renderEditToolbar` (barra fija con "Salir del modo edición" y "Guardar" — ver sección 6 — en modo edición); sin conocer detalles de cómo se implementa cada modo. Ambas funciones añaden además, en el extremo derecho de su contenedor (`#mode-switcher` / `.edit-toolbar`), el botón icono-solo "Ajustar zoom" (mismo SVG en los dos sitios), cuyo handler calcula la caja envolvente de los componentes actuales (`getComponentsBounds` de `ui/componentRenderer.js`) y se la pasa a `fitToBounds` de `ui/table.js`.
- **`ui/toast.js`**: aviso breve no bloqueante (`showToast(message)`), reutilizado por el arranque (estado guardado corrupto/incompatible) y por el guardado a fichero (confirmación de descarga).
- **`ui/componentList.js`**: panel flotante, colapsable, arrastrable y redimensionable en ancho, con el listado de componentes en formato tabla (Id/Tipo/Acciones), usado en modo edición. Expone `renderComponentList(container, components, { onEdit, onRemove, onSelectRow, onAdd, selectedId = null, collapsed = false, onToggleCollapse, onPanelMove, onPanelResize } = {})`: cabecera con título, control de colapso y zona de arrastre (agarrando la cabecera, salvo el botón de colapsar), cuerpo con la tabla (scroll vertical si excede la altura, fila resaltada si `component.id === selectedId`) y pie con el botón "+ Añadir componente"; el cuerpo y el pie se omiten si `collapsed` es `true`. El ancho del panel (300px por defecto) vive como estilo inline en `container` (no en el nodo interno recreado en cada render), redimensionable con el mismo manejador de esquina (`ui/resizeHandle.js`, solo eje horizontal, 290–600px o mitad del viewport, recortado además para no salir del área de la mesa); el arrastre desplaza igualmente `container`, restringido al área visible de la mesa. `onPanelMove`/`onPanelResize` notifican la posición/ancho final para que el caller los conserve entre remontados de la pantalla (ver `modes/edit/editMode.js`), que a su vez los persiste en `core/state.js` (`panelState`) junto con el colapso — ver sección 6.1. Ya no se usa en modo juego (ver sección 3).
- **`ui/resourceList.js`**: panel flotante análogo a `ui/componentList.js` (mismo patrón de arrastre/colapso/resize horizontal), pero con el listado de recursos de la galería (Nombre/Tipo/Acciones, sin selección de fila). Expone `renderResourceList(container, resources, { onEdit, onRemove, onAdd, collapsed = false, onToggleCollapse, onPanelMove, onPanelResize } = {})`, con el mismo contrato de posición/ancho/colapso que `componentList.js`, persistido en `core/state.js` como `resourcePanelState` (independiente de `panelState`).
- **`ui/resourceModal.js`**: modal de edición de un recurso ya existente (el alta no pasa por esta modal), misma estructura visual que `ui/componentModal.js` (overlay/modal/header/content/footer) pero sin tabs y ramificada por `resource.type`: para `'imagen'`, nombre editable, vista previa (`<img>`) y botón "Cambiar imagen..." (input de fichero oculto, mismas extensiones que al añadir) que actualiza una copia de trabajo hasta "Aceptar cambios"; para `'tipografia'`, sin campos editables, solo vista previa de un texto de ejemplo renderizado con la tipografía (vía `ui/fontFaceRegistry.js`). Botón "Eliminar" en ambos casos, delegado siempre en el `onDelete` del caller (comprobación de uso + confirmación, ver `modes/edit/editMode.js`).
- **`ui/fontFaceRegistry.js`**: mantiene un único `<style>` (creado bajo demanda) con una regla `@font-face` por cada recurso de tipo tipografía. Expone `fontFamilyFor(resourceId)` (nombre de familia determinista, `resource-font-<id>`) y `syncFontFaces(resources)` (recalcula el `<style>` a partir de los recursos actuales); `main.js` lo sincroniza al arrancar y en cada `resources:changed`.

## 6. Flujo de desarrollo y build

- **Desarrollo**: se abre `src/index.html` (no es el entregable) con un servidor estático local — por ejemplo la extensión "Live Server" de VSCode — porque los módulos ES nativos (`<script type="module">`) no cargan correctamente vía `file://`. Este fichero referencia los módulos de `/src` directamente.
- **Build**: `src/scripts/build.py` recorre el grafo de `import`/`export` a partir de `src/main.js`, transforma cada módulo a un pequeño sistema `require`/`module.exports` en tiempo de ejecución (sin depender de bundlers ni de Node.js, solo de Python), e inserta el resultado junto con el CSS de `src/styles/main.css` dentro de una copia de `src/index.html`. El resultado, un único fichero autocontenido, se escribe en `src/_output/versions/index-v{NNNN}.html` (`NNNN` = `CURRENT_VERSION` de `src/data/version.js`) — ese es el entregable portable.

## 6.1 Persistencia y guardado a fichero

`src/index.html` incluye un `<script type="application/json" id="initial-state"></script>` vacío que sobrevive tanto al build (se copia tal cual) como a la descarga en tiempo de ejecución (se rellena antes de descargar) — actúa como "semilla" de estado embebida en cada copia del HTML.

```
Arranque (main.js):
  loadState() [core/persistence.js, localStorage]
    → válido        → loadComponents(...) + loadResources(...) + backfillDefaultResourcesIfNeeded(...)
    → corrupto/incompatible → showToast(aviso) + componente de ejemplo + recursos por defecto
    → nada guardado  → readSeedState() [<script id="initial-state">]
                          → hay semilla → loadComponents(...) + loadResources(...) + backfillDefaultResourcesIfNeeded(...)
                          → sin semilla → componente de ejemplo + recursos por defecto
```

- **Autoguardado** (`core/persistence.js`): suscrito a `components:changed`, `panelState:changed`, `resources:changed` y `resourcePanelState:changed` (`core/eventBus.js`) desde `main.js`; serializa `{ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded }` a `localStorage` ante cualquiera de esos cambios (alta/edición/borrado/movimiento/redimensionado de componente o de recurso, cambios de posición/ancho/colapso de cualquiera de las dos ventanas flotantes). Un único slot por navegador/perfil (`localStorage` no se aísla por fichero bajo `file://`), sin conservación entre navegadores/dispositivos. Al arrancar, si hay un guardado válido en `localStorage` con `panelState`/`resourcePanelState`, se hidratan con `loadPanelState()`/`loadResourcePanelState()` antes del primer render; si no los hay (guardado de una versión anterior a esa funcionalidad, semilla embebida o componente/recursos por defecto), cada panel usa sus valores por defecto (expandido, posición y ancho por defecto). `resources` se trata igual que `panelState` en cuanto a tolerancia: si falta o no es un array en el guardado/semilla, se asume `[]` en vez de invalidar todo el estado (y dispara el backfill de recursos por defecto, ver más abajo). La selección de fila (`selectedComponentId`) no forma parte de ningún `panelState` y nunca se persiste. "Guardar a fichero" (`core/fileExport.js`) incluye los cinco campos (`components`, `panelState`, `resources`, `resourcePanelState`, `resourcesSeeded`).
- **Guardar a fichero** (`core/fileExport.js`, botón "Guardar" en `ui/editModeToggle.js`): `buildExportHtml(components, resources, panelState, resourcePanelState, resourcesSeeded)` clona `document.documentElement` (CSS/JS ya embebidos por el build), sustituye el contenido de `#initial-state` por el estado actual y `downloadHtml()` lo descarga como `Blob`. El botón pide el nombre de fichero, precargado con el del fichero actual (`location.pathname`). El navegador decide, según su configuración, si sustituye o no un fichero anterior con el mismo nombre.
- **Recursos por defecto y backfill** (`data/defaultResources.js`, `main.js`): en una sesión totalmente nueva (nada guardado, sin semilla embebida, o guardado corrupto/incompatible) se siembran los 3 recursos de `DEFAULT_RESOURCES` (`seedDefaultResources()`) — un icono SVG y dos tipografías, embebidos como data URI igual que cualquier recurso añadido a mano — y se marca `resourcesSeeded = true` (`core/state.js`, `markResourcesSeeded()`). Si en cambio hay un guardado o semilla válidos (con componentes ya existentes) pero `resourcesSeeded` no es `true` — típicamente un guardado anterior a esta funcionalidad, con `resources` vacío o inexistente — `backfillDefaultResourcesIfNeeded()` los siembra igualmente esa vez, y a partir de ahí quedan como recursos normales: si el usuario los borra, no vuelven a reaparecer en cargas posteriores (ya no se repite el backfill una vez `resourcesSeeded` es `true`).

## 7. Convenciones de código

- Módulos ES (`import`/`export`) organizados por capa/responsabilidad, un fichero por módulo funcional.
- Sin dependencias externas por defecto. Si en el futuro se necesita una librería (por ejemplo, para el editor visual), solo se incorpora si su bundle puede embeberse íntegramente en el HTML final (sin llamadas a CDN en tiempo de ejecución ni instalación adicional para el usuario final).
- Los recursos gráficos van en `/src/img`, organizados por tipo de componente a medida que se definan.
- Convenciones visuales (tokens de color, tipografía, espaciado, nomenclatura BEM de clases, patrones de componente) documentadas en [STYLE_BIBLE.md](STYLE_BIBLE.md).
