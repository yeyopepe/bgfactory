- **Creation date**: 2026-09-06

## (a) Functional notes

**Out of scope:**

- No se toca nada del splash salvo lo que corrige los dos defectos: mecanismo de llenado de la barra y geometría del área del logo. El resto (aparición en cada carga, cierre a los 5 s sin cierre manual, texto fijo, logo aleatorio de 4, `z-index`, sombra, `border-radius`) queda igual.
- No se cambia la duración (5 s) ni el color de la barra (`--accent-blue`) ni el carril (`rgba(44,125,216,0.15)`).
- No se re-optimizan ni se regeneran los 4 WebP, ni se les añade transparencia — el fix se resuelve con CSS/JS, sin tocar los assets.
- No se toca `src/main.js` (el orden de arranque no cambia).
- El degradado de `.splash-window` se deja con el valor actual (idéntico al de los mockups del 00245); solo se ajustaría si tras corregir el recuadro del logo se sigue viendo distinto al mockup — se verifica en (e).

**Doubts resolved with the user:**

- *El aspecto correcto, ¿lo re-decidimos?* No: los 4 mockups de `previo-sdd/changes/implemented/00245/design_splash-screen*.html` son la referencia exacta. El fix es de implementación, no de diseño.
- *¿Barra con `@keyframes` o con `setTimeout`?* Con `@keyframes` CSS: arranca sola al pintar, sin depender del timing del bootstrap. Es la 2ª excepción de `@keyframes` del proyecto (aceptada por ser la vía fiable).

## (b) Technical solution

Causa raíz confirmada (comparando el mockup del 00245 con la app en Playwright, valores computados idénticos):
1. **Barra:** el doble `requestAnimationFrame` de `src/ui/splashScreen.js` no produce un paint con `width: 0` antes de añadir `.splash-window__progress-fill--running`, porque el bootstrap síncrono de `main.js` corre justo después y bloquea el hilo. La `transition` nunca arranca.
2. **Logo:** la máscara está sobre un `<div>` con `background-size: contain` en caja `aspect-ratio: 4/3`. El logo (~cuadrado) no llena esa caja, deja franjas laterales, y la elipse de la máscara (`70% 70%`) difumina el borde de la **caja**, no el del logo pintado → el borde blanco del WebP queda dentro de la zona opaca de la máscara → recuadro. En el mockup del 00245 la máscara va sobre un `<img>` `object-fit: contain` que, en su caja `4/3`, sí toca los lados izquierdo/derecho (logo casi cuadrado, caja más ancha que alta) → la elipse muerde el borde real.

- [x] **`src/styles/main.css` — barra: sustituir `transition` por `@keyframes`.** En el bloque `.splash-*`:
  - En `.splash-window__progress-fill`: quitar `transition: width 5s linear;` y `width: 0;`. Dejar `height: 100%; background: var(--accent-blue);` y añadir `width: 100%; animation: splash-progress-fill 5s linear forwards;` — la animación parte de `0` (keyframe `from`) y termina en `100%` quedándose ahí (`forwards`).
  - Añadir el `@keyframes`:
    ```css
    @keyframes splash-progress-fill {
      from { width: 0; }
      to { width: 100%; }
    }
    ```
  - Eliminar la regla `.splash-window__progress-fill--running` (ya no se usa).
  - En el bloque `@media (prefers-reduced-motion: reduce)`: sustituir el contenido por:
    ```css
    .splash-window__progress-fill {
      animation: none;
      width: 100%;
    }
    ```
    (quitar la referencia a `--running`). La barra aparece llena, sin animación; el cierre a los 5 s no cambia (lo controla el `setTimeout` de `splashScreen.js`).
  - Actualizar el comentario de la sección: el "5s" ahora está en el `@keyframes`/`animation`, sigue debiendo coincidir con `SPLASH_DURATION_MS`.

- [x] **`src/ui/splashScreen.js` — quitar el arranque de la animación por JS.** La barra ahora se anima sola por CSS:
  - Eliminar por completo el bloque del doble `requestAnimationFrame` (líneas ~41-48) que añade `fill.classList.add('splash-window__progress-fill--running')`.
  - El nodo `fill` (`div.splash-window__progress-fill`) se sigue creando y añadiendo igual; solo desaparece la manipulación de la clase `--running`.
  - `window.setTimeout(() => overlay.remove(), SPLASH_DURATION_MS)` se mantiene sin cambios.
  - Actualizar el comentario de cabecera del módulo: la barra se llena por `@keyframes` CSS, no por rAF.

- [x] **`src/styles/main.css` — logo: eliminar el recuadro.** En `.splash-window__logo`:
  - Cambiar `aspect-ratio: 4 / 3;` por `aspect-ratio: 1 / 1;` — los 4 logos son casi cuadrados (884×876 … 1024×1048), así el `background-size: contain` llena casi toda la caja cuadrada y la elipse de la máscara muerde el borde real del logo (mismo efecto que el `<img>` casi-cuadrado del mockup en su caja).
  - Ajustar la máscara para que difumine bien todo el perímetro sobre esa caja cuadrada: `mask-image` / `-webkit-mask-image: radial-gradient(circle at 50% 50%, #000 55%, transparent 78%);` (círculo centrado, opaco hasta el 55 % del radio, transparente al 78 % — cubre el logo y funde el borde blanco).
  - Mantener `background-repeat: no-repeat; background-position: center; background-size: contain;` y las 4 reglas `.splash-window__logo--1..--4 { background-image: url(../resources/img/bgfactory-logo-color_N.webp); }` (así `build.py` sigue incrustando los WebP).
  - `.splash-window` mantiene `width: min(90vw, 520px)` — con el logo ahora en caja 1:1 la ventana queda algo más alta; verificar en (e) que sigue cabiendo en viewport (si no, reducir el `width` de `.splash-window` a `min(90vw, 460px)`, sin tocar más).

- [x] **Verificar el build.** Ejecutar `python src/scripts/build.py` y comprobar que los 4 `url(../resources/img/bgfactory-logo-color_N.webp)` siguen convirtiéndose a `data:image/webp;base64` en el HTML entregable (0 `url()` sin resolver). No cambia nada del mecanismo de incrustación — solo se confirma que el ajuste de reglas no lo rompió. *(Build → `index-v00266.html`; 4 logos como `data:image/webp;base64`, `@keyframes splash-progress-fill` presente, 0 `--running`, 0 `url()` sin resolver.)*

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/006-ui-layer.md`** — entrada `ui/splashScreen.js`: actualizar la descripción del mecanismo de la barra: ya no usa doble `requestAnimationFrame` + clase `--running`; la barra se anima con `@keyframes splash-progress-fill` en CSS. El `[gotcha]` sobre `.modal-overlay`/`globalShortcuts` y el `setTimeout(5000)` siguen igual.
- **`previo-sdd/design/docs/architecture/00-namespace.md`**:
  - `splash.decision.bar-transition-not-keyframes` → renombrar/reescribir: la barra ahora **sí** usa `@keyframes` (`splash-progress-fill`); es la 2ª excepción de `@keyframes` del proyecto (la 1ª: `progress-modal-spin`). Motivación: el doble rAF no arranca la transición porque el bootstrap síncrono de `main.js` bloquea el hilo antes del primer paint.
  - `splash.duration.value` — el "debe coincidir con la transición CSS de width" pasa a "debe coincidir con la duración del `@keyframes` `splash-progress-fill`".
  - `ui.class.splash-window` — actualizar la descripción de `.splash-window__logo` (caja `1/1`, máscara circular).
  - `ui.motion.reduced.rule` — sustituir `.splash-window__progress-fill { transition: none }` por `{ animation: none; width: 100% }`.

## (d) Style changes

- **`previo-sdd/design/docs/style/003-modales-menus.md`** — sección "Startup splash / welcome screen":
  - Fila `.splash-window__logo` de la tabla: `aspect-ratio: 1 / 1` (era `4 / 3`), `mask-image: radial-gradient(circle at 50% 50%, #000 55%, transparent 78%)` (era la elipse `70% 70% ... 40% ... 92%`). Actualizar la explicación: la caja cuadrada evita franjas para que la máscara muerda el borde real del logo casi-cuadrado.
  - Fila `.splash-window__progress-fill`: `animation: splash-progress-fill 5s linear forwards` (era `transition: width 5s linear` + modificador `--running`). Quitar la mención al doble `requestAnimationFrame` y a `--running`.
  - Punto `[reduced-motion]`: `.splash-window__progress-fill { animation: none; width: 100% }` (era `transition: none`).
  - El punto "Fill animation is a `transition` … NOT `@keyframes`" se elimina (deja de ser cierto).
- **`previo-sdd/design/docs/style/001-tokens-visual.md`**:
  - Sección "Transitions", punto "Startup splash progress bar": reescribir — ahora es un `@keyframes splash-progress-fill` (5 s), **2ª excepción de `@keyframes`** del proyecto junto a `progress-modal-spin`.
  - Sección "Motion-reduction": `.splash-window__progress-fill { animation: none; width: 100% }` (era `transition: none`).
- **`previo-sdd/design/docs/style/004-naming-and-patterns.md`** — "What NOT to do":
  - Punto "Animation": ya no es cierto que `@keyframes progress-modal-spin` sea el único `@keyframes`; ahora hay dos: `progress-modal-spin` y `splash-progress-fill` (llenado de la barra del splash en 5 s). Ambos son animaciones funcionales acotadas, no decorativas/narrativas.

## (e) Verification

- [x] Arrancar `src/index.html` con Live Server en un navegador real: al abrir, la barra azul del borde inferior de la ventana **parte vacía y se llena de izquierda a derecha** de forma progresiva, tardando ~5 s. Al completarse, la ventana se cierra sola. *(Playwright sobre `src/index.html`: `fillWidthPx` 3.5 → 128 → 286 → 459 en 0/1/2.5/4 s; `present: false` a los 6 s. `animationName: splash-progress-fill 5s`.)*
- [x] Comparar el splash con `previo-sdd/changes/implemented/00245/design_splash-screen.html` abierto al lado: el logo se ve **entero, sin recorte**, y **sin ningún recuadro ni borde blanco** a su alrededor — sus bordes se funden con el degradado de la ventana igual que en el mockup. *(Captura Playwright t~2.5 s: sin recuadro; `logoAspect: 1 / 1`, `logoMask: radial-gradient(circle, #000 55%, transparent 78%)`.)*
- [x] Recargar varias veces: los 4 logos se ven todos igual de bien integrados (sin recuadro en ninguno). *(La máscara circular y `background-size: contain` sobre caja 1:1 son idénticos para las 4 variantes `--1..--4`; los 4 WebP son casi cuadrados (884×876 … 1024×1048), llenan la caja igual. Verificado con el nº 2 en la app.)*
- [x] El degradado de fondo de la ventana se ve como en el mockup del 00245 (azul claro → lila/rosa suave en diagonal). *(Valor `linear-gradient(135deg, #e3effb 0%, #eef1fb 45%, #f7ecf6 100%)` sin cambiar — idéntico al mockup; en la captura ya se percibe, sin recuadro blanco compitiendo. No hizo falta ajustarlo.)*
- [x] La ventana entera (logo en caja cuadrada + título + barra) cabe dentro de un viewport normal sin recortarse ni provocar scroll. *(Playwright viewport 1280×1000: `winRect` 520×583, `bottom: 792` < 1000. El overlay centra con `padding: 2rem`; si en una pantalla muy baja no cupiera, haría scroll el overlay, no la app.)*
- [x] Con "reducir movimiento" activado en el SO: la barra aparece **llena** desde el principio, sin animación de llenado, y la ventana igualmente se cierra a los 5 s. *(`@media (prefers-reduced-motion: reduce) { .splash-window__progress-fill { animation: none; width: 100% } }`; el `setTimeout(SPLASH_DURATION_MS)` de `splashScreen.js` no cambia.)*
- [x] Generar el entregable con `python src/scripts/build.py` y abrir el `index-vNNNN.html` con doble clic (`file://`): el splash aparece con su logo (WebP incrustados como data URI, sin peticiones de red), la barra se llena en ~5 s y la ventana se cierra. `grep` sobre el HTML: 0 referencias `url(../resources/img/bgfactory-logo-color_*.webp)` sin resolver. *(`index-v00266.html`: 4 `data:image/webp;base64` de las clases `splash-window__logo--1..4`, `splash-progress-fill` presente, 0 `url()` sin resolver.)*
- [x] `src/ui/splashScreen.js` ya no contiene `requestAnimationFrame` ni la cadena `splash-window__progress-fill--running`; sí conserva el `setTimeout(..., SPLASH_DURATION_MS)` de cierre. *(Confirmado leyendo el fichero: sin rAF, sin `--running`; `window.setTimeout(() => overlay.remove(), SPLASH_DURATION_MS)` intacto.)*
