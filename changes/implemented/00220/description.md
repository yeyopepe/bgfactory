- **Nombre**: Revertir interruptores de formato del título (00216) y documentar uso de etiquetas HTML
- **Código**: 00220
- **Tipo**: change
- **Fecha creación**: 2026-08-15

## Descripción completa

Se elimina la funcionalidad añadida por el cambio 00216: los tres interruptores independientes "Negrita", "Cursiva" y "Subrayado" que aparecían en la ventana "Editar título de componente", bajo el campo "Contenido". El título de un componente vuelve a no tener ningún control dedicado de formato, tal y como estaba antes de 00216.

En su lugar, se completa el texto de ayuda (icono "?") de dos campos para dejar claro que ya admiten formato escribiendo etiquetas HTML directamente en el texto:

- El campo "Ayuda" de las propiedades de un componente (sección "Ayuda jugador").
- El campo "Contenido" de la ventana "Editar título de componente".

Ambos textos de ayuda pasan a indicar explícitamente qué etiquetas se pueden escribir a mano para dar formato: negrita, cursiva, subrayado, saltos de línea y listas.

### Pregunta de alcance resuelta

Al quitar los interruptores, el título dejaría de poder subrayarse: hasta ahora, escribir la etiqueta HTML de subrayado a mano no funcionaba (no estaba entre las etiquetas admitidas), y el interruptor de 00216 era la única forma de conseguirlo. Se preguntó al usuario si esa pérdida de capacidad era aceptable o si debía mantenerse el subrayado permitiendo la etiqueta HTML correspondiente.

**Resuelto**: se mantiene la capacidad de subrayar. A partir de este cambio, negrita, cursiva y subrayado son alcanzables por igual escribiendo la etiqueta HTML correspondiente directamente en el texto — mismo mecanismo para los tres, sin ningún control dedicado en la interfaz. Aplica tanto al campo "Ayuda" (tooltip) como al "Contenido" del título, que comparten el mismo tratamiento de texto.

## Apuntes técnicos

- Ficheros a revertir (quitar exactamente lo añadido por 00216, confirmado con `git diff` fichero a fichero sobre el working tree actual — **cuidado**: no tocar nada de otros cambios mezclados en el mismo working tree sin commitear, como 00214/00218/00219 en `editMode.js`/`main.css`/`03-modales-menus.md` §12.1.2, que son ajenos a este cambio):
  - `src/ui/componentTitleModal.js`: quitar bloque `STYLE_TOGGLE_OPTIONS`/`styleGroup` (líneas ~60-98), las tres props `negrita`/`cursiva`/`subrayado` de `working` (líneas 32-34) y su inclusión en `onAccept` (líneas 203-205).
  - `src/ui/componentModal.js`: quitar `tituloNegrita`/`tituloCursiva`/`tituloSubrayado` del objeto `titulo` pasado a `openComponentTitleModal` y de la asignación en `onAccept` (~líneas 541-543 y 550-552).
  - `src/core/component.js`: quitar los tres parámetros/defaults de `createComponent` y las tres líneas correspondientes de `syncCopyWithOriginal`.
  - `src/ui/componentRenderer.js`, `attachComponentTitle`: quitar las tres líneas `label.style.fontWeight`/`fontStyle`/`textDecoration` (mantener el resto de la función igual).
  - `design/docs/architecture/01-component-model.md`: quitar la fila de `tituloNegrita`/`tituloCursiva`/`tituloSubrayado` (línea ~58) y las tres menciones en las listas de campos "siempre propagado"/sin migración (líneas ~20-26, 72, 99).
  - `design/docs/features/035-titulo-de-componente.md`: revertir el párrafo que menciona "tres interruptores de formato" a su redacción anterior a 00216, y el campo "Código" vuelve a listar solo `00212` (quitar `, 00216`).
- Añadir `<u>` a `TOOLTIP_ALLOWED_TAGS` en `src/ui/componentRenderer.js` (hoy es `['b', 'strong', 'i', 'em', 'br', 'ul', 'ol', 'li']`) y reflejarlo en `design/docs/architecture/01-component-model.md` (línea ~52, lista de etiquetas admitidas de `tooltipTexto`, de la que `tituloTexto` "hereda" por remisión en la línea ~54).
- Textos de ayuda a completar, mencionando explícitamente las etiquetas HTML soportadas (`<b>`/`<strong>`, `<i>`/`<em>`, `<u>`, `<br>`, `<ul>`/`<ol>`/`<li>`):
  - `src/ui/componentModal.js` línea ~594 (`createHelpIcon` del campo "Ayuda").
  - `src/ui/componentTitleModal.js` línea ~49 (`createHelpIcon` del campo "Contenido").
  - Redacción exacta a decidir al implementar, manteniendo el tono telegráfico ya usado en esos mismos textos.
- Sin incongruencias entre documentación técnica y código detectadas: 00216 dejó ambos en sync, así que el revert es simétrico en ambos lados.
