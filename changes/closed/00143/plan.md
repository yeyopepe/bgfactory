**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Sin dudas nuevas pendientes con el usuario: el alcance funcional quedó cerrado en `description.md` (convivencia con `tableroSimple`, una sola cara, bisel en el borde, redimensionado libre, editor generalizado con maximizar/restaurar heredado).

Reanálisis por orden (este `plan.md` se escribe cuando ya existían cambios posteriores cerrados — `00144` "Control de tamaño en la configuración de componentes" y `00146` "Reordenar sección Generales" — ambos tocan `ui/componentModal.js` pero solo su pestaña "Generales" (sección de tamaño/orden de campos comunes a los 6 tipos), sin afectar a la pestaña "Específicas" ni al editor de cartas: no hay conflicto con esta solución, que añade contenido nuevo a "Específicas" y generaliza `ui/cardEditorModal.js`.

Decisión técnica tomada durante este análisis (no había sido preguntada al usuario porque es puramente de implementación): el redimensionado libre de `tableroPersonalizado` (a diferencia de `carta`, que mantiene siempre la proporción configurada) implica que la relación ancho/alto de su lienzo puede cambiar en cualquier momento. El diseño de la única cara (imagen, formas, textos) se guarda en "unidades de diseño" sobre un lienzo lógico de tamaño fijo, igual que ya hace `carta` — pero como `carta` solo necesita **un** factor de escala uniforme (su proporción nunca cambia sin pasar por el desplegable "Proporción"), y `tableroPersonalizado` sí puede tener cualquier proporción en cualquier momento, hace falta escalar ancho y alto por separado (`renderScaleX`/`renderScaleY`) en vez de reutilizar el único `renderScale` uniforme de `paintCartaFace`. Se opta por extender `paintCartaFace` para aceptar ambos factores (con el segundo opcional, igual al primero por defecto) en vez de duplicar la función — ver tarea 6.

## (b) Solución técnica

### 1. Modelo de datos (`core/component.js`)

- Añadir al catálogo de tipos conocidos el valor `'tableroPersonalizado'` (solo como referencia en comentarios/JSDoc si los hay; el campo `type` ya es libre, sin enum cerrado).
- No hace falta ningún campo nuevo a nivel de componente (reutiliza `width`/`height`/`bloqueado`/etc., igual que el resto de tipos) — todo lo específico vive en `properties`.
- `properties` de `'tableroPersonalizado'`: `{ cara: { imagenResourceId, ajusteImagen, formas: [], textBoxes: [], bordeColor, bordeGrosor, transparenciaImagen } }` — mismo shape que `caraFrontal`/`caraTrasera` de `'carta'` (sección 4 de `ARCHITECTURE.md`), pero una única cara bajo la clave `cara` en vez de dos. `bordeColor`/`bordeGrosor` se reutilizan tal cual (mismo control en el editor), solo cambia cómo se pintan (bisel en vez de línea simple, ver tarea 6).

### 2. Alta del tipo nuevo

- **`ui/componentTypeModal.js`**: añadir `{ value: 'tableroPersonalizado', label: 'Tablero personalizado' }` a `TYPE_OPTIONS`, junto a `'tableroSimple'`.
- **`ui/componentModal.js`**:
  - Nuevo `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES` (junto a `DEFAULT_BOARD_PROPERTIES`/`DEFAULT_CARTA_PROPERTIES`): `{ cara: { imagenResourceId: null, ajusteImagen: { zoom: 100, posX: 50, posY: 50, rotation: 0 }, formas: [], textBoxes: [], bordeColor: '#000000', bordeGrosor: 2, transparenciaImagen: 0 } }`.
  - `createDefaultComponent(type)`: caso nuevo para `'tableroPersonalizado'` con `width`/`height` fijados (p. ej. `300 × 200`, igual criterio que el resto de tipos que "nunca usan tamaño automático") y `properties: DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES` (clonado, no compartido por referencia).
  - Pestaña "Específicas": nuevo bloque `renderTableroPersonalizadoSpecificFields` (nombrado en paralelo a `renderCartaSpecificFields`), con un único botón "Editar diseño del tablero" que abre el editor generalizado (tarea 3) con `faces: [{ key: 'cara', label: null }]` (una sola cara, sin etiqueta de cara visible al no haber ambigüedad) y `showProporcionSelector: false`, `borderStyle: 'bisel'`; al aceptar, sustituye `working.properties.cara` con el resultado. Sin bloque "Estilo" (Copiar/Pegar estilo, `core/styleClipboard.js`) en esta primera versión — no está entre lo pedido en `description.md`; puede añadirse más adelante como cambio propio si hace falta.

### 3. Generalizar el editor de cartas a "Editor visual"

- **Renombrar** `src/ui/cardEditorModal.js` → `src/ui/visualEditorModal.js`; `openCardEditorModal` → `openVisualEditorModal`. Único punto real que lo importa: `ui/componentModal.js` (`import { openVisualEditorModal } from './visualEditorModal.js'`) — confirmado que no hay más importadores reales en `src/` (las demás coincidencias de "cardEditorModal" en `cardShapeModal.js`/`cardTextBoxModal.js`/`imageAdjustModal.js`/`cardProportions.js`/`colorUtils.js`/`textBoxLayout.js` son solo comentarios/JSDoc, a actualizar de paso pero sin impacto funcional).
- **Nueva firma**: `openVisualEditorModal({ component, faces, showProporcionSelector = true, borderStyle = 'simple', onAccept })`, donde `faces` es `[{ key: string, label: string | null }]` — `[{ key: 'caraFrontal', label: 'Cara frontal' }, { key: 'caraTrasera', label: 'Cara trasera' }]` para `'carta'` (comportamiento actual, sin cambios visibles), `[{ key: 'cara', label: null }]` para `'tableroPersonalizado'`.
- **`working`**: en vez de los campos fijos `caraFrontal`/`caraTrasera`, construir dinámicamente `working[key] = cloneCara(props[key])` iterando `faces`. `working.proporcion`/`working.esquinasRedondeadas` solo se inicializan y se usan si `showProporcionSelector` es `true`.
- **Toolbar**: el bloque del desplegable "Proporción" y el checkbox "Esquinas redondeadas" (líneas ~361-420 del fichero actual) se envuelve en `if (showProporcionSelector) { ... }` — para `tableroPersonalizado` no se pintan (el tipo no tiene proporción configurable, se redimensiona libremente en la mesa, igual que `tableroSimple`).
- **`renderFaces()`**: la construcción de `facesRow` (hoy dos llamadas literales a `renderFace('caraFrontal', 'Cara frontal')`/`renderFace('caraTrasera', 'Cara trasera')`) pasa a iterar `faces.map(({ key, label }) => renderFace(key, label))`. `renderFace(key, label)` ya está parametrizada por clave/etiqueta internamente — no necesita cambios de fondo, solo dejar de asumir que solo existen esas dos claves. Si `label` es `null` (caso `tableroPersonalizado`), omitir el título `.card-editor-modal__face-label` de esa columna (con una sola cara no hace falta distinguirla).
- **Botón "Ajustar imagen…"**: hoy construye a mano `faces: [{ key: 'caraFrontal', ... }, { key: 'caraTrasera', ... }]` para `ui/imageAdjustModal.js` (líneas ~445-507). Generalizar para construir ese array iterando el `faces` recibido por el editor — con una única cara, sigue funcionando tal cual (`ui/imageAdjustModal.js` ya soporta `faces` de longitud 1, no requiere cambios).
- **Borde de cada cara** (líneas ~663-673, dentro de `renderFace`): hoy `canvas.style.border = bordeGrosor > 0 ? '${bordeGrosor}px solid ${color}' : ''`. Con `borderStyle === 'bisel'`, sustituir por el mismo criterio de dos tonos que usa `tableroSimple`/`dado` (`board.style.borderTopColor/borderLeftColor` claro, `borderBottomColor/borderRightColor` oscuro vía `shadeColor`), aplicado siempre (sin la opción de "sin borde" que sí tiene `carta`, ya que un tablero visualmente necesita el bisel para leerse como tal — coherente con que `tableroSimple` no permite grosor `0`). Con `borderStyle === 'simple'` (por defecto), comportamiento actual sin cambios.
- **Extraer `shadeColor`** de `ui/componentRenderer.js` (hoy función local, línea 41) a `core/colorUtils.js` (junto a `hexToRgba`), exportada, e importarla desde ambos `ui/componentRenderer.js` y `ui/visualEditorModal.js` — evita duplicar la fórmula de sombreado entre el renderizado de la mesa y el lienzo del editor.
- **Título del modal**: pasa a depender del número de caras — `"Editor visual — Carta"` si `faces.length === 2`, `"Editor visual — Tablero"` si `faces.length === 1` (o, más simple y suficiente para esta primera versión, un `title` explícito como parámetro adicional de `openVisualEditorModal`, fijado por cada caller: `'Diseñar carta'`/`'Diseñar tablero personalizado'`). Se opta por el parámetro explícito — más simple y no ata el título a asumir siempre 1 o 2 caras.

### 4. `core/cardFaceElements.js`

Sin cambios: `getOrderedFaceElements(cara)`/`bringElementToFront`/`sendElementToBack` ya operan sobre una `cara` genérica (`formas`+`textBoxes`), sin saber si es `caraFrontal`, `caraTrasera` o la única `cara` de un tablero personalizado.

### 5. `core/cardProportions.js` — nueva constante de tamaño de diseño

- Añadir `TABLERO_PERSONALIZADO_DESIGN_WIDTH`/`TABLERO_PERSONALIZADO_DESIGN_HEIGHT` (p. ej. `400 × 400`, lienzo lógico cuadrado por defecto — el usuario diseña sobre este lienzo fijo, independientemente del tamaño real que el tablero tenga luego en la mesa) — constantes hermanas de `CARD_DESIGN_WIDTH`, en el mismo módulo por ser también "tamaños de diseño", aunque `tableroPersonalizado` no tenga entrada en `CARD_PROPORTIONS` (no es una proporción de carta).
- `ui/visualEditorModal.js` usa estas constantes (en vez de `CARD_DESIGN_WIDTH`/`getDesignSize(proporcion)`) para el lienzo cuando `showProporcionSelector` es `false`.

### 6. Render en la mesa (`ui/componentRenderer.js`)

- Extender `paintCartaFace(contentParent, cara, renderScaleX, faceWidth, faceHeight, renderScaleY = renderScaleX)`: los usos internos que hoy multiplican por un único `renderScale` pasan a multiplicar coordenadas/anchos por `renderScaleX` y `renderScaleY` por separado (`x`/`width` → `renderScaleX`, `y`/`height` → `renderScaleY`; `tamañoFuente` → media de ambos o `renderScaleX`, a decidir al implementar según qué se vea mejor con texto). El único caller existente (`'carta'`, tarea de render ya existente) sigue pasando un único `renderScale` (ambos ejes iguales, comportamiento sin cambios).
- Nuevo bloque `else if (component.type === 'tableroPersonalizado')`, hermano de los bloques `'tableroSimple'` y `'carta'` ya existentes:
  - `div.tablero-personalizado` (nueva clase BEM), `position: absolute`, `width`/`height` desde `component.width`/`component.height` (mínimo propio, p. ej. `MIN_TABLERO_PERSONALIZADO_SIZE = 60`, constante hermana de `MIN_BOARD_SIZE`).
  - Borde con bisel: mismo criterio que `'tableroSimple'` (líneas 673-680: `shadeColor(bordeColor, 0.35)` arriba/izquierda, `shadeColor(bordeColor, -0.35)` abajo/derecha), leyendo `bordeColor`/`bordeGrosor` de `properties.cara`.
  - Contenido: `paintCartaFace(tablero, properties.cara, width / TABLERO_PERSONALIZADO_DESIGN_WIDTH, width, height, height / TABLERO_PERSONALIZADO_DESIGN_HEIGHT)`, reutilizando tal cual el pintado de imagen/formas/textBoxes ya implementado para carta.
  - Indicadores (`identifyMode`, `showLockIndicator`, `showHiddenIndicator`) y listeners (`onSelect`/`onToggleSelect`/`onContextMenu`/`onMove`) igual que el resto de tipos — sin `onCartaFlip` (no aplica, un tablero no tiene dos caras que alternar).
  - Redimensionado: `attachResizeHandle` con `clamp` propio `clampTableroPersonalizadoSize` (mismo patrón que `clampBoardSize`, solo aplicando el mínimo, sin ratio) — libre en ambos ejes, sin forzar proporción.

### 7. Documentación funcional/técnica sincronizada por `ms-do`

Ver secciones (c)/(d) más abajo para lo que hay que actualizar en `ARCHITECTURE.md`/`STYLE_BIBLE.md`, incluida la incongruencia ya detectada en `description.md` (lista de tipos de `componentTypeModal.js` desactualizada en la sección 4 de `ARCHITECTURE.md`).

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`:

- Sección 4 ("Modelo de datos de componente"), párrafo del alta de un tipo nuevo: corregir la lista de tipos que ofrece hoy `ui/componentTypeModal.js` (actualmente desactualizada: dice `'texto'`/`'tableroSimple'`/`'dado'`, el código real ya tenía seis — `texto`, `tableroSimple`, `dado`, `documento`, `carta`, `mazo` — y tras este cambio pasan a ser siete, añadiendo `tableroPersonalizado`).
- Añadir un nuevo punto en "Tipos de componente implementados" (mismo formato que `'tableroSimple'`/`'carta'`) para `'tableroPersonalizado'`: qué es, su `properties.cara` (mismo shape que una cara de carta, sin las dos caras), tamaño por defecto, redimensionado libre (como `tableroSimple`), y borde con bisel.
- Sección 5 (`ui/*`): renombrar la entrada de `ui/cardEditorModal.js` a `ui/visualEditorModal.js` (`openVisualEditorModal`), documentando el nuevo parámetro `faces`/`showProporcionSelector`/`borderStyle`/`title`, y que ahora lo usan tanto `'carta'` como `'tableroPersonalizado'` desde `ui/componentModal.js`.
- Documentar la extracción de `shadeColor` desde `ui/componentRenderer.js` a `core/colorUtils.js`.
- Documentar `paintCartaFace` con su nuevo parámetro `renderScaleY` opcional.

## (d) Cambios en estilo

En `STYLE_BIBLE.md`:

- Sección 13 ("Qué NO hacer" / excepciones ya catalogadas): la excepción de bisel de borde, hoy acotada a `'tableroSimple'`/`'dado'`, pasa a incluir también `'tableroPersonalizado'`.
- Documentar la nueva clase de bloque `.tablero-personalizado` (sección 5/6, mismo criterio de bordes/elevación que `.board`).
- Si el modal generalizado cambia de nombre de clase de bloque (`.card-editor-modal` sigue existiendo como nombre de clase CSS aunque el módulo JS se renombre — **no** se renombra la clase CSS en este cambio, solo el fichero/función JS, para no tocar `main.css` sin necesidad) — anotar explícitamente en la sección 12.4 que `.card-editor-modal` es ahora el nombre de clase del "Editor visual" generalizado (usado también por `tableroPersonalizado`, no solo por `carta`), aunque el nombre de la clase no haya cambiado.
