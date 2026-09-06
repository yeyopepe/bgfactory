- **Name**: Enlace "View on Github" en el splash y duración de 3 segundos
- **Code**: 00247
- **Type**: change
- **Creation date**: 2026-09-06

## Full description

Dos cambios sobre la pantalla de bienvenida (splash) que aparece al arrancar la aplicación (añadida en el cambio 00245, ajustada en el fix 00246).

### 1. Enlace "View on Github"

Justo debajo del título "Board Game Factory (2026)" y encima de la barra de progreso, aparece un enlace con el texto fijo **"View on Github"**.

- Al pulsarlo se abre, en una **pestaña nueva** del navegador, el repositorio del proyecto en GitHub — el **mismo destino** que ya se enlaza desde el pie de versión de la aplicación y desde el panel de Configuración.
- El texto "View on Github" es un **literal fijo**, igual en cualquier idioma de la aplicación (como el propio nombre del splash).
- Aspecto: el mismo criterio que el resto de enlaces de texto de la aplicación — color heredado del contexto (texto oscuro, sobre el degradado claro de la ventana) y subrayado, sin usar el color azul de acento. Va en su propia línea, centrado, con un tamaño de letra discreto y separado del título.
- Es el **único elemento interactivo** de la pantalla de bienvenida. Pulsarlo abre GitHub en otra pestaña y **no cierra** la pantalla de bienvenida, que sigue su curso y desaparece sola al cumplirse su tiempo.

### 2. Duración: de 5 a 3 segundos

La pantalla de bienvenida se cierra sola a los **3 segundos** (antes 5), y la barra de progreso azul se llena de vacía a completa en esos 3 segundos.

El resto del comportamiento no cambia: aparece en cada carga de la aplicación, no se puede cerrar antes de tiempo (más allá del propio temporizador), muestra uno de los cuatro logos elegido al azar, y la barra se anima siempre (con independencia de la opción del sistema operativo de reducir el movimiento).

### Preguntas de alcance resueltas con el usuario

- **¿Dónde va el enlace?** Debajo del título, encima de la barra de progreso, en su propia línea centrada.
- **¿"View on Github" es traducible?** No: literal fijo, sin internacionalización (coherente con el título del splash, que tampoco se traduce).
- **¿Destino y forma de abrirse?** El repositorio del proyecto en GitHub, en una pestaña nueva — el mismo destino y criterio que el pie de versión y el panel de Configuración.
- **¿Aspecto?** El patrón de enlace de texto de la aplicación: color heredado + subrayado, sin el azul de acento; fuente discreta, separado del título.
- **¿Qué pasa si se pulsa el enlace mientras la pantalla está visible?** Se abre GitHub en otra pestaña; la pantalla de bienvenida no se cierra por ello, desaparece igual al cumplirse su tiempo.
- **¿Nueva duración?** 3 segundos, tanto para el cierre de la ventana como para el llenado de la barra.
- **¿Animación de la barra con "reducir movimiento" activado?** Sin cambios respecto al fix 00246: se anima siempre, ahora en 3 segundos.

## Technical notes

- **`src/ui/splashScreen.js`**: la constante `SPLASH_DURATION_MS = 5000` pasa a `3000`. El DOM se crea con `document.createElement` (`.splash-overlay` > `.splash-window` con `.splash-window__logo`, `.splash-window__title` `<p>`+`<sup>`, `.splash-window__progress` > `.splash-window__progress-fill`). El nuevo enlace: hijo de `.splash-window`, insertado **tras `.splash-window__title` y antes de `.splash-window__progress`**; un `<a class="splash-window__link">` (o nombre análogo BEM) con `href` fijo al repo, `target="_blank"`, `rel="noopener"`, `textContent` `"View on Github"` (literal, sin `t()`).
- **`src/styles/main.css`, bloque `.splash-*`**: `.splash-window__progress-fill` usa `animation: splash-progress-fill 5s linear forwards` → pasa a `3s`. `SPLASH_DURATION_MS` (JS) y esa duración (CSS) deben seguir coincidiendo — hay un comentario en ambos sitios que lo recuerda. Añadir el estilo del nuevo enlace siguiendo el patrón `ui.link` del style bible: `color: inherit; text-decoration: underline`; sin `:hover`/`:visited`/`:active` especiales; `cursor: pointer` por convención de enlaces; margen de separación respecto al título; centrado; `font-size` discreto (p. ej. `0.875rem`).
- **Patrón de enlace al repo ya existente:** `src/main.js#renderAppVersion` (`#app-version a`: `href` al repo, `target="_blank"`, `rel="noopener"`, texto `t('appVersion.repoLink')` = "Ver en Github") y `src/ui/settingsModal.js` (`.settings-modal__repo`). **Ojo:** esos usan texto traducible; el del splash es **distinto**, literal fijo "View on Github", sin i18n — no reutilizar la clave i18n. La URL del repo sí es la misma constante de destino que usan los otros dos.
- **Style bible a actualizar (para `pv-do`):** `previo-sdd/design/docs/style/005-text-links-and-external-links.md` (patrón "Text links and external links": el splash añade un uso más del enlace externo, con texto fijo no traducible — matiz nuevo) y `003-modales-menus.md` (sección "Startup splash / welcome screen": añadir fila del nuevo `.splash-window__link`; la barra y el temporizador pasan de 5 s a 3 s).
- **Arquitectura a actualizar (para `pv-do`):** `previo-sdd/design/docs/architecture/006-ui-layer.md` (entrada `ui/splashScreen.js`: nuevo enlace en el DOM; `SPLASH_DURATION_MS` 3000; el `@keyframes` a 3 s); `00-namespace.md` (`splash.duration.value` 5000 ms → 3000 ms; nodo nuevo para el enlace, p. ej. `ui.class.splash-window__link`, en la rama `ui.*`).
- **Funcional a actualizar (para `pv-do`):** ficha `previo-sdd/design/docs/features/041-pantalla-de-bienvenida-al-arrancar-la-aplicacion.md` — duración 3 s y el enlace "View on Github".
- Sin entrada de usuario, red en runtime, persistencia ni backend. El enlace es un `<a>` estático a una URL fija de autoría del desarrollador.
- **Relación:** extensión de la pantalla del cambio 00245; relacionado con el cambio 00245 y con el fix 00246.
