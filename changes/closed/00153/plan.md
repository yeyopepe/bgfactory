- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se toca `tableroPersonalizado` (fondo/borde por cara, modelo independiente).
- No se toca el fondo de tipo "Imagen" de `tableroSimple` (el color de fondo nuevo solo aplica a "Color y patrón").
- No se añade slider de opacidad graduable — solo color + checkbox "Transparente" (patrón simple, como en `carta`).

**Dudas resueltas con el usuario (ver `description.md`):**
- Color de fondo solo visible/aplicable con `fondoTipo = 'Color y patrón'`.
- El color de fondo se ubica dentro de la sub-modal "Configurar fondo — Color y patrón" (`ui/boardPatternModal.js`), no en la lista principal de propiedades específicas — corrección del usuario tras el mockup inicial.
- El color de fondo queda detrás del patrón.
- Compatibilidad: tableros nuevos y ya existentes sin estas propiedades se ven exactamente igual que ahora (fondo blanco opaco, borde activo).

## (b) Solución técnica

1. **`ui/componentModal.js` — valor por defecto**: añadir `colorFondo: '#ffffff'` y `bordeActivo: true` a `DEFAULT_BOARD_PROPERTIES` (línea ~80). Esto cubre tanto los tableros creados desde ahora (via `createDefaultComponent`) como el fallback usado por el resto de puntos que leen `DEFAULT_BOARD_PROPERTIES.*`.

2. **`ui/boardPatternModal.js` — nuevo campo "Color de fondo"**:
   - En `working` (línea ~28), añadir `colorFondo: properties.colorFondo ?? '#ffffff'` — usar `??` (no `||`) para distinguir "propiedad ausente" (tablero legado → por defecto blanco opaco) de "explícitamente transparente" (`''`, elegido por el usuario).
   - Añadir un nuevo bloque de campo antes de la fila "Color del patrón / Grosor" (o inmediatamente después, a decidir por orden visual — el mockup `design_seccion-fondo-color-nuevo.html` lo pone primero): un `div.modal__field` con label "Color de fondo", conteniendo un `input[type=color]` + un `div.modal__field--checkbox` con checkbox "Transparente" — mismo patrón exacto que el campo "Color de fondo" ya existente en las propiedades específicas de `carta` (`ui/componentModal.js` líneas 767-809): el checkbox marcado pone `working.colorFondo = ''` y deshabilita el input de color; desmarcado, restaura `working.colorFondo = colorInput.value`.
   - En el `onAccept` (línea ~148, `onAccept({ ...working })`), no requiere cambio adicional (ya pasa todo `working` completo) — solo asegurarse de que `colorFondo` esté en `working` antes de ese punto.

3. **`ui/componentModal.js` — propagar el nuevo campo al aceptar la sub-modal**: en `renderBoardSpecificFields`, dentro del `configureBtn` click handler (rama `else`, línea ~928-937), añadir `colorFondo` a la desestructuración del callback `onAccept` y a la asignación (`props.colorFondo = colorFondo;`), igual que ya se hace con `patronColor`/`patronGrosor`/etc.

4. **`ui/componentModal.js` — checkbox "Activar borde"**: en `renderBoardSpecificFields`, sección "Borde" (línea ~830-880), replicar exactamente el patrón ya usado en `ui/cardShapeModal.js` (líneas 321-384, checkbox `bordeActivo`):
   - `borderLegend.className = 'modal__section-title modal__section-title--toggle'`, con un `input[type=checkbox]` insertado antes del texto "Borde" (en vez de `textContent`, usar `appendChild(checkbox)` + `appendChild(document.createTextNode('Borde'))`).
   - Checkbox inicializado a `props.bordeActivo !== false` (para que tableros guardados sin este campo se comporten como activos).
   - Al cambiar el checkbox: `props.bordeActivo = checkbox.checked`, más una función `updateBorderSectionDisabled()` que alterna `borderSection.classList.toggle('modal__section--disabled', !checked)` y `borderColorInput.disabled` / `borderWidthInput.disabled` — igual que `updateBorderSectionDisabled` de `cardShapeModal.js`.
   - Llamar a esa función también al renderizar por primera vez, para reflejar el estado inicial.

5. **`ui/componentRenderer.js` — aplicar `colorFondo`**: en la rama `component.type === 'tableroSimple'`, dentro del bloque `else` (fondo "Color y patrón", línea ~686-687), sustituir el `board.style.backgroundColor = '#ffffff'` hardcodeado por:
   ```js
   const colorFondo = props.colorFondo ?? '#ffffff';
   board.style.backgroundColor = colorFondo || 'transparent';
   ```
   (mismo criterio `??`/`||` que en el paso 2, y mismo patrón ya usado en otros puntos del renderer para "colorFondo vacío = transparente", p.ej. `paintShape`/`paintTextBox` con `hexToRgba`). No toca la rama `fondoTipo === 'imagen'` (fuera de alcance).

6. **`ui/componentRenderer.js` — aplicar `bordeActivo`**: en la misma rama `tableroSimple` (líneas ~665-672, donde se calculan `bordeColor`/`bordeGrosor` y se pinta el bisel con `shadeColor`), condicionar todo ese bloque a `props.bordeActivo !== false`:
   - Si es `true` (o el campo no existe): comportamiento actual, sin cambios.
   - Si es `false`: no aplicar `borderStyle`/`borderWidth`/`borderTopColor`/etc. (dejar el borde a su valor por defecto, es decir, sin borde) — mismo criterio que `paintShape` (`shapeEl.style.border = shape.bordeActivo !== false ? ... : 'none'`), pero adaptado a las propiedades de borde por lado (`borderStyle = 'none'` es suficiente, sin necesidad de tocar los colores por lado).
   - Importante: la línea `renderHexGrid(svg, width - bordeGrosor * 2, height - bordeGrosor * 2, ...)` (línea ~726) usa `bordeGrosor` para descontar el grosor del borde del área interior del patrón hexagonal — con el borde desactivado, debe seguir descontando `bordeGrosor` igualmente (el grosor configurado no cambia, solo deja de dibujarse la línea) **o** pasar a restar `0` si se considera que sin borde visible no debe reservarse ese margen. Se opta por seguir restando `bordeGrosor` tal cual (no varía el tamaño/posición del patrón al activar/desactivar el borde, solo su trazo visible) — mantiene el comportamiento más predecible y evita saltos de tamaño del patrón al hacer toggle.

7. **Comprobar consistencia del nombre `colorFondo`**: el proyecto ya usa `properties.colorFondo` con distinto significado en otros tipos (`texto`, `carta` top-level, `Shape`/`TextBox` de carta) — todos aislados dentro de su propio `properties` de componente, así que no hay colisión real. No requiere ninguna acción adicional, se deja como nota de consistencia ya contemplada.

No hace falta ninguna migración en `core/state.js`: siguiendo el mismo criterio que el resto de propiedades de `tableroSimple` (`bordeColor`, `bordeGrosor`, etc.), los tableros guardados antes de este cambio no tienen `colorFondo` ni `bordeActivo` en su `properties`, y los fallbacks `??`/`!== false` descritos arriba ya resuelven su compatibilidad sin tocar `loadComponents`.

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md`, sección 12.6 ("Secciones dentro de pestañas de propiedades"), en el punto:

> `ui/componentModal.js`, tipo `'tableroSimple'`: "Borde" (informativo: color/grosor, sin checkbox — el borde de "Tablero simple" está siempre presente, mínimo de grosor 1) y, sin título (`.modal__section--untitled`), el campo "Fondo" (selector "Color y patrón"/"Imagen").

Actualizar a: la sección "Borde" de `'tableroSimple'` deja de ser informativa y pasa a ser des/activador (checkbox "Activar borde", mismo patrón que `Shape`/`TextBox` de carta), quedando como tercer uso de esa variante del patrón junto a los dos ya listados en el párrafo anterior de esa sección. La sección "Fondo" (sin título) no cambia en sí — el nuevo campo "Color de fondo" vive en la sub-modal `ui/boardPatternModal.js` ("Configurar fondo — Color y patrón"), que no usa el patrón `.modal__section` (no forma parte de este catálogo), así que no añade una entrada nueva a esta sección 12.6.
