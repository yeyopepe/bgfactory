**Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se toca `ajusteImagen.rotation` (rotación de la imagen de relleno de una `Forma` o de la imagen de fondo de una cara, cambio 00140) — es un mecanismo ya existente y distinto, que sigue funcionando igual y de forma independiente del nuevo campo.
- No se gira el componente `'carta'`/`'tableroPersonalizado'` completo, ni el componente `'texto'` independiente de la mesa.
- Solo se admiten los 4 ángulos de 90° en 90° (0/90/180/270), sin rotación libre/arbitraria.

**Dudas de alcance ya resueltas con el usuario (ver `description.md`):**
- Disparador: menú contextual del elemento (opción "Girar 90°"), no un control en la modal de propiedades.
- Efecto en tamaño: el marco (`x`/`y`/`width`/`height`) no cambia al girar; solo gira visualmente el contenido dentro de él, pudiendo recortarse por el `overflow: hidden` existente si no encaja.

## (b) Solución técnica

1. **Nuevo campo de datos** `rotation` (`0 | 90 | 180 | 270`, opcional, ausente/`undefined` tratado como `0`) en los objetos `Forma` y `TextBox` (`src/ui/visualEditorModal.js`, propiedades `cara.formas[]`/`cara.textBoxes[]`). No requiere valor por defecto explícito al crear un elemento nuevo (`onAddTextBox`/`onAddShape`, `src/ui/visualEditorModal.js`) ni migración de guardados anteriores — mismo criterio que el campo `orden` ya existente (ausente se comporta como `0`, sin cambio visual).

2. **Acción "Girar 90°" en el menú contextual del elemento** (`openElementContextMenu`, `src/ui/visualEditorModal.js:569-621`): añadir una nueva entrada al bloque que ya solo se muestra cuando `kind && id` (junto a "Eliminar"/"Colocar arriba"/"Colocar abajo"), con un icono nuevo `createRotateIcon()` (mismo patrón SVG `viewBox="0 0 24 24"`, `stroke="currentColor"` que `createBringToFrontIcon`/`createSendToBackIcon`, líneas 77-95). El `onClick` localiza el elemento (`cara.formas`/`cara.textBoxes`, mismo patrón que la acción "Copiar" ya presente en ese mismo bloque) y hace `element.rotation = ((element.rotation ?? 0) + 90) % 360`, seguido de `renderFaces()` para repintar.

3. **Renderizado en el lienzo del editor** (`src/ui/visualEditorModal.js`):
   - `renderTextBox` (línea ~877 en adelante): tras fijar `left`/`top`/`width`/`height`, añadir `if (textBox.rotation) el.style.transform = \`rotate(${textBox.rotation}deg)\`;`. No hace falta fijar `transform-origin` explícito: el origen por defecto de CSS (`50% 50%`, centro del propio elemento) es exactamente el que hace falta aquí, a diferencia de `applyImageAdjustStyle` (que sí lo recalcula porque rota una imagen más grande que su contenedor).
   - `renderShape` (línea ~1030 en adelante): mismo tratamiento con `shape.rotation` sobre el `el` de la figura.
   - En ambos casos, la rotación se aplica sobre el elemento interactivo (`el`) que también lleva el manejador de arrastre/redimensionado (`attachResizeHandle`, `src/ui/resizeHandle.js`). Verificado que esto no rompe la interacción: tanto el arrastre (`handleMouseMove` en `renderTextBox`/`renderShape`, basado en `e.clientX/clientY` menos el punto de inicio, sin usar `getBoundingClientRect()`) como `attachResizeHandle` (basado en delta de `clientX/clientY` respecto al `mousedown`, tampoco usa `getBoundingClientRect()`) calculan siempre en coordenadas de pantalla/mouse puras, independientes de cualquier `transform` visual aplicado al elemento — el único efecto colateral es que el tirador de resize (esquina) queda visualmente girado junto con el resto del elemento, aceptable para esta funcionalidad (mismo tipo de compromiso visual que ya asume el proyecto en otros sitios, p.ej. el recorte de contenido que no cabe tras redimensionar una carta, cambio 00151).

4. **Renderizado en la mesa** (`src/ui/componentRenderer.js`, `paintCartaFace` → `paintShape`/`paintTextBox`, líneas ~315-380): mismo tratamiento — tras fijar `left`/`top`/`width`/`height` en `shapeEl`/`textEl`, aplicar `transform: rotate(Ndeg)` si `shape.rotation`/`textBox.rotation` es distinto de `0`. Ambos elementos ya tienen `pointerEvents: 'none'` y ya conviven con el `overflow: hidden` del contenedor de la carta/tablero (`ui/componentRenderer.js`), así que el recorte de contenido que no encaje tras girar se resuelve solo, sin código adicional.

5. **Sin cambios necesarios en**:
   - `core/cardFaceElements.js` (`getOrderedFaceElements`/`bringElementToFront`/`sendElementToBack`): el campo `rotation` no participa del orden de apilado, y no requiere ningún fallback ni migración (mismo criterio que otros campos opcionales del elemento).
   - `core/styleClipboard.js` (`cloneFace`): `textBoxes` se clona con `{ ...tb }` (spread genérico) y `rotation` viajará automáticamente al copiar/pegar estilo sin tocar ninguna lista de campos explícita.
   - Los flujos de "Duplicar" (`onDuplicate` en `renderTextBox`/`renderShape`, `src/ui/visualEditorModal.js`) y "Copiar"/"Pegar" (`copiedElement`/`pasteElementAt`) ya copian el objeto completo del elemento (`{ ...element }`/spread), así que `rotation` se conserva sin cambios de código.
   - Las modales de propiedades `src/ui/cardTextBoxModal.js`/`src/ui/cardShapeModal.js` no necesitan ningún campo nuevo (la rotación se gestiona íntegramente desde el menú contextual, según lo confirmado con el usuario).

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`, sección 4 ("Modelo de datos de componente" → tipo `'carta'`):

- En la definición de `Forma` (línea ~160): añadir `rotation` al listado de campos (`{ id, tipo, x, y, width, height, ..., rotation: 0 | 90 | 180 | 270 | undefined }`), documentando que gira visualmente el elemento completo (no solo su imagen de relleno, que sigue usando `ajusteImagen.rotation`) sin alterar `x`/`y`/`width`/`height`, editable con "Girar 90°" desde el menú contextual del elemento (cambio 00163), `undefined`/ausente equivalente a `0`.
- En la definición de `TextBox` (línea ~163): añadir el mismo campo `rotation` con la misma semántica y el mismo cambio 00163 como origen.
- **Corregir la incongruencia detectada durante el análisis** (independiente de esta funcionalidad, pero en la misma sección ya tocada): las referencias a `ui/cardEditorModal.js` en la sección 4 (en torno a las líneas 154-168) deben pasar a `ui/visualEditorModal.js`, que es el nombre real del fichero tras un renombrado posterior no reflejado en la documentación.
