- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún dato, nombre de propiedad, validación ni comportamiento cambia — solo la agrupación y disposición visual de campos ya existentes en `ui/boardPatternModal.js`.

**Dudas resueltas con el usuario (ver `description.md`):** las dos secciones nuevas ("Configuración" y "Color") son meramente informativas (fieldset con título, sin checkbox de activar/desactivar toda la sección), no la variante "des/activador" que usa "Borde".

## (b) Solución técnica

Todo el trabajo es en `ui/boardPatternModal.js` (`openBoardPatternModal`). No se toca ningún otro fichero: ningún otro punto del código depende del orden interno de los campos de esta modal (solo se consume vía `openBoardPatternModal({...})`, un único punto de llamada en `ui/componentModal.js`).

1. **Sección "Configuración" (primera)**: crear un `fieldset.modal__section` con `legend.modal__section-title` (sin `--toggle`, patrón informativo — igual que la sección "Fondo" de `ui/componentModal.js`) con texto "Configuración", y mover dentro, en este orden:
   - El bloque `shapeField` ("Forma de casilla") tal cual existe hoy.
   - Una nueva fila (`div` con `display:flex; gap:0.5rem`, mismo patrón que `colorRowInner`) que contenga los dos sub-divs `flex:1` de "Filas" y "Columnas" — reemplaza los dos `div.modal__field` sueltos (`rowsField`/`colsField`) que hoy se añaden cada uno directamente a `content` en filas separadas. Los labels pasan de estar en `rowsField`/`colsField` (cada uno ya con su propio `modal__field`) a sub-divs `style.flex = '1'` dentro de una fila `modal__field` exterior — mismo patrón exacto que ya usa `colorRowInner` (`colorField`/`grosorField`) más arriba en el propio fichero.
   - Los listeners (`input` de `rowsInput`/`colsInput`) y la lógica de clamp (`MIN_CELLS`/`MAX_CELLS`) no cambian, solo el árbol DOM donde se insertan esos elementos.

2. **Sección "Color" (segunda, debajo de "Configuración")**: crear un segundo `fieldset.modal__section` (mismo patrón informativo) con texto "Color", y mover dentro, en este orden:
   - El bloque `bgColorField` ("Color de fondo" + checkbox "Transparente") tal cual existe hoy.
   - El bloque `colorRow` ("Color del patrón" + "Grosor", ya en fila) tal cual existe hoy.

3. **Orden de `appendChild` a `content`**: sustituir el orden actual (`bgColorField`, `colorRow`, `shapeField`, `rowsField`, `colsField`) por: sección "Configuración" completa, luego sección "Color" completa. El footer (`Cancelar`/`Aceptar`) no cambia.

4. **Sin migración ni cambio de datos**: `working` conserva exactamente las mismas claves (`colorFondo`, `patronColor`, `patronGrosor`, `patronForma`, `patronFilas`, `patronColumnas`) y el mismo objeto se sigue pasando tal cual a `onAccept` al pulsar "Aceptar" — el reordenamiento es puramente de construcción de DOM, no de datos.

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md`, sección 12.6, en el punto ya actualizado por el cambio 00153 sobre `ui/boardPatternModal.js` ("Configurar fondo — Color y patrón"): añadir que, desde el cambio 00155, esa sub-modal pasa a usar el propio patrón `.modal__section`/`.modal__section-title` (informativo, sin `--toggle`) para agrupar sus campos en dos secciones, "Configuración" y "Color" — deja de ser una excepción sin secciones dentro del catálogo de esa sección 12.6, sumándose como nuevo uso documentado del patrón.
