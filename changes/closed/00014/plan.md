## (a) Anotaciones funcionales

- No hay preguntas de alcance pendientes: `description.md` ya las resuelve todas (qué se guarda, dónde, cuándo, que no afecta a "Guardar a fichero", y el comportamiento por defecto sin estado de panel guardado).
- Fuera de alcance: `selectedComponentId` (fila seleccionada) no se persiste — sigue siendo estado de módulo momentáneo en `editMode.js`, tal y como ya está hoy.
- Fuera de alcance: `core/fileExport.js` (`buildExportHtml`) no se toca — el export a fichero sigue serializando solo `{ version, components }`, sin `panelState`.

## (b) Solución técnica

1. **`src/core/state.js`** — añadir el estado del panel como parte del estado central de la app (mismo criterio que `components`: única fuente de verdad, notificado vía `eventBus`):
   - Nueva variable de módulo `panelState = { collapsed: false, position: null, width: null }` (mismos valores por defecto que hoy usa `editMode.js`).
   - `getPanelState()`: devuelve el objeto actual.
   - `setPanelState(partial)`: fusiona `partial` sobre el `panelState` actual y emite `panelState:changed` (mismo patrón que `addComponent`/`replaceComponent` con `components:changed`). Se usa desde las interacciones del panel (mover/redimensionar/colapsar).
   - `loadPanelState(newPanelState)`: sustituye `panelState` entero **sin emitir evento** — usado solo una vez al arrancar, para hidratar el estado guardado antes del primer render (igual que `loadComponents` hidrata componentes, pero sin necesidad de disparar aquí el guardado todavía inexistente).

2. **`src/core/persistence.js`** — ampliar la forma persistida con el estado del panel:
   - `parseState(raw)`: además de validar `version`/`components`, leer `parsed.panelState`; si es un objeto, incluirlo en el resultado (`panelState: parsed.panelState`); si no (ausente, de una versión anterior sin este campo, o de otra forma inválida), `panelState: null` — sin invalidar el resto del estado por esto (el resto de campos ya se descarta agregado por error solo si `version`/`components` fallan, como hoy).
   - `saveState(components, panelState)`: nuevo segundo parámetro; serializa `{ version: CURRENT_VERSION, components, panelState }`.
   - `loadState()`/`readSeedState()`: sin cambios de firma (ya devuelven lo que decida `parseState`, ahora con `panelState` incluido).

3. **`src/main.js`** — conectar el nuevo estado con el autoguardado y la hidratación inicial:
   - Import `getPanelState`, `loadPanelState` desde `core/state.js`.
   - Cambiar las dos suscripciones de guardado para que siempre persistan ambas piezas en un único guardado:
     ```js
     on('components:changed', (components) => saveState(components, getPanelState()));
     on('panelState:changed', (panelState) => saveState(getComponents(), panelState));
     ```
     (`getComponents()` ya importado de `core/state.js`.)
   - En el bloque de arranque, cuando `saved` es un estado válido de `localStorage` (rama `else if (saved)`), si `saved.panelState` existe, llamar a `loadPanelState(saved.panelState)` **antes** de `loadComponents(saved.components)` (que es quien dispara el primer render vía `components:changed`, así ya lee el panel hidratado). Si `saved.panelState` es `null` (guardado antiguo sin este campo), no se llama a `loadPanelState` y se mantienen los valores por defecto ya inicializados en `state.js`.
   - No se toca la rama de `seed`/`seedDefaultComponent()`: el estado del panel solo se hidrata desde el guardado válido de `localStorage`, según lo resuelto en `description.md`.

4. **`src/modes/edit/editMode.js`** — sustituir las variables de módulo `collapsed`/`panelPosition`/`panelWidth` por el estado central:
   - Import `getPanelState`, `setPanelState` desde `../../core/state.js` (junto a los imports ya existentes de esa capa).
   - Eliminar las variables de módulo `collapsed`, `panelPosition`, `panelWidth` (se mantiene solo `selectedComponentId`).
   - Al principio de `renderEditMode(container)`, leer `const { collapsed, position: panelPosition, width: panelWidth } = getPanelState();` y usar esas constantes locales donde hoy se usan las variables de módulo (posicionamiento/ancho de `listContainer`, prop `collapsed` pasada a `renderComponentList`).
   - `onToggleCollapse`, `onPanelMove`, `onPanelResize` pasan a llamar `setPanelState(...)` en vez de mutar variables, seguido del mismo `renderList()`/`renderTable()` que ya se invocaba (el re-render de este panel no depende de `main.js`, se gestiona aquí igual que hoy; `setPanelState` se limita a persistir el nuevo valor):
     ```js
     onToggleCollapse: () => {
       setPanelState({ collapsed: !collapsed });
       renderList();
     },
     ...
     onPanelMove: (left, top) => {
       setPanelState({ position: { left, top } });
     },
     onPanelResize: (width) => {
       setPanelState({ width });
     },
     ```
     (`onPanelMove`/`onPanelResize` no necesitan re-render propio, igual que hoy — el arrastre/redimensionado ya aplica el cambio visual directamente sobre `listContainer.style` mientras se arrastra, ver `ui/componentList.js`/`ui/resizeHandle.js`; solo notifican el valor final.)

## (c) Cambios de arquitectura

- **`design/docs/ARCHITECTURE.md`**:
  - Sección 2 (capas): sin cambio estructural (`panelState` vive en `core/state.js`, ya documentado como "estado central de la app").
  - Sección 5, viñeta de `ui/componentList.js`: corregir la frase final "`onPanelMove`/`onPanelResize` notifican la posición/ancho final para que el caller los conserve entre remontados... ninguno de los dos se persiste en el modelo de datos" — ya no es cierto; ahora sí se persisten como parte de `core/state.js`/autoguardado.
  - Sección 6.1 (Persistencia y guardado a fichero): ampliar la forma persistida documentada (`{ version, components }` → `{ version, components, panelState }`) y añadir una frase sobre que el estado del panel (posición, ancho, colapsado) se guarda igual que los componentes, vía `panelState:changed`, y se hidrata al arrancar solo desde `localStorage` (no desde la semilla embebida ni el componente por defecto). Aclarar explícitamente que `core/fileExport.js`/"Guardar a fichero" sigue sin incluir `panelState`.
  - Sección 3, última frase del párrafo de modo edición: ajustar "mantiene la selección, el colapso del panel y la posición/ancho del panel... como estado a nivel de módulo, fuera de la función `renderEditMode`" — la selección sigue siendo estado de módulo de `editMode.js`, pero colapso/posición/ancho pasan a vivir en `core/state.js` (persistidos), no en `editMode.js`.
