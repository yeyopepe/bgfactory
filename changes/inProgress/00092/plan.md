## (a) Anotaciones funcionales

- **Fuera de alcance**: no cambia la posición del botón "Ajustar imagen…" entre las dos caras (ya está bien, se mantiene), ni su lógica de habilitación (ya funciona correctamente), ni el comportamiento de apilado vertical en pantallas estrechas (se conserva tal cual).
- **Causa raíz identificada** (resuelve la duda técnica pendiente de la descripción funcional): el hueco excesivo no viene del `gap` del flex ni de un margen puntual, sino de que `.card-editor-modal` hereda `width: 90%` de `.modal` (`src/styles/main.css`) con un `max-width: 1100px` fijo — así que en cualquier ventana razonablemente ancha el modal ocupa ~1100px reales, muy por encima del contenido (dos lienzos + botón), que ronda 600-750px según la proporción de carta elegida. El ancho de cada lienzo es variable: se calcula en JS con `CANVAS_MAX_SIDE = 260px` como lado máximo (`src/ui/cardEditorModal.js`, `renderFace`), así que las proporciones verticales/horizontales alcanzan anchos de lienzo distintos entre sí — cualquier `max-width` fijo deja una holgura distinta según la proporción activa, no solo en la que muestra el mockup (Poker 5:7). La solución debe hacer que el modal se ajuste al contenido real (shrink-to-fit) en vez de fijar un ancho generoso constante.
- **Incongruencia de documentación detectada**: `STYLE_BIBLE.md` sección 12.4 ("Modales anchas") documenta `.card-editor-modal` con `max-width: 920px`, pero el código actual ya tiene `1100px` desde el change `fast-mueve-boton-ajustar-imagen-entre-caras_20260725` (que no actualizó la biblia de estilo, al no tocarla nunca por definición). El código manda: se corrige la documentación como parte de este change (ver apartado (d)).

## (b) Solución técnica

1. **`src/styles/main.css`, regla `.card-editor-modal`** (hoy `max-width: 1100px;`): sustituir por un ancho ajustado al contenido con tope de seguridad, p.ej.:
   ```css
   .card-editor-modal {
     width: fit-content;
     max-width: min(1100px, 90vw);
   }
   ```
   `width: fit-content` hace que el modal se encoja al ancho real de sus dos caras + botón en vez de expandirse siempre al 90% del viewport; `max-width: min(1100px, 90vw)` conserva un tope tanto en pantallas muy anchas (nunca más de 1100px) como en pantallas estrechas (nunca más del 90vw que ya usaba `.modal`), preservando el `flex-wrap: wrap` existente en `.card-editor-modal__faces` para el apilado en pantallas pequeñas.

2. **`src/styles/main.css`, regla `.card-editor-modal__faces`** (hoy `gap: 1.5rem;`): reducir a `gap: 1rem;` — `1.5rem` no está entre los dos valores que `STYLE_BIBLE.md` sección 4 recomienda para gap de flex ("0.5rem (ajustado) o 1rem (holgado)"); `1rem` es el valor "holgado" ya documentado y adecuado aquí, dado que además el punto 1 ya elimina la holgura sobrante del ancho del modal.

3. **Verificación visual en navegador** (ejecutar la app y abrir el editor de cartas): comprobar que con estos dos cambios el conjunto (cara frontal + botón + cara trasera) queda compacto y sin espacio sobrante alrededor del botón, tanto con la proporción por defecto (`'5:7'`) como con al menos una proporción donde el lienzo alcanza su lado máximo de 260px en horizontal (`'7:5'`, `'1:1'` o `'circular'`, ver `core/cardProportions.js`) — para confirmar que `fit-content` no provoca wrap indebido en ninguna de las proporciones disponibles en una ventana de escritorio normal, y que el apilado vertical en pantallas estrechas sigue funcionando igual que antes.

## (d) Cambios en estilo

- **`STYLE_BIBLE.md` sección 12.4** ("Modales anchas"): corregir la entrada de `.card-editor-modal`, hoy `` `.card-editor-modal` (`max-width: 920px`, editor de las dos caras de una carta) ``, para reflejar el comportamiento final tras este change: ya no es un `max-width` fijo sino un ancho ajustado al contenido con tope `min(1100px, 90vw)` — dejar constancia de que esta es la primera excepción del catálogo de esa sección que usa `width: fit-content` en vez de heredar el `width: 90%` fijo de `.modal`, con el motivo (el ancho de su contenido varía según la proporción de carta activa, a diferencia de las demás modales anchas del catálogo, de contenido más estable).
