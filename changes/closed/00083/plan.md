## (a) Anotaciones funcionales

Sin dudas de alcance pendientes: `description.md` ya las resolvió todas explícitamente (aplica a las tres ventanas, manejador combinado `axis: 'both'`, sin límite máximo salvo el borde de pantalla, solo crece la zona de listado, se persiste igual que el ancho). Nada queda fuera de alcance adicional.

## (b) Solución técnica

1. **`core/state.js`** — añadir el campo `height: null` a los tres estados de panel (líneas 15-17: `panelState`, `resourcePanelState`, `deckPanelState`). No hace falta tocar `getPanelState`/`setPanelState`/`loadPanelState` (y sus equivalentes de recursos/mazos): ya hacen merge genérico de un objeto parcial (`{ ...panelState, ...partial }`), así que `setPanelState({ height })` funciona sin cambios adicionales en esa capa.

2. **`src/styles/main.css`** — cambiar `.component-panel__body`, `.resource-panel__body` y `.deck-panel__body` de `max-height: 320px` a `height: 320px` (mismas líneas 1426, 1516, 1687). Con `max-height` el body se autoajusta al contenido hasta el tope; con `height` fijo pasa a comportarse como el ancho del panel (tamaño fijo, editable, no autoajustado al contenido) — necesario para poder aplicar una altura mayor a 320px vía estilo inline sin que la regla de la hoja de estilos la recorte. Mantener `overflow-y: auto` y `overflow-x: auto` tal cual.

3. **`ui/resizeHandle.js`** — no requiere cambios: ya soporta `axis: 'both'` genéricamente (usado hoy por el redimensionado de componentes en la mesa), calculando `{ width, height }` y pasándolo a `clamp`/`onResize`/`onResizeEnd`.

4. **`ui/componentList.js`, `ui/resourceList.js`, `ui/deckList.js`** — en los tres, el mismo cambio (hoy usan `axis: 'x'` sobre el `panel`, ligado únicamente al ancho vía `container.style.width`):
   - Añadir una constante `MIN_PANEL_BODY_HEIGHT` (p. ej. `96`, misma magnitud en los tres ficheros, análoga a cómo `MIN_PANEL_WIDTH = 290` ya está duplicada en los tres) que garantice ver la cabecera de tabla más una fila dentro de la zona de listado.
   - Guardar en una variable (`let body;`) la referencia al elemento `.component-panel__body`/`.resource-panel__body`/`.deck-panel__body` creado dentro del bloque `if (!collapsed)`, para poder leerlo/escribirlo desde el handler de resize que se registra después.
   - Aceptar una nueva opción `bodyHeight` en `renderComponentList`/`renderResourceList`/`renderDeckList` (mismo patrón que `columnWidths`). Si `body` existe y `bodyHeight != null`, aplicar `body.style.height = \`${bodyHeight}px\`` al crearlo.
   - Cambiar `attachResizeHandle(panel, {...})`:
     - `axis: collapsed ? 'x' : 'both'` — en colapsado no hay zona de listado visible, se mantiene el comportamiento actual (solo ancho).
     - `getSize: () => ({ width: container.getBoundingClientRect().width, height: body ? body.getBoundingClientRect().height : 0 })`.
     - `clamp`: mantener el cálculo de `width` ya existente (mínimo `MIN_PANEL_WIDTH`, máximo hasta el borde derecho); añadir `height` clamped a `[MIN_PANEL_BODY_HEIGHT, maxByBottomEdge]`, donde `maxByBottomEdge` se calcula igual que `maxByRightEdge` pero en vertical: `(container.offsetParent ? container.offsetParent.clientHeight : window.innerHeight) - container.offsetTop`. Cuando `axis === 'x'` (colapsado) `computeSize` de `resizeHandle.js` ya fuerza `deltaY = 0`, así que `height` no varía realmente en ese caso, pero el `clamp` debe seguir devolviendo un `height` válido (el actual) para no romper la forma del objeto.
     - `onResize: ({ width, height }) => { container.style.width = ...; if (body) body.style.height = \`${height}px\`; }`.
     - `onResizeEnd: ({ width, height }) => { igual que onResize; if (onPanelResize) onPanelResize(width, height); }`.

5. **`modes/edit/editMode.js`** — en los tres bloques de montaje de panel (componentes ~L37-93, recursos, mazos):
   - Desestructurar también `height` de `getPanelState()`/`getResourcePanelState()`/`getDeckPanelState()` (junto a `position`/`width`/`columnWidths` ya existentes).
   - Pasar `bodyHeight: panelHeight` (y equivalentes) a `renderComponentList`/`renderResourceList`/`renderDeckList`.
   - Cambiar la firma de los tres `onPanelResize`: `onPanelResize: (width, height) => setPanelState({ width, height })` (y análogos para `setResourcePanelState`/`setDeckPanelState`).

No hace falta tocar `core/persistence.js` ni `core/fileExport.js`: ya serializan el objeto `panelState`/`resourcePanelState`/`deckPanelState` completo tal cual (no listan sus campos internos uno a uno), así que el nuevo campo `height` viaja automáticamente con el resto en autoguardado, "Guardar a fichero" y la hidratación al arrancar (`loadPanelState`/etc. ya hacen `panelState = newPanelState` sin filtrar campos). Un guardado anterior a este cambio sin `height` simplemente lo tendrá a `undefined`/ausente; como el CSS por defecto sigue siendo `height: 320px` y la comprobación en `editMode.js`/`componentList.js` es `!= null` (igual que ya ocurre con `width`), el body cae al tamaño por defecto del CSS sin migración adicional necesaria.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:

- Sección 6.1 (`Persistencia y guardado a fichero`): donde describe que `panelState`/`resourcePanelState`/`deckPanelState` tienen forma `{ collapsed, position, width }` (y variantes), actualizar a `{ collapsed, position, width, height }`, indicando que `height` controla el alto de la zona de listado de cada ventana (no el alto total de la ventana) y se persiste/restaura igual que `width`.
- Sección 3 (última frase del párrafo sobre `panelState`): donde dice "El redimensionado del panel (`ui/resizeHandle.js`) no tiene límite máximo de ancho, solo el mínimo y no salirse del borde derecho de la pantalla" — ampliar para reflejar que ahora también redimensiona en alto (mismo criterio: mínimo para dejar ver cabecera + una fila, sin máximo salvo no salirse del borde inferior de la pantalla), usando `axis: 'both'` en vez de `axis: 'x'`.

## (d) Cambios en estilo

No aplica: no se introduce ninguna convención visual nueva (el manejador de esquina ya existe y no cambia de aspecto, solo de comportamiento).
