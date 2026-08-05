**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance:**
- El mecanismo de versión (`CURRENT_VERSION` en `src/data/version.js`, incrementada solo por `build.py`/la skill `ms-version`) no se toca: este cambio solo consume ese valor para componerlo junto al texto libre, nunca lo escribe ni lo edita.
- El pie de página `footer#app-version` (que hoy muestra `CURRENT_VERSION` en formato `vNNNNN`, sin punto) no se toca — sigue exactamente igual, es un elemento distinto del título de cabecera.
- El JSON que genera el botón "Exportar" (`buildComponentsExport`, selección de componentes/recursos/grupos) no incorpora el título como dato — solo cambia el **nombre de fichero por defecto** propuesto en su modal, no el contenido exportado.

**Dudas resueltas con el usuario** (ya recogidas en `description.md`, se listan aquí por referencia rápida):
- El nombre por defecto al exportar se aplica a **ambas** acciones de modo edición: "Guardar" (HTML completo) y "Exportar" (JSON de selección).
- La edición se activa con click directo sobre el título, sin botón aparte.
- El título editado se persiste con el resto del estado del juego (localStorage + fichero exportado por "Guardar").
- Un título vacío revierte automáticamente al valor anterior.

## (b) Solución técnica

1. **Nuevo módulo `src/core/appTitle.js`** — vive en `core` (sin DOM), agrupa la composición del título completo a partir del texto libre + versión:
   - `export const DEFAULT_APP_TITLE = 'Errantes, un juego de mesa de SJ Martínez';` (mismo texto que hoy es literal en `src/index.html`).
   - `formatVersion()`: `CURRENT_VERSION` (`src/data/version.js`) tiene forma `'v00111'`; el título mostrado hasta ahora usa el formato con punto `'v.00111'` (el que aplica `build.py` al sustituir el marcador `{VERSION}`). Esta función devuelve `` `v.${CURRENT_VERSION.slice(1)}` `` para no cambiar el aspecto visual actual.
   - `getFullAppTitle(appTitle)`: devuelve `` `${appTitle} ${formatVersion()}` ``, la cadena completa que se muestra en `h1`/`title` y que se usa como nombre de fichero por defecto.
   - *(Nota de incongruencia detectada, sin acción en este cambio: hoy el título estático usa `v.NNNNN` con punto y el footer usa `CURRENT_VERSION` tal cual (`vNNNNN`, sin punto) — son dos formatos de versión distintos ya convivientes en el proyecto. Este cambio mantiene el formato con punto para el título, replicando el aspecto actual, sin unificarlo con el del footer, que queda fuera de alcance.)*

2. **`src/core/state.js`** — nuevo campo de estado `appTitle` (string), siguiendo exactamente el mismo patrón que `panelState`:
   - `let appTitle = DEFAULT_APP_TITLE;` (import de `core/appTitle.js`).
   - `export function getAppTitle() { return appTitle; }`
   - `export function setAppTitle(newTitle) { appTitle = newTitle; emit('appTitle:changed', appTitle); }`
   - `export function loadAppTitle(newTitle) { appTitle = newTitle; }` (sin `emit`, usado solo al hidratar desde guardado/semilla, mismo criterio que `loadPanelState`).

3. **`src/core/persistence.js`** — incluir `appTitle` en el ciclo de guardado/carga, con compatibilidad hacia atrás para guardados sin este campo (se comportan como si no se hubiera editado nunca el título):
   - `parseState`: `const appTitle = typeof parsed.appTitle === 'string' && parsed.appTitle.trim() !== '' ? parsed.appTitle : DEFAULT_APP_TITLE;` — se añade al objeto devuelto.
   - `saveState(components, panelState, resources, resourcePanelState, resourcesSeeded, groups, groupPanelState, appTitle)`: nuevo último parámetro, se añade al objeto serializado.
   - `readSeedState()`/`loadState()` ya devuelven el resultado de `parseState`, así que exponen `appTitle` sin cambios adicionales.
   - `buildComponentsExport` **no** cambia (fuera de alcance, ver (a)).

4. **`src/core/fileExport.js`** — `buildExportHtml` gana un parámetro más, `appTitle`, que se añade al objeto embebido en `#initial-state` (mismo patrón que `panelState`/`groups`), para que el título editado viaje dentro del HTML que genera "Guardar".

5. **`src/main.js`** — cablear el nuevo campo de estado igual que `panelState`:
   - Importar `getAppTitle`, `loadAppTitle` de `core/state.js`.
   - En la hidratación inicial (`saved`/`seed`), llamar a `loadAppTitle(saved.appTitle)` / `loadAppTitle(seed.appTitle)` cuando exista.
   - `persistState()` añade `getAppTitle()` como último argumento de `saveState(...)`.
   - `on('appTitle:changed', renderAll)` y `on('appTitle:changed', persistState)`, mismo patrón que `panelState:changed`.
   - Llamar a la función de render del título (punto 6) desde `renderAll()`.

6. **Nuevo módulo `src/ui/appTitle.js`** — UI del título editable, responsable de pintar `<h1>` y `document.title`:
   - `export function renderAppTitle(container)`, invocada desde `main.js#renderAll()` con el `<h1 id="app-title">` (ver punto 7).
   - Estado transitorio de módulo `let editing = false;` (mismo patrón que `selectedComponentId` en `playMode.js`: variable a nivel de módulo, no en `core/state.js`, porque no debe persistirse ni sobrevivir a un recarga de página).
   - Composición: `getFullAppTitle(getAppTitle())` (de `core/appTitle.js`) para el texto a mostrar y para `document.title`.
   - **Modo juego** (`getState().mode !== MODES.EDIT`): pinta el texto compuesto tal cual, sin listeners de click ni icono de lápiz.
   - **Modo edición, no editando** (`editing === false`): pinta el texto compuesto con la clase `app-title--hoverable` (cursor `pointer`, icono de lápiz que solo se muestra en `:hover` vía CSS, sección 12.11 de `STYLE_BIBLE.md`); un listener de `click` pone `editing = true` y vuelve a invocar `renderAppTitle` directamente (no hace falta pasar por `emit`/`renderAll`, es un estado puramente de esta UI).
   - **Modo edición, editando** (`editing === true`): pinta un `<input type="text">` con el valor actual de `getAppTitle()` (sin la versión), más un `<span>` con la versión en `var(--text-muted)` a continuación (no editable, fuera del `<input>`); al montar, `input.focus(); input.select();`.
     - Listener `blur` y `keydown` (tecla `Enter`, con `input.blur()` para reutilizar el mismo camino): confirmar — `const trimmed = input.value.trim(); if (trimmed) setAppTitle(trimmed); editing = false;` (si `trimmed` está vacío, no se llama a `setAppTitle`, se descarta el cambio y se vuelve a pintar el valor anterior — cumple el caso "título vacío revierte" de `description.md`). Tras el `blur`, `editing = false` y se vuelve a invocar `renderAppTitle` (si `setAppTitle` cambia el estado, el propio `emit('appTitle:changed')` ya dispara `renderAll` desde `main.js`, así que la única llamada directa necesaria es la del caso "vacío", donde no hay `emit`).
   - `document.title = getFullAppTitle(getAppTitle());` se actualiza en cada invocación de `renderAppTitle`, independientemente del modo — cubre el caso "se ve igual en el título de la pestaña en ambos modos".

7. **`src/index.html`** — el `<h1>` deja de tener texto literal (pasa a pintarse en runtime):
   - `<h1 id="app-title"></h1>` (vacío, sin el marcador `{VERSION}`).
   - `<title>` se mantiene igual que hoy (`Errantes, un juego de mesa de SJ Martínez {VERSION}`), como contenido de respaldo antes de que `main.js` cargue y fije `document.title` dinámicamente — necesario además para que siga existiendo el marcador `{VERSION}` que exige `build.py` (ver punto 8).

8. **`src/scripts/build.py`** — no requiere cambios: sigue sustituyendo `{VERSION}` dentro de `<title>` exactamente igual que hoy; ya no hay ningún `{VERSION}` en `<h1>` porque ese elemento nace vacío.

9. **`src/ui/editModeToggle.js`** — usar el título completo como nombre de fichero por defecto en las dos acciones de exportación, eliminando la lógica que ya no se usa:
   - Eliminar `currentFileName()` (deja de usarse: el nombre por defecto ya no depende del nombre del fichero actualmente abierto).
   - Botón "Guardar": `const defaultName = `${getFullAppTitle(getAppTitle())}.html`; const name = prompt('Guardar', defaultName);` — el resto del flujo (extensión `.html` si el usuario la quita, `saveAs`) no cambia.
   - `saveAs(filename)`: pasar `getAppTitle()` como nuevo argumento de `buildExportHtml(...)` (punto 4).
   - `openExportFlow()`: `defaultFilename: `${getFullAppTitle(getAppTitle())}.json`` en vez de `'errantes-componentes.json'`. El resto del flujo (`ui/exportSelectionModal.js`, que ya permite editar ese nombre antes de confirmar) no cambia.
   - Import nuevo: `getFullAppTitle` de `core/appTitle.js`; `getAppTitle` ya se importaría de `core/state.js` (junto a los getters ya importados en este fichero).

**Orden de implementación:** 1 → 2 (depende de 1) → 3 y 4 (dependen de 2) → 5 (depende de 3 y 4) → 6 (depende de 2 y 1) → 7 (depende de 6, para que el contenedor exista) → 9 (depende de 1 y 2) → 8 se verifica al final (sin cambios, pero conviene confirmar que `build.py` sigue encontrando el marcador tras el punto 7).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:
- **Sección 3 ("Modo juego vs modo edición")**: añadir un punto nuevo describiendo el título de cabecera editable — análogo a los ya documentados para indicadores/paneles: qué evento dispara la edición (click, solo en modo edición), qué campo de `core/state.js` lo respalda (`appTitle`), y que la versión sigue siendo responsabilidad exclusiva de `CURRENT_VERSION`/`build.py`, nunca editable.
- **Sección 6 (persistencia, si existe un listado de qué campos de `core/state.js` se guardan)**: añadir `appTitle` a la lista de estado persistido en `localStorage`/`buildExportHtml`, junto a `panelState`/`resourcePanelState`/`groupPanelState`.
- Anotar la incongruencia detectada en (b).1 (formato de versión con punto en el título vs. sin punto en el footer) como nota existente, sin unificarla — para que quede documentada y no se interprete como un descuido en una futura lectura del código.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, nueva subsección **12.11 Título de cabecera editable**, análoga en formato a la 12.3 (etiqueta identificativa) y sección 12.2 (cursores):

- Bloque `.app-title` (BEM), con dos estados vía modificador de clase JS: `.app-title--hoverable` (modo edición, no editando — cursor `pointer`, icono de lápiz propio `.app-title__pencil` oculto por defecto y mostrado solo en `:hover` del bloque) y `.app-title--editing` (modo edición, editando — contiene un `input[type=text]` de estilo a medida en vez del `<input>` genérico de formulario ya descrito en la sección de campos, para que mantenga la tipografía/tamaño del `h1`, más un `.app-title__version` en `var(--text-muted)` no interactivo).
- En modo juego, o en modo edición sin hover, no se añade ninguna clase modificadora: el `h1` se comporta exactamente igual que el `h1` genérico ya descrito en la sección 3 (Tipografía)/Layout — sin cursor especial ni icono.
- El icono de lápiz reutiliza el mismo criterio SVG inline que ya usa el resto de iconos de la app (`stroke="currentColor"`, sin dependencia de una librería de iconos externa).
