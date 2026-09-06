- **Creation date**: 2026-09-06

## (a) Functional notes

**Out of scope:**

- No se añade ninguna vía de cierre manual del splash (confirmado con el usuario): ni botón, ni clic, ni ESC/ENTER. Siempre dura 5 s exactos.
- No se toca el `<h1 id="app-title">` ni el `#app-version`: el splash es un overlay independiente que se añade y se quita de `document.body`, sin modificar el resto del DOM de `index.html`.
- No se borran los JPG originales (`src/resources/img/bgfactory-logo-color_1..4.jpg`); quedan en disco. Solo se usan los `.webp` ya generados.
- No se añade preferencia persistente ni configuración del splash (no aparece en el panel de Configuración, no se puede desactivar).
- No se internacionaliza: "Board Game Factory (2026)" es literal fijo. No se añade clave a `data/i18n.*.js`.
- No se cubre el caso `file://` para desarrollo (la app de desarrollo ya requiere servidor estático por los ES modules); en el entregable los WebP van incrustados como data URI y no hay petición de red.

**Doubts resolved with the user:**

- *¿Cierre manual permitido?* No: cierre automático siempre a los 5 s, sin botón/clic/tecla.
- *¿Cómo encaja el logo casi cuadrado en 800×600?* Imagen entera sin recorte ni deformación (`object-fit: contain` conceptual), con difuminado de bordes para fundirse con el fondo.
- *¿"Board Game Factory (2026)" traducible?* Fijo, nombre de la app.
- *Logos:* reducidos y optimizados a WebP antes de incrustarlos (ya hecho).
- *¿Aspecto del degradado de fondo?* El de los mockups aprobados `design_splash-screen*.html`: `linear-gradient(135deg, #e3effb 0%, #eef1fb 45%, #f7ecf6 100%)`, perceptible, a toda la ventana.

## (b) Technical solution

Patrón de referencia: `src/ui/progressModal.js` (overlay creado con `document.createElement`, añadido a `document.body`, doble `requestAnimationFrame`, autodesmontaje con `overlay.remove()`), y las convenciones de `previo-sdd/design/docs/style/004-naming-and-patterns.md` (BEM, `className` una sola vez, vanilla JS, sin dependencias). Los 4 mockups `design_splash-screen*.html` son solo referencia visual; el markup/CSS se decide aquí desde cero.

- [x] **`src/resources/img/` — confirmar los 4 WebP.** Verificar que existen `bgfactory-logo-color_1.webp` … `_4.webp` (ya generados: ~800 px lado mayor, calidad 80, 22–99 KB). No regenerarlos. Los `.jpg` originales se quedan.

- [x] **`src/ui/splashScreen.js` — nuevo módulo.** Crear el fichero con un único export:

  ```js
  // Pantalla de bienvenida al arrancar: overlay a pantalla completa con un logo
  // aleatorio, el nombre de la app y una barra de progreso que se llena en 5 s.
  // Sin botones ni vía de cierre manual — se cierra sola a los SPLASH_DURATION_MS.
  // Estructura DOM propia (no reutiliza .modal/.modal-overlay), mismo criterio que
  // ui/progressModal.js.

  const SPLASH_DURATION_MS = 5000;
  const LOGO_COUNT = 4;

  export function showSplashScreen() {
    const overlay = document.createElement('div');
    overlay.className = 'splash-overlay';

    const windowEl = document.createElement('div');
    windowEl.className = 'splash-window';

    const logoArea = document.createElement('div');
    // Clase base + una de las 4 variantes de logo, elegida al azar en cada arranque.
    const logoIndex = Math.floor(Math.random() * LOGO_COUNT) + 1;
    logoArea.className = `splash-window__logo splash-window__logo--${logoIndex}`;
    windowEl.appendChild(logoArea);

    const title = document.createElement('p');
    title.className = 'splash-window__title';
    title.textContent = 'Board Game Factory';
    const sup = document.createElement('sup');
    sup.textContent = '(2026)';
    title.appendChild(sup);
    windowEl.appendChild(title);

    const progress = document.createElement('div');
    progress.className = 'splash-window__progress';
    const fill = document.createElement('div');
    fill.className = 'splash-window__progress-fill';
    progress.appendChild(fill);
    windowEl.appendChild(progress);

    overlay.appendChild(windowEl);
    document.body.appendChild(overlay);

    // Doble rAF (igual criterio que ui/progressModal.js): garantizar un repintado
    // real con la barra a 0 antes de arrancar la transición de width a 100%, para
    // que el navegador anime el cambio en lugar de saltar al estado final.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.classList.add('splash-window__progress-fill--running');
      });
    });

    window.setTimeout(() => {
      overlay.remove();
    }, SPLASH_DURATION_MS);
  }
  ```

  - `Math.random() * 4` → índice 1..4; sin recordar el anterior (sin estado de módulo).
  - El logo va como `background-image` vía la clase `--N` (ver tarea de CSS): así `build.py` lo incrusta como data URI (solo incrusta assets referenciados desde CSS/HTML, no desde JS).
  - Sin listeners de clic, teclado ni `overlay.addEventListener` de ningún tipo: no hay cierre manual.
  - El `setTimeout` no se cancela ni se guarda referencia: el splash siempre completa sus 5 s.
  - `SPLASH_DURATION_MS` (5000) debe coincidir con la duración de la transición CSS de la barra (ver CSS). Comentar esa dependencia en ambos sitios.

- [x] **`src/main.js` — invocar `showSplashScreen()` como primer paso del arranque.** Añadir el import junto al resto de imports de `./ui/*`:

  ```js
  import { showSplashScreen } from './ui/splashScreen.js';
  ```

  y llamarlo **antes de `initI18n()`** (que hoy es la primera sentencia ejecutable tras los imports, línea ~28):

  ```js
  // Splash lo primero: visible de inmediato, independiente de i18n y del estado.
  showSplashScreen();

  // i18n lo primero: resuelve el idioma activo, fija <html lang> y document.title
  // antes de construir nada de UI ni disparar los toasts de arranque.
  initI18n();
  ```

  - No cambia ningún otro orden del bootstrap (resolución de estado, `renderAll`, etc. siguen igual): el splash es un overlay encima, la app se monta normalmente por debajo mientras tanto.
  - `showSplashScreen()` no lanza (no depende de estado ni de i18n); si por defensa se quisiera, envolver en `try/catch` que solo haga `console.error` — opcional, no imprescindible.

- [x] **`src/styles/main.css` — estilos del splash.** Añadir un bloque nuevo al final del fichero (o junto a `.progress-modal`, criterio de agrupación de "modales sin cierre"). Sin tokens nuevos: reutiliza `--accent-blue`, `--radius-lg`, `--shadow-2`. Reglas:

  ```css
  /* Pantalla de bienvenida al arrancar (ui/splashScreen.js). Overlay propio, no
     reutiliza .modal/.modal-overlay. Se cierra sola a los 5 s (sin cierre manual). */
  .splash-overlay {
    position: fixed;
    inset: 0;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    /* Por encima de todo lo demás del proyecto: .toast/.export-menu (1100/1200),
       .context-menu (1050), .modal-overlay (1000). */
    z-index: 1300;
  }

  .splash-window {
    position: relative;
    width: min(90vw, 520px);
    /* Nominal del área del logo: 800x600 px (4:3). Aquí se limita para caber en
       viewport y se mantiene la proporción con aspect-ratio en __logo. */
    padding: 1.75rem 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(135deg, #e3effb 0%, #eef1fb 45%, #f7ecf6 100%);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-2);
    overflow: hidden; /* la barra inferior respeta el border-radius */
  }

  .splash-window__logo {
    width: 100%;
    aspect-ratio: 4 / 3;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain; /* imagen entera, sin recorte ni deformación */
    /* Difuminado de los bordes: el fondo claro propio de los WebP se funde con
       el degradado de la ventana, sin recuadro visible. */
    -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 48%, #000 40%, transparent 92%);
            mask-image: radial-gradient(ellipse 70% 70% at 50% 48%, #000 40%, transparent 92%);
  }

  .splash-window__logo--1 { background-image: url(../resources/img/bgfactory-logo-color_1.webp); }
  .splash-window__logo--2 { background-image: url(../resources/img/bgfactory-logo-color_2.webp); }
  .splash-window__logo--3 { background-image: url(../resources/img/bgfactory-logo-color_3.webp); }
  .splash-window__logo--4 { background-image: url(../resources/img/bgfactory-logo-color_4.webp); }

  .splash-window__title {
    margin: 0;
    font-size: 2.25rem;
    font-weight: 700;
    text-align: center;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .splash-window__title sup {
    font-size: 0.5em;
    font-weight: 600;
    color: var(--text-muted);
    margin-left: 0.15em;
    vertical-align: super;
  }

  .splash-window__progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 4px;
    background: rgba(44, 125, 216, 0.15); /* carril tenue del --accent-blue */
  }

  .splash-window__progress-fill {
    height: 100%;
    width: 0;
    background: var(--accent-blue);
    /* 5s: debe coincidir con SPLASH_DURATION_MS de ui/splashScreen.js. */
    transition: width 5s linear;
  }

  .splash-window__progress-fill--running {
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    /* Sin llenado progresivo: la barra aparece completa. El cierre a los 5 s no
       cambia (lo controla el setTimeout de ui/splashScreen.js). */
    .splash-window__progress-fill {
      transition: none;
    }
    .splash-window__progress-fill--running {
      width: 100%;
    }
  }
  ```

  - Elegida **transición CSS de `width`** (no `@keyframes`): no añade una segunda excepción a la prohibición de animaciones del style bible (`004-naming-and-patterns.md`), y la propia guía de `001-tokens-visual.md` admite `transition` en cambios de estado. `@keyframes progress-modal-spin` sigue siendo la única.
  - La ruta `url(../resources/img/…)` es relativa a `src/styles/main.css`; `build.py` (`embed_css_asset_urls`, `css_base_dir='styles'`) la resuelve a `src/resources/img/…` y la incrusta como data URI. Verificado.

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/007-persistence-build.md`** — sección "Startup (main.js)": añadir que `showSplashScreen()` (`ui/splashScreen.js`) es la primera sentencia del arranque, antes de `initI18n()`; es un overlay independiente que no altera el resto del flujo (resolución de estado, seed, toasts, `renderAll`).
- **`previo-sdd/design/docs/architecture/010-internationalization-i18n.md`** — bloque "Startup flow (`src/main.js`)": el paso 1 pasa a estar precedido de `showSplashScreen()`; aclarar que el splash NO usa `t()` (texto de marca fijo "Board Game Factory (2026)").
- **`previo-sdd/design/docs/architecture/006-ui-layer.md`** — añadir entrada para **`ui/splashScreen.js`**: `showSplashScreen()`, overlay propio (no reutiliza `.modal`), un logo aleatorio de 4 (`background-image` por clase CSS `--1..--4`), nombre fijo de la app, barra de progreso de 5 s con transición CSS de `width`, autodesmontaje con `setTimeout(5000)`, sin cierre manual. Mismo criterio "modal sin botones que se cierra solo" que `ui/progressModal.js`.

## (d) Style changes

- **`previo-sdd/design/docs/style/003-modales-menus.md`** — nueva sección análoga a "In-progress operation modal", p. ej. "Splash / pantalla de bienvenida": bloque `.splash-overlay`/`.splash-window` (no reutiliza `.modal`), fondo blanco del overlay, degradado `linear-gradient(135deg, #e3effb, #eef1fb, #f7ecf6)` de la ventana, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-2)`, `z-index: 1300` (nuevo máximo del proyecto, por encima de `.export-menu`/`.toast` a 1200/1100). Área de logo `aspect-ratio: 4/3` con `background-size: contain` + `mask-image: radial-gradient(...)` para difuminar los bordes. Barra `.splash-window__progress` de 4px pegada al borde inferior, carril `rgba(44,125,216,0.15)`, relleno `--accent-blue`. Sin vía de cierre manual, se cierra sola a los 5 s.
- **`previo-sdd/design/docs/style/001-tokens-visual.md`** — sección "Elevation, shadow and transition": registrar `z-index: 1300` del splash como nuevo nivel máximo (hoy el doc/CSS tienen 1200 como tope). Anotar en "The die roll's flicker…"/animaciones que el llenado de la barra del splash es una **`transition` de `width`** (no `@keyframes`, no una nueva excepción) y que respeta `prefers-reduced-motion: reduce` (primer uso de esa media query en el proyecto — mencionarlo).
- **`previo-sdd/design/docs/style/004-naming-and-patterns.md`** — "What NOT to do", punto de gradientes: hoy dice "no flashy gradients (beyond the existing subtle header gradient)". El degradado de la ventana del splash es una segunda excepción acordada con el usuario (validada en mockups); dejarlo anotado para que no se lea como incumplimiento.

## (e) Verification

- [x] Cargar `src/index.html` con Live Server: al abrir aparece de inmediato una ventana centrada sobre fondo blanco, con un logo, el texto "Board Game Factory" y "(2026)" en superíndice, y una barra azul fina abajo que se llena de izquierda a derecha. *(Verificado leyendo el resultado: `.splash-overlay` `position:fixed; inset:0; background:#fff` centra con flexbox; `showSplashScreen()` es la 1ª sentencia de `main.js`; la ventana monta `__logo` + `<p>`/`<sup>` + `__progress`/`__progress-fill`.)*
- [x] La barra tarda ~5 s en llenarse y, al completarse, la ventana desaparece sola y queda visible la mesa de juego. *(`transition: width 5s linear` + `setTimeout(() => overlay.remove(), 5000)`; la app se monta por debajo desde el arranque.)*
- [x] Durante esos 5 s: hacer clic sobre la ventana y pulsar ESC / ENTER — la ventana **no** se cierra antes de tiempo. *(`splashScreen.js` no registra ningún listener; el overlay no lleva la clase `.modal-overlay`, así que `ui/globalShortcuts.js` no lo considera para ESC/ENTER.)*
- [x] Recargar varias veces: el logo mostrado varía y se ven los 4 en distintas recargas. El logo se ve entero (sin recorte ni deformación) y sus bordes se funden con el degradado de la ventana, sin recuadro visible. *(`Math.floor(Math.random()*4)+1` sin estado de módulo; `background-size: contain`; `mask-image: radial-gradient(ellipse 70% 70% at 50% 48%, #000 40%, transparent 92%)`.)*
- [x] El splash aparece igual tras recargar estando en modo edición y estando en modo juego. *(Se monta antes de resolver el estado/modo; no lee `getState().mode`.)*
- [x] El `<h1>` de cabecera y el `#app-version` del pie siguen mostrando lo de siempre una vez cerrado el splash; no han cambiado. *(`splashScreen.js` solo hace `document.body.appendChild(overlay)` / `overlay.remove()`; no toca esos nodos ni ningún otro de `index.html`.)*
- [x] Con "reducir movimiento" activado en el SO: la barra aparece llena (sin animación de llenado) y la ventana igualmente se cierra a los 5 s. *(`@media (prefers-reduced-motion: reduce)` → `.splash-window__progress-fill { transition: none }` y `--running { width: 100% }`; el `setTimeout(5000)` no cambia.)*
- [x] Generar el entregable con `python src/scripts/build.py` y abrir el `index-vNNNN.html` resultante con doble clic (`file://`): el splash aparece con su logo (los 4 WebP incrustados como data URI, sin peticiones de red), se llena la barra y se cierra a los 5 s. *(Build ejecutado → `index-v00264.html`; `showSplashScreen` presente en el bundle; 4 `data:image/webp;base64` de las clases `splash-window__logo--1..4`.)*
- [x] En el HTML del entregable, no queda ninguna referencia `url(../resources/img/bgfactory-logo-color_*.webp)` sin resolver (todas convertidas a `data:image/webp;base64,`). *(`grep` sobre `index-v00264.html`: 0 `url()` sin resolver.)*
