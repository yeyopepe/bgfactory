- **Creation date**: 2026-09-06

## (a) Functional notes

**Out of scope:**

- No se toca nada del splash salvo el enlace nuevo y la duración. El resto (logo aleatorio de 4, aparición en cada carga, sin cierre manual, texto fijo del título, degradado, máscara del logo, animación de la barra siempre) queda igual.
- No se centraliza la URL del repo: hoy es un literal repetido en `src/main.js` y `src/ui/settingsModal.js`; se añade un tercer literal en `src/ui/splashScreen.js`, coherente con ese patrón (no es objetivo de este cambio refactorizarlo).
- No se reutiliza la clave i18n `appVersion.repoLink` ("Ver en Github" / "View on GitHub"): el texto del splash es un literal fijo distinto, **"View on Github"** (tal cual lo pidió el usuario, con "h" minúscula), sin `t()`.
- No se añade estado de `:hover`/`:visited`/`:active` al enlace (el patrón `ui.link` no los estiliza).
- `src/main.js` no se toca (el orden de arranque no cambia; solo baja la constante dentro de `splashScreen.js`).

**Doubts resolved with the user:**

- *Ubicación del enlace:* debajo del título, encima de la barra de progreso, en su propia línea centrada.
- *¿"View on Github" traducible?* No — literal fijo, sin i18n.
- *Destino y apertura:* `https://github.com/yeyopepe/bgfactory` en pestaña nueva (`target="_blank"` + `rel="noopener"`), mismo destino que el pie de versión y el panel de Configuración.
- *Aspecto:* patrón `ui.link` (`color: inherit` + `text-decoration: underline`, sin azul de acento), fuente discreta, separado del título, centrado.
- *Clic durante los segundos del splash:* el enlace es clicable; abrir GitHub no cierra el splash, que desaparece igual al cumplirse su tiempo (no hay listener que lo cierre).
- *Nueva duración:* 3 s (ventana y llenado de barra).

## (b) Technical solution

- [x] **`src/ui/splashScreen.js` — bajar la duración a 3 s.** Cambiar la constante de módulo:
  ```js
  const SPLASH_DURATION_MS = 3000; // debe coincidir con el @keyframes splash-progress-fill de .splash-window__progress-fill (main.css)
  ```
  (el comentario ya existe; solo cambia el valor 5000 → 3000). El `window.setTimeout(() => overlay.remove(), SPLASH_DURATION_MS)` no se toca — recoge el nuevo valor solo.

- [x] **`src/ui/splashScreen.js` — insertar el enlace "View on Github".** En `showSplashScreen()`, entre la construcción de `.splash-window__title` (el `<p>` con su `<sup>`) y la de `.splash-window__progress`, añadir:
  ```js
  const link = document.createElement('a');
  link.className = 'splash-window__link';
  link.href = 'https://github.com/yeyopepe/bgfactory';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'View on Github';
  windowEl.appendChild(link);
  ```
  Insertar el `windowEl.appendChild(link)` **después** del `windowEl.appendChild(title)` y **antes** del `windowEl.appendChild(progress)` — el orden de `appendChild` fija el orden visual dentro del `flex-direction: column` de `.splash-window`. Mismo patrón `createElement` + asignación de props que `renderAppVersion` en `src/main.js` y `settingsModal.js` (ver `../style/005-text-links-and-external-links.md`). Texto literal, sin `t()`.

- [x] **`src/styles/main.css` — `@keyframes` de la barra a 3 s.** En el bloque `.splash-*`, en `.splash-window__progress-fill`:
  ```css
  animation: splash-progress-fill 3s linear forwards;
  ```
  (era `5s`). Actualizar también el comentario contiguo que dice "5s: debe coincidir con SPLASH_DURATION_MS" → "3s". El `@keyframes splash-progress-fill` (scaleX 0→1) no cambia.

- [x] **`src/styles/main.css` — regla `.splash-window__link`.** Añadir en el bloque `.splash-*`, tras `.splash-window__title sup { ... }` y antes de `.splash-window__progress`:
  ```css
  .splash-window__link {
    /* Enlace de texto de la app (ver ../style/005-text-links-and-external-links.md):
       color heredado del contexto + subrayado, sin --accent-blue. */
    margin-top: -0.5rem; /* compensa parte del gap: 1rem de .splash-window, para quedar pegado al título */
    font-size: 0.875rem;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  ```
  - `color: inherit` toma el `var(--text-primary)` heredado de `.splash-window__title` / `.splash-window` (texto oscuro sobre el degradado claro) — se distingue solo por el subrayado, criterio `ui.link` (`[gotcha]`: un enlace de texto NO es `--accent-blue`).
  - Centrado: `.splash-window` ya tiene `align-items: center`, el `<a>` (inline-level, pero como flex item se comporta como bloque) queda centrado sin `text-align`/`align-self` propios.
  - `margin-top: -0.5rem` reduce a ~0.5rem la separación con el título (el contenedor aplica `gap: 1rem` entre todos los hijos); ajustar el valor exacto en la verificación visual si queda demasiado pegado o suelto.
  - Sin `:hover`/`:visited`/`:active` (patrón `ui.link`). El cursor pointer del `<a href>` es el del navegador; se declara explícito por la convención de "Cursors" (`../style/003-modales-menus.md`).

- [x] **Verificar el build.** `python src/scripts/build.py` y comprobar que el HTML entregable incluye el `<a>` "View on Github" (se genera desde JS, va en el bundle) y que la barra usa `3s`. No cambia el mecanismo de incrustación de assets. *(`index-v00268.html`: "View on Github" en el bundle JS, `.splash-window__link` en el CSS (regla + uso), `animation: splash-progress-fill 3s`.)*

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/006-ui-layer.md`** — entrada `ui/splashScreen.js`: (1) `SPLASH_DURATION_MS = 3000` (era 5000) y el `@keyframes` a `3s`; (2) añadir al DOM descrito el `<a class="splash-window__link">` "View on Github" entre `.splash-window__title` y `.splash-window__progress` — `href` fijo al repo, `target="_blank"`, `rel="noopener"`, texto literal sin `t()` (a diferencia de `#app-version a`, que sí usa `t()`); es el único elemento interactivo del splash y su clic no cierra el overlay.
- **`previo-sdd/design/docs/architecture/00-namespace.md`**:
  - `splash.duration.value` — `5000ms` → `3000ms` (y la referencia al `@keyframes`).
  - Nuevo nodo `ui.class.splash-window__link` en la rama `ui.*`: enlace externo del splash, patrón `ui.link` + `ui.link.external` (target `_blank`/rel `noopener`), texto literal fijo "View on Github" (NO `t('appVersion.repoLink')`), `href` `https://github.com/yeyopepe/bgfactory` (3er sitio con ese literal, junto a `main.js#renderAppVersion` y `settingsModal.js`). `ui.class.splash-window` — añadir el `__link` a la lista de hijos.

## (d) Style changes

- **`previo-sdd/design/docs/style/005-text-links-and-external-links.md`** — añadir el splash como tercer sitio del enlace al repo (junto a `#app-version a` y `.settings-modal__repo a`), con el matiz nuevo: **texto literal fijo no traducible** ("View on Github"), a diferencia de los otros dos que usan `t('appVersion.repoLink')`. El `href`, `target="_blank"` + `rel="noopener"` y el tratamiento visual (`color: inherit` + `text-decoration: underline`) son idénticos.
- **`previo-sdd/design/docs/style/003-modales-menus.md`** — sección "Startup splash / welcome screen":
  - Añadir fila `.splash-window__link` a la tabla de bloques: `margin-top: -0.5rem; font-size: 0.875rem; color: inherit; text-decoration: underline; cursor: pointer`. Enlace externo "View on Github" (literal fijo), entre `.splash-window__title` y `.splash-window__progress`. Patrón `ui.link` (`005-text-links-and-external-links.md`). Único elemento interactivo del splash; su clic no cierra el overlay.
  - Actualizar la fila `.splash-window__progress-fill` y el texto del temporizador: `5s`/`5000` → `3s`/`3000` (dos sitios: `animation: ... 3s ...` y el `setTimeout` de cierre).

## (e) Verification

- [x] Arrancar `src/index.html` con Live Server: al abrir el splash, debajo del título "Board Game Factory (2026)" y encima de la barra azul aparece un enlace subrayado "View on Github", en el color oscuro del texto (no azul), centrado, con letra más pequeña que el título. *(Captura Playwright: `linkColor: rgb(26, 26, 26)`, `text-decoration: underline`, `font-size: 14px`; orden de hijos `logo → title → link → progress`.)*
- [x] Pulsar "View on Github" mientras el splash está visible: se abre `https://github.com/yeyopepe/bgfactory` en una **pestaña nueva**; el splash **sigue visible** y desaparece por su cuenta al cumplirse el tiempo (no se cierra por el clic). *(Test con timing controlado: clic a t+200ms → popup a `https://github.com/yeyopepe/bgfactory`, splash aún visible a t+596ms y t+897ms; cerrado a t+3.3s por el temporizador.)*
- [x] El splash se cierra solo a los **~3 segundos** (antes 5), y la barra azul se llena de vacía a completa en esos ~3 segundos. *(`animation: splash-progress-fill 3s`; `SPLASH_DURATION_MS = 3000`; splash cerrado a t+3.3s en el test.)*
- [x] El enlace no tiene efecto de `:hover` distinto (no cambia de color ni de estilo al pasar el ratón, solo el cursor de mano del navegador). *(CSS: `.splash-window__link` solo declara `color: inherit; text-decoration: underline; cursor: pointer` + `margin-top`/`font-size`; sin `:hover`/`:visited`/`:active`.)*
- [x] El resto del splash es idéntico a antes: logo entero sin recuadro, degradado de fondo, uno de los 4 logos al azar en cada recarga, sin forma de cerrar antes de tiempo. *(Captura: logo nº4 entero sin recuadro, degradado visible; `splashScreen.js` sin listeners de cierre.)*
- [x] Con "reducir movimiento" activado en el SO: la barra se sigue animando (llenándose en ~3 s), igual que sin esa opción. *(No hay `@media (prefers-reduced-motion: reduce)` para el splash — se quitó en 00246; `animation: splash-progress-fill 3s` aplica siempre.)*
- [x] Generar el entregable con `python src/scripts/build.py` y abrirlo con doble clic (`file://`): el splash muestra el enlace "View on Github", se cierra a los ~3 s, y el enlace abre GitHub en pestaña nueva. Sin peticiones de red para cargar el splash. *(`index-v00268.html`: "View on Github" en el bundle, `.splash-window__link` en el CSS, `splash-progress-fill 3s`; logos ya data URI de cambios anteriores.)*
- [x] En `src/ui/splashScreen.js`, `SPLASH_DURATION_MS` es `3000` y hay un `<a class="splash-window__link">` con `href`/`target="_blank"`/`rel="noopener"` y `textContent` `"View on Github"`. En `src/styles/main.css`, `.splash-window__progress-fill` usa `animation: splash-progress-fill 3s linear forwards` y existe la regla `.splash-window__link`. *(Confirmado leyendo ambos ficheros.)*
