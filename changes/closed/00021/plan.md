## (a) Anotaciones funcionales

Fuera de alcance:
- No se persiste el resultado del reajuste (igual que el resto de cámara/zoom hoy).
- No se añade animación de transición al mover/zoomear la cámara (coherente con la guía de estilo, sección 13: sin animaciones).
- El cálculo del encuadre para componentes de tipo `'texto'` con `width`/`height` a `null` (tamaño automático según contenido) usa como aproximación el tamaño mínimo ya existente (`40×24px`, `MIN_TEXT_BOX_WIDTH`/`MIN_TEXT_BOX_HEIGHT` de `componentRenderer.js`) en vez de medir el tamaño real renderizado en el DOM — es una aproximación ya aceptada implícitamente por la descripción funcional ("si los elementos son muy pequeños, el zoom se acerca como mucho hasta el límite máximo"), no una medición exacta.

Dudas resueltas con el usuario (recogidas ya en `description.md`, sin dudas técnicas adicionales que resolver en esta fase):
- Disponibilidad en ambos modos, aspecto "solo icono", y ubicación (extremo superior derecho en ambos modos) — ya cerradas.

## (b) Solución técnica

1. **`src/ui/componentRenderer.js`** — añadir y exportar `getComponentsBounds(components)`:
   - Si `components` está vacío, devuelve `null`.
   - Si no, recorre los componentes y calcula la caja envolvente `{ minX, minY, maxX, maxY }` usando, para cada uno, `x ?? 100`, `y ?? 100` (mismos valores por defecto que ya usa este módulo al renderizar) y `width ?? MIN_TEXT_BOX_WIDTH`, `height ?? MIN_TEXT_BOX_HEIGHT` como tamaño mínimo cuando no está fijado.
   - Se mantiene en este módulo (no en `table.js`) porque es quien ya conoce el modelo de componente y las constantes de tamaño mínimo — `table.js` sigue sin importar `state.js` ni conocer componentes.

2. **`src/ui/table.js`** — añadir capacidad de "ajustar a encuadre" sin romper su independencia de componentes:
   - Añadir constantes module-level `let activeViewport = null;` y `let activeUpdateTransform = null;`, asignadas dentro de `createInfiniteTable` (mismo mecanismo ya usado para `cameraX/cameraY/zoom`: solo hay una mesa montada a la vez).
   - Exportar `fitToBounds(bounds, { padding = 60 } = {})`:
     - Si no hay mesa montada (`activeViewport` nulo), no hace nada.
     - Si `bounds` es `null` (sin componentes): vista neutra, `cameraX = 0`, `cameraY = 0`, `zoom = 1` (son ya los valores iniciales del módulo).
     - Si no: calcula el zoom necesario para que el ancho/alto de `bounds` quepa en el viewport actual (`activeViewport.getBoundingClientRect()`) menos `padding` a cada lado, capado entre `minZoom` y `maxZoom` ya existentes; centra la cámara en el centro de `bounds`.
     - En ambos casos llama a `activeUpdateTransform()` para aplicar el cambio al `world` ya montado, de forma instantánea (sin transición, coherente con el resto de la mesa).
   - `fitToBounds` recibe una caja ya calculada, nunca componentes ni `state.js` — mantiene el comentario existente ("independiente del conocimiento de componentes").

3. **`src/ui/editModeToggle.js`** — nuevo botón "Ajustar zoom" en ambos puntos:
   - Importar `getComponents` (ya importado) y añadir `getComponentsBounds` desde `componentRenderer.js`, y `fitToBounds` desde `table.js`.
   - Factorizar un helper local `createFitButton(className)` que crea el `<button>` icono-solo (SVG de encuadre, idéntico al de los ficheros `design_*.html` de esta entrada — mismo `viewBox`/`path`), con `title="Ajustar zoom para ver todos los elementos"` y `aria-label="Ajustar zoom"`, y el handler `() => fitToBounds(getComponentsBounds(getComponents()))`.
   - `renderEditToolbar`: añadir el botón (clase `.edit-toolbar` ya cubre su estilo, el SVG hereda `color: currentColor`) al final de la barra, tras "Guardar".
   - `renderEnterEditButton`: pasa a renderizar también el botón de ajuste de zoom junto al de "Entrar en modo edición" (mismo contenedor `#mode-switcher`, a la derecha), con una clase propia (p.ej. `.mode-switcher__fit-btn`) para el estilo cuadrado 36×36. Como la función ya no crea solo el botón de entrada, se renombra a `renderModeSwitcher` (se actualiza también su importación/uso en `main.js`).

4. **`src/styles/main.css`**:
   - `#mode-switcher`: añadir `display: flex; align-items: center; gap: 0.5rem;` para alinear los dos botones en fila (hoy solo contiene un botón, no tiene layout de fila definido).
   - Nueva clase `.mode-switcher__fit-btn`: mismo fondo/color que `#mode-switcher button` (`--accent-blue`/`--text-light`, sin borde, `border-radius: 4px`, hover `opacity: 0.9`), pero `padding: 0; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;` en vez del padding de texto, siguiendo la propuesta visual de `design_boton-ajustar-zoom-juego.html`.
   - El icono SVG usa `width/height: 18px` (modo juego) / `16px` (barra de edición, dentro de `.edit-toolbar button`, que ya tiene su propio padding) y `stroke="currentColor"` para heredar el color de texto del botón, sin nuevo token de color.

5. Verificar manualmente en navegador (modo edición y modo juego, con 0, 1 y varios componentes de tamaños distintos) que el botón reencuadra correctamente y respeta `minZoom`/`maxZoom`.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 5:
- **`ui/table.js`**: añadir que, además de pan/zoom manual, expone `fitToBounds(bounds, { padding })` para reencuadrar instantáneamente la cámara a una caja `{minX, minY, maxX, maxY}` ya calculada por el caller (o `null` para vista neutra), manteniendo la mesa sin conocimiento de componentes.
- **`ui/componentRenderer.js`**: documentar la nueva función exportada `getComponentsBounds(components)` (caja envolvente de todos los componentes, con los mismos valores por defecto de posición/tamaño mínimo que ya usa el renderizado).
- **`ui/editModeToggle.js`**: actualizar el nombre `renderEnterEditButton` → `renderModeSwitcher` y añadir que en modo juego renderiza también el botón flotante de "Ajustar zoom" junto al de entrar en modo edición; y que `renderEditToolbar` añade el mismo botón al final de la barra de edición.

## (d) Cambios en estilo

En `design/docs/STYLE_BIBLE.md`, sección 9 (Botones): documentar el nuevo patrón "botón icono-solo" para acciones sin texto visible (icono SVG `stroke="currentColor"`, con `title`/`aria-label` como etiqueta accesible obligatoria al no llevar texto) — dos variantes ya existentes tras esta entrada:
- Dentro de un botón de barra ya existente (`.edit-toolbar button`): mismo padding/tamaño que los botones con texto de ese bloque, solo cambia el contenido (icono en vez de texto).
- Botón flotante cuadrado independiente (p. ej. `.mode-switcher__fit-btn`): `padding: 0`, ancho/alto fijo (`36px`), icono centrado con flex, mismo fondo/color de acción primaria que ya tuviera el contexto.
