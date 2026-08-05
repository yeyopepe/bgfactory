- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance:** no se toca `tableroPersonalizado`, ni el "Color de fondo" ya existente dentro de "Color y patrón" (cambio 00153) — quedan como propiedades independientes.

**Dudas resueltas con el usuario (ver `description.md`):**
- La configuración de "Color" abre ventana propia ("Configurar fondo — Color"), igual que "Imagen" y "Color y patrón".
- El color de este tipo no comparte valor con el "Color de fondo" de "Color y patrón": cada uno se guarda en su propia propiedad.

## (b) Solución técnica

1. **`ui/componentModal.js` — valor por defecto**: añadir `colorSolido: '#ffffff'` a `DEFAULT_BOARD_PROPERTIES` (línea ~80) — nueva propiedad, independiente de `colorFondo` (que sigue siendo la del tipo "Color y patrón"). Blanco opaco por defecto, mismo criterio que el resto de colores de esta modal.

2. **Nuevo fichero `ui/boardColorModal.js`** — sub-modal "Configurar fondo — Color", siguiendo la misma estructura que `ui/boardPatternModal.js`/`ui/boardImageModal.js` (overlay/modal/header/content/footer, sin tabs, sin sección `.modal__section` al ser un único campo):
   - `export function openBoardColorModal({ properties, onAccept })`.
   - `working.colorSolido = properties.colorSolido ?? '#ffffff'` (usar `??`, no `||`, para distinguir "propiedad ausente" de "explícitamente transparente" — mismo criterio que `colorFondo` en `boardPatternModal.js`).
   - Un único campo "Color": `input[type=color]` + checkbox "Transparente" — mismo patrón exacto ya usado tres veces en la app (propiedades de `carta`, y `colorFondo` de `boardPatternModal.js`, cambio 00153): marcado pone `working.colorSolido = ''` y deshabilita el input de color; desmarcado, restaura el valor del input.
   - Footer con "Cancelar" (cierra sin más) y "Aceptar" (`onAccept({ ...working })` y cierra) — mismo patrón que las otras dos sub-modales.

3. **`ui/componentModal.js` — tercera opción del desplegable**: en `renderBoardSpecificFields`, añadir `{ value: 'color', label: 'Color' }` a `bgTypeOptions` (línea ~920-923), después de `'imagen'`.

4. **`ui/componentModal.js` — importar y usar `openBoardColorModal`**: añadir el import junto a los de `openBoardImageModal`/`openBoardPatternModal`. En el handler de `configureBtn` (línea ~939-961), añadir una rama `else if (fondoTipo === 'color')` (entre la de `'imagen'` y el `else` final que hoy asume siempre "colorPatron") que invoque:
   ```js
   openBoardColorModal({
     properties: props,
     onAccept: ({ colorSolido }) => {
       props.colorSolido = colorSolido;
     },
   });
   ```
   El `else` final queda reservado exclusivamente a `'colorPatron'` (ya no es el "cualquier cosa que no sea imagen").

5. **`ui/componentRenderer.js` — renderizado del nuevo tipo**: en la rama `component.type === 'tableroSimple'` (línea ~682-723), separar el `else` actual (que hoy asume siempre "Color y patrón") en dos ramas:
   ```js
   if (fondoTipo === 'imagen') {
     // sin cambios
   } else if (fondoTipo === 'color') {
     const colorSolido = props.colorSolido ?? '#ffffff';
     board.style.backgroundColor = colorSolido || 'transparent';
   } else {
     // rama "colorPatron" actual, sin cambios (colorFondo + dibujo del patrón)
   }
   ```
   No se toca `hexGridToRender` ni el bloque que lo consume (línea ~725-733): solo se ejecuta dentro de la rama "colorPatron", igual que ahora.

6. **Sin migración**: los tableros guardados antes de este cambio no tienen `fondoTipo: 'color'` (no existía), así que no requieren tratamiento especial — el `fondoTipo || 'colorPatron'`/`fondoTipo === 'imagen'` ya existente cubre su compatibilidad sin tocar `core/state.js`.

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md`, sección 12.6, en el bloque ya existente sobre `ui/boardPatternModal.js`: añadir que, desde el cambio 00156, el tipo de fondo "Color y patrón" convive con un tercer tipo, "Color" (`ui/boardColorModal.js`, "Configurar fondo — Color"), con un único campo de color + checkbox "Transparente" — tampoco usa el patrón `.modal__section` (un solo campo, sin necesidad de agrupación), mismo criterio que `ui/boardImageModal.js`.
