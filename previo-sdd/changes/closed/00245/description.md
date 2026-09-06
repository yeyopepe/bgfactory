- **Name**: Pantalla de bienvenida (splash) al arrancar la aplicación
- **Code**: 00245
- **Type**: change
- **Creation date**: 2026-09-06

## Full description

Al cargar la aplicación (en cada carga o recarga, tanto durante el desarrollo como en la versión entregable), antes de mostrar la mesa de juego aparece una pantalla de bienvenida.

### Aspecto y contenido

- Una ventana centrada en la pantalla, sobre una capa que cubre por completo la aplicación y queda por encima de cualquier otro elemento de la interfaz (incluidos los cuadros de diálogo y menús).
- El fondo de la ventana es un **degradado en diagonal que abarca todo el fondo de la ventana**, de un azul claro a un lila/rosa muy suave (misma gama de color que los logos), claramente perceptible. **Debe verse como en los mockups aprobados** (`design_splash-screen*.html`).
- Dentro de la ventana se muestra **uno de cuatro logos**, elegido **al azar** en cada arranque, con la misma probabilidad para los cuatro y sin recordar cuál se mostró la vez anterior. El logo se presenta en un área de 800×600 px; se ve la imagen completa, sin recortarla ni deformarla. Los logos traen su propio fondo claro: sus bordes se **difuminan** para fundirse con el degradado de la ventana, de modo que no se percibe ningún recuadro ni corte alrededor de la imagen; el conjunto (fondo de la ventana + logo) queda integrado con una transición suave. **El resultado debe verse como en los mockups aprobados** (los 4: `design_splash-screen.html`, `design_splash-screen-logo2.html`, `design_splash-screen-logo3.html`, `design_splash-screen-logo4.html`, uno por logo).
- Debajo (o junto) al logo aparece el nombre de la aplicación: **"Board Game Factory"**, con **"(2026)" en superíndice** pegado al nombre. Es el nombre de marca del producto: texto fijo, igual en cualquier idioma de la aplicación.
- En el borde inferior de la ventana hay una **fina barra azul** que se **llena de izquierda a derecha**, de vacía a completa, de forma progresiva y a ritmo constante durante los 5 segundos que dura la pantalla. Sirve para que el usuario vea cuánto falta para que desaparezca; no representa ninguna carga real de datos.

### Comportamiento

- La pantalla **se cierra sola a los 5 segundos** y entonces queda visible la aplicación.
- **No hay ninguna forma de cerrarla antes**: no tiene botón de cierre, no se cierra al hacer clic sobre ella ni al pulsar ninguna tecla. Siempre dura sus 5 segundos.
- Aparece igual en modo juego y en modo edición.
- Es independiente del título de cabecera de la aplicación (que sigue mostrando el nombre editable de la partida y la versión) y del indicador de versión del pie: la pantalla de bienvenida no modifica ninguno de los dos.

### Accesibilidad

- Para usuarios que han pedido al sistema reducir las animaciones, la barra azul se muestra sin efecto de llenado progresivo, pero la pantalla sigue cerrándose sola a los 5 segundos igual que en el resto de casos.

### Preguntas de alcance resueltas con el usuario

- **¿Se puede cerrar la pantalla antes de tiempo (botón, clic, tecla)?** No. Cierre automático siempre, sin ninguna opción de cierre manual.
- **¿Cómo encaja cada logo en el área de 800×600, teniendo en cuenta que los originales son casi cuadrados?** Se muestra la imagen entera sin recorte ni deformación (con posible franja de fondo), no recortada para llenar el área.
- **¿"Board Game Factory (2026)" es texto traducible o fijo?** Fijo: es el nombre de la aplicación.
- **Optimización de los logos:** antes de incrustarlos se reducen y optimizan, guardándolos ya en formato WebP.

## Technical notes

- **Imágenes ya preparadas:** los 4 logos se han reducido a ~800 px de lado mayor y convertido a WebP (calidad ~80), guardados como `src/resources/img/bgfactory-logo-color_1.webp` … `_4.webp` (22–99 KB cada uno; total ~195 KB frente a ~2 MB de los JPG). Los JPG originales (`bgfactory-logo-color_1..4.jpg`) se dejan en disco por ahora. Los originales son casi cuadrados (884×876 y 1024×1048), no 4:3 — de ahí el criterio "imagen entera" (equivalente a `object-fit: contain`) para el área 800×600.
- **Aspecto de referencia:** los mockups aprobados `previo-sdd/changes/inProgress/00245/design_splash-screen*.html` (uno por logo) son la referencia visual del resultado. Valores concretos que usan y que hay que reproducir salvo criterio del style bible: degradado de la ventana `linear-gradient(135deg, #e3effb 0%, #eef1fb 45%, #f7ecf6 100%)`; máscara de difuminado del logo `radial-gradient(ellipse 70% 70% at 50% 48%, #000 40%, transparent 92%)` sobre el `<img>`; ventana con `border-radius` `--radius-lg` (8px) y `box-shadow` `--shadow-2`; barra inferior de 4px, carril `rgba(44,125,216,0.15)`, relleno `--accent-blue`.
- **Integración logo ↔ fondo:** los WebP traen su propio fondo claro (no transparente). Sobre el degradado de la ventana ese fondo dibujaría un recuadro visible. Se resuelve con una máscara CSS (`mask-image`/`-webkit-mask-image: radial-gradient(...)`) sobre el `<img>` que difumina sus bordes hacia transparente. `pv-how` fija la técnica definitiva (máscara CSS con prefijo de compatibilidad, o un tratamiento equivalente); el requisito es "sin recuadro perceptible, transición suave entre logo y fondo, como en los mockups".
- **Incrustación en el entregable:** `src/scripts/build.py` solo incrusta como data URI los assets referenciados desde CSS (`url(...)`) o desde `index.html` (`<img>`/`<link>`/`<source>`), **no** los referenciados solo desde JavaScript. Para que los 4 WebP acaben incrustados sin tocar `build.py`, referenciarlos como `background-image` en reglas de `src/styles/main.css` (una clase por logo) y que el JS elija al azar qué clase aplicar. `build.py` ya reconoce `.webp` en `MIME_TYPES`.
- **Punto de arranque:** nuevo módulo `src/ui/splashScreen.js` con `showSplashScreen()`, invocado desde `src/main.js` como primer paso del bootstrap (antes de `initI18n()` y de resolver el estado) para que sea visible de inmediato. El splash no depende de i18n (texto fijo).
- **Estructura DOM propia**, al estilo de `src/ui/progressModal.js` (no reutiliza `.modal`/`.modal-overlay`): capa propia + ventana propia, sin cabecera/contenido/pie ni vía de cierre manual — mismo criterio de "modal sin botones que se cierra solo" ya existente para `progressModal`.
- **`z-index`:** la capa del splash debe quedar por encima de `.modal-overlay` (1000) y de los menús contextuales / `.column-header-menu` (1050).
- **Barra de progreso:** color con el token existente `--accent-blue` (`#2c7dd8`); no hace falta token nuevo. El proyecto prohíbe animaciones complejas (`@keyframes`/narrativas) salvo excepción explícita ya documentada (el spinner de `progressModal`). El llenado de la barra puede resolverse con una transición CSS de `width` (no `@keyframes`); si `pv-how` opta por `@keyframes` sería una segunda excepción a documentar en el style bible. Contemplar `prefers-reduced-motion`.
- **Documentación a actualizar (para pv-do):** `previo-sdd/design/docs/architecture/001-overview.md` o `007-persistence-build.md` (paso de arranque en `main.js`), `previo-sdd/design/docs/architecture/006-ui-layer.md` (nuevo módulo `ui/splashScreen.js`), `previo-sdd/design/docs/style/003-modales-menus.md` (patrón de la ventana tipo `progressModal`), y `previo-sdd/design/docs/style/001-tokens-visual.md` si se añade una excepción de animación. Nueva ficha de feature en `previo-sdd/design/docs/features/`.
