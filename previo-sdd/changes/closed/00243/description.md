- **Name**: Footer de versión con nombre de app y enlace al repositorio
- **Code**: 00243
- **Type**: change
- **Creation date**: 2026-09-03

## Full description

Hoy, en la esquina inferior derecha de la pantalla se muestra un pequeño texto gris con la versión del prototipo (por ejemplo `v00244`). Aparece siempre, en cualquier modo (juego y edición), y el usuario no puede editarlo.

La versión actual (contador interno del prototipo) es hoy `v00245`.

Este cambio amplía ese texto para que muestre dos líneas:

- **Línea 1**: el nombre de la aplicación seguido de la versión actual, con el mismo formato de versión que ya se usa ahí. El nombre es `BG Factory` (con espacio, igual que el título por defecto de la app y el `<title>` del navegador). Ejemplo: `BG Factory v00245`.
- **Línea 2**: un enlace clicable al repositorio del proyecto en GitHub. El enlace apunta a `https://github.com/yeyopepe/bgfactory` y se muestra con el texto fijo `Ver en Github`. Al pulsarlo, el repositorio se abre en una pestaña nueva del navegador, sin sacar al usuario de la aplicación.

Aspecto: todo el bloque mantiene el color gris tenue y el tamaño pequeño que ya tiene el texto de versión, y sigue anclado en la esquina inferior derecha, alineado a la derecha. El enlace se distingue del resto por ir subrayado; no se usa ningún color de acento, solo el mismo gris.

El contenido es fijo del proyecto: no es configurable ni editable por el usuario, igual que la versión. Se muestra en los dos modos, como hasta ahora. No se guarda nada ni cambia el comportamiento de ninguna otra parte de la aplicación.

### Dudas de alcance resueltas con el usuario

- **Correo del autor**: la petición original pedía añadir también el texto `<yeyopepe@gmail.com>`. El usuario lo descartó: **no se añade** el correo, solo el nombre de app + versión y el enlace al repositorio.
- **Formato**: dos líneas (`BG Factory vXXX` arriba, enlace del repositorio abajo), no una sola línea con separadores.
- **Comportamiento del enlace**: abre en una pestaña nueva.
- **Color**: todo en el gris actual del footer; el enlace, además, subrayado. Sin color de acento.
- **Modos**: visible en todos los modos, igual que ahora.
- **Edición**: no editable por el usuario; contenido fijo del proyecto.
- **Texto visible del enlace**: texto fijo `Ver en Github` (ver ampliación del 2026-09-03 más abajo). El destino real sigue siendo la URL completa `https://github.com/yeyopepe/bgfactory`.
- **Estados vacío / error / carga**: no aplican; es contenido totalmente estático que se pinta una sola vez al arrancar la aplicación.
- **Guardado y empaquetado**: no se guarda nada; el empaquetado del entregable no necesita cambios.

### Ampliación 2026-09-03 — texto del enlace

Se cambia el texto visible del enlace de la línea 2. Antes se mostraba la URL sin el `https://` (`github.com/yeyopepe/bgfactory`); ahora se muestra el texto fijo **`Ver en Github`**. El resto no cambia: el `href` sigue siendo `https://github.com/yeyopepe/bgfactory`, se abre en pestaña nueva, va subrayado y en el mismo gris tenue, sin color de acento. Con esto queda sin efecto la duda de alcance previa "texto visible sin `https://`": el texto ya no deriva de la URL.

## Technical notes

- El footer es el contenedor `#app-version` de `src/index.html`; hoy `src/main.js` hace `versionEl.textContent = CURRENT_VERSION` en el arranque. `CURRENT_VERSION` vive en `src/data/version.js` (hoy `v00245`), contador que `src/scripts/build.py` incrementa y reescribe en cada empaquetado.
- **Nombre de la app**: en `/src` el nombre es `BG Factory` (con espacio) — `DEFAULT_APP_TITLE = 'BG Factory'` en `src/core/appTitle.js` y `<title>BG Factory {VERSION}</title>` en `src/index.html`. La línea 1 del footer usa ese literal (`BG Factory`), decidido con el usuario; no se reutiliza `DEFAULT_APP_TITLE` por código. Se mantiene el formato de versión sin punto que usa este footer (distinto del de `<h1>`, formateado por `core/appTitle.js` → `formatVersion()`; ver `previo-sdd/design/docs/architecture/005-modes.md`, "Editable header title").
- **Primer hiperenlace (`<a>`) de cara al usuario en `/src`**: no hay ninguna regla de estilo para enlaces en el style bible (`previo-sdd/design/docs/style/`), ni ningún `href="http"` / `target="_blank"` / `rel="noopener"` en `src/` a día de hoy. `pv-how` deberá decidir si conviene documentar una convención mínima de enlace (color, subrayado, `rel="noopener"` con `target="_blank"`) en el style bible.
- `#app-version` es un ID reservado a contenedores de layout únicos (`previo-sdd/design/docs/style/004-naming-and-patterns.md`). El DOM se construye con vanilla JS (`document.createElement`, `className`, `classList`); el `<a>` debe crearse así, asignando `href`/`textContent` por código, nunca `innerHTML` interpolado (client hardening: contenido estático y de autoría propia, pero se sigue el patrón por consistencia).
- El footer ya está catalogado en el style bible: `font-size: 0.75rem` = "version footer" (`001-tokens-visual.md`, Typography); `z-index: 10` = "Version footer" (`002-componentes-layout.md`, tabla de z-index de overlays `position: fixed`). Regla CSS actual en `src/styles/main.css` (`#app-version`): `position: fixed; bottom: 1rem; right: 1rem; font-size: 0.75rem; color: var(--text-muted); z-index: 10`. Cualquier color nuevo debe salir de tokens `:root`, nunca hardcodeado; el gris es `var(--text-muted)`.
- **Coexistencia con la entrada 00231** (`inProgress`, aún sin implementar): planea abrir una modal de changelog al pulsar el footer de versión, haciendo `#app-version` (o un elemento dentro) clicable. Este cambio añade una segunda línea (enlace al repositorio) al mismo footer. No hay conflicto directo, pero `pv-how` de la que se implemente en segundo lugar debe diseñar la estructura interna del footer contando con: texto de versión + enlace externo + posible disparador de changelog.
- Sin interfaces ni estructuras de datos afectadas: no hay firma de función, modelo de datos, campo persistido ni evento. Es una adición de DOM/texto en el arranque de `src/main.js` más una regla CSS en `src/styles/main.css`. `src/scripts/build.py` no requiere cambios (solo incrusta imágenes/fuentes como data URI; un `<a>` externo es markup normal).
- Sin inconsistencias documentación-vs-código detectadas durante el análisis. Sin puntos de seguridad pendientes.
