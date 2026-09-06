- **Creation date**: 2026-09-06

## (a) Functional notes

**Out of scope:**

- Solo cambia el fondo de `.splash-overlay`. Nada más del splash se toca: la ventana blanca (`.splash-window`), el logo, el título, el enlace, la barra, la duración de 3 s, el `z-index: 1300`, el `setTimeout` de cierre — todo igual.
- No se extrae el patrón de puntos de la mesa a una clase/utilidad CSS compartida. El proyecto no tiene convención de utilidades de fondo, y ese refactor excede "que el splash se vea sobre el fondo de la mesa". Se replican los 3 valores del patrón en `.splash-overlay`, con un comentario que señala `.infinite-table` como origen; si en el futuro se toca el patrón, hay que tocarlo en 2 sitios (nota para `pv-do`: dejarlo anotado en la doc).
- No se añade ninguna capa de atenuación ni desenfoque sobre el fondo de la mesa (confirmado con el usuario).
- No se toca `.infinite-table` ni la regla `body`.

**Doubts resolved with the user:**

- *¿Qué se ve por detrás del splash?* El fondo de la mesa (gris `--bg-table` + patrón de puntos), tapete vacío, sin componentes ni interfaz.
- *¿Se atenúa u oscurece?* No — se ve tal cual, sin capa translúcida ni blur.
- *¿Cambia el bloqueo/interacción?* No — el overlay sigue cubriendo toda la pantalla; solo cambia su color/textura.

## (b) Technical solution

Nota de causa (confirmada leyendo el CSS): la regla `body` de `src/styles/main.css` solo tiene `background: var(--bg-table)` (#c2c2c2, gris **liso**). El patrón de puntos vive en `.infinite-table` (`src/styles/main.css` ~líneas 315-326):
```css
background-color: var(--bg-table);
background-image: radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px);
background-size: 32px 32px;
background-position: -8px -8px;
```
`.infinite-table` está dentro de `#content`, que no está montado en el instante del splash. Por eso dejar `.splash-overlay` transparente daría gris liso sin puntos — hay que replicar el patrón.

- [x] **`src/styles/main.css` — `.splash-overlay`: fondo de la mesa con puntos.** En el bloque `.splash-*`, sustituir la línea `background: #ffffff;` (y su comentario "Opaque white ground…") de `.splash-overlay` por:
  ```css
  /* Fondo de la mesa de juego (tapete gris + patrón de puntos), en vez de un
     fondo opaco: la pantalla de bienvenida se ve "sobre la mesa". Mismos valores
     que .infinite-table (el <body> solo trae el gris liso, no el patrón); si el
     patrón de la mesa cambia, actualizar también aquí. Sin capa de atenuación. */
  background-color: var(--bg-table);
  background-image: radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px);
  background-size: 32px 32px;
  ```
  - **No** copiar `background-position: -8px -8px` de `.infinite-table`: ese offset alinea la retícula con el sistema de coordenadas de la mesa infinita, irrelevante para un overlay estático a pantalla completa. Dejar el `background-position` por defecto (`0 0`).
  - Sin tokens nuevos: `--bg-table` (#c2c2c2) y `--bg-table-dot` (rgba(0,0,0,0.09)) ya están en `:root`.
  - El resto de propiedades de `.splash-overlay` (`position: fixed; inset: 0; display: flex; align-items/justify-content: center; padding; z-index: 1300`) no cambian.

- [x] **Verificar el build.** `python src/scripts/build.py` y comprobar que el HTML entregable tiene `.splash-overlay` con `background-image: radial-gradient(...)` en vez de `background: #ffffff`. No cambia nada más. *(`index-v00269.html`: `.splash-overlay` con `background-color: var(--bg-table)` + `radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px)` + `background-size: 32px 32px`; 0 `#ffffff` en la regla.)*

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/00-namespace.md`** — nodo `ui.class.splash-overlay`: el fondo pasa de `#ffffff` opaco al fondo de la mesa (`var(--bg-table)` + `radial-gradient` de `var(--bg-table-dot)` a `32px 32px`), replicado de `.infinite-table`. Sin capa de atenuación (sigue sin ser el `rgba(0,0,0,0.5)` de `.modal-overlay`).

## (d) Style changes

- **`previo-sdd/design/docs/style/003-modales-menus.md`** — sección "Startup splash / welcome screen", fila `.splash-overlay` de la tabla: cambiar `background: #ffffff` / "Opaque white ground, NOT the `rgba(0,0,0,0.5)` scrim of `.modal-overlay`" por: fondo de la mesa de juego — `background-color: var(--bg-table); background-image: radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px); background-size: 32px 32px` (replicado de `.infinite-table`; el `<body>` solo trae el gris liso). Sigue sin ser el scrim oscuro de `.modal-overlay` — no hay atenuación; la pantalla de bienvenida se ve "sobre la mesa". `[gotcha]` el patrón está duplicado (`.infinite-table` + `.splash-overlay`), no extraído a una utilidad.
- **`previo-sdd/design/docs/style/001-tokens-visual.md`** — el token `--bg-table-dot` (`rgba(0, 0, 0, 0.09)`, punto del patrón de la mesa) no está en la tabla de tokens de `:root` (solo `--bg-table`). Añadirlo, y anotar que el patrón de puntos de la mesa (`radial-gradient` a `32px`) lo usan `.infinite-table` y `.splash-overlay` (00248).

## (e) Verification

- [x] Arrancar `src/index.html` con Live Server: al aparecer la pantalla de bienvenida, el fondo alrededor de la ventana blanca es el **tapete gris de la mesa con el patrón de puntos** (no blanco). No hay ninguna capa oscura ni desenfoque: el fondo de la mesa se ve tal cual. *(Captura Playwright: fondo `rgb(194, 194, 194)` con `radial-gradient(circle, rgba(0, 0, 0, 0.09) 1.5px, rgba(0, 0, 0, 0) 1.5px)`; sin scrim.)*
- [x] El patrón de puntos del fondo del splash se ve igual (mismo tamaño de punto y separación, `32px`) que el fondo de la mesa que queda visible una vez cerrada la pantalla de bienvenida. *(Valores computados idénticos entre `.splash-overlay` y `.infinite-table`: mismo `radial-gradient` y `background-size: 32px 32px`. Capturas antes/después del cierre: la textura no cambia.)*
- [x] La ventana blanca del splash (logo, título, enlace "View on Github", barra azul) se ve exactamente igual que antes, centrada, con su sombra y su degradado. *(Captura: sin cambios en `.splash-window` ni sus hijos.)*
- [x] El resto del comportamiento no cambia: la pantalla se cierra sola a los ~3 s, no se puede cerrar antes, el enlace "View on Github" abre GitHub en pestaña nueva sin cerrarla, logo aleatorio de 4. *(Playwright: `splashGone: true` a los ~3.6 s; `splashScreen.js` no se ha tocado.)*
- [x] Generar el entregable con `python src/scripts/build.py` y abrirlo con doble clic (`file://`): la pantalla de bienvenida aparece con el fondo de la mesa (gris + puntos) alrededor de la ventana. *(`index-v00269.html`: `.splash-overlay` con el `radial-gradient`, sin `#ffffff`.)*
- [x] En `src/styles/main.css`, `.splash-overlay` ya no tiene `background: #ffffff`; tiene `background-color: var(--bg-table)` + `background-image: radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px)` + `background-size: 32px 32px`. *(Confirmado leyendo el fichero.)*
