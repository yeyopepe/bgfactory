- **Name**: La pantalla de bienvenida se ve sobre el fondo de la mesa
- **Code**: 00248
- **Type**: change
- **Creation date**: 2026-09-06

## Full description

Cambio sobre la pantalla de bienvenida (splash) que aparece al arrancar la aplicación (añadida en el cambio 00245, ajustada en 00246 y 00247).

Actualmente, mientras se muestra la pantalla de bienvenida, todo lo que rodea a la ventana blanca del splash es **blanco liso** y tapa por completo la aplicación.

Con este cambio, ese fondo pasa a mostrar el **fondo de la mesa de juego** — el mismo tapete gris con patrón de puntos que se ve en la mesa de la aplicación — en lugar del blanco. Se ve el tapete vacío, **sin componentes ni interfaz** (paneles, cabecera, barra de modos): solo el fondo de la mesa. La ventana blanca del splash (con el logotipo, el nombre "Board Game Factory (2026)", el enlace "View on Github" y la barra de progreso azul) se sigue viendo exactamente igual, centrada, encima de ese fondo.

No se atenúa ni se oscurece el fondo de la mesa: se ve tal cual, sin ninguna capa translúcida ni desenfoque. La ventana del splash destaca por su propia sombra y su degradado, no por oscurecer lo que hay detrás.

El resto del comportamiento de la pantalla de bienvenida no cambia: sigue cubriendo toda la pantalla a efectos de bloqueo (no se puede interactuar con la mesa mientras está visible), dura 3 segundos, se cierra sola, no se puede cerrar antes de tiempo, el único elemento interactivo es el enlace "View on Github", y al cerrarse aparece la aplicación completa.

### Preguntas de alcance resueltas con el usuario

- **¿Qué se ve por detrás del splash?** El fondo de la mesa (gris con patrón de puntos), tapete vacío, sin componentes ni interfaz.
- **¿Se atenúa u oscurece ese fondo?** No. Se ve tal cual, sin capa oscura ni desenfoque.
- **¿Cambia la interacción o el bloqueo?** No: el splash sigue cubriendo toda la pantalla y bloqueando la mesa; solo cambia el color/textura de esa capa (de blanco al fondo de la mesa).
- **¿Duración y cierre?** Sin cambios: 3 segundos, cierre automático, sin cierre manual.

## Technical notes

- **`src/styles/main.css`, bloque `.splash-*`:** hoy `.splash-overlay` tiene `background: #ffffff`. El objetivo es que muestre el fondo de la mesa **con el patrón de puntos**.
- **[gotcha] el `<body>` NO trae el patrón de puntos.** La regla `body` solo tiene `background: var(--bg-table)` (#c2c2c2, gris liso). El patrón de puntos vive en `.infinite-table` (`background-image: radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px); background-size: 32px 32px; background-position: -8px -8px`), que está dentro de `#content` y solo se monta con `renderAll()`. En el instante del splash `#content` está vacío. Por tanto, dejar `.splash-overlay` transparente o con `background: var(--bg-table)` daría gris **liso, sin puntos**.
- **Solución previsible:** `.splash-overlay` replica el fondo de `.infinite-table` — `background-color: var(--bg-table)` + `background-image: radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px)` + `background-size: 32px 32px` (+ `background-position` si se quiere alinear la retícula). `pv-how` decide si conviene extraer esos valores a un token/clase compartida o replicarlos, y si el `background-position: -8px -8px` de `.infinite-table` debe copiarse o es indiferente para el splash.
- El splash se monta como primera sentencia de `main.js`, antes de `initI18n()` y del primer `renderAll()`; en el instante en que aparece, por detrás del overlay solo está el `<body>` y aún no hay UI montada. No hace falta ocultar nada.
- Tokens implicados (en `:root` de `main.css`): `--bg-table: #c2c2c2`, `--bg-table-dot: rgba(0, 0, 0, 0.09)`. Ninguno nuevo.
- **Documentación a actualizar (para `pv-do`):** `previo-sdd/design/docs/style/003-modales-menus.md` (sección "Startup splash / welcome screen": la fila de `.splash-overlay` dice hoy `background: #ffffff` — "Opaque white ground, NOT the `rgba(0,0,0,0.5)` scrim of `.modal-overlay`"; pasa a describir el fondo de mesa con puntos), `previo-sdd/design/docs/architecture/00-namespace.md` (nodo `ui.class.splash-overlay`), y la ficha funcional `previo-sdd/design/docs/features/041-pantalla-de-bienvenida-al-arrancar-la-aplicacion.md` (el fondo alrededor de la ventana ya no es blanco, es el fondo de la mesa).
- **Relación:** ajuste sobre la pantalla del cambio 00245; relacionado con 00245, 00246 y 00247.
