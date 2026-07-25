## (a) Anotaciones funcionales

Fuera de alcance (ya recogido en `description.md`, se reafirma aquí para el diseño técnico):
- "Traer al frente" / "Enviar al fondo" no se implementan en esta entrada (descartado por el usuario). No se toca `reorderComponent`.
- No se añade ninguna acción específica por tipo de componente todavía; solo la sección general con "Bloquear"/"Desbloquear".
- Click derecho sobre la mesa vacía: sin cambios respecto a hoy.

No ha hecho falta resolver ninguna duda técnica nueva con el usuario: `description.md` y los "Apuntes técnicos" ya fijaban el enfoque (selección transitoria a nivel de módulo en `playMode.js`, reutilización de clases `--selectable`/`--selected`, referencia visual `ui/resourceList.js`/`createAddMenu`, iconos SVG inline estilo `editModeToggle.js`). El análisis técnico (`ms-internal-tech-analysis`) no ha encontrado ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real.

## (b) Solución técnica

1. **`ui/componentRenderer.js` — nuevo parámetro `onContextMenu`**: añadir `onContextMenu` a la firma de `renderComponentsOnTable(...)`. Para cada uno de los seis tipos de componente (`texto`, `tablero`, `dado`, `documento`, `ficha`, `carta`), en su elemento contenedor exterior (el mismo nodo donde ya se añaden los listeners de `onSelect`/`onToggleSelect`/`onMove`), añadir:
   ```js
   if (onContextMenu) {
     el.addEventListener('contextmenu', (e) => {
       e.preventDefault();
       e.stopPropagation();
       onContextMenu(component, e);
     });
   }
   ```
   `preventDefault` evita el menú nativo del navegador; `stopPropagation` evita que el evento llegue a la mesa (`ui/table.js`) o a otro componente por debajo.

2. **`ui/componentRenderer.js` — nuevo parámetro `showLockIndicator` (indicador de candado)**: añadir `showLockIndicator = false` a la firma. Crear un helper local `createLockBadge()` (mismo patrón que `createIdentifierLabel()`, línea ~217): devuelve un `span.component-lock-badge` con un SVG inline de candado (`stroke="currentColor"`, `viewBox="0 0 24 24"`, mismo estilo que el SVG ya existente en `ui/editModeToggle.js`). Para cada uno de los seis tipos, tras la lógica de `identifyMode`, añadir:
   ```js
   if (showLockIndicator && component.bloqueado) {
     el.appendChild(createLockBadge());
   }
   ```
   Se añade siempre al contenedor **exterior** de cada tipo (nunca al contenedor interno con `overflow: hidden`), igual que `.component-id-label`, para no ser recortado por el propio contenido del componente (regla transversal ya documentada en `ARCHITECTURE.md` sección 5).

3. **Nuevo módulo `ui/contextMenu.js`** (genérico, reutilizable, análogo en espíritu a `createAddMenu` de `ui/resourceList.js` pero para menús contextuales posicionados junto al cursor): expone `openContextMenu({ x, y, generalItems, specificItems = [], onClose })`.
   - `generalItems`/`specificItems`: arrays de `{ icon (nodo SVG), label (string), onClick () => void }`. Se pinta primero la sección general, y solo si `specificItems.length > 0` se pinta un separador seguido de la sección específica (si no hay ninguna acción específica, no se dibuja separador huérfano, tal como pide `description.md`).
   - Estructura/aspecto: reutiliza el lenguaje visual ya documentado en `STYLE_BIBLE.md` sección 12.7 (`.resource-add__menu`/`.resource-add__item`: fondo azul claro, hover azul sólido con texto claro, sombra de nivel 2) mediante nuevas clases de bloque propias (`.context-menu`, `.context-menu__item`, `.context-menu__separator`) que comparten esos mismos valores.
   - Posicionamiento: se añade a `document.body` con `position: fixed`, en `(x, y)`; tras insertarlo en el DOM se mide con `getBoundingClientRect()` y se reajusta `left`/`top` si se sale de los límites de la ventana (mismo criterio que "ajustando su posición para no salirse de los límites de la pantalla").
   - Singleton: si ya hay un menú contextual abierto (estado de módulo interno), se cierra automáticamente antes de abrir el nuevo — implementa directamente "click derecho sobre otro elemento con un menú ya abierto: cierra el anterior, abre el nuevo".
   - Cierre: al hacer click fuera del menú (`mousedown` en `document`, mismo patrón que `createAddMenu`), al pulsar **ESC** (listener de teclado propio de este módulo — no se apoya en `ui/globalShortcuts.js`, que solo reconoce el DOM de modales `.modal-overlay`/`.modal__footer`, y este menú deliberadamente no es una modal), o al elegir una de las filas (tras invocar su `onClick`). En los tres casos se invoca `onClose()` (si se pasó) antes de terminar de desmontar el menú, para que el caller pueda reaccionar (en este caso, deseleccionar el componente).

4. **`main.css` — estilos nuevos**: `.context-menu`/`.context-menu__item`/`.context-menu__separator` (ver punto 3) y `.component-lock-badge` (pequeño círculo oscuro superpuesto en una esquina del componente, con el trazo del candado en claro, `pointer-events: none` para no interceptar clicks/arrastre — mismo criterio que `.component-id-label`).

5. **`modes/play/playMode.js` — selección y menú contextual**: introducir un estado de módulo `selectedComponentId = null` (análogo al de `modes/edit/editMode.js`, para sobrevivir a los remontados de `components:changed`). Reestructurar `renderPlayMode(container)` para que monte la mesa una vez y defina una función local `renderTable()` (patrón ya usado en `editMode.js`) que invoca `renderComponentsOnTable` con las opciones actuales ya existentes más:
   - `selectedId: selectedComponentId` (activa la clase `--selected` ya existente, reutilizando el resaltado de selección sin necesidad de pasar `onToggleSelect`, que seguiría sin usarse en modo juego).
   - `onContextMenu: (component, event) => { ... }`, que:
     - fija `selectedComponentId = component.id` y vuelve a invocar `renderTable()` (para que se pinte el resaltado antes de que el usuario interactúe con el menú);
     - construye `generalItems` con una única entrada "Bloquear"/"Desbloquear" (texto según `component.bloqueado`, icono de candado cerrado/abierto según corresponda) cuyo `onClick` hace `replaceComponent(component.id, updateComponent(component, { bloqueado: !component.bloqueado }))` (mismo patrón ya usado en este fichero para `onMove`/`onDiceResult`/`onCartaFlip`);
     - llama a `openContextMenu({ x: event.clientX, y: event.clientY, generalItems, specificItems: [], onClose: () => { selectedComponentId = null; renderTable(); } })`.
   - `showLockIndicator` no se pasa (queda `false` por defecto): en modo juego no se muestra el candado sobre el elemento, tal como pide `description.md`.

6. **`modes/edit/editMode.js` — indicador de candado**: en la llamada a `renderComponentsOnTable` dentro de `renderTable()` (línea ~277), añadir `showLockIndicator: true`. No se toca la selección de modo edición (sigue con `onToggleSelect`/`selectedId` como hoy).

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:
- **Sección 3** (Modo juego vs modo edición): documentar que `modes/play/playMode.js` ahora mantiene un estado de selección transitorio a nivel de módulo (`selectedComponentId`, análogo al de `editMode.js`, no persistido) para dar soporte al menú contextual de click derecho, y que reutiliza la clase `--selected` ya existente por tipo sin usar `onToggleSelect`.
- **Sección 5** (`ui/componentRenderer.js`): documentar los dos parámetros nuevos de `renderComponentsOnTable` (`onContextMenu`, `showLockIndicator`) y el nuevo helper `createLockBadge()`, con la misma regla de "contenedor exterior, nunca el interno con overflow" ya establecida para `.component-id-label`. Añadir también `ui/contextMenu.js` al listado de módulos reutilizables de esta sección, con su contrato (`openContextMenu`), su comportamiento singleton y sus tres vías de cierre.
- **Sección 8** (funcionalidades transversales a revisar al añadir un elemento nuevo): añadir una entrada nueva — "menú contextual y candado de bloqueo" — recordando que un tipo de componente futuro que use `renderComponentsOnTable` ya obtiene ambos automáticamente (no requieren nada específico por tipo, a diferencia de otras funcionalidades transversales de esa lista), pero que cualquier acción **específica** por tipo que se añada más adelante deberá pasarse vía `specificItems` del nuevo `onContextMenu`.

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`:
- **Nueva sección 12.8** ("Menú contextual de componente"): documentar `.context-menu`/`.context-menu__item`/`.context-menu__separator`, dejando explícito que reutiliza el mismo lenguaje visual ya fijado en la sección 12.7 (`.resource-add__menu`) — fondo azul claro, hover azul sólido con texto claro, sombra nivel 2 — y que cualquier menú contextual futuro debe reutilizar este patrón en vez de crear uno ad-hoc.
- **Sección 12.3** (Etiqueta identificativa de componente): añadir un apartado hermano para el indicador de candado (`.component-lock-badge`) — insignia circular oscura superpuesta en una esquina del componente, solo en modo edición, `pointer-events: none` igual que `.component-id-label`, visible de forma permanente mientras `bloqueado` esté activo (a diferencia de la etiqueta identificativa, que solo aparece en hover/selección).
