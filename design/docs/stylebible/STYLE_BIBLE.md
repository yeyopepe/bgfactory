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
--bg-table:     #808080;  /* fondo de la mesa infinita */
--bg-toolbar:   #333333;  /* header y toolbars */
--bg-card:      #f5f5f5;  /* paneles/tarjetas (listas, panel de edición) */
--accent-blue:  #2c7dd8;  /* color de acción primario (botones, foco, tabs activas) */
--accent-blue-dark: #123a66;  /* fondo de la etiqueta identificativa de componente en modo edición (sección 12.3) */
--text-primary: #1a1a1a;  /* texto sobre fondos claros */
--text-light:   #ffffff;  /* texto sobre fondos oscuros/de acento */
--text-muted:   #666666;  /* texto secundario */
--error:        #d32f2f;  /* estados de error y acciones destructivas */
```

Colores puntuales que aún no son tokens (usarlos igual, pero si se repiten, promoverlos a `:root`):
- Bordes neutros: `#ddd`, `#eee`, `#f0f0f0`, `#e0e0e0`, `#f9f9f9`
- Overlays: `rgba(0,0,0,0.5)` (fondo de modal), `rgba(255,255,255,0.1)` (hover en toolbar oscura), `rgba(0,0,0,0.15)` (sombra de modal)

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

- Radio estándar de controles pequeños (botones, inputs, items): `4px`
- Radio de botones muy pequeños (dentro de items de lista): `3px`
- Radio de contenedores destacados (modal): `8px`
- Bordes: `1px solid` con un gris de la lista de la sección 2 (`#ddd`/`#eee`), o `1px solid var(--text-light)` sobre fondo oscuro (toolbar).

## 6. Sombra y elevación

- Solo el modal tiene sombra: `box-shadow: 0 4px 20px rgba(0,0,0,0.15)`. No añadir sombras a botones ni tarjetas — el resto de la UI es plana.

## 7. Nomenclatura de clases — BEM

El proyecto sigue **BEM** (`bloque__elemento--modificador`). Reglas concretas:

- Bloque en kebab-case: `.component-list`, `.modal`, `.infinite-table`, `.edit-mode-panel`, `.help-icon`, `.board`, `.board-image-modal` (galería de imágenes del fondo "Imagen" del tablero, cambio 00019), `.component-type-modal` (lista de tipos al elegir qué componente crear, cambio 00019).
- Elemento con doble guion bajo: `.component-list__item`, `.modal__header`, `.modal__tabs`, `.modal__field`, `.infinite-table__world`, `.help-icon__tooltip`.
- Modificador con doble guion: `.text-box--selectable`, `.text-box--movable`, `.modal__field--checkbox`.
- Estados transitorios (no BEM, clases simples añadidas/quitadas por JS): `.grabbing`, `.active` — se usan tal cual, sin prefijo del bloque, y siempre junto a `classList.add/remove`, nunca reemplazando `className` entero.
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

## 9. Botones

Todos los botones comparten esta base (adaptar el fondo/borde según contexto):

```css
padding: 0.5rem 1rem;   /* o 0.25rem 0.5rem si es un botón pequeño dentro de un item */
border: none;           /* o 1px solid var(--text-light) sobre fondo oscuro */
border-radius: 4px;     /* 3px si es un botón pequeño */
cursor: pointer;
font-size: 0.875rem;    /* o 0.75rem si es pequeño */
```

- Acción primaria: fondo `var(--accent-blue)`, texto `var(--text-light)`, hover `opacity: 0.9`.
- Acción secundaria/cancelar: fondo `#f0f0f0`, texto `var(--text-primary)`, hover `#e0e0e0`.
- Acción destructiva (eliminar/borrar): fondo `var(--error)`, texto `var(--text-light)`, hover `opacity: 0.9` — mismo tratamiento que la acción primaria, solo cambia el color de fondo. Aplica tanto al botón standalone `.btn-eliminar` (modales) como al modificador BEM `--danger` dentro de un bloque existente (p. ej. `.component-list__action-btn--danger`): cualquier acción que elimine un elemento debe usar este color en toda la app, nunca el azul de acción primaria.
- Botón sobre fondo oscuro (toolbar): transparente, borde `1px solid var(--text-light)`, hover `rgba(255,255,255,0.1)`.
- Deshabilitado: `opacity: 0.5; cursor: not-allowed`.
- No usar `:active` ni transiciones — el único feedback de interacción es el cambio de `opacity` u `background` en `:hover`.
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
- Aspecto: grip diagonal pequeño (`::after` con gradientes), gris neutro por defecto y `var(--accent-blue)` en `:hover`/`.resize-handle--active` — sin sombras ni bordes redondeados (coherente con la sección 6 y 11 de este documento).
- Cursor: `nwse-resize`, igual en todos los usos aunque el elemento solo redimensione un eje (mismo punto de arrastre visual reconocible en toda la app).
- No introducir un segundo patrón de redimensionado (bordes laterales, esquinas múltiples, etc.) sin decidirlo explícitamente — reutilizar `ui/resizeHandle.js`.

## 12. Icono de ayuda (tooltip / modal)

Patrón estándar para ayuda contextual en cualquier punto de la app: `.help-icon`, círculo de 16px con "?" (implementado en `ui/helpIcon.js`, `createHelpIcon({ text, html })`).

- Aspecto: círculo 16px, fondo `var(--text-muted)` (`var(--accent-blue)` en `:hover`), texto "?" en `var(--text-light)`, `font-size: 0.7rem`, `cursor: help` — sin sombra ni borde, coherente con el resto de la app (sección 6).
- **Tooltip** (`.help-icon__tooltip`): para texto plano de menos de 200 caracteres. Aparece encima del icono al pasar el ratón (`:hover`), fondo `var(--bg-toolbar)`, texto `var(--text-light)`, mismo `box-shadow` que el modal (sección 6).
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
- **Modo edición**: en vez de tooltip nativo, una pequeña etiqueta propia (`.component-id-label`) superpuesta a la esquina superior izquierda del componente (dentro de su área, no sobresaliendo por encima — así nunca depende de que haya espacio libre por encima y no queda oculta tras la cabecera u otro elemento fijo cuando el componente está cerca del borde de la mesa, ver cambio 00035), con el mismo texto y formato. Fondo `var(--accent-blue-dark)`, texto `var(--text-light)`, `font-size: 0.72rem`, sin sombra ni borde redondeado grande (coherente con sección 13); `pointer-events: none` para no interceptar el arrastre/selección del elemento que tiene debajo. Visible solo en los mismos dos momentos en que ya se muestra el contorno azul discontinuo de selección (`:hover` y `.<tipo>--selected`), nunca de forma permanente. No se recorta ni se envuelve en varias líneas si el id es más largo que el propio componente — puede sobresalir de su ancho, al ser una ayuda de edición y no arte final del juego.

## 13. Qué NO hacer

- No introducir un segundo sistema de tokens de color (Tailwind, otra paleta) — extender `:root` en `main.css`.
- No mezclar `style="color:#..."` inline para colores del catálogo de la sección 2.
- No crear clases de un solo uso sin seguir BEM salvo que encajen en la excepción `.btn-*` ya existente.
- No añadir sombras, bordes redondeados grandes, gradientes o animaciones — el lenguaje visual actual es plano y funcional (prototipo de mesa infinita para juego de tablero), y cualquier cambio de dirección estética debe decidirse explícitamente, no colarse componente a componente.

**Excepción explícita — bisel/profundidad de "Tablero" y "Dado" (cambios 00019 y 00020):** el tipo de componente `'tablero'` (`ui/componentRenderer.js`) simula relieve en su borde repartiendo el color de borde elegido en dos tonos (más claro arriba/izquierda, más oscuro abajo/derecha, calculados con un helper local `shadeColor`), sin usar sombra ni degradado. El tipo `'dado'` (`ui/componentRenderer.js`, `renderDiceSilhouette`) reutiliza la misma familia de recurso para su silueta: una copia de la silueta frontal en un tono oscuro derivado del color del cuerpo, ligeramente desplazada detrás (efecto de profundidad), más un contorno fino y las líneas internas de faceteado (4/8/9+ resultados posibles) en otro tono oscuro derivado — todo calculado con el mismo `shadeColor`, sin sombra ni degradado. Es una excepción acotada **únicamente** a estos dos tipos de componente — no se aplica a ningún otro tipo existente ni futuro salvo que se decida ampliarlo explícitamente, y no cambia la regla general de esta sección para el resto de la app.

**Nota — esquinas redondeadas de "Carta" (cambio 00053) no son una excepción nueva:** el tipo de componente `'carta'` (`ui/componentRenderer.js`) usa `border-radius: 8px`, el mismo radio ya catalogado en la sección 5 para "contenedores destacados" (el que ya usa `.modal`) — no introduce un valor nuevo ni es una excepción a "no bordes redondeados grandes": 8px ya es el radio moderado que esta guía reserva para ese caso. Es distinta de la excepción de bisel/profundidad de arriba: `'carta'` no simula relieve ni sombra, solo recorta sus esquinas.

**Nota — parpadeo y temblor de la tirada del dado no son una animación CSS:** el efecto de "tirada" del componente `'dado'` (~1s de resultados aleatorios cambiando rápido antes de fijar el resultado final, ver `ui/componentRenderer.js`) se implementa como un cambio repetido de `textContent` mediante un temporizador en JS (`setInterval`/`setTimeout`), sin `transition` ni `@keyframes`. El temblor añadido en el cambio 00031 (pequeño desplazamiento aleatorio del dado durante ese mismo segundo) usa el mismo temporizador para recalcular un `transform: translate()` en cada tick — un valor puramente numérico calculado en JS, misma excepción ya documentada en la sección 8 para transforms dinámicos (como el pan/zoom de la mesa), no una animación/transición CSS. Ninguno de los dos entra dentro de la prohibición general de animaciones de esta sección ni requiere una excepción propia — se deja anotado aquí para que quede claro si se revisa en el futuro.
