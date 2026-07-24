## (a) Anotaciones funcionales

Sin nada fuera de alcance añadido en esta planificación: el alcance ya quedó acotado en `description.md` durante el análisis funcional (incluidas las ampliaciones de borde de carta, transparencia de imagen, renombrado de botón y secciones de "Tablero"/"Ficha").

Dudas ya resueltas con el usuario durante el análisis funcional (documentadas en el propio `description.md`, se recogen aquí como referencia rápida):

- Layout de la sección: se valoraron tres variantes — (1) título/checkbox + línea separadora en la misma fila (con una sub-variante de línea centrada, descartada), (2) sección entera encuadrada (`fieldset`/`legend`) dejando sin marco los campos sin título, y (3) igual que (2) pero encuadrando también los campos sin título (sin `<legend>`). Se descartaron (1) y (2); **se confirmó la variante (3)**: toda la pestaña "Específicas" (y los bloques nuevos del cuadro de texto de carta) usa un mismo lenguaje visual de bloques encuadrados, tengan título o no.
- Color del título de sección: nuevo token `--section-accent` (violeta/índigo apagado, `#5b5f97`), con significado propio distinto del azul de acento — confirmado tras valorar reutilizar `--accent-blue-dark` o `--error`. Solo se aplica al texto del título; el marco en sí usa el gris neutro ya existente (`--border-neutral`), igual que cualquier otro borde fino de la app.
- Alcance de la reorganización de "Tablero"/"Ficha": agrupación visual de campos ya existentes (incluidos los que no forman una sección con título propio, que quedan igualmente encuadrados pero sin `<legend>`), sin checkbox de activación de sección (ninguno de los dos bordes tiene hoy un des/activador completo) — confirmado.

## (b) Solución técnica

1. **`src/styles/main.css`** — añadir el token `--section-accent: #5b5f97;` al bloque `:root` (junto al resto de tokens de color), y las reglas nuevas del patrón `.modal__section`, implementado con `<fieldset>`/`<legend>` (sección entera encuadrada, no un título con línea encima):
   - `fieldset.modal__section { border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); margin: 1rem 0 0 0; padding: 1rem; }` — el marco usa el gris neutro ya existente, no `--section-accent` (ese tono queda reservado al texto del título). `fieldset.modal__section > *:last-child { margin-bottom: 0; }` para que el último campo no deje hueco extra antes del borde inferior.
   - `legend.modal__section-title` — `padding:0 0.5rem; font-size:0.875rem; font-weight:600; color:var(--section-accent); text-transform:uppercase; letter-spacing:0.02em;` (el propio `<legend>` ya "corta" el borde superior del `fieldset`, sin necesidad de línea ni pseudo-elemento).
   - `legend.modal__section-title--toggle` — `display:flex; align-items:center; gap:0.5rem; cursor:pointer;`; su `input[type=checkbox]` con `margin:0`.
   - `fieldset.modal__section--disabled > *:not(legend)` — `opacity:0.5; pointer-events:none`.
   - `fieldset.modal__section--untitled` — mismo marco que `.modal__section`, pero sin `<legend>` (usado para los campos de "Tablero"/"Ficha" que no llevan sección con nombre, ver tarea 7); solo necesita `padding-top: 1rem` en vez del padding-top reducido que deja hueco para la `<legend>`.
   - Reutilizar exactamente esta CSS para los tres usos (cuadro de texto de carta, "Tablero", "Ficha") — un solo patrón compartido, no clases ad-hoc por sitio.

2. **`src/ui/cardTextBoxModal.js`** — tras el `colorField` existente (línea ~115), añadir:
   - Bloque **"Borde"**: `<fieldset class="modal__section">` con `<legend class="modal__section-title modal__section-title--toggle">` (checkbox "Activar borde" + texto "Borde") ligado a `working.bordeActivo`: al desmarcar, añadir `modal__section--disabled` al `fieldset` y `disabled = true` a los inputs de color/grosor/tipo de línea (no solo depender de `pointer-events:none` de la CSS, para que también queden inaccesibles por teclado); al marcar, quitar la clase y `disabled = false`. Dentro del `fieldset`: fila color+grosor (mismo patrón ya usado en `componentModal.js`, sección 8 del STYLE_BIBLE) ligada a `working.bordeColor`/`working.bordeGrosor` (rango 1–20, 2 por defecto), y un `<select>` "Tipo de línea" (Continua/Punteada) ligado a `working.bordeTipo`.
   - Bloque **"Fondo"**: `<fieldset class="modal__section">` con `<legend class="modal__section-title">` informativo "Fondo" (sin checkbox de sección): selector de color + checkbox "Transparente" ligados a `working.colorFondo` (vacío = transparente), mismo patrón ya usado en `componentModal.js` para `colorFondo` de `'texto'`/`'ficha'` (líneas 349-391 y 799-860: `bgColorInput`/`bgTransparentCheckbox`, disabled del color si transparente marcado).
   - Valores iniciales desde `working` (copia de `textBox`): `working.bordeActivo ?? false`, `working.bordeColor || '#000000'`, `working.bordeGrosor ?? 2`, `working.bordeTipo || 'continua'`, `working.colorFondo || ''`.

3. **`src/ui/cardEditorModal.js`**, función `renderTextBox` (líneas 228-303) — aplicar al `el` (vista previa del cuadro de texto en el propio editor):
   - `el.style.border = textBox.bordeActivo ? \`${textBox.bordeGrosor ?? 2}px ${textBox.bordeTipo === 'punteada' ? 'dashed' : 'solid'} ${textBox.bordeColor || '#000000'}\` : 'none';`
   - `el.style.backgroundColor = textBox.colorFondo || 'transparent';`

4. **`src/ui/componentRenderer.js`**, bloque de renderizado de `textBoxes` de una carta sobre la mesa (líneas 1030-1049) — mismo cálculo de `border`/`backgroundColor` que en el punto 3, aplicado a `textEl`.

5. **`src/ui/cardEditorModal.js`**, función `renderFace` (líneas 141-226):
   - Añadir, junto a `chooseImageBtn` (tras él, antes de `addTextBoxBtn`, o donde mejor encaje visualmente con el botón "Elegir imagen…"): un control **"Borde"** simple (título `<p>` sin línea separadora — no usa `.modal__section`, mismo criterio que ya recoge `description.md` para este bloque) con fila color+grosor (0–20, 0 por defecto) ligada a `cara.bordeColor`/`cara.bordeGrosor`, aplicando en vivo `canvas.style.border` (o `'none'` si grosor es 0) para reflejarlo en la vista previa.
   - Añadir un control **"Transparencia"** (solo si `cara.imagenResourceId` no es `null`): slider `input[type=range]` 0–100 + `input[type=number]` sincronizado + símbolo "%" (mismo patrón ya implementado para "Zoom" en `src/ui/imageAdjustModal.js` líneas ~187-220), ligado a `cara.transparenciaImagen`, aplicando en vivo `img.style.opacity = String(1 - cara.transparenciaImagen / 100)` sobre la `<img>` ya creada en `renderFace` (líneas 163-174).
   - En el callback de `chooseImageBtn` (línea ~192-197), tras `cara.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }`, añadir `cara.transparenciaImagen = 0`.
   - En `cloneCara` (líneas 16-22), añadir `bordeColor: cara?.bordeColor ?? '#000000'`, `bordeGrosor: cara?.bordeGrosor ?? 0`, `transparenciaImagen: cara?.transparenciaImagen ?? 0` (si no se copian aquí, se pierden al abrir el editor porque la función es una whitelist explícita de campos).
   - Renombrar `addTextBoxBtn.textContent` (línea 204) de `'+ Cuadro de texto'` a `'+ Texto'`.

6. **`src/ui/componentRenderer.js`**, bloque `component.type === 'carta'` (líneas 983-1054):
   - Tras fijar `carta.style.backgroundColor = '#ffffff'` (línea 1015), aplicar el borde de la cara activa: `carta.style.border = (cara?.bordeGrosor ?? 0) > 0 ? \`${cara.bordeGrosor}px solid ${cara.bordeColor || '#000000'}\` : 'none';` (línea simple, sin bisel, ya que `carta` tiene `box-sizing: border-box` y `borderRadius` ya calculado — línea 992-993).
   - Tras crear el `<img>` de la imagen de fondo (líneas 1019-1027), añadir `img.style.opacity = String(1 - (cara.transparenciaImagen ?? 0) / 100);`.

7. **`src/ui/componentModal.js`**:
   - `DEFAULT_CARTA_PROPERTIES.caraFrontal`/`.caraTrasera` (líneas 67-68) — añadir `bordeColor: '#000000'`, `bordeGrosor: 0`, `transparenciaImagen: 0` a cada objeto de cara.
   - `renderBoardSpecificFields` (líneas 410-452) — envolver el `borderRow` ya existente (color+grosor de "Tablero") en un `<fieldset class="modal__section">` con `<legend class="modal__section-title">` informativo "Borde" (sin checkbox). Envolver el campo `bgField`/`bgLabel` "Fondo" que sigue (línea 454 en adelante) en su propio `<fieldset class="modal__section modal__section--untitled">`, sin `<legend>` — mismo marco, sin título.
   - `renderFichaSpecificFields` (líneas ~780-901) — envolver el campo `shapeField` ("Forma", antes de la línea 799) en un `<fieldset class="modal__section modal__section--untitled">` sin `<legend>`. Envolver juntos `bgTypeField` (líneas 799-819) + `bgColorField` (líneas 821-860) en un único `<fieldset class="modal__section">` con `<legend class="modal__section-title">` informativo "Fondo"; envolver `borderRow` (líneas 862-901) en su propio `<fieldset class="modal__section">` con `<legend class="modal__section-title">` informativo "Borde", después del anterior.
   - Ningún `addEventListener` ni valor por defecto existente cambia — solo el marcado envolvente (`fieldset.modal__section` + `legend.modal__section-title`, con o sin texto según lleve título) alrededor de los campos ya creados.

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md` sección 4 (Modelo de datos de componente):

- Tipo `'carta'`, modelo `TextBox`: documentar los campos nuevos `bordeActivo` (boolean, `false` por defecto), `bordeColor` (string hex, `'#000000'` por defecto), `bordeGrosor` (number px, 1–20, `2` por defecto), `bordeTipo` (`'continua' | 'punteada'`, `'continua'` por defecto) y `colorFondo` (string hex o vacío, vacío/transparente por defecto) — mismo naming que `'tablero'`/`'ficha'` (`bordeColor`/`bordeGrosor`) y `'ficha'`/`'texto'` (`colorFondo` vacío = transparente). Campos opcionales, sin migración: ausentes en guardados previos, se comportan como valores por defecto.
- Tipo `'carta'`, `caraFrontal`/`caraTrasera`: documentar los campos nuevos `bordeColor` (string hex, `'#000000'` por defecto) y `bordeGrosor` (number px, 0–20, `0` por defecto = sin borde, a diferencia de `'tablero'` donde el mínimo es 1), y `transparenciaImagen` (number, 0–100, `0` por defecto = imagen opaca, aplicado como `opacity` CSS de la imagen de fondo de esa cara). Igual sin migración: campos opcionales, ausentes en cartas guardadas antes de esta ampliación se comportan como `bordeGrosor: 0`/`transparenciaImagen: 0` (sin cambio visual).

No hay cambios de arquitectura para `'tablero'`/`'ficha'`: la reorganización en secciones es puramente de `ui/componentModal.js` (capa de presentación), sin tocar su modelo de datos.

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md`:

- **Sección 2 (Design tokens)**: añadir `--section-accent: #5b5f97;` al bloque de tokens, con el comentario "color dedicado exclusivamente al título de `.modal__section` (sección 12.6), distinto de `--accent-blue`/`--accent-blue-dark` (que siempre significan interactivo/seleccionado)".
- **Sección 12.6 (Secciones dentro de pestañas de propiedades)**: documentar el patrón `.modal__section` como una sección **encuadrada por completo** (`<fieldset>` con borde `var(--border-neutral)`, igual que cualquier otro borde fino de la app, y `<legend>` para el título), no un título con línea separadora encima de los campos (variante valorada y descartada durante el análisis de esta entrada, ver `changes/inProgress/00072/description.md` — o `implemented/00072/` una vez movida). El título (`<legend>`) usa `var(--section-accent)`, en mayúsculas; puede ser meramente informativo o de tipo des/activador (checkbox + texto dentro del propio `<legend>`). Los grupos de campos que no necesitan nombre (sin relación funcional entre sí que justifique un título) usan el mismo marco sin `<legend>` (`.modal__section--untitled`), para que toda la pestaña mantenga un único lenguaje visual de bloques encuadrados. Documentar los tres usos de este cambio (00072): los bloques "Borde"/"Fondo" del cuadro de texto de carta (`ui/cardTextBoxModal.js`); el bloque "Borde" (titulado) y "Fondo" (sin título) de "Tablero"; y "Forma" (sin título), "Fondo" (titulado) y "Borde" (titulado) de "Ficha" (`ui/componentModal.js`) — ninguno de los dos bordes de "Tablero"/"Ficha" lleva checkbox de sección, al no tener hoy un des/activador completo.
- **Sección 13 (Qué NO hacer / excepciones catalogadas)**: añadir un párrafo nuevo, junto a los ya existentes de bisel de "Tablero"/"Dado" y esquinas de "Carta", documentando `--section-accent` como excepción de color catalogada (cambio 00072): tono dedicado exclusivamente al título de `.modal__section`, no reutilizable para ningún otro fin (el marco del `fieldset` en sí sigue usando el gris neutro estándar).

`design/docs/FEATURES.md` — sección "Componente 'carta'", párrafo de **Editor de cartas** (y su lista de "Cuadros de texto"):

- Editar in place la entrada de "Cuadros de texto" para añadir: cada cuadro de texto admite ahora borde propio (activable con un check, color/grosor/tipo de línea Continua o Punteada) y color de fondo propio (vacío = transparente por defecto), independientes entre cuadros de texto.
- Editar in place el párrafo de "Editor de cartas" para añadir, por cada cara: un borde propio de la carta completa (color + grosor, `0` = sin borde) y un valor de transparencia de la imagen de fondo (0–100%, `0%` = opaca), ambos independientes entre cara frontal y trasera.
- Añadir el código `00072` a la lista de "Código" de la entrada "Componente 'carta'" (línea 175 actual: `00053, 00058, 00060, 00063, 00071, 00075` → añadir `00072`).
- No se documenta la reorganización visual de "Tablero"/"Ficha" en secciones ni el renombrado del botón "+ Texto": son cambios de presentación/etiqueta que no alteran ninguna capacidad funcional descrita en este documento.
