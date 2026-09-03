- **Name**: Consolidar la documentación técnica del dimensionado del editor visual y quitar constante muerta
- **Code**: 00241
- **Type**: fast
- **Creation date**: 2026-09-03

## Full description

Trabajo de higiene tras la cadena de cambios/fixes del dimensionado del editor visual (00225 → 00233 → 00235 → 00237 → 00240). El objetivo es que futuros cambios sobre esa zona no vuelvan a ser tan problemáticos: dejar la documentación técnica como una referencia clara del "modelo mental" completo (cómo se dimensiona la ventana del editor y, a partir de ahí, el lienzo de cada cara), en vez de una acumulación cambio-a-cambio, y eliminar del código una constante que había quedado sin uso.

No cambia ningún comportamiento de la aplicación: es solo documentación y limpieza de código muerto.

## Applied changes

- `src/ui/visualEditorModal.js` — **eliminada la constante `EDITOR_CHROME_H` (`= 200`) y su comentario**. Había quedado sin ninguna referencia: `getEditorWorkArea()` solo usa `EDITOR_CHROME_V` en su rama de fallback (cuando no hay cara del render anterior que medir); el ancho disponible por cara siempre se mide (`content.clientWidth`), no hay contrapartida horizontal constante. Verificado con `grep`: 0 usos.
- `src/ui/visualEditorModal.js` — comentario de cabecera de `getEffectiveCanvasMaxSide()` reescrito y acortado: describe las dos ramas (por defecto = constante; maximizado/manual = encajar en ancho por cara Y alto del hueco real, primera restricción, único suelo `CANVAS_MIN_SIDE`, sin techo) y remite a la doc de arquitectura para el detalle completo, en vez de arrastrar el historial de motivaciones cambio-a-cambio.
- `previo-sdd/design/docs/architecture/006-ui-layer.md` — sección "Window size" de `ui/visualEditorModal.js` **reescrita como referencia estructurada** ("Window sizing", dos capas): (1) la caja de la modal — tabla de los tres estados (por defecto / `maximized` / `manualSize`) con cómo obtiene su tamaño cada uno, gotchas del `--maximized` (necesita `width` y `height` fijos, no solo `max-*`; su `max-height: 90vh` también anula el `max-height: 80vh` de `.modal`), coexistencia `maximized`/`manualSize`, `clampModalSize`; (2) el lienzo — `currentCanvasMaxSide` cacheado una vez por render, pseudocódigo de `getEffectiveCanvasMaxSide()` y `getEditorWorkArea()`, la pasada de convergencia vía `requestAnimationFrame` y por qué carta no la dispara, el CSS de centrado (`min-height: 0` load-bearing), y una tabla de constantes de módulo (sin `EDITOR_CHROME_H`, con nota de que no hay contrapartida horizontal). Encabezado con la línea de historia 00225→00241.
- `previo-sdd/design/docs/style/003-modales-menus.md` — §"Wide modals", fila `.card-editor-modal`: ya se había actualizado en 00240; sin cambios adicionales aquí más allá de que sigue siendo coherente con la referencia de arquitectura (a la que remite para el mecanismo completo).

Sin cambios en `previo-sdd/design/docs/features/`: el comportamiento de cara al usuario no cambia.
