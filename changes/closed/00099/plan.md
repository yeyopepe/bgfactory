## (a) Anotaciones funcionales

- **Fuera de alcance**: el tipo de componente `'texto'` independiente (colocado directamente sobre la mesa) no se toca — la alineación/margen es exclusiva de `TextBox` dentro de una cara de carta. No se introduce ningún tope máximo de margen más allá del propio tamaño del cuadro. No hay migración de datos: un `TextBox` guardado antes de este cambio se comporta como `alineacionHorizontal: 'izquierda'`, `alineacionVertical: 'arriba'`, márgenes `0`.
- **Duda resuelta**: magnitud del aumento del editor de cartas — confirmada con el usuario a partir de la maqueta (`design_editor-cartas-mas-grande.html`): `max-width: min(1500px, 95vw)` para `.card-editor-modal` (antes `min(1100px, 90vw)`) y `CANVAS_MAX_SIDE = 380` (antes `260`).
- Ambas partes tocan el mismo modal/lienzo (editor de cartas) pero no colisionan: la parte de alineación/márgenes cambia el modelo de `TextBox` y su renderizado; la parte de tamaño solo cambia una constante y una regla CSS. Se implementan y prueban juntas por compartir el mismo punto de entrada visual.

## (b) Solución técnica

### Parte 1 — Alineación y márgenes de `TextBox`

1. **Nuevo módulo puro `src/core/textBoxLayout.js`** (mismo criterio que `core/cardProportions.js`: sin dependencias de otras capas), para no duplicar la lógica de alineación entre los dos puntos de renderizado (`ui/componentRenderer.js` y `ui/cardEditorModal.js`) ni crear una dependencia ui→ui nueva. Expone:
   - `getTextBoxLayoutStyle(textBox, scale)` → `{ justifyContent, textAlign, paddingTop, paddingRight, paddingBottom, paddingLeft }` (los cuatro últimos ya como string `'Npx'`, escalados por `scale`):
     - `alineacionHorizontal` (`'izquierda'|'centro'|'derecha'`, por defecto `'izquierda'`) → `textAlign`: `'left'|'center'|'right'`.
     - `alineacionVertical` (`'arriba'|'centro'|'abajo'`, por defecto `'arriba'`) → `justifyContent`: `'flex-start'|'center'|'flex-end'`.
     - `margenSuperior`/`margenDerecha`/`margenInferior`/`margenIzquierda` (número, px, por defecto `0`) → `padding*` multiplicado por `scale` (mismo criterio que `tamañoFuente * renderScale` ya existente).

2. **`ui/cardTextBoxModal.js`** — nuevos controles en el formulario, insertados entre el campo "Tipografía" (línea 82) y el campo "Tamaño de fuente" (línea 84 actual):
   - **Grupo "Alineación horizontal"** y **"Alineación vertical"**: dos selectores de opción única (patrón nuevo, no existe ya un componente de "grupo de botones tipo segmented control" en el proyecto — se introduce siguiendo el lenguaje visual ya usado para "opción activa" en `.modal__tab.active`: fondo `var(--accent-blue)`/texto `var(--text-light)` en el botón activo, `var(--bg-subtle)` en reposo, `var(--bg-hover)` en hover, con la transición estándar de 150ms). Tres botones tipo icono-solo (SVG, tal como en la maqueta, `stroke="currentColor"`) por grupo, con `title`/`aria-label` (patrón de "botón icono-solo" ya documentado en `STYLE_BIBLE.md` sección 9). Ambos grupos en una misma fila (`display:flex; gap:1rem`, cada uno `flex:1`), reutilizando la excepción de `style.xxx=` inline ya admitida en `STYLE_BIBLE.md` sección 8 para layouts de fila puntuales.
   - **Fila de 4 campos de margen** ("Arriba", "Derecha", "Abajo", "Izquierda"): extensión del patrón de "fila de campos numéricos relacionados" de `STYLE_BIBLE.md` sección 8 (hoy documentado solo para 2 campos) a 4 campos, mismo criterio (`div` contenedor con `display:flex; gap:0.5rem`, cada campo `flex:1`, `<input type="number" min="0">`). Se implementan en una sola fila de 4 (no dos filas de 2 agrupadas por eje), siguiendo la maqueta ya validada visualmente.
   - Ambos bloques (grupos de alineación + fila de márgenes) van dentro de un mismo `div.modal__field` (o dos consecutivos), sin usar `fieldset.modal__section` (no son una configuración des/activable como "Borde", son campos siempre activos, igual que "Contenido"/"Tipografía"/"Tamaño").
   - `working.alineacionHorizontal`/`working.alineacionVertical` inicializados a `working.alineacionHorizontal || 'izquierda'` / `working.alineacionVertical || 'arriba'`; cada click de un botón del grupo actualiza `working.*` y refresca la clase `active` de los tres botones del grupo.
   - `working.margenSuperior`/`margenDerecha`/`margenInferior`/`margenIzquierda` inicializados a `working.margen* ?? 0`; cada input valida con `parseInt` + `Math.max(valor, 0)` (sin negativos), mismo patrón que `tamañoFuente`/`bordeGrosor` ya existente en este fichero.

3. **`ui/componentRenderer.js`** (líneas 993-1016, `TextBox` sobre la carta en la mesa): tras fijar `width`/`height`, añadir `textEl.style.display = 'flex'; textEl.style.flexDirection = 'column'` y aplicar `Object.assign(textEl.style, getTextBoxLayoutStyle(textBox, renderScale))` (`justifyContent`, `textAlign`, `padding*`). El `overflow: hidden` y `whiteSpace: pre-wrap`/`wordBreak: break-word` ya existentes se mantienen sin cambios — siguen aplicando sobre el nuevo contenedor flex.

4. **`ui/cardEditorModal.js`** (`renderTextBox`, líneas 336-350): mismo cambio que el punto anterior — `display:flex; flexDirection:'column'` + `Object.assign(el.style, getTextBoxLayoutStyle(textBox, previewScale))`. El resto de la función (drag, resize, dblclick para abrir `cardTextBoxModal`) no cambia.
   - Al crear un `TextBox` nuevo (`addTextBoxBtn`, líneas 313-327), no hace falta añadir explícitamente `alineacionHorizontal`/`alineacionVertical`/`margen*` — quedan `undefined` y `getTextBoxLayoutStyle` ya los trata como `'izquierda'`/`'arriba'`/`0` por defecto, igual que un `TextBox` cargado de antes de este cambio.

### Parte 2 — Editor de cartas más grande

5. **`src/ui/cardEditorModal.js`**: cambiar `const CANVAS_MAX_SIDE = 260;` (línea 13) a `const CANVAS_MAX_SIDE = 380;`. Es la única constante que gobierna `previewScale` (línea 164) y por tanto el tamaño de ambos lienzos — no hace falta tocar nada más en este fichero para este punto.
6. **`src/styles/main.css`**: cambiar `.card-editor-modal { max-width: min(1100px, 90vw); }` (línea 1053-1056) a `max-width: min(1500px, 95vw);`. `width: fit-content` se mantiene (la modal sigue ajustándose al contenido real hasta ese nuevo tope). El resto de reglas de `.card-editor-modal__*` (línea 1058 en adelante) no necesitan cambios: ya están expresadas en `%`/`flex`/`gap`, no en valores fijos atados a `260`.

## (c) Cambios de arquitectura

No aplica: no se modifica la separación por capas (`core`/`ui`/`modes`) ni el modelo genérico de componente. Se añade un módulo nuevo en `core/` (`textBoxLayout.js`) siguiendo el mismo patrón ya existente de módulos puros de datos/lógica sin dependencias (`core/cardProportions.js`, `core/dice.js`), sin introducir ninguna capa ni dependencia nueva entre capas.

## (d) Cambios en estilo

Actualizar `design/docs/ARCHITECTURE.md` sección 4, definición de `TextBox` (línea 133): añadir a la lista de campos `alineacionHorizontal` (`'izquierda' | 'centro' | 'derecha'`, por defecto `'izquierda'`), `alineacionVertical` (`'arriba' | 'centro' | 'abajo'`, por defecto `'arriba'`), y `margenSuperior`/`margenDerecha`/`margenInferior`/`margenIzquierda` (number, px, por defecto `0`) — mismo criterio de "campos opcionales sin migración" ya documentado ahí para `bordeActivo`/`colorFondo`. Documentar también el nuevo módulo `core/textBoxLayout.js` junto a la mención de `core/cardProportions.js` en esa misma sección (línea 138), como el punto único que traduce estos campos a estilos de renderizado para ambos puntos de pintado.

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`:
- Sección 8 ("Campo de color + su grosor asociado, en la misma fila"): documentar la extensión del patrón de fila a N campos numéricos relacionados (no solo 2), citando la fila de 4 campos de margen de `ui/cardTextBoxModal.js` como segundo ejemplo del patrón general "varios campos numéricos relacionados, en una misma fila con `flex:1` cada uno".
- Nueva entrada (sección 12.x, grupo de botones de opción única): documentar el patrón "grupo de alineación" (`ui/cardTextBoxModal.js`) como patrón reutilizable para elegir exactamente una opción entre varias mediante botones tipo icono-solo agrupados (selección visual con fondo `var(--accent-blue)` para la opción activa, mismo lenguaje que `.modal__tab.active`), distinto de un `<select>` nativo y de un checklist — para que cualquier futura necesidad similar (una elección única representada con iconos) lo reutilice en vez de crear un patrón ad-hoc.
