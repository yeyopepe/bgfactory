## (a) Anotaciones funcionales

- **Fuera de alcance**: proporciones especiales para "Mazo" (circular/hexagonal). Solo es una caja rectangular, con una orientación "Vertical"/"Horizontal" (ver tarea 6), sin más formas.
- **Fuera de alcance**: límite al número de cartas de un mazo, o validación de que las cartas metidas sean "compatibles" entre sí.
- **Fuera de alcance**: deshacer/rehacer barajar, sacar una carta, o meter cartas en un mazo (arrastrando o desde el menú).
- **Duda resuelta con el usuario**: las cartas dentro de un mazo no se dibujan en la mesa en **ningún** modo (ni edición ni juego) — solo "Oculto" se comporta de forma distinta entre modos, esto no. Siguen visibles en el panel flotante de Componentes.
- **Dependencia ya resuelta**: la parte de "arrastrar cartas seleccionadas sobre un mazo" (tarea 7) se dejó pendiente en `description.md` por depender de selección múltiple de componentes, que no existía. Los cambios 00108 (selección múltiple con Ctrl) y 00109 (fix de arrastre en bloque en vivo) ya están implementados y cerrados — la dependencia está resuelta, esta parte se incluye ya en el plan.
- **Interpretación técnica de "el cursor está sobre un mazo al soltar"** (tarea 7): se implementa como solape entre el rectángulo `(x, y, width, height)` de la carta arrastrada en su posición final y el de cada mazo — no como un test de punto exacto contra la posición del ratón. Es el criterio de "drop" más robusto y habitual (igual de válido para el caso de una única carta que para varias) y evita tener que exponer coordenadas de mundo del cursor desde `ui/componentRenderer.js` hasta la capa de modo.
- **Confirmación de "añadir al mazo"** (tarea 7): se usa `confirm()` nativo (mismo patrón que ya usa `attemptDeleteComponents` para un único componente en `modes/edit/editMode.js`), no una modal de listado como `ui/bulkDeleteConfirmModal.js` — a diferencia de un borrado (irreversible), meter cartas en un mazo es una acción reversible y de bajo riesgo (las cartas se pueden volver a sacar con "Ver contenido..."), no justifica una modal de detalle.
- **Cambiar la orientación de un mazo ya creado** intercambia su `width`/`height` actuales (transpone la caja), en vez de resetear a un tamaño por defecto — conserva cualquier redimensionado manual que ya se hubiera hecho.

## (b) Solución técnica

### 1. `core/deck.js` (fichero nuevo)

Módulo puro, sin dependencias de otras capas (mismo patrón que `core/dice.js`/`core/group.js`):

- `shuffleCartaIds(cartaIds)`: copia barajada con Fisher-Yates + `Math.random()`, sin mutar el array recibido.
- `getCartaIdsEnAlgunMazo(components)`: `Set` con todos los ids de carta referenciados por `properties.cartaIds` de cualquier componente `type === 'mazo'` — reutilizado por `modes/play/playMode.js` y `modes/edit/editMode.js` para excluir esas cartas del renderizado de la mesa.
- `MAZO_REVEAL_GAP = 20`: separación en píxeles entre el mazo y su zona de revelado.
- `getMazoRevealZoneRect(mazo)`: `{ x, y, width, height }` de la zona de revelado — `x: (mazo.x ?? 100) + (mazo.width ?? DEFAULT) + MAZO_REVEAL_GAP`, `y: mazo.y ?? 100`, mismo `width`/`height` que el propio mazo. Único punto de cálculo, reutilizado por el renderizado (tarea 5) y por cualquier acción que coloque una carta revelada (tareas 5 y 4).
- `rectsOverlap(a, b)`: solape de dos rectángulos `{x, y, width, height}` — usado por la tarea 7 (drop sobre un mazo).

### 2. Alta del tipo "Mazo"

- `ui/componentTypeModal.js`: añadir `{ value: 'mazo', label: 'Mazo' }` a `COMPONENT_TYPES`.
- `ui/componentRenderer.js`: añadir `mazo: 'Mazo'` a `COMPONENT_TYPE_LABELS`.
- `ui/componentModal.js`:
  - `DEFAULT_MAZO_PROPERTIES = { cartaIds: [], orientacion: 'vertical' }`.
  - `DEFAULT_MAZO_WIDTH = 180`, `DEFAULT_MAZO_HEIGHT = DEFAULT_MAZO_WIDTH / getProporcionRatio('5:7')` (reutiliza `core/cardProportions.js`, mismo criterio de tamaño que "Carta/Ficha").
  - `createDefaultComponent(type)`, rama `else if (type === 'mazo')`: `width/height` según orientación por defecto (`'vertical'` → tal cual; si en el futuro se cambiara el valor por defecto a horizontal, ya bastaría con transponer aquí), `bloqueado: true`, `subirAlMoverInteractuar: true` (pieza que se interactúa activamente, mismo criterio que "Dado"/"Carta"), `properties: { ...DEFAULT_MAZO_PROPERTIES }`.

### 3. Pestaña "Específicas" del mazo (modo edición)

En `ui/componentModal.js`, rama nueva `else if (workingComponent.type === 'mazo')` → `renderMazoSpecificFields(container)`:

- Texto informativo de solo lectura: `"${cartaIds.length} cartas"`.
- Desplegable "Orientación" (`Vertical`/`Horizontal`) ligado a `workingComponent.properties.orientacion`; al cambiar, transpone `workingComponent.width`/`workingComponent.height` (intercambia ambos valores) — aplicado de inmediato sobre `workingComponent` (mismo criterio de aplicación inmediata dentro de `properties` que ya tienen `proporcion` de carta o "Pegar estilo", según la nota ya existente en `ARCHITECTURE.md` sobre `workingComponent`).
- Botón "Ver contenido del mazo" (ver tarea 4) — abre `openMazoContentModal` sobre el componente ya guardado en el estado (no sobre `workingComponent`, para que "Sacar" opere siempre sobre datos reales, consistentes con lo que haya en `core/state.js` en cada momento, incluso si la modal de propiedades sigue abierta detrás).

### 4. `ui/mazoContentModal.js` (fichero nuevo) — "Ver contenido del mazo"

Sub-modal sin tabs, mismo patrón estructural que `ui/boardImageModal.js` pero con filas en vez de grid: `openMazoContentModal({ mazoId, onSacar })`.

- Lee el mazo actual con `getComponents().find((c) => c.id === mazoId)` en cada (re)render interno de la propia modal (no recibe el objeto por parámetro, para poder refrescarse sola tras cada "Sacar" sin cerrarse).
- Si `cartaIds.length === 0`: mensaje "Este mazo no tiene cartas".
- Si no: una fila por carta (mismo orden que `cartaIds`, arriba primero), cada una con:
  - Miniatura con el diseño real de la cara frontal de esa carta — reutiliza `paintCartaFace` (extraída de `ui/componentRenderer.js`, ver tarea 5) sobre un contenedor pequeño de proporción fija (mismo criterio de escala que ya usa la mesa: `renderScale = anchoMiniatura / CARD_DESIGN_WIDTH`). Si la carta referenciada ya no existe (id huérfano), la fila se omite (limpieza silenciosa, igual que en el resto del módulo).
  - El id de la carta.
  - Botón "Sacar", que invoca `onSacar(cartaId)` (la mutación real la hace quien abre la modal — `modes/play/playMode.js` o el flujo de `ui/componentModal.js`/`editMode.js`, ver tarea 3 y 5 —, no la propia modal) y, tras invocarlo, vuelve a pintar el cuerpo de la modal leyendo el mazo actualizado (sin cerrarla).
- Footer con un único botón "Cerrar".

### 5. Renderizado del mazo en la mesa (`ui/componentRenderer.js`)

- Extraer de la rama `'carta'` (bloque que pinta imagen de fondo + `textBoxes` de una cara) una función local `paintCartaFace(contentParent, cara, renderScale)` con exactamente la misma lógica ya existente, sin cambiar su comportamiento — reutilizada por la rama `'mazo'` y por `ui/mazoContentModal.js` (tarea 4).
- Nueva rama `else if (component.type === 'mazo')`, mismo patrón estructural que `'tablero'`/`'documento'` (caja rectangular, reutilizando la clase `.carta` para heredar `border-radius: var(--radius-lg)` + sombra nivel 1 sin duplicar CSS — visualmente "una carta boca abajo"):
  - `cartaIds = component.properties?.cartaIds || []`; `cartaArriba = cartaIds.length ? getComponents().find((c) => c.id === cartaIds[0]) : null`.
  - Si `cartaArriba`: `paintCartaFace` sobre `cartaArriba.properties.caraTrasera`, `renderScale = width / CARD_DESIGN_WIDTH`.
  - Si no: helper local nuevo `renderMazoEmptyPlaceholder(container, width, height)` — icono SVG simple dibujado en JS, mismo criterio que `renderDiceSilhouette` de `'dado'` (sin depender de ningún recurso de la galería).
  - `onSelect`/`onToggleSelect`/`selectedIds` (clase `mazo--selected`)/`onContextMenu`/`identifyMode`/`showLockIndicator`/`showHiddenIndicator`/`onMove`/`canMove`: mismo cableado que el resto de tipos, sin lógica especial (el bloque de arrastre múltiple ya sale "gratis" vía `getBlockDragTargets`, aplicable si algún día se selecciona un mazo junto con otros elementos — no es el caso relevante de este cambio, pero no hay que excluirlo).
  - `onResize`: libre en ambos ejes (como `'tablero'`), `clamp` con mínimo propio `MIN_MAZO_WIDTH`/`MIN_MAZO_HEIGHT` (`60×60`, mismo mínimo que "Carta/Ficha").
  - **Zona de revelado**: tras pintar la caja del mazo, calcular `getMazoRevealZoneRect(component)` (`core/deck.js`) y añadir al `worldEl` (como elemento hermano, no hijo del mazo, ya que su posición no depende del recorte/tamaño de la caja) un `div` decorativo con borde punteado y el texto centrado "Carta revelada" — sin listeners, sin selección, sin `onContextMenu`. Se pinta siempre que se pinta el mazo (los dos modos), tenga o no cartas.
  - Nuevo parámetro `onMazoDraw` en la firma de `renderComponentsOnTable`: si se pasa, un click sobre el mazo (clase `mazo--clickable`) lo invoca con `onMazoDraw(component)` — sin lógica de vaciado aquí (la decide quien lo pase, tarea 6).

### 6. Mecánica de juego en `modes/play/playMode.js`

- Filtro de `renderTable()`: `.filter((c) => !c.oculto && !getCartaIdsEnAlgunMazo(getComponents()).has(c.id))`.
- `onMazoDraw: (mazo) => { ... }`:
  - `cartaIds = mazo.properties?.cartaIds || []`; si vacío, no hace nada.
  - `topId = cartaIds[0]`; `carta = getComponents().find((c) => c.id === topId)`.
  - `replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds: cartaIds.slice(1) } }))`.
  - Si `carta` existe (limpieza defensiva si no): calcular `{ x, y } = getMazoRevealZoneRect(mazo)`, `replaceComponent(carta.id, updateComponent(carta, { x, y, properties: { caraActual: 'frontal' } }))`, `reorderComponent(carta.id, 1)`.
- `onContextMenu`: extender `extra` con `else if (component.type === 'mazo') extra = \`${(component.properties?.cartaIds || []).length} cartas\`;`.
- `specificItems`:
  - `'mazo'`: `[{ icon: <barajar>, label: 'Barajar', onClick: () => replaceComponent(component.id, updateComponent(component, { properties: { cartaIds: shuffleCartaIds(component.properties?.cartaIds || []) } })) }, { icon: <ojo>, label: 'Ver contenido...', onClick: () => openMazoContentModal({ mazoId: component.id, onSacar: (cartaId) => sacarCartaDeMazo(component.id, cartaId) }) }]`.
  - `'carta'`: si existe algún `type === 'mazo'`, añade `{ icon: <carta-en-caja>, label: 'Meter en mazo...', onClick: () => openInsertIntoMazoModal(...) }` (ver tarea 8); si no hay ningún mazo, no se añade nada.
  - Extraer una función compartida `sacarCartaDeMazo(mazoId, cartaId)` (dentro de `playMode.js`, reutilizada tanto por `onMazoDraw` — con `cartaId` fijo a la de arriba — como por el callback `onSacar` de "Ver contenido...") que generaliza la lógica de la tarea anterior a "sacar una carta cualquiera, no solo la de arriba": quita `cartaId` de `cartaIds` (esté donde esté en el array), reposiciona esa carta en `getMazoRevealZoneRect(mazo)`, `caraActual: 'frontal'`, `reorderComponent(cartaId, 1)`.

### 7. Arrastrar cartas seleccionadas sobre un mazo (`modes/edit/editMode.js`)

En el `onMove` de `renderTable()` (el que ya gestiona el arrastre en bloque de la selección múltiple, cambio 00108/00109):

1. Determinar el conjunto de componentes implicados en el arrastre: si `selectedComponentIds.size > 1 && selectedComponentIds.has(component.id)`, es toda la selección; si no, es solo `[component]` (cubre igual el caso de una única carta seleccionada, o de una carta arrastrada sin selección previa — mismo criterio en ambos, ver anotación (a)).
2. Aplicar las nuevas posiciones tal como ya hace hoy el código (sin cambios en esa parte).
3. Si **todos** los componentes de ese conjunto son `type === 'carta'`: buscar el primer mazo (`getComponents().filter((c) => c.type === 'mazo')`) cuyo rectángulo (`rectsOverlap`, `core/deck.js`) solape con el rectángulo final de `component` (la carta que se soltó directamente, con sus `x`/`y` ya actualizados y su `width`/`height`).
4. Si hay solape con un mazo: `confirm('¿Añadir la(s) N carta(s) seleccionada(s) al mazo "<id>"?')`.
   - Si acepta: para cada componente del conjunto, `replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds: [...cartaIds, carta.id] } }))` (acumulando sobre el mismo mazo, en cualquier orden — basta iterar el conjunto y añadir uno a uno al final).
   - Si cancela, o no hay solape, o la selección no es 100% cartas: no se hace nada más (las cartas quedan en la mesa en su nueva posición, ya aplicada en el paso 2).

### 8. "Meter en mazo..." (menú contextual de carta, ya planificado en la versión anterior del plan, sin cambios de fondo)

- `ui/insertIntoMazoModal.js` (fichero nuevo): `openInsertIntoMazoModal({ carta, mazos, onAccept })` — `<select>` de mazos (`formatComponentIdentifier(mazo)`) + `.align-group` de dos botones ("Arriba del todo"/"Abajo del todo"); footer "Cancelar"/"Aceptar"; `onAccept({ mazoId, posicion })`.
- En `playMode.js`, al aceptar: añade `carta.id` al principio o al final de `cartaIds` del mazo elegido (`replaceComponent`); no toca la carta (deja de dibujarse por el filtro de la tarea 6, calculado a partir del mazo).

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md`, tras implementar:

- Sección 4: añadir "Mazo" a "Tipos de componente implementados" (séptimo tipo), documentando `properties.cartaIds`/`properties.orientacion`, la regla de exclusión de renderizado de las cartas referenciadas, y que no admite proporciones especiales (solo transposición vertical/horizontal).
- Sección 5 (`ui/componentRenderer.js`): nuevo parámetro `onMazoDraw`, extracción de `paintCartaFace` compartida con la rama `'mazo'`, y la zona de revelado como elemento decorativo hermano del mazo (no seleccionable).
- Sección 5: nuevos módulos `core/deck.js` (`shuffleCartaIds`, `getCartaIdsEnAlgunMazo`, `getMazoRevealZoneRect`, `rectsOverlap`), `ui/mazoContentModal.js`, `ui/insertIntoMazoModal.js`.
- Sección 3 (modo juego) y descripción de `modes/edit/editMode.js`: filtrado de cartas-dentro-de-mazo en la mesa (ambos modos, panel de Componentes sin filtrar); nueva mecánica de arrastrar la selección de cartas sobre un mazo (apoyada en la selección múltiple del cambio 00108) para meterlas todas de golpe.
- Sección 8 ("Funcionalidades transversales"): no se necesita ningún ajuste adicional — el tipo nuevo no es una colección a nivel de `state.js`, no referencia recursos de la galería directamente (solo a través de la carta que referencia), y su `clamp` de redimensionado es libre, sin proporción fija.

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md`, tras implementar:

- Sección 12.8 (menú contextual): primer uso real de `specificItems` (hasta ahora reservado sin uso) — "Barajar"/"Ver contenido..." (mazo) y "Meter en mazo..." (carta) como ejemplos.
- Nota en la documentación de "Carta"/piezas de juego: "Mazo" reutiliza la clase `.carta` (radio `--radius-lg`, sombra nivel 1) por ser visualmente "una carta boca abajo", sin clase de bloque nueva para la caja.
- Nueva entrada de estilo para la "zona de revelado" (`.mazo-reveal-zone` o nombre equivalente en `main.css`): recuadro decorativo con borde punteado neutro (mismo `var(--border-neutral)`/`var(--text-muted)` que el resto de elementos informativos de solo lectura de la app, p. ej. `.context-menu__info-row`), sin sombra ni fondo sólido, `pointer-events: none`.
