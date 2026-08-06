**Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

Sin alcance excluido: el cambio es puramente visual, tal como quedó documentado en `description.md` tras la validación del mockup con el usuario. No ha surgido ninguna duda técnica adicional que resolver con el usuario durante la planificación.

## (b) Solución técnica

1. **Nuevo icono/insignia "Copia" en `src/ui/componentRenderer.js`**
   - Añadir `createCopyBadge()`, función hermana de `createLockBadge()`/`createHiddenBadge()` (mismo fichero, líneas ~238-265): crea un `<span class="component-copy-badge">` con un SVG de dos cuadrados superpuestos (`stroke="currentColor"`, mismo `stroke-width="2"` que los otros dos iconos), análogo en estructura a los ya existentes.
   - Añadir el parámetro `showCopyIndicator = false` a la firma de `renderComponentsOnTable` (línea 486), junto a `showLockIndicator`/`showHiddenIndicator`.
   - En cada una de las 7 ramas de tipo de componente (`texto`/textBox, `tableroSimple`/board, `tableroPersonalizado`/tablero, `dado`/dice, `documento`/documentViewer, `carta`, `mazo` — líneas 536-537, 671-672, 900-901, 1038-1039, 1254-1255, 1469-1470, 1673-1674), añadir justo después de la línea de `showHiddenIndicator`:
     ```js
     if (showCopyIndicator && component.copyOf) <el>.appendChild(createCopyBadge());
     ```
   - En esas mismas 7 ramas, justo después de añadir la clase `--selectable` correspondiente (líneas 540, 754, 916, 1075, 1291, 1481, 1684 — nótese que `mazo` reutiliza `carta--selectable`, no tiene clase propia, ver `STYLE_BIBLE.md` sección 13), añadir cuando corresponda:
     ```js
     if (showCopyIndicator && component.copyOf) <el>.classList.add('is-copy');
     ```
     `is-copy` es una clase de estado simple sin prefijo de bloque, mismo criterio que `.lifted`/`.active`/`.grabbing` (`STYLE_BIBLE.md` sección 7): no es un modificador BEM de un bloque concreto, sino un estado transversal a los 7 tipos, necesario para poder aplicarlo con un único selector CSS por tipo sin duplicar la variante de color en las 6 clases `--selectable` existentes.

2. **Nuevo parámetro en `src/modes/edit/editMode.js`**
   - En `renderTable()` (línea ~458-461), añadir `showCopyIndicator: true` junto a `showLockIndicator: true`/`showHiddenIndicator: true` en la llamada a `renderComponentsOnTable`.
   - No tocar `src/modes/play/playMode.js`: al no pasar el parámetro, `showCopyIndicator` queda en su valor por defecto (`false`) y el distintivo no aparece en modo juego, igual que ya ocurre con candado/oculto.

3. **Nuevos estilos en `src/styles/main.css`**
   - Junto a los bloques `.component-lock-badge`/`.component-hidden-badge` (sección "Indicador de bloqueo", líneas ~2150-2194), añadir `.component-copy-badge` con la misma estructura (`position: absolute`, `width/height: 18px`, `border-radius: 50%`, `box-shadow`, `pointer-events: none`, `color: var(--text-light)`) pero:
     - `bottom: 2px; left: 2px;` (esquina inferior izquierda, libre — superior izquierda: `.component-id-label`; superior derecha: candado; inferior derecha: oculto).
     - `background: var(--error);` en vez de `rgba(0, 0, 0, 0.55)`.
   - Añadir también `.component-copy-badge svg` con las mismas reglas que `.component-lock-badge svg`/`.component-hidden-badge svg` (`width/height: 100%`, `padding: 3px`, `box-sizing: border-box`).
   - Para el contorno de selección/hover en rojo: en cada uno de los 6 bloques `--selectable`/`--selected` existentes (`.text-box`, `.board`, `.tablero-personalizado`, `.dice`, `.document-viewer`, `.carta` — este último cubre también `mazo`, que reutiliza sus clases), añadir justo debajo del bloque ya existente una variante calificada con `.is-copy`, p. ej. para `carta` (líneas 930-944):
     ```css
     .carta--selectable.is-copy:hover,
     .carta--selectable.is-copy.carta--selected {
       outline-color: var(--error);
     }

     .carta--selectable.is-copy:hover .component-id-label,
     .carta--selectable.is-copy.carta--selected .component-id-label {
       background: var(--error);
     }
     ```
     Repetir el mismo patrón (dos reglas) para los otros 5 selectores (`text-box--selectable`, `board--selectable`, `tablero-personalizado--selectable`, `dice--selectable`, `document-viewer--selectable`), sustituyendo el nombre de bloque correspondiente. Como CSS aplica las reglas por orden de aparición y ambas tienen la misma especificidad, colocar estos bloques **después** del bloque base ya existente para que `outline-color`/`background` en rojo prevalezcan sobre el azul cuando el elemento tiene también la clase `is-copy`.
   - No se toca `.component-id-label` en sí (su regla base sigue con `background: var(--accent-blue-dark)`): el rojo se aplica solo mediante la regla más específica de arriba cuando el elemento es copia y está en hover/seleccionado.

4. **Verificación de convivencia con candado/oculto**: no requiere cambio de código adicional — al estar cada insignia en su propia esquina (`.component-lock-badge` arriba-derecha, `.component-hidden-badge` abajo-derecha, `.component-copy-badge` abajo-izquierda, `.component-id-label` arriba-izquierda) y todas con `pointer-events: none`, conviven sin solaparse ni interferir con el arrastre/selección, igual que ya ocurre hoy con las dos existentes.

## (d) Cambios en estilo

Actualizar `STYLE_BIBLE.md` sección 12.3 ("Etiqueta identificativa de componente (modo edición)"), a continuación del párrafo de "Indicador de 'Oculto'": documentar el nuevo `.component-copy-badge` (insignia hermana de `.component-lock-badge`/`.component-hidden-badge`, mismo patrón de superposición/`pointer-events: none`/visibilidad permanente en modo edición vía `showCopyIndicator`), anclada en la esquina inferior **izquierda** (la última libre de las cuatro), con la diferencia deliberada de fondo `var(--error)` en vez del `rgba(0,0,0,.55)` neutro de las otras dos — primer uso de `--error` fuera de su semántica original de error/acción destructiva, decidido explícitamente para este indicador (no reabre esa convención para otros usos sin decidirlo de nuevo).

Documentar también la clase de estado `is-copy` (sección 7, junto a `.grabbing`/`.active`/`.lifted`): añadida por `ui/componentRenderer.js` cuando `component.copyOf` es truthy y `showCopyIndicator` está activo, usada para calificar en rojo (`var(--error)`) el contorno discontinuo de selección/hover y el fondo de `.component-id-label` de una copia, en vez del azul estándar (`var(--accent-blue)`/`var(--accent-blue-dark)`) — mismo criterio de "estado transversal sin prefijo de bloque" que las clases ya catalogadas ahí.
