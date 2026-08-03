## (a) Anotaciones funcionales

- Fuera de alcance: no se toca `core/styleClipboard.js` (no incluye hoy propiedades individuales de `TextBox`/`Forma`, solo de la carta completa — confirmado en el análisis técnico de `ms-new`).
- Fuera de alcance: no se toca `transparenciaImagen` (transparencia de la imagen de fondo de una cara) ni el borde de `TextBox`/`Forma` — este cambio solo añade transparencia al color de fondo.
- Sin dudas nuevas que resolver con el usuario en esta fase: las dos preguntas de alcance (relación con "Transparente" y rango 0-100) ya se resolvieron en `description.md`.

## (b) Solución técnica

1. **`core/colorUtils.js`** (módulo nuevo, puro, sin dependencias de otras capas — mismo patrón que `core/cardProportions.js`/`core/textBoxLayout.js`): expone `hexToRgba(hex, transparenciaPercent)`, que convierte un color hex (`#rrggbb`) + un porcentaje de transparencia (0-100) a una cadena `rgba(r, g, b, alpha)` con `alpha = 1 - transparenciaPercent / 100`. Si `hex` es vacío/nulo, devuelve `'transparent'` (mismo comportamiento que hoy `colorFondo || 'transparent'`). No existe ya ningún helper de conversión hex→rgba en el proyecto (confirmado por búsqueda), así que se crea aquí en vez de duplicarlo en cada punto de render.

2. **Modelo de datos** — añadir `colorFondoTransparencia` (number, 0-100, `0` por defecto) a `TextBox` y a `Forma`:
   - `ui/cardTextBoxModal.js`: tras la línea `working.colorFondo = ...` (no existe una línea de default explícita para `colorFondo` ahí, se inicializa directo desde `textBox`), añadir `working.colorFondoTransparencia = working.colorFondoTransparencia ?? 0;` cerca del resto de defaults de `working` (patrón ya usado para `alineacionHorizontal`/`margenSuperior`/etc., línea ~122-190).
   - `ui/cardShapeModal.js`: junto a la línea 27 (`working.colorFondo = working.colorFondo ?? '';`), añadir `working.colorFondoTransparencia = working.colorFondoTransparencia ?? 0;`.

3. **Control deslizante en `ui/cardTextBoxModal.js`** (sección "Fondo", tras el bloque `bgColorField` ya existente, líneas ~394-431): añadir un nuevo `bgOpacityField` (`div.modal__field`) con:
   - Label "Nivel de transparencia".
   - `input[type=range]` (min 0, max 100, valor inicial `working.colorFondoTransparencia`) + `input[type=text]` sincronizado + símbolo `%`, replicando exactamente el patrón ya usado en `ui/imageAdjustModal.js` (`opacitySlider`/`opacityTextInput`, líneas 263-304: evento `input` en el slider actualiza `working.colorFondoTransparencia` y el texto; evento `change` en el texto valida con `parseInt`/`clamp(0,100)` y sincroniza el slider).
   - El slider y el input de texto quedan `disabled` cuando `bgTransparentCheckbox.checked` es `true` (sin color de fondo elegido no hay nada que hacer transparente) — añadir esa condición dentro del listener `change` de `bgTransparentCheckbox` (línea ~417-420) y al inicializar (`bgOpacitySlider.disabled = bgOpacityTextInput.disabled = bgTransparentCheckbox.checked;`).
   - Reutiliza la clase CSS `.modal__opacity-value` (nueva, ver punto 5) para el contenedor del valor numérico, en vez de crear una variante ad-hoc.

4. **Control deslizante en `ui/cardShapeModal.js`** (sección "Fondo", líneas ~90-128): mismo control, mismo patrón, insertado igual junto al `bgColorField` existente y deshabilitado igual cuando "Transparente" está marcado (listener de `bgTransparentCheckbox`, líneas ~113-116).

5. **CSS** (`src/styles/main.css`): añadir la clase `.modal__opacity-value` (BEM, bloque `modal` ya existente) con el mismo estilo que hoy tiene `.image-adjust-modal__opacity-value` (líneas 1150-1161: `display:flex; align-items:center; justify-content:center; gap; width:100%` y el input de texto interior a `4rem` centrado) — nueva clase reutilizable por `cardTextBoxModal.js` y `cardShapeModal.js`, sin tocar la ya existente y específica de `image-adjust-modal`.

6. **Renderizado** — sustituir la asignación directa de `colorFondo` por `hexToRgba(colorFondo, colorFondoTransparencia)` en los cuatro puntos ya localizados:
   - `ui/componentRenderer.js` línea 309 (`Forma` en mesa/mazo): `shapeEl.style.backgroundColor = hexToRgba(shape.colorFondo, shape.colorFondoTransparencia ?? 0);`
   - `ui/componentRenderer.js` línea 331 (`TextBox` en mesa): `textEl.style.backgroundColor = hexToRgba(textBox.colorFondo, textBox.colorFondoTransparencia ?? 0);`
   - `ui/cardEditorModal.js` línea 536 (`TextBox` en lienzo del editor): mismo reemplazo con `textBox.colorFondoTransparencia ?? 0`.
   - `ui/cardEditorModal.js` línea 636 (`Forma` en lienzo del editor): mismo reemplazo con `shape.colorFondoTransparencia ?? 0`.
   - Importar `hexToRgba` de `../core/colorUtils.js` en ambos ficheros (mismo patrón de import ya usado para el resto de helpers de `core/`).
   - `colorFondoTransparencia ?? 0` en cada punto de render cubre la compatibilidad hacia atrás: elementos guardados sin el campo se comportan como `0` (opaco), sin cambio visual.

7. **Ficheros de prueba** (`src/test/*.json`, si alguno ya trae `textBoxes`/`formas` con `colorFondo`): no es obligatorio actualizarlos (el campo es opcional con default `0`), se deja tal cual.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4.3 (tipo `'carta'`):

- En la definición de `Forma` (línea ~144), añadir el nuevo campo `colorFondoTransparencia` al shape `{ id, tipo, x, y, width, height, colorFondo, colorFondoTransparencia, bordeActivo, bordeColor, bordeGrosor }` y una frase describiéndolo: `colorFondoTransparencia` (number, 0-100, `0` por defecto = opaco): nivel de transparencia aplicado sobre `colorFondo` al pintar el fondo (`core/colorUtils.js`, `hexToRgba`), solo con efecto si `colorFondo` no está vacío; una figura guardada antes de este campo se comporta como `0` (sin cambio visual).
- En la definición de `TextBox` (línea ~147), añadir el mismo campo al shape y una frase análoga (mismo criterio y semántica que en `Forma`).
- Añadir `core/colorUtils.js` a la lista de módulos de datos puros mencionados en la sección (junto a `core/cardProportions.js`/`core/textBoxLayout.js`), con su función `hexToRgba(hex, transparenciaPercent)`.
