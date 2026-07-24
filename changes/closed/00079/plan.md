## (a) Anotaciones funcionales

**Fuera de alcance:**
- Redimensionado manual del ancho de columnas de la tabla de "Mazos" (`ui/tableColumnResize.js`, ya usado por Componentes/Recursos): la tabla solo tiene dos columnas (Nombre/Acciones) y la `description.md` no lo pide explícitamente — se omite `columnWidths`/`onColumnResize` en este panel, a diferencia de `resourcePanelState`/`panelState`.
- Cualquier mecánica de mazo (barajar, robar carta): ya quedaba fuera de alcance según `ARCHITECTURE.md` sección 4.1 (change 00053) y sigue estándolo aquí; este change solo añade gestión (alta/edición/borrado) del mazo como entidad.

**Dudas:** ninguna requirió confirmación explícita del usuario. El resto de decisiones de diseño (nombres de función, estructura de módulos nuevos, patrón del modal de confirmación con lista) se resolvieron por analogía directa con los módulos ya existentes de Recursos/Componentes, documentados en `ARCHITECTURE.md`.

## (b) Solución técnica

1. **`core/deck.js`** — añadir `getComponentsUsingDeck(deckId, components)`: devuelve los ids de los componentes con `component.type === 'carta' && component.properties?.deckId === deckId`. A diferencia de `getComponentsUsingResource` (`core/resource.js`), no necesita recorrido profundo (`collectDeepValues`): `deckId` es siempre una propiedad plana de primer nivel en `properties`, nunca anidada.

2. **`core/state.js`**:
   - Añadir `replaceDeck(id, updatedDeck)` y `removeDeck(id)` (mismo patrón que `replaceResource`/`removeResource`: mutan `state.decks` y emiten `decks:changed`).
   - Añadir un tercer panel state, `deckPanelState` (`{ collapsed: false, position: null, width: null }`, sin `columnWidths` — ver (a)), con `getDeckPanelState()`, `setDeckPanelState(partial)` (emite `deckPanelState:changed`) y `loadDeckPanelState(newState)` — mismo patrón que `resourcePanelState`.

3. **`core/persistence.js`**:
   - `parseState`: leer `deckPanelState` del JSON guardado igual que `resourcePanelState` (objeto o `null`), y añadirlo al resultado devuelto.
   - `saveState(components, panelState, resources, resourcePanelState, resourcesSeeded, decks, deckPanelState)`: nuevo parámetro al final, incluido en el JSON serializado.
   - `readSeedState`/`parseState` ya reutilizan la misma función internamente, sin cambios adicionales.

4. **`core/fileExport.js`**: `buildExportHtml(components, resources, panelState, resourcePanelState, resourcesSeeded, decks, deckPanelState)` — nuevo parámetro, incluido en el JSON de la semilla embebida (`#initial-state`).

5. **`main.js`**:
   - Importar `getDeckPanelState`, `loadDeckPanelState` de `core/state.js`.
   - `persistState()`: pasar `getDeckPanelState()` como séptimo argumento a `saveState(...)`.
   - Suscribir `on('decks:changed', renderAll)` — **actualmente no existe** (`decks:changed` solo dispara `persistState`, nunca un repintado); hace falta para que el nuevo panel "Mazos" (y el desplegable "Mazo" de `ui/componentModal.js`, que ya lee `getDecks()`) se actualicen tras un alta/edición/borrado de mazo. Suscribir también `on('deckPanelState:changed', persistState)`.
   - Hidratar `deckPanelState` con `loadDeckPanelState(saved.deckPanelState)` / `loadDeckPanelState(seed.deckPanelState)` (si existe) en los dos puntos donde ya se hidrata `resourcePanelState`, antes de `loadDecks(...)`.

6. **`ui/editModeToggle.js`**: importar `getDeckPanelState` de `core/state.js` y añadirlo como argumento en las dos llamadas existentes a `buildExportHtml(...)`.

7. **`ui/deckDeleteConfirmModal.js`** (nuevo): expone `openDeckDeleteConfirmModal({ deckName, cardIds, onConfirm })`. Mismo patrón visual `modal-overlay`/`modal` que `ui/errorModal.js`/`ui/importReportModal.js`: cabecera "Eliminar mazo en uso", mensaje explicando que el mazo está en uso por las cartas listadas (`<ul>` con `cardIds`) y que se borrará el mazo dejándolas "Sin mazo"; pie con "Cancelar" (cierra sin más) y "Aceptar" (invoca `onConfirm()` y cierra). Es el modal con lista que pide la `description.md`, distinto del bloqueo de `showErrorModal` que ya usa Recursos (aquí sí se permite continuar).

8. **`ui/deckModal.js`** (nuevo): expone `openDeckModal({ deck = null, onAccept, onDelete })`, reutilizado tanto para alta como edición:
   - Sin `deck` (alta): cabecera "Nuevo mazo", sin botón "Eliminar".
   - Con `deck` (edición): cabecera `Mazo: ${deck.name}`, botón "Eliminar" presente.
   - Único campo "Nombre" (prellenado con `deck?.name ?? ''`), validación de no-vacío en vivo que deshabilita "Aceptar" mientras esté vacío (mismo criterio que el `id` de `ui/componentModal.js`).
   - Footer: "Eliminar" (solo en edición) → invoca `onDelete(deck, closeModal)`, donde `closeModal` es una función que el propio módulo pasa (`() => overlay.remove()`) para que el caller decida cuándo cerrar — necesario porque el borrado de un mazo en uso es asíncrono (pasa por `ui/deckDeleteConfirmModal.js`) y no puede seguir el contrato síncrono booleano de `ui/resourceModal.js`. "Cancelar" (cierra sin más). "Aceptar" (deshabilitado si el nombre está vacío) → `onAccept(createDeck({ name }) o updateDeck(deck, { name }))` y cierra.
   - Importa `createDeck`/`updateDeck` de `core/deck.js`.

9. **`ui/deckList.js`** (nuevo): panel flotante análogo a `ui/resourceList.js` pero simplificado (sin filtro de texto, sin columna "Tipo", sin clonar — ver (a)). Expone `renderDeckList(container, decks, { onEdit, onRemove, onAdd, collapsed = false, onToggleCollapse, onPanelMove, onPanelResize } = {})`:
   - Cabecera "Mazos (n)" con colapso y arrastre (mismo bloque de listeners mousedown/mousemove/mouseup que `resourceList.js`/`componentList.js`).
   - Tabla de dos columnas (Nombre/Acciones), sin `<thead>` de tipo; vacío → "No hay mazos todavía." (mismo criterio que Recursos/Componentes).
   - Botón "Editar" (→ `onEdit(deck)`) y "Eliminar" (→ `onRemove(deck)`) por fila.
   - Pie con un único botón "+ Añadir mazo" (→ `onAdd()`), mismo patrón simple que `ui/componentList.js` (sin menú desplegable, a diferencia de "+ Añadir recurso").
   - Redimensionado horizontal (`ui/resizeHandle.js`, `MIN_PANEL_WIDTH = 290`, mismo `clamp` que los otros dos paneles).

10. **`modes/edit/editMode.js`** — cablear el nuevo panel:
    - Importar `getDecks, addDeck, replaceDeck, removeDeck, getDeckPanelState, setDeckPanelState` de `../../core/state.js`; `createDeck, getComponentsUsingDeck` de `../../core/deck.js`; `renderDeckList` de `../../ui/deckList.js`; `openDeckModal` de `../../ui/deckModal.js`; `openDeckDeleteConfirmModal` de `../../ui/deckDeleteConfirmModal.js`.
    - Nuevo contenedor flotante `deckListContainer` (clase `deck-panel-container`), posicionado igual que `resourceListContainer` a partir de `getDeckPanelState()` (posición/ancho); `deckCollapsed` como variable local de `renderEditMode`, igual que `collapsed`/`resourceCollapsed`.
    - `attemptDeleteDeck(deck, { onDeleted } = {})`:
      ```js
      function attemptDeleteDeck(deck, { onDeleted } = {}) {
        const affectedIds = getComponentsUsingDeck(deck.id, getComponents());
        if (affectedIds.length > 0) {
          openDeckDeleteConfirmModal({
            deckName: deck.name,
            cardIds: affectedIds,
            onConfirm: () => {
              for (const cardId of affectedIds) {
                const card = getComponents().find((c) => c.id === cardId);
                if (card) replaceComponent(cardId, updateComponent(card, { properties: { ...card.properties, deckId: null } }));
              }
              removeDeck(deck.id);
              if (onDeleted) onDeleted();
            },
          });
          return false;
        }
        if (!confirm(`¿Eliminar el mazo "${deck.name}"?`)) return false;
        removeDeck(deck.id);
        return true;
      }
      ```
    - `renderDeckPanel()`, llamada junto a `renderTable()`/`renderList()`/`renderResourcePanel()`:
      ```js
      function renderDeckPanel() {
        renderDeckList(deckListContainer, getDecks(), {
          onEdit: (deck) => {
            openDeckModal({
              deck,
              onAccept: (updated) => replaceDeck(deck.id, updated),
              onDelete: (d, closeModal) => attemptDeleteDeck(d, { onDeleted: closeModal }),
            });
          },
          onRemove: (deck) => attemptDeleteDeck(deck),
          onAdd: () => {
            openDeckModal({ onAccept: (newDeck) => addDeck(newDeck) });
          },
          collapsed: deckCollapsed,
          onToggleCollapse: () => {
            deckCollapsed = !deckCollapsed;
            setDeckPanelState({ collapsed: deckCollapsed });
            renderDeckPanel();
          },
          onPanelMove: (left, top) => setDeckPanelState({ position: { left, top } }),
          onPanelResize: (width) => setDeckPanelState({ width }),
        });
      }
      ```

11. **`src/styles/main.css`** — añadir, junto al bloque de `.resource-panel*` (sección "Floating resource panel"):
    - `.deck-panel-container` (posición absoluta apilada por defecto debajo de `.resource-panel-container`: `top` calculado con el mismo criterio que la separación ya existente entre `.component-panel-container` (`top: 1rem`) y `.resource-panel-container` (`top: 28rem`, salto de 27rem) — usar `top: 55rem` para dejar el mismo hueco debajo de Recursos; `right: 1rem`; `width: 400px`; `z-index: 15`, igual que los otros dos.
    - `.deck-panel`, `.deck-panel__header` (+ `.grabbing`), `.deck-panel__body`, `.deck-panel__footer` — copia directa de las reglas `.resource-panel*` equivalentes (sin las de `__filter`, que no aplican).
    - `.deck-panel__footer button` — mismo estilo que `.component-panel__footer button` (botón azul de ancho completo).
    - `.deck-list`, `.deck-list__empty`, `.deck-list__actions-cell`, `.deck-list__action-btn` (+ `--danger`) — copia directa de las reglas `.resource-list*` equivalentes (sin `__empty-filter`, que no aplica al no haber filtro).

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:

- **Sección 3** ("Modo juego vs modo edición"): añadir un nuevo bullet, a continuación del que describe el panel "Recursos", describiendo la tercera ventana flotante "Mazos" (`ui/deckList.js` + `ui/deckModal.js`), con posición/ancho/colapso propios (`deckPanelState`), botón "+ Añadir mazo", "Editar"/"Eliminar" por fila y desde dentro de la modal de edición, y el flujo de borrado con `ui/deckDeleteConfirmModal.js` cuando el mazo está en uso (a diferencia del bloqueo de Recursos, aquí se permite continuar y las cartas afectadas quedan sin mazo).
- **Sección 4.1** ("Modelo de datos de mazo"): reescribir el párrafo final para reflejar que `core/deck.js` ahora expone `getComponentsUsingDeck` y que `core/state.js` expone `replaceDeck`/`removeDeck` y un `deckPanelState` propio — eliminando las frases ya obsoletas ("sin ningún equivalente a `isResourceInUse`... no hace falta, ya que este change no permite borrar mazos" y "sin ningún panel de gestión dedicado a mazos en este change").
- **Sección 6.1** ("Persistencia y guardado a fichero"): actualizar la lista de campos serializados por el autoguardado y "Guardar a fichero" (añadir `deckPanelState` a los ya citados `components, panelState, resources, resourcePanelState, resourcesSeeded, decks`) y la suscripción de eventos (`deckPanelState:changed`); corregir "cualquiera de las dos ventanas flotantes" → "cualquiera de las tres ventanas flotantes".
