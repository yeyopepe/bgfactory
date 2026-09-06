- **Name**: La barra del splash no se anima y el fondo no coincide con los mockups
- **Code**: 00246
- **Type**: fix
- **Creation date**: 2026-09-06

## Full description

La pantalla de bienvenida (splash) que aparece al arrancar la aplicación, añadida en el cambio 00245, presenta dos defectos visuales cuando se abre la aplicación en un navegador real.

### 1. La barra de progreso no se llena progresivamente

La fina barra azul del borde inferior de la ventana aparece **completa (al 100 %) desde el primer instante** y se queda así los 5 segundos, hasta que la ventana se cierra.

Comportamiento esperado (el descrito en el cambio 00245): la barra parte vacía y se **llena de izquierda a derecha, a ritmo constante, a lo largo de los 5 segundos** que dura la pantalla, sirviendo de indicador visual del tiempo que queda hasta que se cierre.

### 2. El aspecto de la ventana no coincide con los mockups aprobados

La referencia de aspecto correcto **son los cuatro mockups aprobados del cambio 00245** (`previo-sdd/changes/implemented/00245/design_splash-screen*.html`), uno por logo. La implementación debe verse exactamente como ellos.

- **Alrededor del logo se ve un recuadro blanco duro** (el fondo blanco propio de la imagen), en vez de fundirse de forma suave con el fondo de la ventana como en los mockups. Este es el defecto principal del aspecto.
- El degradado en diagonal del fondo de la ventana debe verse como en esos mockups (azul claro → lila/rosa muy suave); si tras corregir el recuadro sigue percibiéndose distinto al mockup, ajustarlo hasta igualarlo.

### Alcance

El resto del comportamiento del splash es correcto y no se toca: aparece en cada carga de la aplicación, se cierra sola a los 5 segundos, no se puede cerrar antes, muestra el nombre fijo "Board Game Factory (2026)" y uno de los cuatro logos elegido al azar.

### Cómo se ha comprobado

El usuario aportó una captura del splash tal como lo ve en su navegador (ventana con la barra llena, recuadro blanco alrededor del logo). Se arrancó además la aplicación con un navegador headless (Playwright) y se comparó, lado a lado, con el mockup `design_splash-screen.html` del cambio 00245:

- **Barra:** en headless la barra **sí** se anima. El fallo solo se reproduce en el navegador real, por cómo se bloquea el hilo durante el arranque.
- **Logo:** el recuadro blanco **sí** se reproduce en headless. Comparando el mockup con la app, el degradado de la ventana y la máscara del logo resultan con valores computados idénticos; la diferencia está en **sobre qué elemento** se aplica la máscara (ver notas técnicas): el mockup enmascara un `<img>` real y la app enmascara un `<div>` con `background-image` cuyo contenido, por `background-size: contain`, no llena la caja.

## Technical notes

- **Bug 1 (barra):** en `src/main.js`, `showSplashScreen()` es la primera sentencia y todo el bootstrap (`initI18n()`, `loadState()`/seed/defaults, `syncFontFaces()`, primer `renderAll()` que monta toda la UI) corre **síncrono** a continuación, en el mismo tick, bloqueando el hilo principal cientos de ms. El doble `requestAnimationFrame` de `src/ui/splashScreen.js` (copiado de `src/ui/progressModal.js`) no produce un *paint* intermedio con `width: 0` antes de añadir la clase `.splash-window__progress-fill--running`: cuando por fin corren los rAF (tras `renderAll()`), el primer render del elemento ya lleva `width: 100 %` y la `transition: width 5s linear` no llega a arrancar. `progressModal.js` no lo sufre porque su `work()` pesado va **dentro** del 2º rAF.
  - **Técnica recomendada:** pasar la animación de la barra a CSS puro con `@keyframes` (arranca sola en cuanto el navegador pinta el elemento, sin depender de que JS añada una clase en el momento justo ni del timing del bootstrap). Sería la **2ª excepción de `@keyframes`** del proyecto (la 1ª: `@keyframes progress-modal-spin` de `progressModal.js`). Alternativa sin `@keyframes`: `setTimeout(fn, ~32 ms)` (≥ 2 frames) para añadir `--running` — más frágil si el bootstrap tarda más de lo previsto. `pv-how` decide.
  - `prefers-reduced-motion: reduce` debe seguir dejando la barra **llena sin animación**, y el cierre automático a los 5 s (el `setTimeout` de `splashScreen.js`) intacto.
- **Bug 2b (recuadro del logo) — causa raíz confirmada:** el mockup del 00245 aplica `mask-image: radial-gradient(ellipse 70% 70% at 50% 48%, #000 40%, transparent 92%)` sobre un **`<img>`** (`.splash-logo-area img`), con `object-fit: contain`: la imagen casi-cuadrada llena prácticamente toda la caja 4:3 y la elipse muerde justo su borde real → difuminado correcto. La implementación (`src/styles/main.css`, `.splash-window__logo`) aplica la misma máscara sobre un **`<div>` con `background-image`** y `background-size: contain` — se pasó a `background-image` para que `build.py` incrustara los WebP (solo incrusta assets citados desde CSS/HTML). `background-size: contain` **encoge** el logo dentro del div, dejando franjas vacías; la máscara actúa sobre la **caja completa del div**, no sobre la imagen encogida, así que el logo pintado queda entero dentro de la zona opaca de la máscara y su borde blanco no se difumina → recuadro. Opciones a valorar por `pv-how` (ninguna prefijada): volver a `<img>` reales en el DOM (incrustables por `build.py` vía `<img>` o `<link rel=preload>` en `index.html`); usar `background-size: cover` (llena la caja pero recorta el logo — chocaría con "imagen entera" del 00245); que `.splash-window__logo` no imponga 4:3 y se ajuste al tamaño del logo; o preparar los 4 WebP con fondo transparente (elimina la necesidad de máscara). **Debe quedar exactamente como los mockups del 00245.**
- **Bug 2a (degradado):** `.splash-window { background: linear-gradient(135deg, #e3effb 0%, #eef1fb 45%, #f7ecf6 100%) }` es idéntico al de los 4 mockups del 00245 y su valor computado coincide en app y mockup. Si tras corregir el recuadro del logo el degradado se sigue viendo distinto al mockup, ajustarlo hasta igualar los mockups del 00245 (no reinterpretarlo). Puede que ahora se perciba peor solo por contraste con el recuadro blanco del logo.
- **Ficheros implicados:** `src/ui/splashScreen.js`, `src/styles/main.css`. Sin entrada de usuario, red, persistencia ni i18n. Chequeo de seguridad: ninguna categoría aplica.
- **Documentación a revisar si cambian valores o el mecanismo de animación (para `pv-do`):** `previo-sdd/design/docs/style/003-modales-menus.md` (sección "Startup splash / welcome screen": valores de `.splash-window` y `.splash-window__logo`), `001-tokens-visual.md` (sección "Transitions": la nota de que la barra usa `transition` y **no** `@keyframes`; sección "Motion-reduction"), `004-naming-and-patterns.md` ("What NOT to do": "`@keyframes progress-modal-spin` is the only `@keyframes`"), `previo-sdd/design/docs/architecture/00-namespace.md` (nodos `splash.decision.bar-transition-not-keyframes`, `ui.class.splash-window`, `ui.motion.reduced.rule`), `006-ui-layer.md` (entrada `ui/splashScreen.js`, mecanismo de la barra).
- **Relación:** es un fix del cambio 00245 (ya en `implemented`).

## Ajuste posterior (misma sesión)

Tras implementar el fix, en el navegador real la barra **seguía** apareciendo fija: el `@keyframes` que animaba `width` tampoco arrancaba de forma fiable con el hilo bloqueado por el arranque de `main.js`. Decisión del usuario: la animación de la barra **no debe depender de nada del sistema ni del navegador, debe verse siempre** (igual que el giro del indicador de "operación en curso"), y si el problema es de implementación, simplificarla.

Cambios aplicados (solo `src/styles/main.css`, bloque `.splash-*`):

- `@keyframes splash-progress-fill` pasa a animar `transform: scaleX(0 → 1)` (con `transform-origin: left`) en vez de `width: 0 → 100%`. `transform` se compone en el compositor sin recalcular layout y arranca de forma fiable en cuanto el elemento entra en el árbol de render — misma técnica que `@keyframes progress-modal-spin` (que sí funciona en el mismo escenario). `animation: splash-progress-fill 5s linear forwards` no cambia.
- Se **elimina** el bloque `@media (prefers-reduced-motion: reduce)` del splash: la barra se anima siempre, sin excepción. Es un indicador funcional del tiempo restante, no un adorno — mismo criterio que `progress-modal-spin`, que tampoco lo respeta.

`src/ui/splashScreen.js` no se toca en este ajuste (ya no arrancaba la animación por JS desde el fix inicial).
