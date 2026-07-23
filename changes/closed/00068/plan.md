# Plan — 00068 Grosor configurable en el patrón del tablero

## (a) Anotaciones funcionales

- Fuera de alcance: no se toca el grosor del borde del tablero (`bordeGrosor`), que ya es configurable y es un campo aparte. Tampoco se toca el fondo tipo "Imagen".
- Dudas ya resueltas en `description.md` (no ha hecho falta reabrirlas): rango 1-20px paso 1 por defecto 1px, aplica a ambas formas de patrón, campo en la misma fila que el color siguiendo la convención ya documentada en `STYLE_BIBLE.md` sección 8.
- Verificado con `ms-tech-analysis`: el código real coincide exactamente con los apuntes técnicos de `description.md` (líneas del modal, defaults, patrón color+grosor, renderizado cuadrado/hexagonal). No se ha detectado ninguna incongruencia entre documentación técnica y código.

## (b) Solución técnica

1. **`src/ui/componentModal.js`** — `DEFAULT_BOARD_PROPERTIES` (líneas 23-32): añadir `patronGrosor: 1`.
2. **`src/ui/componentModal.js`** — `onAccept` de `openBoardPatternModal` (líneas 496-504): destructurar también `patronGrosor` y copiarlo a `props.patronGrosor`.
3. **`src/ui/boardPatternModal.js`**:
   - `working` (líneas 28-33): añadir `patronGrosor: properties.patronGrosor || 1`.
   - Sustituir el campo de color actual (líneas 35-47, standalone) por la estructura de fila color+grosor descrita en `STYLE_BIBLE.md` sección 8 (idéntica a la usada en `componentModal.js:412-451` para el borde del tablero): un `div.modal__field` exterior, un `div` interior con `style.display='flex'; style.gap='0.5rem'`, y dos sub-`div` con `style.flex='1'` — el de color primero (mismo input ya existente) y el de grosor después (`input type="number"`, `min=1`, `max=20`, valor `working.patronGrosor`, con el mismo patrón de clamp que ya usan `rowsInput`/`colsInput` de este mismo fichero: `parseInt` + `Math.min(Math.max(parsed,1),20)`, cayendo al valor previo si `Number.isNaN`).
   - Incluir `patronGrosor` en el objeto pasado a `onAccept` (ya se hace vía `{ ...working }`, no requiere cambio adicional más allá de que `working` ya lo tenga).
4. **`src/ui/componentRenderer.js`** — patrón cuadrado (líneas ~412-424): leer `const patronGrosor = props.patronGrosor || 1;` y sustituir los dos `1px` fijos del `linear-gradient` (línea 422-423) por `` `${patronGrosor}px` ``.
5. **`src/ui/componentRenderer.js`** — patrón hexagonal:
   - Añadir `patronGrosor` a `hexGridToRender` (línea 417).
   - Añadir el parámetro `grosor` a `renderHexGrid(svgEl, width, height, filas, columnas, color, grosor)` (línea 51) y usarlo en `polygon.setAttribute('stroke-width', '1')` (línea 82) → `polygon.setAttribute('stroke-width', String(grosor))`.
   - Actualizar la llamada (línea 435) para pasar `hexGridToRender.patronGrosor`.

No aplica sección (c) — no hay `docs.tech.architectureDocPath`... (sí lo hay, ver más abajo, se usa en 4.1) — esta tarea no cambia arquitectura básica (modelo de datos, capas), solo añade una propiedad más al mismo tipo de componente ya existente, mismo patrón que `bordeGrosor`. Se documentará como actualización menor en el paso de documentación (4.1), no como cambio de arquitectura.

## (d) Cambios en estilo

No aplica: la convención "color + grosor en la misma fila" que este cambio usa ya está documentada en `STYLE_BIBLE.md` sección 8 (añadida durante el análisis de `ms-new` de esta misma entrada). Esta implementación es una aplicación más de esa convención ya existente, no introduce ninguna nueva.
