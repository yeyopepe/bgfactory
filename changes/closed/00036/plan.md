## (a) Anotaciones funcionales

Fuera de alcance:
- No se implementa ningún parser Markdown conforme a CommonMark completo: se cubre el subconjunto habitual para notas de juego (encabezados, negrita, cursiva, código en línea, enlaces, listas con/sin numerar, párrafos) — casos exóticos de Markdown (tablas, citas anidadas, HTML embebido dentro del propio Markdown, etc.) pueden no renderizarse perfectamente. Coherente con "los errores de formato son cosa del usuario, no se validan".
- No se implementa ningún mecanismo fiable al 100% para detectar que una URL embebida ha sido bloqueada por `X-Frame-Options`/`frame-ancestors`: el bloqueo ocurre dentro del `<iframe>` (documento de otro origen) y el navegador no siempre distingue "cargó una página de error" de "cargó bien". Se implementa una heurística best-effort (ver (b)), documentada como tal — no se puede prometer detección 100% fiable en todos los sitios/navegadores.

Dudas resueltas con el usuario durante el análisis (ver `description.md`):
- Selector "Formato" (HTML/Markdown) para el tipo de contenido "Texto", por defecto Markdown — confirmado.
- Sanitización del HTML resultante antes de insertarlo en el DOM — confirmado.
- Aspecto visual: plano (borde fino, sin sombra), sin excepción a la guía de estilo — confirmado.
- Scroll solo vertical; el contenido se adapta siempre al ancho del componente — confirmado.
- Errores de formato en el Markdown/HTML pegado: no se validan, se renderiza tal cual lo interprete el navegador — confirmado.

## (b) Solución técnica

1. **`src/core/markdown.js`** (módulo nuevo) — exporta `markdownToHtml(text)`. Implementación propia y ligera (no hay librería de terceros en el proyecto ni forma de traerla vía npm/CDN, ver `ARCHITECTURE.md`/`build.py`: el build concatena módulos ES propios con un mini `require`, no admite paquetes externos con su propia sintaxis). Escapa primero cualquier carácter HTML especial del texto de entrada (`<`, `>`, `&`) y después aplica, línea a línea/bloque a bloque, las transformaciones: encabezados `#`…`######`, negrita `**texto**`, cursiva `*texto*`, código en línea `` `codigo` ``, enlaces `[texto](url)`, listas con `-`/`*` y listas numeradas `1.`, párrafos separados por línea en blanco, saltos de línea simples como `<br>`. Devuelve una cadena HTML.
2. **`src/core/sanitizeHtml.js`** (módulo nuevo) — exporta `sanitizeHtml(html)`. Sanitización basada en DOM (no regex sobre texto, más robusto): crea un `<template>` desconectado del documento, le asigna `innerHTML = html`, recorre todos los elementos (`querySelectorAll('*')`) eliminando por completo los `<script>`, quitando cualquier atributo que empiece por `on` (manejadores de evento inline) y neutralizando atributos `href`/`src` cuyo valor empiece por `javascript:` (case-insensitive, con posibles espacios/tabs intercalados). Devuelve `template.innerHTML` ya limpio, listo para asignar a `element.innerHTML` en el renderer.
3. **`src/ui/componentTypeModal.js`** — añadir `{ value: 'documento', label: 'Visor de documentos' }` a `COMPONENT_TYPES`, como cuarta opción.
4. **`src/ui/componentModal.js`**:
   - Añadir `DEFAULT_DOCUMENTO_PROPERTIES = { tipoContenido: 'texto', contenido: '', formato: 'markdown', url: '' }` y una constante de tamaño por defecto `DEFAULT_DOCUMENTO_WIDTH = 240` / `DEFAULT_DOCUMENTO_HEIGHT = 320` (proporción vertical tipo hoja, igual que la maqueta `design_visor-documentos.html`).
   - En `createDefaultComponent(type)`, añadir la rama `type === 'documento'` que fija `width`/`height` a esos valores y `properties = { ...DEFAULT_DOCUMENTO_PROPERTIES }` (mismo patrón que `'tablero'`/`'dado'`, tamaño fijo desde el alta, no automático).
   - En `renderSpecificTab()`, añadir la rama `workingComponent.type === 'documento'` que delega en una nueva función `renderDocumentoSpecificFields(container)` (mismo patrón que `renderBoardSpecificFields`/`renderDadoSpecificFields`):
     - Select "Tipo de contenido" con opciones `texto`/`url` (mismo patrón de `<select>` que "Configuración de caras" del dado).
     - Bloque "Texto" (visible solo si `tipoContenido === 'texto'`): `<textarea>` "Contenido" (igual que el de `'texto'`, `rows` mayor, p.ej. 6, ya que aquí se pega contenido más largo) + select "Formato" (`markdown`/`html`).
     - Bloque "URL" (visible solo si `tipoContenido === 'url'`): `<input type="text">` "URL de la página".
     - Igual que `updateModeFieldsVisibility` del dado: alternar `style.display` de ambos bloques según el select, sin volver a invocar `renderSpecificTab()` entero (evita perder el foco/estado de los inputs).
5. **`src/ui/componentRenderer.js`**:
   - Importar `{ markdownToHtml }` de `../core/markdown.js` y `{ sanitizeHtml }` de `../core/sanitizeHtml.js`.
   - Añadir `documento: 'Documento'` a `COMPONENT_TYPE_LABELS`.
   - Añadir constantes `MIN_DOCUMENTO_WIDTH = 80`, `MIN_DOCUMENTO_HEIGHT = 80`.
   - Añadir una rama `else if (component.type === 'documento')` en `renderComponentsOnTable`, con la misma estructura que la rama `'texto'` (posición absoluta, selección con dblclick/`onToggleSelect`, arrastre con `onMove`/`canMove`, redimensionado con `attachResizeHandle` clamped a los mínimos anteriores, `identifyMode` tooltip/label):
     - Contenedor raíz `div.document-viewer` (`width`/`height` siempre presentes, igual que `'tablero'`).
     - Un `div.document-viewer__content` interior (`overflow-y: auto`, `overflow-x: hidden`, ocupa el 100% del contenedor) donde va el contenido:
       - Si `properties.tipoContenido === 'url'`: se crea/actualiza un `<iframe>` (`width: 100%`, `height: 100%`, `border: 0`, `sandbox="allow-scripts allow-same-origin allow-popups"` — aislado del resto de la app, la URL es contenido externo no confiable) con `src = properties.url`. Se añade un segundo `div.document-viewer__error` (oculto por defecto, superpuesto) con el texto "No se pudo cargar el contenido"; se muestra si el iframe dispara su evento `error`, o si no ha disparado `load` transcurridos 3s desde fijar `src` (heurística best-effort, ver (a)).
       - En cualquier otro caso (`tipoContenido === 'texto'`, incluye el valor por defecto de componentes ya guardados sin este campo): `content.innerHTML = sanitizeHtml(properties.formato === 'html' ? (properties.contenido || '') : markdownToHtml(properties.contenido || ''))`.
     - Aspecto: fondo blanco, borde `1px solid #ddd` (color neutro ya catalogado en `STYLE_BIBLE.md` sección 2), sin `border-radius` grande ni sombra — coherente con la sección 13 (aspecto plano, sin excepción de estilo).
     - Regla CSS adicional para que las imágenes u otro contenido ancho del Markdown/HTML pegado no provoquen scroll horizontal: `.document-viewer__content img, .document-viewer__content pre { max-width: 100%; }` y `word-break: break-word` en el contenedor.
6. **`src/styles/main.css`**: añadir las reglas de `.document-viewer`, `.document-viewer__content`, `.document-viewer__error`, y los modificadores `.document-viewer--selectable`/`--movable`/`--selected` siguiendo exactamente el mismo patrón ya existente para `.text-box`/`.board`/`.dice` (outline discontinuo azul en hover/selección, `cursor: move` al arrastrar, mostrar `.component-id-label` en hover/selección).

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`, sección "Tipos de componente implementados":
- Añadir un cuarto bullet `**'documento'**` (cambio 00036), documentando sus `properties` (`tipoContenido`, `contenido`, `formato`, `url`), el tamaño por defecto fijo (240×320, igual criterio que `'tablero'`/`'dado'`: nunca automático), y una referencia a los dos módulos nuevos `core/markdown.js` (conversión Markdown→HTML, subconjunto propio) y `core/sanitizeHtml.js` (sanitización DOM antes de insertar HTML de usuario), explicando el motivo (el estado del proyecto se guarda/exporta como HTML autocontenido; sin sanitizar, un `<script>` pegado se ejecutaría al reabrirlo).
- Corregir de paso la frase ya desactualizada de la sección 3 ("`modes/play/playMode.js` renderiza... con los componentes 'texto' dibujados sobre ella") si al tocar ese área se confirma que ya renderiza los cuatro tipos genéricamente (verificar contra el código antes de tocarla; si ya estaba desactualizada por un cambio anterior no relacionado, corregirla de paso ya que se está editando esta misma sección).
