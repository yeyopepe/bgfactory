- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** el menú contextual "Meter en mazo..." (`ui/insertIntoMazoModal.js`) no se toca. El `confirm()` nativo que ya existe hoy en modo edición al soltar cartas sobre un mazo (`attemptDropOnMazo`, `modes/edit/editMode.js`) no se elimina ni se modifica — solo se le añade el resaltado durante el arrastre, previo a ese diálogo. Ningún otro comportamiento de arrastre (bloqueo, "levantar" al arrastrar, zona de revelado, etc.) se toca.

**Dudas resueltas con el usuario:** ninguna pregunta abierta durante la planificación — las decisiones de alcance (sin confirmación en modo juego, inserción siempre "abajo del todo", resaltado también con selección múltiple en modo edición, confirm() de modo edición intacto) ya se resolvieron y quedaron fijadas en `description.md` durante `ms-new`.

## (b) Solución técnica

1. **`src/core/deck.js` — sin cambios.** Se reutiliza tal cual la función `rectsOverlap(a, b)` ya existente, usada hoy por `attemptDropOnMazo` de modo edición.

2. **`src/ui/componentRenderer.js` — resaltado del mazo durante el arrastre, en el único punto de renderizado compartido por ambos modos.**
   - Añadir `rectsOverlap` al import ya existente de `../core/deck.js` (línea 14): `import { getMazoRevealZoneRect, rectsOverlap } from '../core/deck.js';`.
   - Dentro de `renderComponentsOnTable`, declarar una variable de módulo de la función (junto a `elementsById`, ~línea 525): `let dropTargetMazoEl = null;` — el elemento del mazo actualmente resaltado (o `null`), compartida por todas las cartas que se puedan arrastrar en este render.
   - Añadir una función interna, junto a `getBlockDragTargets` (~línea 532), que centraliza la lógica de solape y resaltado, reutilizable por el bloque `'carta'`:
     ```js
     function updateMazoDropHighlight(rect) {
       const mazo = components.find((c) => c.type === 'mazo' &&
         rectsOverlap(rect, { x: c.x ?? 100, y: c.y ?? 100, width: c.width ?? 100, height: c.height ?? 100 }));
       const targetEl = mazo ? elementsById.get(mazo.id) : null;
       if (targetEl === dropTargetMazoEl) return;
       if (dropTargetMazoEl) dropTargetMazoEl.classList.remove('drop-target');
       dropTargetMazoEl = targetEl || null;
       if (dropTargetMazoEl) dropTargetMazoEl.classList.add('drop-target');
     }
     function clearMazoDropHighlight() {
       if (dropTargetMazoEl) dropTargetMazoEl.classList.remove('drop-target');
       dropTargetMazoEl = null;
     }
     ```
     Mismo criterio de solape que `attemptDropOnMazo` (`editMode.js`): solo el rectángulo del componente bajo el cursor, no la caja envolvente de toda una selección múltiple.
   - En el bloque de renderizado del tipo `'carta'` (~línea 1570-1634, dentro de `if (onMove && canMove(component))`):
     - En el listener `mousedown` (~línea 1623), calcular una vez si el gesto puede terminar en inserción: `const isCartaOnlyGroup = selectedIds.size <= 1 || [...selectedIds].every((id) => components.find((c) => c.id === id)?.type === 'carta');` — cubre tanto el caso de una única carta (modo juego, y modo edición sin selección múltiple) como una selección múltiple compuesta solo por cartas (modo edición). Si la selección mezcla tipos, no se resalta nada (igual que `attemptDropOnMazo` no ofrece insertar en ese caso).
     - En `handleMouseMove` (~línea 1583), después de actualizar `currentX`/`currentY`: si `isCartaOnlyGroup`, llamar a `updateMazoDropHighlight({ x: currentX, y: currentY, width: component.width ?? 100, height: component.height ?? 100 })`; si no, no hacer nada (sin resaltado).
     - En `handleMouseUp` (~línea 1613), antes de `onMove(...)`, llamar siempre a `clearMazoDropHighlight()` — el resaltado nunca debe sobrevivir a soltar el ratón, ni siquiera si `onMove` decide insertar en el mazo (que redibuja la mesa de todos modos).
   - No se toca el bloque de renderizado del tipo `'mazo'` (~línea 1782-1837): un mazo no puede arrastrarse encima de otro mazo para insertarse (no aplica a este cambio).

3. **`src/modes/play/playMode.js` — insertar directo al soltar, sin confirmación (comportamiento nuevo de este cambio).**
   - Añadir `rectsOverlap` al import ya existente de `../../core/deck.js` (línea 10): `import { getCartaIdsEnAlgunMazo, shuffleCartaIds, rectsOverlap } from '../../core/deck.js';`.
   - Modificar el callback `onMove` (~línea 147-150): antes del `replaceComponent`/`reorderComponent` actuales, si `component.type === 'carta'`, buscar un mazo solapado con el mismo criterio que `attemptDropOnMazo` y, si lo hay, insertar la carta al final de `cartaIds` de ese mazo y devolver sin mover la carta ni reordenarla (queda oculta de la mesa por estar ya en `cartaIds`, igual que cualquier otra carta guardada en un mazo):
     ```js
     onMove: (component, x, y) => {
       if (component.type === 'carta') {
         const mazo = getComponents()
           .filter((c) => c.type === 'mazo')
           .find((m) => rectsOverlap({ x, y, width: component.width ?? 100, height: component.height ?? 100 }, { x: m.x ?? 100, y: m.y ?? 100, width: m.width ?? 100, height: m.height ?? 100 }));
         if (mazo) {
           const cartaIds = [...(mazo.properties?.cartaIds || []), component.id];
           replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds } }));
           return;
         }
       }
       replaceComponent(component.id, updateComponent(component, { x, y }));
       if (component.subirAlMoverInteractuar) reorderComponent(component.id, 1);
     },
     ```
   - Modo juego no tiene selección múltiple (`selectedComponentId` es un único id), así que no hace falta ninguna lógica de grupo aquí — coincide con el `isCartaOnlyGroup` de `componentRenderer.js`, que para un único elemento arrastrado siempre vale `true`.

4. **`src/modes/edit/editMode.js` — sin cambios funcionales.** `attemptDropOnMazo` ya implementa la inserción con `confirm()`; el resaltado añadido en el paso 2 se aplica automáticamente porque `editMode.js` usa la misma `renderComponentsOnTable`.

Orden de implementación: 1 (sin cambios, solo confirmar) → 2 (resaltado compartido) → 3 (inserción directa en modo juego) → 4 (verificar que modo edición sigue igual).

## (d) Cambios en estilo

- **`design/docs/style/INDEX.md`**: añadir nueva subsección junto a "Efecto 'levantar' al arrastrar en Modo Juego" (mismo formato: bloque de texto explicando el estado transitorio, su disparador y su alcance), describiendo el nuevo estado `.drop-target`:
  - Estado transitorio sin BEM (mismo criterio que `.lifted`/`.active`/`.grabbing`, catalogado en §7), añadido/quitado por JS (`ui/componentRenderer.js`) sobre el elemento de un `'mazo'` (que reutiliza `.carta`) mientras una carta (o selección compuesta solo por cartas, en modo edición) se arrastra por encima y solapa con él.
  - Aplica en ambos modos por igual, al vivir en el único punto de renderizado compartido (`renderComponentsOnTable`) — no es exclusivo de modo juego como `.lifted`.
  - Se retira siempre al soltar el ratón, se inserte o no la carta en el mazo (la mesa se redibuja de todos modos si se inserta).
  - Añadir también `.drop-target` a la lista de ejemplos de "Estados transitorios" de §7 (junto a `.grabbing`, `.active`, `.lifted`).
- **`src/styles/main.css`**: añadir la regla `.drop-target`, agrupada junto a las reglas de `.carta--selectable`/`.mazo--clickable`/`.mazo-count-label` (~línea 1013-1057, sección de `'mazo'`), con un comentario breve explicando el porqué (nuevo estado, distinto de `.carta--selected`, no confundir contorno discontinuo de selección con contorno de zona de suelta). Reutiliza tokens existentes, sin introducir ninguno nuevo — mismo halo que ya usa la maqueta `changes/inProgress/00188/design_mazo-drop-highlight.html` (solo como referencia de aspecto, no de código):
  ```css
  .drop-target {
    outline: 3px solid var(--accent-blue);
    outline-offset: 3px;
    box-shadow: var(--shadow-2), 0 0 0 6px var(--accent-blue-light);
  }
  ```
  Contorno **sólido** (a diferencia del contorno discontinuo `dashed` de `.carta--selected`) para no confundirse visualmente con el estado de selección — semánticamente son estados distintos (zona de suelta vs. elemento seleccionado) y pueden coexistir si el mazo estuviera seleccionado a la vez.

## (e) Verificación

1. En modo juego, arrastrar una carta desbloqueada hasta solapar un mazo: mientras se arrastra por encima, el mazo se resalta (contorno azul sólido + halo); al soltar, la carta desaparece de la mesa sin ningún diálogo de confirmación y el contador de cartas del mazo (`"<id> — N cartas"`) sube en 1.
2. En modo juego, arrastrar una carta y soltarla fuera de cualquier mazo: comportamiento sin cambios (la carta se mueve a la posición soltada, sin resaltado de ningún mazo).
3. En modo juego, verificar que la carta insertada queda "abajo del todo": abrir "Ver contenido..." del mazo desde su menú contextual y comprobar que la carta insertada aparece la última de la lista.
4. En modo juego, arrastrar una carta bloqueada (`bloqueado !== 'ninguno'`) sobre un mazo: no se puede arrastrar en absoluto (comportamiento previo sin cambios), por tanto tampoco se inserta ni se resalta nada.
5. En modo edición, arrastrar una única carta sobre un mazo: el mazo se resalta igual que en modo juego mientras se arrastra; al soltar, sigue apareciendo el `confirm()` nativo ya existente — aceptar inserta la carta, cancelar no hace nada (comportamiento previo sin cambios, solo con el resaltado añadido antes).
6. En modo edición, seleccionar varias cartas (Ctrl+click) y arrastrarlas juntas sobre un mazo: el mazo se resalta igual que con una sola; al soltar y confirmar, todas se insertan en el mazo (comportamiento previo sin cambios).
7. En modo edición, seleccionar una mezcla de carta(s) y algún otro tipo de componente, y arrastrar esa selección sobre un mazo: el mazo **no** se resalta (igual que hoy no se ofrece insertar en ese caso).
8. En cualquiera de los dos modos, arrastrar una carta que pase brevemente por encima de un mazo y luego se aleje antes de soltar: el resaltado aparece al solapar y desaparece en cuanto deja de solapar, sin esperar a soltar.
