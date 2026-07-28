## (a) Anotaciones funcionales

Sin dudas pendientes de resolver con el usuario: `description.md` deja el comportamiento completamente especificado (casos límite, persistencia, alcance).

Nada queda fuera de alcance más allá de lo ya explícito en `description.md` (no persistencia entre sesiones, no afecta a modales ni al apilado de componentes sobre la mesa).

## (b) Solución técnica

Todo el cambio vive en `src/modes/edit/editMode.js`, que es donde ya se componen los tres paneles hermanos (`ui/componentList.js`, `ui/resourceList.js`, `ui/deckList.js`); no hace falta tocar esos tres ficheros de UI ni `core/state.js` (el orden es transitorio, no persistido).

1. **Estado de orden de apilado, a nivel de módulo** (fuera de `renderEditMode`, igual que `selectedComponentId`, [editMode.js:33](../../../src/modes/edit/editMode.js#L33), para sobrevivir a los remontados completos que disparan `components:changed`/`resources:changed`/`decks:changed`):
   ```js
   let panelStackOrder = ['component', 'resource', 'deck']; // de abajo a arriba; coincide con el orden por defecto actual
   ```
   Usar claves simbólicas (no referencias a elementos DOM, que se recrean en cada remontado) para que el mecanismo sea agnóstico a qué paneles existan.

2. **Función `bringPanelToFront(key)`**, en `editMode.js`: mueve `key` al final de `panelStackOrder` (si no lo estaba ya) y vuelve a aplicar los `z-index`.

3. **Función `applyPanelStackOrder(panelsByKey)`**: recorre `panelStackOrder` y asigna `panelsByKey[key].style.zIndex = String(15 + index)` a cada contenedor (`listContainer`, `resourceListContainer`, `deckListContainer`), sustituyendo así el `z-index: 15` fijo de `main.css` por un valor calculado en JS. Se llama una vez tras crear los tres contenedores en `renderEditMode` (para que reflejen el orden vigente al remontar) y de nuevo cada vez que `bringPanelToFront` cambia el orden.

4. **Enganchar "traer al frente" a la interacción**: tras crear `listContainer`, `resourceListContainer` y `deckListContainer` ([editMode.js:71-107](../../../src/modes/edit/editMode.js#L71-L107)), añadir a cada uno un listener en fase de captura:
   ```js
   listContainer.addEventListener('mousedown', () => bringPanelToFront('component'), true);
   resourceListContainer.addEventListener('mousedown', () => bringPanelToFront('resource'), true);
   deckListContainer.addEventListener('mousedown', () => bringPanelToFront('deck'), true);
   ```
   `mousedown` en captura cubre a la vez "click en cualquier parte" (cabecera, fila, botón, campo) y "empezar a arrastrar" (el propio `mousedown` de cabecera que ya usa `ui/componentList.js`/`ui/resourceList.js`/`ui/deckList.js` para iniciar el arrastre, [componentList.js:222](../../../src/ui/componentList.js#L222)), sin interferir con él: no se llama `stopPropagation`/`preventDefault`, solo se reordena `panelStackOrder` y se actualizan estilos antes de que el resto de listeners (bubbling) se ejecuten. Cubre también el caso "ventana colapsada" sin nada especial, ya que el `mousedown` en la cabecera colapsada dispara igualmente el listener del contenedor.

5. **Generalidad para paneles futuros**: cualquier ventana flotante nueva que se añada más adelante al modo edición solo necesita añadir su clave a `panelStackOrder`, su entrada en el mapa que recibe `applyPanelStackOrder`, y su propio listener de `mousedown` en captura — no hace falta tocar el resto del mecanismo.

6. **Quitar los `z-index: 15` fijos** de `.component-panel-container`, `.resource-panel-container` y `.deck-panel-container` en `src/styles/main.css` ([líneas 1393](../../../src/styles/main.css#L1393), [1483](../../../src/styles/main.css#L1483), [1832](../../../src/styles/main.css#L1832)), ya que a partir de ahora ese valor lo fija siempre `applyPanelStackOrder` en JS (evita que quede un valor fijo que pueda entrar en conflicto silencioso con el calculado).

No hace falta ningún cambio en `core/state.js`, en los tres módulos de `ui/*List.js`, ni en las funciones `onPanelMove`/`onPanelResize`/`onToggleCollapse` existentes.

## (c) Cambios de arquitectura

No aplica: este cambio no modifica la arquitectura por capas ni el modelo de datos descritos en `ARCHITECTURE.md`. Es un mecanismo de UI puramente transitorio (paralelo al ya documentado para `selectedComponentId`), acotado a `modes/edit/editMode.js`.

## (d) Cambios en estilo

`STYLE_BIBLE.md` sección 10 (Layout) documenta la posición inicial de los paneles flotantes y la tabla de capas `z-index` para elementos `position: fixed` (footer, toolbar, header, mode switcher, menú contextual, modal). Los paneles flotantes del modo edición son `position: absolute` (no `fixed`) dentro de `tableContainer`, por lo que quedan fuera de esa tabla — hoy no se menciona su `z-index: 15` en `STYLE_BIBLE.md` en absoluto.

Añadir a la sección 10, tras la línea sobre la posición inicial de los paneles ([STYLE_BIBLE.md:137](../../../design/docs/stylebible/STYLE_BIBLE.md#L137)), una nota indicando que el `z-index` de estos tres paneles ya no es un valor CSS fijo: se calcula en `modes/edit/editMode.js` (`applyPanelStackOrder`, base `15`, uno por posición en `panelStackOrder`) para reflejar cuál está en primer plano tras la última interacción del usuario, permaneciendo siempre por debajo de la capa `99` (toolbar de edición) de la tabla de capas fijas.
