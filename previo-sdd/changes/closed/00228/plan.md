- **Creation date**: 2026-09-02
- **Risk**: 1/10 — Minimal risk — local change, easily reversible

## (a) Functional notes

**Out of scope:** No se toca ningún otro botón ni ningún otro comportamiento. La acción del botón "Ajustar zoom" (`fitToBounds(getComponentsBounds(...))`) no cambia. El botón "Entrar en modo edición" (modo juego) se deja tal cual. "Importar" y "Exportar" conservan su estilo de contorno transparente y su orden relativo. No se refactoriza `editModeToggle.js` más allá de lo necesario para este reordenamiento.

**Doubts resolved with the user:**
- ¿A qué posición/color unificar el botón "Ajustar zoom"? → Al de modo juego: cuadrado 36×36 con fondo azul sólido, fijo en la esquina superior derecha (`top: 0.5rem; right: 1rem`), en los dos modos.
- ¿"Salir del modo edición" mantiene su estilo o cambia? → Cambia a esquema de acción primaria (fondo azul sólido, texto blanco), igual que "Entrar en modo edición". Solo ese botón de la barra; "Importar"/"Exportar" siguen con contorno transparente.
- ¿A qué se refería "segunda fila de botones del modo edición"? → A la barra de herramientas del modo edición (la captura 1 era en realidad el modo juego, la 2 el modo edición). "Salir del modo edición" va al extremo derecho de esa barra.

## (b) Technical solution

- [x] **`src/ui/editModeToggle.js` — sacar el botón "Ajustar zoom" de `.edit-toolbar` y montarlo fijo en modo edición.** En `renderEditToolbar`, eliminar el bloque que crea `viewGroup` (`const viewGroup = document.createElement('div'); viewGroup.className = 'toolbar-group toolbar-group--view'; viewGroup.appendChild(createFitButton()); toolbar.appendChild(viewGroup);`). En su lugar, tras `container.appendChild(toolbar);`, añadir el botón fijo al mismo `container` (`#edit-toolbar`): `container.appendChild(createFitButton('mode-switcher__fit-btn'));` — reutiliza la misma clase que en modo juego para heredar aspecto y color. El `#edit-toolbar` es hermano de `#mode-switcher` tras el `<h1>` y `renderEditToolbar` ya hace `container.innerHTML = ''` al entrar y sale pronto si `mode !== EDIT`, así que el botón se limpia/reañade en cada render sin fugas.
- [x] **`src/ui/editModeToggle.js` — mover el grupo "Salir del modo edición" al final de la barra.** En `renderEditToolbar`, reordenar la construcción de `toolbar`: primero `persistenceGroup` (Importar), luego el `toolbar-divider`, luego `exportGroup` (Exportar), luego un `toolbar-divider`, y por último `sessionGroup` (Salir del modo edición). Es decir, mover el bloque de `sessionGroup` (creación de `exitButton`, su `innerHTML`, su listener `setMode(MODES.PLAY)`, `sessionGroup.appendChild(exitButton)` y `toolbar.appendChild(sessionGroup)`) para que se ejecute **después** de `toolbar.appendChild(exportGroup);`. Añadir un `toolbar.appendChild(document.createElement('div')).className = 'toolbar-divider';` entre `exportGroup` y `sessionGroup`. El primer `toolbar-divider` (antes entre `sessionGroup` y `persistenceGroup`) pasa a ir entre `persistenceGroup` y `exportGroup` (ya existe uno ahí; revisar que no queden dos seguidos ni ninguno al principio). Resultado del orden DOM: `[Importar] | [Exportar] | [Salir del modo edición]` (con `justify-content: flex-end`, orden DOM = orden visual).
- [x] **`src/ui/editModeToggle.js` — marcar el botón "Salir del modo edición" con una clase propia.** Al crear `exitButton`, añadir `exitButton.className = 'edit-toolbar__exit-btn';` (BEM: elemento del bloque `.edit-toolbar`, no excepción `.btn-*`, coherente con la Style Bible §7). No tocar su `innerHTML` (icono + texto) ni su listener.
- [x] **`src/styles/main.css` — hacer autónomas las reglas de tamaño de `.mode-switcher__fit-btn`.** La regla `#mode-switcher .mode-switcher__fit-btn { padding: 0; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }` depende del ancestro `#mode-switcher` y no aplicaría al botón montado dentro de `#edit-toolbar`. Cambiar el selector a `.mode-switcher__fit-btn` (sin el ancestro), de modo que el dimensionado 36×36 aplique en ambos contenedores. La regla `.mode-switcher__fit-btn .icon-frame { ... }` ya es autónoma, no se toca.
- [x] **`src/styles/main.css` — dar al fit button de `#edit-toolbar` posición fija y color de acción primaria.** Como el botón montado en `#edit-toolbar` es hijo directo de `.edit-toolbar` (que tiene su propia regla `.edit-toolbar button { background: none; border: 1px solid var(--text-light); ... }`), añadir una regla que lo saque de ese flujo y le dé el aspecto de modo juego. Añadir:
  ```css
  #edit-toolbar > .mode-switcher__fit-btn {
    position: fixed;
    top: 0.5rem;
    right: 1rem;
    z-index: 101;
    background: var(--accent-blue);
    color: var(--text-light);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  #edit-toolbar > .mode-switcher__fit-btn:hover { opacity: 0.9; }
  ```
  (Reproduce lo que `#mode-switcher button` + `#mode-switcher button:hover` dan en modo juego, ya que ese selector no alcanza al botón fuera de `#mode-switcher`.) `z-index: 101` deja el botón por encima del header (`100`) y de `.edit-toolbar` (`99`), en la misma posición que en modo juego, sin solaparse con la barra.
- [x] **`src/styles/main.css` — estilo de acción primaria para "Salir del modo edición".** Añadir tras las reglas de `.edit-toolbar button`:
  ```css
  .edit-toolbar button.edit-toolbar__exit-btn {
    background: var(--accent-blue);
    border-color: var(--accent-blue);
    color: var(--text-light);
  }
  .edit-toolbar button.edit-toolbar__exit-btn:hover { opacity: 0.9; background: var(--accent-blue); }
  ```
  El `:hover` fija `background` para anular el `.edit-toolbar button:hover { background: rgba(255,255,255,0.1); }` heredado, dejando solo el `opacity: 0.9` (patrón de hover de acción primaria de la app).
- [x] **`src/styles/main.css` — limpiar `.toolbar-group--view` si queda sin uso.** Tras quitar `viewGroup` de `renderEditToolbar`, la clase `.toolbar-group--view` (`margin-left: 0.75rem`) ya no la usa nadie. Comprobar con una búsqueda que no se referencia en ningún otro `.js`/`.html` y eliminar esa regla del CSS.

## (d) Style changes

Actualizar la Style Bible (`previo-sdd/design/docs/style/`):

- **`02-componentes-layout.md` §9 (Botones), sub-bullet "Botón flotante cuadrado independiente (p. ej. `.mode-switcher__fit-btn`)":** ampliar la descripción para reflejar que `.mode-switcher__fit-btn` ya no es exclusivo del modo juego / contenedor `#mode-switcher`: es el botón "Ajustar zoom", que se muestra fijo en la esquina superior derecha (`position: fixed; top: 0.5rem; right: 1rem; z-index: 101`) con el mismo aspecto (cuadrado 36×36, fondo `var(--accent-blue)`) en **ambos** modos — en modo juego dentro de `#mode-switcher`, en modo edición dentro de `#edit-toolbar` con regla `#edit-toolbar > .mode-switcher__fit-btn` que le reaplica posición fija y color de acción primaria (porque `#mode-switcher button` no lo alcanza ahí). Las reglas de tamaño de la clase pasan a ser autónomas (selector `.mode-switcher__fit-btn`, sin ancestro).
- **`02-componentes-layout.md` §9, bullet "Botón sobre fondo oscuro (toolbar)":** anotar la excepción: en `.edit-toolbar`, el botón "Salir del modo edición" (`.edit-toolbar__exit-btn`) no usa el estilo transparente/borde de la barra sino el de **acción primaria** (fondo `var(--accent-blue)`, texto `var(--text-light)`, hover `opacity: 0.9`), igual que "Entrar en modo edición" del modo juego — el resto de botones de la toolbar ("Importar", "Exportar") sí mantienen el estilo transparente.
- **`04-modes.md`** (y `05-ui-layer.md` si menciona el fit button): revisar la descripción de `renderEditToolbar` / la barra del modo edición para reflejar el nuevo orden (`Importar | Exportar | Salir del modo edición`) y que el botón "Ajustar zoom" ya no vive dentro de `.edit-toolbar` sino como botón fijo en la esquina, común a los dos modos.

## (e) Verification

- [x] En **modo juego**, el botón "Ajustar zoom" (icono de encuadre) sigue en la esquina superior derecha, cuadrado y con fondo azul, y al pulsarlo reencuadra la vista para ver todos los elementos (sin cambios respecto a antes).
- [x] Al **entrar en modo edición**, el botón "Ajustar zoom" aparece en la **misma** esquina superior derecha que en modo juego, con el mismo tamaño (36×36) y el mismo fondo azul — no dentro de la barra de herramientas ni desplazado hacia abajo. Visualmente coincide con la posición que tenía en modo juego.
- [x] En modo edición, pulsar el botón "Ajustar zoom" reencuadra la vista igual que en modo juego.
- [x] La barra de herramientas del modo edición muestra los botones en este orden de izquierda a derecha: **Importar · Exportar · Salir del modo edición**. No aparece el icono de encuadre en la barra.
- [x] El botón "Salir del modo edición" tiene fondo azul sólido y texto blanco (como "Entrar en modo edición"); "Importar" y "Exportar" siguen con contorno transparente sobre el fondo oscuro. Al pasar el ratón por "Salir del modo edición" se atenúa ligeramente (opacidad), sin cambiar a fondo claro.
- [x] Pulsar "Salir del modo edición" vuelve al modo juego correctamente.
- [x] El botón "Ajustar zoom" de modo edición queda visualmente por encima de la cabecera y no se solapa con la barra de herramientas ni con el título de la app.
- [x] Alternar varias veces entre modo juego y modo edición no deja botones "Ajustar zoom" duplicados ni huérfanos en pantalla.
