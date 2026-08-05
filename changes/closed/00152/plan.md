**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Fuera de alcance: `'carta'` no se toca en este fix — sigue manteniendo su comportamiento actual (reescala su contenido al cambiar tamaño/proporción, comportamiento intencionado y documentado). El usuario ha pedido explícitamente extender este mismo criterio a `'carta'`, pero eso es una modificación deliberada de un comportamiento ya existente y usado (afecta a todas las cartas ya diseñadas), no un bug — se gestionará como una entrada `ms-new` aparte.

Dudas resueltas con el usuario:
- ¿El lienzo del Editor visual para `'tableroPersonalizado'` debe representar el tamaño real del componente (no un lienzo fijo)? → Sí, confirmado.

## (b) Solución técnica

1. **`ui/componentRenderer.js`** (causa raíz): en la rama `component.type === 'tableroPersonalizado'`, la llamada a `paintCartaFace(tableroContent, cara, width / TABLERO_PERSONALIZADO_DESIGN_WIDTH, width, height, height / TABLERO_PERSONALIZADO_DESIGN_HEIGHT)` pasa a `paintCartaFace(tableroContent, cara, 1, width, height, 1)` — factor de escala fijo `1` en ambos ejes, para que el contenido se pinte siempre en píxeles reales, sin depender del tamaño actual del componente. `tableroContent` ya tiene `overflow: hidden`, así que cualquier elemento que no quepa en el nuevo tamaño queda recortado automáticamente, sin más cambios.
2. **`ui/visualEditorModal.js`** → `getFaceDesignSize()`: en la rama sin proporción configurable (`!showProporcionSelector`), devolver `{ width: component.width, height: component.height }` (el tamaño real del componente recibido, disponible en el closure de `openVisualEditorModal`) en vez de `{ width: TABLERO_PERSONALIZADO_DESIGN_WIDTH, height: TABLERO_PERSONALIZADO_DESIGN_HEIGHT }`. Con esto el lienzo del editor coincide siempre con el tamaño real del tablero en el momento de abrirlo, y como el paso 1 ya pinta en escala `1`, "lo que se ve al diseñar" y "lo que sale en la mesa" quedan consistentes sin ningún factor de conversión de por medio.
3. **`core/cardProportions.js`**: eliminar `TABLERO_PERSONALIZADO_DESIGN_WIDTH`/`TABLERO_PERSONALIZADO_DESIGN_HEIGHT` y su comentario — tras los dos puntos anteriores quedan sin ningún uso en el proyecto (confirmado por búsqueda completa en `src/`), así que no se dejan como código muerto.
4. **Import de `ui/componentRenderer.js`**: quitar `TABLERO_PERSONALIZADO_DESIGN_WIDTH`/`TABLERO_PERSONALIZADO_DESIGN_HEIGHT` de la lista de símbolos importados desde `../core/cardProportions.js` (ya no existen tras el paso 3).
5. **Import de `ui/visualEditorModal.js`**: mismo ajuste — quitar esos dos símbolos del `import` de `../core/cardProportions.js`.

Sin migración de datos: `properties.cara.formas`/`textBoxes`/`imagenResourceId` ya guardan `x`/`y`/`width`/`height` en las mismas unidades que ahora se interpretan como píxeles reales (antes "unidades de diseño" sobre un lienzo de 300×300) — un tablero ya creado con contenido diseñado bajo el bug actual seguirá viéndose en la posición/tamaño que tenía la última vez que se guardó (mismos números, ahora interpretados 1:1 en vez de reescalados), sin ningún salto visual adicional más allá de que a partir de ahora esos números ya no cambian solos al redimensionar.

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`, dentro de la entrada de `'tableroPersonalizado'` (sección 4, añadida en el cambio 00143): corregir la frase sobre el pintado con `renderScaleX`/`renderScaleY` distintos calculados a partir de un lienzo lógico fijo — pasa a pintarse siempre con escala `1` (contenido en píxeles reales, fijo con independencia del tamaño del componente), y el lienzo del Editor visual (`ui/visualEditorModal.js`, sección 5) representa el tamaño real del componente en el momento de abrirlo, no un tamaño de diseño fijo. Eliminar también la mención a `TABLERO_PERSONALIZADO_DESIGN_WIDTH`/`_HEIGHT` (`core/cardProportions.js`), retiradas en este fix.
