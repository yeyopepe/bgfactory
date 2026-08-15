- **Fecha creación**: 2026-08-15

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se modifica el arrastre normal de cartas/componentes que no termina sobre un mazo, ni el resto de handlers (`onResize`, selección, etc.). El mecanismo interno de `runWithProgressModal` (doble `requestAnimationFrame`, fix 00218) no cambia — el problema no estaba ahí, sino en qué trabajo queda fuera de su envoltorio.

**Dudas resueltas con el usuario:** ninguna pregunta abierta — la causa raíz y el comportamiento esperado ya los aportó el propio usuario/análisis previo.

## (b) Solución técnica

- [x] **`src/modes/edit/editMode.js` — dividir `attemptDropOnMazo` (línea ~167) en detección pura + aplicación.** Sustituir la función actual por dos funciones sin efectos secundarios en la primera:
  ```js
  // Detecta si el grupo arrastrado (todas cartas) va a caer sobre un mazo al
  // soltarlo, sin aplicar ningún cambio todavía — permite decidir si hace falta
  // la modal de operación en curso antes de lanzar el trabajo bloqueante.
  function findMazoDropTarget(groupIds, draggedRect) {
    const groupComponents = groupIds.map((id) => getComponents().find((c) => c.id === id)).filter(Boolean);
    if (groupComponents.length === 0 || !groupComponents.every((c) => c.type === 'carta')) return null;

    const mazo = getComponents()
      .filter((c) => c.type === 'mazo')
      .find((m) => rectsOverlap(draggedRect, { x: m.x ?? 100, y: m.y ?? 100, width: m.width ?? 100, height: m.height ?? 100 }));
    if (!mazo) return null;

    return { mazo, groupComponents };
  }

  // Mismo criterio que en modo juego: sin confirmación previa.
  function insertCardsIntoMazo(mazo, groupComponents) {
    const cartaIds = [...(mazo.properties?.cartaIds || []), ...groupComponents.map((c) => c.id)];
    replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds } }));
  }
  ```
  `findMazoDropTarget` reutiliza exactamente la misma lógica de detección que tenía `attemptDropOnMazo` (mismo criterio de solape, mismo filtro "todas cartas"), sin tocar ningún estado — solo lectura.
- [x] **`src/modes/edit/editMode.js` — mover la decisión de mostrar la modal a antes del bucle de posiciones, dentro del handler `onMove` (línea ~739).** Reestructurar así:
  ```js
  onMove: (component, x, y) => {
    const group = selectedComponentIds.size > 1 && selectedComponentIds.has(component.id)
      ? [...selectedComponentIds]
      : getSelectionUnit(component);

    const dropTarget = findMazoDropTarget(group, { x, y, width: component.width ?? 100, height: component.height ?? 100 });

    const applyPositions = () => {
      if (group.length > 1) {
        const dx = x - (component.x ?? 0);
        const dy = y - (component.y ?? 0);
        for (const id of group) {
          const c = getComponents().find((comp) => comp.id === id);
          if (!c) continue;
          const newX = c.id === component.id ? x : (c.x ?? 0) + dx;
          const newY = c.id === component.id ? y : (c.y ?? 0) + dy;
          replaceComponent(c.id, updateComponent(c, { x: newX, y: newY }));
        }
      } else {
        replaceComponent(component.id, updateComponent(component, { x, y }));
      }
    };

    if (dropTarget) {
      const count = dropTarget.groupComponents.length;
      const text = `Añadiendo ${count} carta${count === 1 ? '' : 's'} al mazo…`;
      runWithProgressModal(text, () => {
        applyPositions();
        insertCardsIntoMazo(dropTarget.mazo, dropTarget.groupComponents);
      });
    } else {
      applyPositions();
    }
  },
  ```
  Clave del fix: `findMazoDropTarget` se evalúa **antes** de tocar ningún estado (lectura pura sobre `getComponents()` actual, sin `replaceComponent`), así que la modal ya está en el DOM y pintada (doble `requestAnimationFrame`, fix 00218) antes de que arranque el bucle de `replaceComponent` de posiciones — que es donde estaba el bloqueo real (N re-renders + N autoguardados vía `components:changed`). Cuando no hay `dropTarget` (arrastre normal), el camino queda idéntico al actual: `applyPositions()` se ejecuta de inmediato, sin modal, sin ningún retraso ni cambio de comportamiento.

## (d) Cambios en estilo

- **`design/docs/style/03-modales-menus.md`**, sección §12.1.2 (línea 38): la frase "`work` inserta las cartas en el mazo" no refleja ya con precisión el alcance de la operación protegida — actualizar a algo como "`work` reposiciona las cartas arrastradas y las inserta en el mazo" para dejar claro que el trabajo protegido por la modal incluye también la actualización de posición de cada carta del grupo, no solo la inserción final (bug 00219: la modal no cubría antes ese trabajo, que era la parte realmente lenta).

## (e) Verificación

- [x] Leer `editMode.js` y confirmar que `findMazoDropTarget` no llama a `replaceComponent` ni a ninguna otra función que mute estado — solo lectura de `getComponents()`. Confirmado.
- [x] Confirmar que dentro de `onMove`, `findMazoDropTarget` se evalúa antes de cualquier llamada a `replaceComponent` (ni la del bucle de posiciones, ni la de la rama de un solo componente). Confirmado: `dropTarget` se calcula en la primera línea del handler, antes de definir `applyPositions`.
- [x] Confirmar que cuando `dropTarget` no es `null`, tanto `applyPositions()` como `insertCardsIntoMazo(...)` se ejecutan dentro del callback `work` pasado a `runWithProgressModal` — ninguna de las dos se ejecuta fuera de ese callback en ese caso. Confirmado.
- [x] Confirmar que cuando `dropTarget` es `null`, `applyPositions()` se ejecuta de forma inmediata y síncrona (sin pasar por `runWithProgressModal`), igual que el comportamiento anterior a este fix. Confirmado (rama `else`).
- [x] Regenerar el build (`python src/scripts/build.py`) y confirmar en el HTML generado que `findMazoDropTarget`/`insertCardsIntoMazo` aparecen, que ya no queda ninguna referencia a la función `attemptDropOnMazo` original, y que `runWithProgressModal` sigue apareciendo una sola vez como llamada (dentro de `onMove`). Confirmado en `index-v00214.html`.
