- **Name**: Icono de ayuda junto a los títulos en Interacciones programadas y renombrar "Al hacer click"
- **Code**: 00247
- **Type**: fast
- **Creation date**: 2026-09-03

## Full description

En el modal de edición de un componente/carta, pestaña General, existe la sección "Interacciones programadas". Contiene una fila por cada tipo de click configurable (click izquierdo y click derecho), y cada fila muestra un título, un desplegable para elegir la acción y un icono de ayuda "?".

Cambios solicitados:

1. **Posición del icono de ayuda.** Actualmente el icono "?" de ambas filas aparece debajo del desplegable. Debe mostrarse al lado del título de cada fila (a su derecha), igual que en el resto de campos del modal que llevan ayuda contextual.

2. **Texto de la etiqueta del click izquierdo.** La etiqueta de la fila de click izquierdo dice "Al hacer click" (en inglés, "On click"). Debe pasar a decir "Click izquierdo" (en inglés, "Left click"), en coherencia con la fila de "Click derecho".

No cambia ningún comportamiento: solo la colocación visual del icono y el texto de una etiqueta.

## Technical notes

- Sección renderizada en `src/ui/componentModal.js`, bloque de "Interacciones programadas" (~líneas 822-895): bucle sobre `typeInteractions` para la fila de click izquierdo y bloque `rightClickField` para la de click derecho. En ambos casos se hace `field.appendChild(label)`, `field.appendChild(select)`, `field.appendChild(createHelpIcon(...))` directamente sobre un `div.modal__field`, que apila en vertical y deja el icono bajo el select.
- El propio modal ya usa el patrón "icono junto a la etiqueta": un `div` contenedor con `display:flex; align-items:center; gap:0.35rem` que envuelve el `label` (con `marginBottom:0`) + el icono de ayuda, y luego se añaden ese contenedor y el control al `.modal__field` (ver `moveLabelRow` y `tooltipTextoLabelRow` en el mismo archivo). Reutilizar ese mismo patrón para las dos filas.
- Textos en `src/data/i18n.en.js` y `src/data/i18n.es.js`, clave `componentModal.onClickLabel` (EN: `'On click'` → `'Left click'`; ES: `'Al hacer click'` → `'Click izquierdo'`). La clave `componentModal.interactionHelp` usa `interaction.label` (no esta etiqueta), así que el texto de la ayuda no se ve afectado.

## Applied changes

- **`src/ui/componentModal.js`** (sección "Interacciones programadas"):
  - Fila de click izquierdo (bucle `for...of typeInteractions`): se añade un contenedor `interactionLabelRow` (`div` con `display:flex; align-items:center; gap:0.35rem`) que envuelve el `label` (con `marginBottom:'0'`) y el icono de ayuda. Al `.modal__field` se le añaden ahora `interactionLabelRow` y luego el `select` (antes se añadían `label`, `select` e icono sueltos, dejando el icono bajo el select).
  - Fila de click derecho (`rightClickField`): mismo cambio, con contenedor `rightClickLabelRow` que envuelve `rightClickLabel` + icono de ayuda; al `.modal__field` se añaden `rightClickLabelRow` y luego el `select`.
  - Resultado: el icono "?" queda a la derecha del título de cada fila, no debajo del desplegable. Se reutiliza el mismo patrón ya usado por `moveLabelRow` y `tooltipTextoLabelRow` en este archivo.
- **`src/data/i18n.en.js`**: clave `componentModal.onClickLabel` cambiada de `'On click'` a `'Left click'`.
- **`src/data/i18n.es.js`**: clave `componentModal.onClickLabel` cambiada de `'Al hacer click'` a `'Click izquierdo'`.

Verificación: `node --check` sobre los tres archivos modificados sin errores de sintaxis.
