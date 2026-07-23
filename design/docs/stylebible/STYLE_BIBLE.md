# Errantes — Style Bible

Guía de estilo de la app en `/src`. Documenta las convenciones **ya existentes** en el código (`src/styles/main.css` + los módulos de `src/ui`, `src/modes`). Cualquier UI nueva debe seguir estas reglas para mantener consistencia visual y estructural.

Para la arquitectura técnica general (capas, modelo de datos, build), ver [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Stack de estilos

- CSS plano, un único fichero: [main.css](../../src/styles/main.css). No hay preprocesador ni CSS-in-JS.
- El DOM se construye con JS vanilla (`document.createElement`, `className`, `classList`), no hay framework de componentes. Los ficheros en `src/ui/*.js` son los "componentes".
- No añadir dependencias de UI (React, Tailwind, etc.) sin acordarlo antes: la app está pensada como vanilla JS + CSS plano.

## 2. Design tokens (`:root`)

Todos los colores viven como custom properties en `:root`. **Nunca hardcodear un color que ya tenga token** — reutilizar el existente o añadir uno nuevo al `:root` si hace falta un tono nuevo y reutilizable.

```css
--bg-table:     #c2c2c2;  /* fondo de la mesa infinita */
--bg-toolbar:   #333333;  /* header y toolbars */
--bg-card:      #f5f5f5;  /* paneles/tarjetas (listas, panel de edición) */
--accent-blue:  #2c7dd8;  /* color de acción primario (botones, foco, tabs activas) */
--accent-blue-dark: #123a66;  /* fondo de la etiqueta identificativa de componente en modo edición (sección 12.3) */
--text-primary: #1a1a1a;  /* texto sobre fondos claros */
--text-light:   #ffffff;  /* texto sobre fondos oscuros/de acento */
--text-muted:   #666666;  /* texto secundario */
--error:        #d32f2f;  /* estados de error y acciones destructivas */
--border-neutral: #dcdcdc;  /* todos los bordes finos neutros (cambio 00063) */
--bg-subtle:    #f0f0f0;  /* fondos neutros en reposo: cabecera de tabla, botón secundario (cambio 00063) */
--bg-hover:     #e8e8e8;  /* cualquier hover neutro: fila, botón secundario, tab (cambio 00063) */
--radius-sm:    4px;   /* radio de controles, ver sección 5 (cambio 00063) */
--radius-lg:    8px;   /* radio de contenedores destacados, ver sección 5 (cambio 00063) */
--shadow-1:     0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08);  /* elevación nivel 1, ver sección 6 (cambio 00063) */
--shadow-2:     0 4px 20px rgba(0,0,0,0.15);  /* elevación nivel 2, ver sección 6 (cambio 00063) */
--transition-fast: 150ms ease;  /* transición estándar de hover/foco, ver sección 6 (cambio 00063) */
```

Todos los grises neutros y las sombras/radios reutilizables ya son tokens — no quedan colores "puntuales" sin promover. Overlays que siguen siendo valores puntuales (no se repiten lo bastante para merecer token): `rgba(0,0,0,0.5)` (fondo de `.modal-overlay`), `rgba(255,255,255,0.1)` (hover en toolbar oscura).

## 3. Tipografía

- Fuente global: `system-ui, sans-serif` (sin webfonts externas).
- Tamaños usados, de mayor a menor — reutilizar estos, no inventar tamaños intermedios:
  - `4rem` — resultado a tamaño grande del componente "Dado" (`ui/diceResultModal.js`, cambio 00020), excepción puntual para mostrarlo legible desde lejos; único uso previsto por ahora
  - `1.5rem` — título principal (`h1`)
  - `1.125rem` — títulos de panel (`.edit-mode-panel h2`)
  - `0.875rem` — texto de UI por defecto (botones, tabs, labels, inputs, items de lista)
  - `0.75rem` — texto auxiliar (botones pequeños, error de validación, footer de versión)
- `font-weight: 500` para labels de formulario; el resto usa el peso normal del navegador.

## 4. Espaciado

Escala basada en `rem`, en pasos de `0.25rem`: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`. No usar píxeles para padding/margin salvo casos ya existentes (bordes `1px`/`2px`).

- Padding de contenedor estándar: `1rem`
- Padding de controles (botones, tabs): `0.5rem 1rem`
- Gap entre elementos en flex: `0.5rem` (ajustado) o `1rem` (holgado)

## 5. Bordes y esquinas

Escala de dos radios (cambio 00063, sustituye la escala anterior de tres tamaños):

- `var(--radius-sm)` (4px) — controles: botones (incl. los pequeños dentro de items de lista, que antes usaban 3px), inputs, items pequeños de lista/galería.
- `var(--radius-lg)` (8px) — contenedores destacados: modal, paneles flotantes (`.component-panel`, `.resource-panel`), y el componente "Carta".
- Bordes: `1px solid var(--border-neutral)`, o `1px solid var(--text-light)` sobre fondo oscuro (toolbar).

## 6. Elevación, sombra y transición

Sistema de 3 niveles de elevación (cambio 00063), reutilizable en toda la app en vez de "solo el modal tiene sombra":

- **Nivel 0 — plano**: la mesa infinita y cualquier contenido embebido dentro de otro elemento (p. ej. `.document-viewer__content`). Sin sombra.
- **Nivel 1 — flotante sutil** (`box-shadow: var(--shadow-1)`): paneles de trabajo (`.component-panel`, `.resource-panel`), cabecera/toolbar (`h1`, `.edit-toolbar`), `.toast`, y las piezas de juego sobre la mesa — `.board`, `.ficha`, `.carta`, `.document-viewer`. Dos casos especiales de la misma idea, adaptados a que su silueta no es una caja rectangular plana:
  - `.dice` usa `filter: drop-shadow(...)` en vez de `box-shadow`, para que la sombra siga la silueta real (triángulo/cuadrado/rombo/decágono) en vez de la caja cuadrada del contenedor.
  - `.text-box` (texto suelto sobre la mesa, sin caja/fondo) usa `text-shadow` en vez de `box-shadow`, solo para mantener legibilidad sobre cualquier color de mesa.
- **Nivel 2 — overlay** (`box-shadow: var(--shadow-2)`): modales (`.modal`) y `.help-icon__tooltip` — el nivel más alto, ya lo tenían antes de este cambio.
- El estado transitorio `.lifted` al arrastrar un componente en Modo Juego (cambio 00062) es el estado "en el aire" de este mismo sistema (una sombra más pronunciada + desplazamiento fijo mientras dura el arrastre), no una excepción aislada.
- **Transiciones**: los elementos interactivos (botones, filas de lista, tabs, items seleccionables, icono de ayuda, campos de formulario) llevan `transition: <propiedad> var(--transition-fast)` (150ms) en sus cambios de `:hover`/`:focus` — color de fondo/borde, `opacity`, `box-shadow`, y en los botones de acción primaria/destructiva un ligero `transform: translateY(-1px)`. No usar `:active` ni transiciones en el contorno discontinuo de selección (`--selectable`/`--selected`) ni en el temblor/parpadeo del dado — son indicadores funcionales de estado y JS puro, no decoración (ver sección 13).

## 7. Nomenclatura de clases — BEM

El proyecto sigue **BEM** (`bloque__elemento--modificador`). Reglas concretas:

- Bloque en kebab-case: `.component-list`, `.modal`, `.infinite-table`, `.edit-mode-panel`, `.help-icon`, `.board`, `.board-image-modal` (galería de imágenes del fondo "Imagen" del tablero, cambio 00019), `.component-type-modal` (lista de tipos al elegir qué componente crear, cambio 00019).
- Elemento con doble guion bajo: `.component-list__item`, `.modal__header`, `.modal__tabs`, `.modal__field`, `.infinite-table__world`, `.help-icon__tooltip`.
- Modificador con doble guion: `.text-box--selectable`, `.text-box--movable`, `.modal__field--checkbox`.
- Estados transitorios (no BEM, clases simples añadidas/quitadas por JS): `.grabbing`, `.active`, `.lifted` (cambio 00062) — se usan tal cual, sin prefijo del bloque, y siempre junto a `classList.add/remove`, nunca reemplazando `className` entero.
- Excepción histórica: `.btn-cancel` / `.btn-accept` / `.btn-eliminar` no siguen BEM (no son `algo__algo`). Si se añaden más variantes de botón standalone (no ligado a un bloque existente), usar el mismo patrón `.btn-<intención>` en vez de mezclar con BEM de otro bloque.
- Cuando el botón sí pertenece a un bloque ya existente (p. ej. una fila de `.component-list`), no se usa la excepción `.btn-*`: se sigue BEM normal con un modificador, como `.component-list__action-btn--danger`.
- IDs (`#mode-switcher`, `#content`, `#app-version`, `#edit-toolbar`) se reservan para contenedores de layout únicos definidos en `index.html`, no para componentes reutilizables.

## 8. Patrones de componente (JS)

Cada "componente" es una función que crea y devuelve un `HTMLElement` vía `document.createElement`, asigna `className` una vez en la creación, y usa `classList.add/remove/toggle` solo para estados dinámicos posteriores. Ejemplo de la forma esperada (ver [componentModal.js](../../src/ui/componentModal.js)):

```js
const modal = document.createElement('div');
modal.className = 'modal';
```

- Un fichero por componente en `src/ui/`, nombrado en camelCase (`componentList.js`, `componentModal.js`, `table.js`).
- Los estados de UI (tab activa, arrastrando, seleccionable) se representan como clase, nunca como estilo inline.
- No usar `style.xxx =` desde JS para nada que pueda expresarse como clase/token CSS. Excepción legítima: transforms dinámicos calculados (p. ej. pan/zoom de `.infinite-table__world`), donde el valor es puramente numérico y no tiene sentido como clase.
- **Campo de color + su grosor asociado, en la misma fila**: cuando un modal tiene un color y un grosor que van juntos conceptualmente (p. ej. color y grosor de un borde/trazo), ambos campos se muestran en la misma fila en vez de apilados verticalmente como el resto de campos del formulario. Patrón usado en `componentModal.js` (borde de tablero y de ficha): un `div.modal__field` exterior contiene un `div` interior con `style.display = 'flex'; style.gap = '0.5rem'`, y dentro dos sub-`div` con `style.flex = '1'` — uno por campo (color primero, grosor después). Es la única excepción admitida a la regla de "no `style.xxx=` desde JS" de más arriba, porque el layout de fila es puntual a ese par de campos, no un estado ni un valor reutilizable como clase.

## 9. Botones

Todos los botones comparten esta base (adaptar el fondo/borde según contexto):

```css
padding: 0.5rem 1rem;   /* o 0.25rem 0.5rem si es un botón pequeño dentro de un item */
border: none;           /* o 1px solid var(--text-light) sobre fondo oscuro */
border-radius: var(--radius-sm);
cursor: pointer;
font-size: 0.875rem;    /* o 0.75rem si es pequeño */
transition: background var(--transition-fast), opacity var(--transition-fast);
```

- Acción primaria: fondo `var(--accent-blue)`, texto `var(--text-light)`, hover `opacity: 0.9` + `transform: translateY(-1px)` + `box-shadow: 0 3px 8px rgba(44,125,216,.35)` (sombra de color, coherente con el nivel de elevación que gana al "despegarse" en hover).
- Acción secundaria/cancelar: fondo `var(--bg-subtle)`, texto `var(--text-primary)`, hover `var(--bg-hover)` — solo transición de `background`, sin `transform` (es la acción no destacada).
- Acción destructiva (eliminar/borrar): fondo `var(--error)`, texto `var(--text-light)`, hover `opacity: 0.9` + `transform: translateY(-1px)` + `box-shadow: 0 3px 8px rgba(211,47,47,.3)` — mismo tratamiento que la acción primaria, solo cambia el color de fondo/sombra. Aplica tanto al botón standalone `.btn-eliminar` (modales) como al modificador BEM `--danger` dentro de un bloque existente (p. ej. `.component-list__action-btn--danger`): cualquier acción que elimine un elemento debe usar este color en toda la app, nunca el azul de acción primaria.
- Botón sobre fondo oscuro (toolbar): transparente, borde `1px solid var(--text-light)`, hover `rgba(255,255,255,0.1)` con transición de `background`, sin `transform`.
- Deshabilitado: `opacity: 0.5; cursor: not-allowed`, sin `transform` en hover.
- Sigue sin usarse `:active` — el feedback de interacción es el cambio de `opacity`/`background`/`box-shadow`/`transform` en `:hover`, ahora con una transición de 150ms (`var(--transition-fast)`) en vez de instantáneo (ver sección 6).
- **Botón icono-solo** (acción sin texto visible): icono SVG con `stroke="currentColor"` (hereda el color de texto/borde ya definido para el contexto) y siempre con `title`/`aria-label` como etiqueta accesible, ya que no hay texto. Dos variantes:
  - Dentro de un botón de barra ya existente (p. ej. `.edit-toolbar button`): mismo padding/tamaño que los botones con texto de ese bloque — solo cambia el contenido.
  - Botón flotante cuadrado independiente (p. ej. `.mode-switcher__fit-btn`): `padding: 0`, ancho/alto fijo (`36px`), icono centrado con `display: inline-flex; align-items: center; justify-content: center`, mismo fondo/color de acción primaria que ya tuviera el contexto.

## 10. Layout

- La app es una columna flex de altura completa (`html, body { height: 100% }`, `body { display:flex; flex-direction:column; height:100vh }`): header fijo (`h1`, `3.5rem`) + `#content` flexible (`flex: 1 1 auto; min-height: 0`).
- Paneles laterales de ancho fijo: `400px` (`.component-list`, `.edit-mode-panel`).
- Posición inicial por defecto de los paneles flotantes del modo edición: ambos anclados al lado derecho, apilados verticalmente (`.component-panel-container` arriba, `.resource-panel-container` justo debajo) — es solo la posición de partida, el usuario puede arrastrar cada panel libremente después.
- Los overlays (modal, mode-switcher) usan `position: fixed` con `z-index` crecientes por capa:
  - `10` — footer de versión
  - `99` — toolbar de edición
  - `100` — header
  - `101` — mode switcher
  - `1000` — overlay de modal (siempre el nivel más alto)
- Al añadir un elemento fijo/absoluto nuevo, elegir su `z-index` respetando este orden (por debajo del modal, por encima del contenido normal).

## 11. Redimensionado (manejador de esquina)

Patrón estándar para hacer redimensionable cualquier elemento de la app (no exclusivo de un componente): `.resize-handle`, un bloque standalone (no sigue BEM de ningún otro bloque, como excepción similar a `.btn-*`) con el manejador implementado en `ui/resizeHandle.js` (`attachResizeHandle`).

- Posición: esquina inferior derecha del elemento a redimensionar (`position: absolute; right: 0; bottom: 0`) — el host debe ser un contenedor posicionado (`position: relative/absolute`).
- Aspecto: contenedor de `18px` (antes `16px`) con grip diagonal de `9px` (antes `8px`, `::after` con gradientes) — agrandado ligeramente en el cambio 00063 para mejorar la diana de arrastre. Gris neutro por defecto y `var(--accent-blue)` + `transform: scale(1.15)` con transición de 150ms en `:hover`/`.resize-handle--active` — sin sombras ni bordes redondeados propios (el grip en sí, no el elemento que redimensiona).
- Cursor: `nwse-resize`, igual en todos los usos aunque el elemento solo redimensione un eje (mismo punto de arrastre visual reconocible en toda la app).
- No introducir un segundo patrón de redimensionado (bordes laterales, esquinas múltiples, etc.) sin decidirlo explícitamente — reutilizar `ui/resizeHandle.js`.

**Variante para borde de columna de tabla (cambio 00064):** `.column-resize-handle`, aplicada además de `.resize-handle` (mismo mecanismo de arrastre de `ui/resizeHandle.js`, reutilizado vía `ui/tableColumnResize.js` — no es un segundo sistema de redimensionado, es la misma interacción orientada a otro borde). Diferencias respecto a `.resize-handle`: ocupa el borde derecho completo de la celda de cabecera (`top/bottom: 0`, no solo la esquina), cursor `col-resize` en vez de `nwse-resize`, y el grafismo es una línea vertical fina (no el grip diagonal de `::after`) — mismo gris neutro en reposo y `var(--accent-blue)` en `:hover`/`.resize-handle--active`, con la misma transición de 150ms.

## 12. Icono de ayuda (tooltip / modal)

Patrón estándar para ayuda contextual en cualquier punto de la app: `.help-icon`, círculo de 16px con "?" (implementado en `ui/helpIcon.js`, `createHelpIcon({ text, html })`).

- Aspecto: círculo 16px, fondo `var(--text-muted)` (`var(--accent-blue)` + `box-shadow: 0 2px 5px rgba(44,125,216,.35)` en `:hover`, con transición de 150ms), texto "?" en `var(--text-light)`, `font-size: 0.7rem`, `cursor: help` — sin borde.
- **Tooltip** (`.help-icon__tooltip`): para texto plano de menos de 200 caracteres. Aparece encima del icono al pasar el ratón (`:hover`), fondo `var(--bg-toolbar)`, texto `var(--text-light)`, `box-shadow: var(--shadow-2)` (nivel 2, sección 6).
- **Modal**: para texto de 200 caracteres o más, o con formato (HTML). Reutiliza el mismo patrón `.modal-overlay`/`.modal` ya documentado (no un patrón nuevo), con botón "Cerrar" (`.btn-cancel`). Usa el mismo `z-index: 1000` reservado para overlays de modal (sección 10) — no se introduce un nivel nuevo.
- Cualquier ayuda contextual nueva en la app debe reutilizar `ui/helpIcon.js` en vez de crear un tooltip/modal ad-hoc.

## 12.1 Modal de error

Patrón estándar para comunicar cualquier error de la app: `showErrorModal(title, message, detail)` (implementado en `ui/errorModal.js`).

- Reutiliza el mismo patrón `.modal-overlay`/`.modal` ya documentado (no un patrón nuevo), con botón "Cerrar" (`.btn-cancel`) y `z-index: 1000` (sección 10).
- Diferencia respecto al modal informativo genérico (sección 12): la cabecera (`.modal__header--error`) incluye un icono circular de alerta (`.modal__error-icon`, "!" sobre `var(--error)`) junto al título, para distinguirse a simple vista de un modal informativo o de confirmación normal.
- Si hay un mensaje técnico adicional (p.ej. el error de un `JSON.parse`), se muestra en un bloque monoespaciado (`.modal__error-detail`) debajo del mensaje principal.
- Es el único punto de la app para comunicar errores: cualquier error nuevo debe usar `ui/errorModal.js` en vez de `ui/toast.js` u otro aviso ad-hoc — el toast queda reservado a confirmaciones/avisos de éxito, no de error.

## 12.2 Cursores

Convención general (cambio 00031): cualquier elemento clicable de la app debe mostrar el cursor de dedo (`cursor: pointer`) al pasar el ratón por encima, salvo que ya tenga asignado uno de los cursores más específicos siguientes, que comunican un tipo de interacción concreto y tienen prioridad sobre el genérico:

- `grab` / `grabbing` — arrastrar la mesa infinita (`.infinite-table`) o un panel flotante por su cabecera (`.component-panel__header`, `.resource-panel__header`).
- `move` — mover un componente sobre la mesa (`.text-box--movable`, `.board--movable`, `.dice--movable`).
- `nwse-resize` — manejador de redimensionado (`.resize-handle`, sección 11).
- `not-allowed` — botón deshabilitado (`.btn-accept:disabled`).
- `help` — icono de ayuda contextual (`.help-icon`, sección 12).

Regla genérica de refuerzo: `input[type="checkbox"]`, `input[type="radio"]` y `.modal__field select` llevan `cursor: pointer` explícito en `main.css`, sin depender del estilo por defecto del navegador.

**Modo juego**: los componentes sobre la mesa usan siempre uno de estos 3 cursores fijos, nunca el puntero por defecto — `move` si el componente se puede arrastrar (checkbox "Bloqueado" desmarcado), `pointer` si solo responde a un click sin poder arrastrarse (p. ej. un dado "Bloqueado", que siempre se puede lanzar con click aunque no se pueda mover — cambio 00020), y `grab`/`grabbing` al arrastrar la propia mesa. Cuando un mismo componente admite ambas interacciones a la vez (un dado no bloqueado se puede arrastrar y también lanzar con click; o una carta no bloqueada, que se puede arrastrar y también voltear con click — cambio 00053), prevalece `move`: mismo criterio en ambos casos, frente al caso común de un componente bloqueado que solo responde al click.

## 12.3 Etiqueta identificativa de componente (modo edición)

Patrón para mostrar "qué es" un componente de la mesa sin abrirlo (cambio 00032), distinto del icono de ayuda de la sección 12 (esa reutilización obligatoria no aplica aquí: no es ayuda contextual, es identificación del elemento bajo el cursor).

- **Modo juego**: se usa el `title` nativo del navegador (sin marcado ni estilos propios) con el texto `"<Tipo>: <id>"` (p. ej. "Dado: 3fa8...").
- **Modo edición**: en vez de tooltip nativo, una pequeña etiqueta propia (`.component-id-label`) superpuesta a la esquina superior izquierda del componente (dentro de su área, no sobresaliendo por encima — así nunca depende de que haya espacio libre por encima y no queda oculta tras la cabecera u otro elemento fijo cuando el componente está cerca del borde de la mesa, ver cambio 00035), con el mismo texto y formato. Fondo `var(--accent-blue-dark)`, texto `var(--text-light)`, `font-size: 0.72rem`, `border-radius: var(--radius-sm)` con una sombra pequeña (`box-shadow: 0 2px 4px rgba(0,0,0,.25)`, cambio 00063) para leerse como una etiqueta "pegada" a la pieza; `pointer-events: none` para no interceptar el arrastre/selección del elemento que tiene debajo. Visible solo en los mismos dos momentos en que ya se muestra el contorno azul discontinuo de selección (`:hover` y `.<tipo>--selected`), nunca de forma permanente. No se recorta ni se envuelve en varias líneas si el id es más largo que el propio componente — puede sobresalir de su ancho, al ser una ayuda de edición y no arte final del juego.

## 12.4 Modales anchas (excepción a `max-width: 500px`)

`.modal` usa por defecto `max-width: 500px` (sección 2/8). Cuando el contenido necesita más espacio (varias columnas, listas largas), la modal añade una segunda clase de bloque propia con su propio `max-width`, en vez de sobrescribir el valor por defecto de forma ad-hoc: `.card-editor-modal` (`max-width: 920px`, editor de las dos caras de una carta), `.element-selection-modal` (`max-width: 640px`, cambio 00065 — modales de exportar/importar con selección) e `.import-report-modal` (`max-width: 640px`, cambio 00065 — informe de importación con tabla). Cualquier modal nueva que necesite más ancho debe seguir el mismo patrón: clase de bloque propia añadida a `modal.className` (p. ej. `'modal mi-modal'`), con su `max-width` en `main.css` — nunca un `style="max-width:…"` inline.

## 12.5 Lista de selección agrupada (checklist)

Patrón para elegir un subconjunto de una colección organizada por categorías (`ui/elementSelectionModal.js`, cambio 00065, usado por las modales de exportar/importar con selección): un bloque por categoría (`.element-selection-group`), con una cabecera que combina el checkbox "seleccionar todo el bloque" y el título de la categoría (`.element-selection-group__select-all`, fondo `var(--bg-subtle)`, mismo tono que la cabecera de tabla de `.component-list`), y debajo la lista de checks individuales (`.element-selection-group__list`, scroll vertical propio si excede `12rem` de alto; cada ítem `.element-selection-group__item` con hover `var(--bg-hover)`, mismo criterio que una fila de `.component-list`). Un bloque sin elementos no se pinta (no se muestra una categoría vacía). Cualquier selección múltiple futura organizada en categorías debe reutilizar este patrón en vez de crear un checklist ad-hoc — mismo criterio que ya se sigue con `.resize-handle` (sección 11) o `.help-icon` (sección 12).

## 12.6 Secciones dentro de pestañas de propiedades

Patrón para agrupar visualmente varios campos relacionados dentro de una misma pestaña de `ui/componentModal.js` (o de un sub-modal de edición) cuando ese grupo de campos crece lo bastante como para necesitar separación del resto — sin llegar a justificar una pestaña ni un sub-modal propios. Bloque `.modal__section` (elemento BEM de `.modal`): separador superior algo más marcado que el resto de bordes finos de la app (`border-top: 2px solid var(--border-neutral)`, excepción puntual al `1px` de la sección 5 — remarca el cambio de grupo sin introducir un color nuevo), más `padding-top`/`margin-top` de `1rem` (mismo criterio de espaciado que el resto de la modal, sección 4). Es agrupación visual estática, siempre visible dentro de la pestaña ya activa — no introduce un nivel nuevo de tabs, acordeón ni colapso.

El título de la sección puede ser de dos tipos, según si el grupo de campos representa una configuración que se puede activar/desactivar entera o no:

- **Meramente informativo** (`.modal__section-title`): un texto (`font-size: 0.875rem`, `font-weight: 500`, color `var(--text-muted)`, mayúsculas) encima de los `.modal__field` que agrupa, sin ningún control — solo separa visualmente ese grupo del resto. Los campos de debajo están siempre activos.
- **Des/activador** (`.modal__section-title--toggle`): mismo aspecto de texto que el tipo anterior, pero precedido de un checkbox con el que forma una sola fila (`display:flex; align-items:center; gap:0.5rem`), igual que un `.modal__field--checkbox` (sección 8) pero haciendo de título de sección en vez de campo suelto. Ese checkbox controla si la configuración de toda la sección está activa: desmarcado, el resto de campos de la sección (`.modal__section--disabled`) se muestran deshabilitados (`opacity: 0.5`, sin poder interactuar — mismo criterio que un botón deshabilitado, sección 9) sin perder los valores ya introducidos; marcado, se habilitan de nuevo tal cual estaban.

Primer uso (cambio 00072): los bloques "Borde" y "Fondo" del cuadro de texto de una carta (`ui/cardTextBoxModal.js`). "Borde" es del tipo des/activador (`.modal__section-title--toggle`, checkbox "Activar borde" + título): desmarcado, deshabilita los campos de color/grosor/tipo de línea sin borrarlos. "Fondo" es del tipo meramente informativo (`.modal__section-title`): agrupa el color de fondo y su checkbox de campo "Transparente" (que es un control de ese campo, no de la sección — sigue el patrón ya existente de la sección 8, no el de des/activador de sección). Cualquier grupo de campos futuro con esta misma necesidad (en una pestaña de `componentModal.js` o en cualquier otro modal/sub-modal) debe reutilizar `.modal__section` con el tipo de título que corresponda, en vez de crear un separador o un checkbox de activación ad-hoc.

## 13. Qué NO hacer

- No introducir un segundo sistema de tokens de color (Tailwind, otra paleta) — extender `:root` en `main.css`.
- No mezclar `style="color:#..."` inline para colores del catálogo de la sección 2.
- No crear clases de un solo uso sin seguir BEM salvo que encajen en la excepción `.btn-*` ya existente.
- No añadir degradados llamativos (más allá del degradado sutil ya documentado del header, sección 6) ni animaciones/transiciones complejas (`@keyframes`, animaciones narrativas) — la mejora de acabado del cambio 00063 es de profundidad y transición de hover/foco, no un giro hacia un estilo decorativo. Sombras y radios **sí** están permitidos ahora: siguen siempre el sistema de elevación (sección 6) y la escala de radios (sección 5), nunca un valor ad-hoc por componente.

**Bisel/profundidad de "Tablero" y "Dado" (cambios 00019 y 00020), complementario a su sombra de contacto (cambio 00063):** el tipo de componente `'tablero'` (`ui/componentRenderer.js`) simula relieve en su borde repartiendo el color de borde elegido en dos tonos (más claro arriba/izquierda, más oscuro abajo/derecha, calculados con un helper local `shadeColor`), sin usar sombra ni degradado — la sombra de contacto que sí lleva (`.board`, nivel 1 de elevación) es un `box-shadow` CSS aparte, no calculada por este helper. El tipo `'dado'` (`ui/componentRenderer.js`, `renderDiceSilhouette`) reutiliza la misma familia de recurso para su silueta: una copia de la silueta frontal en un tono oscuro derivado del color del cuerpo, ligeramente desplazada detrás (efecto de profundidad), más un contorno fino y las líneas internas de faceteado (4/8/9+ resultados posibles) en otro tono oscuro derivado — todo calculado con el mismo `shadeColor`. Su sombra de contacto (`.dice`) usa `filter: drop-shadow` en vez de `box-shadow` porque la silueta no es rectangular (ver sección 6). Esta técnica de bisel calculado en JS sigue acotada **únicamente** a estos dos tipos de componente — no se aplica a ningún otro tipo existente ni futuro salvo que se decida ampliarlo explícitamente.

**Esquinas redondeadas de "Carta" (cambio 00053):** el tipo de componente `'carta'` (`ui/componentRenderer.js`, y `.carta` en `main.css`) usa `var(--radius-lg)`, el radio que la sección 5 reserva para "contenedores destacados" (el que también usa `.modal`, los paneles flotantes, y ahora la propia `.carta`) — no es un valor especial. Desde el cambio 00063 también lleva sombra de contacto nivel 1, igual que el resto de piezas de juego (sección 6).

**Parpadeo y temblor de la tirada del dado no son una animación CSS:** el efecto de "tirada" del componente `'dado'` (~1s de resultados aleatorios cambiando rápido antes de fijar el resultado final, ver `ui/componentRenderer.js`) se implementa como un cambio repetido de `textContent` mediante un temporizador en JS (`setInterval`/`setTimeout`), sin `transition` ni `@keyframes`. El temblor añadido en el cambio 00031 (pequeño desplazamiento aleatorio del dado durante ese mismo segundo) usa el mismo temporizador para recalcular un `transform: translate()` en cada tick — un valor puramente numérico calculado en JS, misma excepción ya documentada en la sección 8 para transforms dinámicos (como el pan/zoom de la mesa), no una animación/transición CSS. Ninguno de los dos entra dentro de la prohibición de animaciones complejas de esta sección ni requiere una excepción propia.

**Efecto "levantar" al arrastrar en Modo Juego (cambio 00062), integrado en el sistema de elevación (cambio 00063):** el estado transitorio `.lifted` (`src/styles/main.css`), añadido/quitado por `ui/componentRenderer.js` (`beginDragLift`/`endDragLift`) solo cuando `renderComponentsOnTable` recibe `liftOnDrag: true` (exclusivo de `modes/play/playMode.js`, nunca de `modes/edit/editMode.js`), aplica un desplazamiento fijo (`transform: translate(-2px, -4px)`) y una sombra (`box-shadow: 6px 7px 9px 2px rgba(0,0,0,0.35)`) al componente mientras se arrastra, simulando que se levanta de la mesa y vuelve a apoyarse al soltarlo. Desde el cambio 00067 este cambio de aspecto transiciona con `var(--transition-fast)` (el mismo token de la sección 6 usado en hover/foco de botones, filas, tabs, etc.), aplicado simétricamente tanto al levantar como al soltar — ya no es instantáneo. Esto no reabre la prohibición general de animaciones complejas de esta sección (`@keyframes`, animaciones narrativas): sigue aplicando sin cambios al resto de casos (temblor/parpadeo del dado, contorno de selección `--selectable`/`--selected`). Ya no es una excepción aislada: es el estado "en el aire" del mismo sistema de elevación (sección 6) que usan en reposo el resto de piezas — acotado **únicamente** a este estado transitorio y a este gesto (arrastre en Modo Juego).
