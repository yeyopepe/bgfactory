- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se modifica el indicador existente `.component-copy-badge` de la copia, ni la lógica de creación/sincronización de copias (`core/component.js`), ni ningún otro indicador de esquina (candado, oculto).

**Dudas resueltas con el usuario:** todas las dudas de alcance se resolvieron ya en `description.md` (paso `ms-new`): aplica a los 7 tipos de componente, forma de píldora para el número, solo modo edición. No ha surgido ninguna duda técnica nueva durante la planificación.

## (b) Solución técnica

1. **`src/ui/componentRenderer.js` — precalcular el número de copias por original.** Dentro de `renderComponentsOnTable`, justo antes del `for (const component of stackedComponents)` (línea ~519), añadir un único recorrido de `components` que construya `copyCountByOriginalId` (`Map<string, number>`): por cada componente con `copyOf` truthy, incrementa el contador de esa clave. Cálculo en O(n) una sola vez por render, reutilizado luego por los 7 tipos — evita recorrer la lista completa una vez por componente.
   ```js
   const copyCountByOriginalId = new Map();
   for (const c of components) {
     if (c.copyOf) copyCountByOriginalId.set(c.copyOf, (copyCountByOriginalId.get(c.copyOf) ?? 0) + 1);
   }
   ```
2. **`src/ui/componentRenderer.js` — nueva función `createHasCopiesBadge(count)`.** Añadirla junto a `createCopyBadge` (tras su definición, línea ~277), mismo criterio de comentario explicando cuándo se pinta:
   ```js
   // Indicador de "Tiene copias": insignia superpuesta, solo pintada en modo edición
   // (`showCopyIndicator`) sobre el componente ORIGINAL (`component.copyOf` es `null`) cuando
   // tiene al menos una copia vinculada — mismo icono/color que `.component-copy-badge` (la
   // insignia que lleva la copia), pero en forma de píldora con el número de copias entre
   // paréntesis, ya que no cabe en el círculo fijo de 18px. Misma esquina inferior izquierda:
   // nunca coincide con `.component-copy-badge` en el mismo componente, porque un original
   // nunca tiene `copyOf` propio (no se permiten copias de copias).
   function createHasCopiesBadge(count) {
     const badge = document.createElement('span');
     badge.className = 'component-has-copies-badge';
     badge.innerHTML =
       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
       '<rect x="3" y="8" width="11" height="11" rx="1.5"/>' +
       '<path d="M8 8V5a1.5 1.5 0 0 1 1.5-1.5H19A1.5 1.5 0 0 1 20.5 5v11A1.5 1.5 0 0 1 19 17.5h-3" stroke-linecap="round" stroke-linejoin="round"/>' +
       '</svg>' +
       `<span>(${count})</span>`;
     return badge;
   }
   ```
3. **`src/ui/componentRenderer.js` — invocar el nuevo badge en los 7 puntos de renderizado.** Justo después de cada línea existente `if (showCopyIndicator && component.copyOf) X.appendChild(createCopyBadge());` (líneas 546, 683, 912, 1051, 1269, 1485, 1694 — tipos `texto`/`board`/`tableroPersonalizado`/`dice`/`documentViewer`/`carta`/`mazo`), añadir el hermano simétrico:
   ```js
   if (showCopyIndicator && !component.copyOf) {
     const copyCount = copyCountByOriginalId.get(component.id) ?? 0;
     if (copyCount > 0) X.appendChild(createHasCopiesBadge(copyCount));
   }
   ```
   (sustituyendo `X` por la variable local de cada rama: `textBox`, `board`, `tablero`, `dice`, `documentViewer`, `carta`, `mazo`). No hace falta tocar las líneas `classList.add('is-copy')` de cada rama — ese estado sigue aplicándose solo a las copias, sin cambios.
4. **`src/styles/main.css` — nueva clase `.component-has-copies-badge`.** Añadirla justo después del bloque `.component-copy-badge`/`.component-copy-badge svg` (tras línea 2495), replicando el mismo patrón de superposición (posición, esquina, `z-index`, `pointer-events: none`... nota: revisar que `.component-copy-badge` actual no declare `pointer-events: none` explícito — si no lo declara, tampoco añadirlo aquí, para mantener paridad exacta) pero en forma de píldora:
   ```css
   /* Indicador de "Tiene copias": mismo lenguaje visual que .component-copy-badge (icono,
      color var(--error), esquina inferior izquierda) sobre el componente ORIGINAL, pero en
      forma de píldora con el número de copias vinculadas — no cabe en el círculo fijo de 18px. */
   .component-has-copies-badge {
     position: absolute;
     bottom: 2px;
     left: 2px;
     z-index: 1;
     height: 18px;
     padding: 0 6px 0 3px;
     border-radius: 9px;
     background: var(--error);
     color: var(--text-light);
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
     display: flex;
     align-items: center;
     gap: 3px;
     font-size: 0.72rem;
     font-weight: 600;
     white-space: nowrap;
   }

   .component-has-copies-badge svg {
     width: 14px;
     height: 14px;
     flex-shrink: 0;
   }
   ```
   Usar exactamente `bottom: 2px; left: 2px;` (no `6px` como en la maqueta de referencia `design_indicadores-copia-comparacion.html`, que usaba un valor distinto solo por espaciado de la maqueta) para coincidir con el offset real de `.component-copy-badge`/`.component-lock-badge`/`.component-hidden-badge` en `main.css`.

## (c) Cambios de arquitectura

No aplica: el cambio no modifica capas, modelo de datos ni flujo de eventos — solo añade renderizado derivado (badge calculado a partir de datos ya existentes, `copyOf`).

## (d) Cambios en estilo

- **`design/docs/style/03-modales-menus.md`, §12.3** — añadir un nuevo apartado hermano de "Indicador de 'Copia'" (tras él, antes de "Contorno de selección y etiqueta en rojo para copias"), documentando `.component-has-copies-badge`: mismo criterio de superposición que candado/oculto/copia (esquina, `pointer-events: none`, permanente en modo edición vía `showCopyIndicator`), fondo `var(--error)` igual que el indicador de copia (mismo motivo: familia visual compartida), forma de píldora en vez de círculo fijo porque incorpora el número de copias entre paréntesis, mutuamente excluyente con `.component-copy-badge` en el mismo componente (un original nunca tiene `copyOf`).

## (e) Verificación

1. En modo edición, un componente (de cualquiera de los 7 tipos) sin copias no muestra ningún badge nuevo en su esquina inferior izquierda.
2. En modo edición, un componente original con 1 copia vinculada muestra en su esquina inferior izquierda una píldora roja con el icono de "copia" seguido de "(1)".
3. Crear una segunda copia del mismo original: la píldora pasa a mostrar "(2)" tras el siguiente render (p. ej. reabrir/actualizar el panel o recargar la mesa).
4. Eliminar todas las copias de ese original: la píldora deja de mostrarse.
5. Una copia (componente con `copyOf` no nulo) sigue mostrando exactamente el badge existente (círculo con solo icono), nunca la píldora nueva — confirma que ambos indicadores son mutuamente excluyentes.
6. En modo juego, ningún componente (ni original con copias ni copia) muestra ninguno de los dos badges — se sigue respetando que `showCopyIndicator` solo se activa en modo edición.
7. Repetir la comprobación 2 con al menos dos tipos de componente distintos de `'carta'` (p. ej. `'tableroSimple'` y `'dado'`) para confirmar que el indicador es realmente transversal a los 7 tipos.
