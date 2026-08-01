## (a) Anotaciones funcionales

Sin fuera de alcance relevante ni dudas técnicas adicionales: el `description.md` ya deja resueltas las preguntas de alcance (contenido a duplicar, cara de destino, desplazamiento de posición, cierre de la modal tras duplicar) durante `ms-new`. No ha surgido ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real al analizar esta solución.

## (b) Solución técnica

1. **`src/ui/cardTextBoxModal.js`** — añadir el botón "Duplicar" al footer:
   - Crear `duplicateBtn` (`btn-cancel`, mismo patrón que `cancelBtn`/`fontBtn`: botón secundario, no destructivo ni de confirmación) con texto `"Duplicar"`, insertado en el footer entre `deleteBtn` y `cancelBtn` (footer actual: `Eliminar` → `Cancelar` → `Aceptar`; con esto queda `Eliminar` → `Duplicar` → `Cancelar` → `Aceptar` — coincide con la maqueta `design_propiedades-cuadro-texto.html`, que coloca "Duplicar" justo después de "Eliminar").
   - `openCardTextBoxModal` pasa a aceptar un cuarto campo opcional en su único parámetro: `{ textBox, onAccept, onDelete, onDuplicate }`.
   - Al hacer click en `duplicateBtn`: si se pasó `onDuplicate`, invocarlo con `working` (el objeto que la modal ya mantiene con los campos editados en curso, el mismo que se pasa hoy a `onAccept`) y cerrar la modal (`overlay.remove()`) — mismo patrón exacto que ya sigue `deleteBtn` con `onDelete`.
   - No se toca ningún otro campo de la modal: la lógica de edición de `working` (contenido, tipografía, alineación, márgenes, tamaño, color, estilo, borde, fondo) ya existente no cambia.

2. **`src/ui/cardEditorModal.js`** — implementar el callback `onDuplicate` en la llamada a `openCardTextBoxModal` (dentro de `renderTextBox`, junto a `onAccept`/`onDelete` ya existentes):
   - Definir una constante para el desplazamiento en unidades de diseño, p. ej. `const DUPLICATE_OFFSET = 20;` (junto a `MIN_TEXT_BOX_DESIGN_SIZE`, cabecera del fichero) — no reutilizar el `+30` de `cloneComponent`/`createCopy` (`core/component.js`), que está en píxeles reales de mesa, no en unidades de diseño (`CARD_DESIGN_WIDTH = 300`); `20` guarda una proporción visualmente similar dado que un cuadro de texto nuevo por defecto ya mide `designWidth * 0.5` de ancho.
   - `onDuplicate: (workingTextBox) => { ... }`: construye una copia superficial de `workingTextBox` (`{ ...workingTextBox }`) con `id: crypto.randomUUID()` (mismo mecanismo que el botón "+ Texto") y `x`/`y` desplazados `+DUPLICATE_OFFSET` respecto al valor de `workingTextBox` (no del `textBox` original sin editar, para que el desplazamiento parta de la posición actual mostrada en el editor). No hace falta clonar en profundidad: ningún campo de `TextBox` es un objeto/array anidado (todos son `string`/`number`/`boolean`).
   - Aplica también los cambios en curso al original: `Object.assign(textBox, workingTextBox)` (mismo efecto que ya tiene `onAccept` sobre el original) antes de añadir la copia — así "Duplicar" deja el original actualizado con lo editado en esa sesión de la modal, igual que si se hubiera pulsado "Aceptar", tal como especifica `description.md`.
   - Añade la copia a la cara actual: `const cara = working[caraKey]; cara.textBoxes.push(copia);` (mismo `cara`/`caraKey` que ya usa `onDelete` en esa misma función) y llama a `renderFaces()` para refrescar el lienzo — mismo patrón que el botón "+ Texto" ya existente.
   - No hace falta clamping de `x`/`y` al desplazar (el editor ya permite mover cuadros de texto libremente fuera del lienzo visible sin restricción, según el código actual de arrastre).

## (c) Cambios de arquitectura

No aplica: no se añade ningún campo nuevo a `TextBox` ni se altera el modelo de datos de `'carta'` descrito en `ARCHITECTURE.md` sección 4 — solo se añade una acción de UI que crea una copia con la forma ya documentada.

## (d) Cambios en estilo

No aplica: el nuevo botón reutiliza tal cual la clase `btn-cancel` ya catalogada en `STYLE_BIBLE.md`, sin introducir ningún color, tamaño ni patrón visual nuevo.
