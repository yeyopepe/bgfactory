## (a) Anotaciones funcionales

- Fuera de alcance: no se toca nada más de la figura geométrica (tipo círculo/cuadrado, color de fondo, redimensión) ni del resto del editor de cartas — cambio mínimo acotado al borde.
- Sin dudas pendientes: el usuario ya especificó el patrón exacto a replicar (checkbox activador, igual que `TextBox`) y que una figura nueva debe seguir naciendo con borde visible (para no cambiar el aspecto que ya tenían las figuras creadas con el cambio 00118).

## (b) Solución técnica

1. **`src/ui/cardShapeModal.js`**:
   - Añadir `working.bordeActivo = working.bordeActivo ?? true` (por defecto `true` — ver punto 3, para que una figura ya existente sin este campo, creada bajo el cambio 00118, siga mostrando su borde tal cual lo tenía).
   - Sustituir el `fieldset.modal__section` "Borde" actual (meramente informativo) por el mismo patrón que ya usa `src/ui/cardTextBoxModal.js` para su propio borde: `<legend class="modal__section-title modal__section-title--toggle">` con un checkbox delante del texto "Borde", que controla `working.bordeActivo` y llama a `updateBorderSectionDisabled()` (nueva función local que alterna `modal__section--disabled` en el `fieldset` y `disabled` en los inputs de color/grosor, igual que en `cardTextBoxModal.js`).
   - Cambiar `borderWidthInput.min` de `0` a `1`, y el valor por defecto de `working.bordeGrosor` de `working.bordeGrosor ?? 2` (ya existente, no cambia) — pero el parseo en el listener de `input` debe clampear a `Math.min(Math.max(parsed, 1), 20)` en vez de `Math.min(Math.max(parsed, 0), 20)` con fallback `2` en vez de `0` si no es un número (mismo criterio que `cardTextBoxModal.js`).

2. **`src/ui/cardEditorModal.js`**:
   - En `onAddShape` (creación de una figura nueva desde el menú "Añadir elemento"), añadir `bordeActivo: true` al objeto inicial (junto a `bordeColor: '#000000'`, `bordeGrosor: 2`), para que las figuras nuevas sigan naciendo con un borde visible, igual que hasta ahora.
   - En `renderShape`, cambiar la condición del borde de `shape.bordeGrosor > 0 ? ... : 'none'` a `shape.bordeActivo ? ... : 'none'`.

3. **`src/ui/componentRenderer.js`**, dentro de `paintCartaFace` (bucle sobre `cara?.formas || []`): mismo cambio de condición, de `shape.bordeGrosor > 0` a `shape.bordeActivo`.

4. **Compatibilidad hacia atrás**: una figura guardada bajo el cambio 00118 no tiene el campo `bordeActivo` — al leerla, `shape.bordeActivo` es `undefined` (falsy), lo que ocultaría el borde de figuras que antes sí lo mostraban con `bordeGrosor > 0`. Como el único origen posible de datos hoy es este mismo proyecto recién implementado (00118 se acaba de mover a `implemented` en esta misma sesión, sin guardados reales de usuario todavía en circulación), no hace falta una migración formal — pero para que el criterio quede explícito y correcto de cara a cualquier guardado ya hecho con el cambio 00118, la condición de render en los tres puntos (`cardShapeModal.js` al inicializar `working`, `cardEditorModal.js#renderShape` y `componentRenderer.js#paintCartaFace`) debe tratar `bordeActivo === undefined` como `true` si `bordeGrosor > 0` estaba ya establecido — en la práctica, basta con inicializar `working.bordeActivo = working.bordeActivo ?? true` en la modal (punto 1) y usar `shape.bordeActivo !== false` (en vez de `shape.bordeActivo`) como condición de render en los dos puntos de pintado (`renderShape` y `paintCartaFace`), de forma que una figura sin el campo (`undefined`) siga mostrando su borde tal cual lo tenía, y solo desaparezca cuando el usuario lo desactive explícitamente (`bordeActivo: false`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 (tipo `'carta'`), en la definición de `Forma` (añadida por el cambio 00118): añadir el campo `bordeActivo: boolean` (`true` por defecto) al shape documentado, y sustituir la frase que describe el borde como "sección informativa sin checkbox activador" por la descripción del patrón `modal__section-title--toggle` (checkbox "Activar borde", campos deshabilitados mientras está desmarcado, grosor 1–20), aclarando que una figura sin este campo (guardada antes de este fix) se comporta como si estuviera activo.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, en la entrada añadida por el cambio 00118 sobre `.card-editor-modal__shape`/la figura geométrica: corregir la frase que decía que el borde de una figura no lleva checkbox activador (a diferencia de `TextBox`) — ahora sí lo lleva, mismo patrón `modal__section-title--toggle` (sección 12.6) que ya usa `TextBox`, sin ninguna diferencia entre ambos.
