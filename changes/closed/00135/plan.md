- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- Fuera de alcance: no se modifica ninguna carta ya existente ni se toca `core/fichaMigration.js` (migración de fichas antiguas a carta) — esa migración fija proporciones concretas (`'circular'`/`'1:1'`) y no tiene relación con la nueva opción "Libre".
- Duda resuelta con el usuario (ya recogida en `description.md`): el redimensionado de "Libre" debe ser completamente libre en ambos ejes, igual que ya se comporta hoy "Circular" en la mesa (sin forzar ratio, solo respetando el tamaño mínimo de una carta).
- Duda resuelta con el usuario: el lienzo de diseño de "Libre" en el editor de cartas arranca con la proporción por defecto del catálogo (5:7), solo como punto de partida — no se vuelve a imponer una vez la carta está en la mesa.

## (b) Solución técnica

1. **`src/core/cardProportions.js`** — añadir una entrada al final de `CARD_PROPORTIONS`:
   ```js
   { value: 'libre', label: 'Libre (redimensionamiento libre)', ratio: 5 / 7, shape: 'rect' }
   ```
   - `ratio: 5 / 7` (mismo valor que `'5:7'`) le da un lienzo de diseño de partida coherente en `getDesignSize`/`getProporcionRatio` sin necesitar ninguna rama especial en esas funciones — se sigue usando el mismo `find` que ya usan las demás proporciones.
   - `shape: 'rect'` hace que `isRectShape('libre')` devuelva `true` (activa el checkbox "Esquinas redondeadas") y que `getCartaShapeCss('libre', esquinasRedondeadas)` caiga en la rama por defecto (rectángulo con `border-radius` según el checkbox, sin `clip-path`) — mismo camino de código que Poker/Tarot/Cuadrada, sin tocar esas funciones.
   - No hace falta tocar `HEX_CLIP_PATHS`, `TRIANGLE_CLIP_PATHS` ni `TRIANGLE_GEOMETRY`: son mapas indexados por `shape`, y `'rect'` no aparece en ninguno de los tres (comportamiento ya es el correcto por omisión).

2. **`src/ui/componentRenderer.js`** — en `clampCartaSize` (dentro del bloque de renderizado de `'carta'`, condición actual `if (props.proporcion === 'circular')`), ampliar la condición para incluir también `'libre'`:
   ```js
   if (props.proporcion === 'circular' || props.proporcion === 'libre') {
     return {
       width: Math.max(width, MIN_CARTA_WIDTH),
       height: Math.max(height, MIN_CARTA_HEIGHT),
     };
   }
   ```
   Esto es lo único que hace efectivo el redimensionado libre: al no forzar `ratio`, `attachResizeHandle` (que ya soporta ejes independientes, sin cambios) deja que ancho y alto varíen por separado, en ambos manejadores de esquina (`'br'` y `'tl'`) ya que ambos usan la misma función `clampCartaSize`.

3. **`src/ui/cardEditorModal.js` y `src/ui/componentModal.js`** — no requieren cambios: ambos ya iteran `CARD_PROPORTIONS` para construir el desplegable "Proporción" (por lo que "Libre" aparecerá automáticamente al final, en la posición en que se añadió al array) y ambos ya usan `getProporcionRatio`/`getDesignSize`, que resuelven la nueva entrada sin rama especial.

4. **`src/core/styleClipboard.js` / `src/ui/styleClipboardSelectionModal.js`** (copiar/pegar estilo de carta) — no requieren cambios: `props.proporcion` se copia tal cual como valor libre y `CARD_PROPORTIONS.find(...)` ya resuelve su `label` para mostrarlo en el checklist, igual que cualquier otra proporción.

No se toca `src/core/fichaMigration.js` (fuera de alcance, ver (a)).

Nada en esta solución afecta a la arquitectura por capas ni introduce convenciones de estilo nuevas (reutiliza `shape: 'rect'` y el manejador de redimensionado ya existentes), así que se omiten las secciones (c) y (d).
