- **Creation date**: 2026-09-09

## (a) Functional notes

**Out of scope:**
- No se toca ningún comportamiento observable. Refactor puro de organización de código.
- No se modifican ni añaden pruebas funcionales. `src/test/functional/fresh-boot.test.js` mantiene su propia copia local de `seedDefaultResources()` (con el comentario "Reproduce main.js#seedDefaultResources()") y sigue pasando sin cambios — no se hace que importe la función real (su copia siembra sin traducción i18n del nombre, y adaptarla queda fuera de alcance). Solo se anota que ese comentario del test queda desactualizado (referencia `main.js#seedDefaultResources()`).
- No se centraliza el literal de URL del repositorio (`https://github.com/yeyopepe/bgfactory`), hoy triplicado en `ui/settingsModal.js`, `ui/splashScreen.js` y el `renderAppVersion` que se extrae. Solo se traslada la 3ª copia a `ui/appVersion.js` tal cual.
- No se agrupan las suscripciones `on(...)` en una función `wireEventBus()`: se dejan como están en `main.js` (cambio cosmético opcional que no aporta y añade ruido al diff).
- No se renombran símbolos de `core/state.js` ni de ningún otro módulo existente.

**Doubts resolved with the user:**
- *¿Dónde ubicar el módulo de arranque de estado, si usa `showToast()` y `syncFontFaces()` de la capa `ui/` y "core depende solo de core" (001-overview.md)?* → Se crea una **capa nueva `src/app/`** con `src/app/bootState.js`, por encima de todas las capas, autorizada a importar de `core/` y `ui/`. `main.js` deja de ser el único punto que cablea capas: ahora son `main.js` y `app/`. Se documenta la capa nueva en `001-overview.md`.

## (b) Technical solution

- [ ] **`src/ui/appVersion.js` (nuevo) — extraer `renderAppVersion`.** Crear el fichero con el mismo patrón que `src/ui/appTitle.js`. Mover íntegra la función `renderAppVersion(el)` de `main.js` (l.42-76), exportándola: `export function renderAppVersion(el) { ... }`. Imports que necesita en cabecera:
  - `import { CURRENT_VERSION } from '../data/version.js';`
  - `import { t } from '../core/i18n.js';`
  - `import { getTableText } from '../core/state.js';`
  Cabecera de comentario breve al estilo del proyecto (telegráfico), p. ej.: `// Bloque de nombre/versión de #app-version: nombre + versión, enlace al repo y, si el usuario lo configuró, su texto libre encima.` Mantener literal el string `` `BG Factory ${CURRENT_VERSION}` `` y la URL `https://github.com/yeyopepe/bgfactory`, las clases BEM `app-version__name` / `app-version__repo` / `app-version__table-text` / `app-version__separator`, y el comentario interno sobre `textContent` vs `innerHTML` / `white-space: pre-line`.

- [ ] **`src/data/defaultResources.js` — absorber `DEFAULT_RESOURCE_NAME_KEY` + `seedDefaultResources`.** Añadir al final del fichero (tras `DEFAULT_RESOURCES`):
  - El mapa `DEFAULT_RESOURCE_NAME_KEY` (l.125-128 de `main.js`) con su comentario ("El nombre de cada recurso semilla se traduce en el momento de sembrarlo...").
  - `export function seedDefaultResources() { ... }` con el cuerpo actual (l.130-138), incluido el comentario del gotcha "Flag a true antes de añadir: cada `addResource()` dispara autoguardado síncrono."
  Imports nuevos que necesita la cabecera del fichero:
  - `import { addResource, markResourcesSeeded } from '../core/state.js';`
  - `import { createResource } from '../core/resource.js';`
  - `import { t } from '../core/i18n.js';`
  Verificado: no hay ciclo de imports — `core/state.js`, `core/resource.js` y `core/i18n.js` no importan de `data/defaultResources.js` (solo `core/state.js` lo menciona en un comentario). `core/resource.js`→`core/i18n.js`→`data/i18n.*.js`, sin retorno a `defaultResources.js`. `data/defaultResources.js` deja de ser un módulo de datos puro y pasa a depender de `core/`; el comentario de cabecera que hoy dice "Vive en data/ porque no depende de ninguna otra capa (igual que data/version.js)" hay que corregirlo (p. ej.: "Datos de la galería por defecto y su siembra; la siembra usa core/ para traducir nombres y registrar los recursos.").

- [ ] **`src/app/bootState.js` (nuevo) — extraer el arranque de estado.** Crear carpeta `src/app/` y el fichero. Exporta `export function hydrateStateOnStartup() { ... }` (sin valor de retorno). Contiene, en este orden exacto:
  1. La función local `bootFromSeedOrDefaults()` (l.143-156 de `main.js`), íntegra, con su comentario.
  2. El cuerpo de arranque de l.165-193: `const saved = loadState();` + la cadena `if (saved?.error === 'corrupt') { bootFromSeedOrDefaults(); showToast(t('toast.stateRecoverFailedCorrupt')); } else if (saved) { ...hidratación de panelState/resourcePanelState/tagPanelState/appTitle/tableText/resourcesSeeded/components/resources/tags + loadGroups(deriveMissingGroups(...)) } else { bootFromSeedOrDefaults(); }` — tal cual, sin reordenar.
  3. Como última sentencia de la función: `syncFontFaces(getResources());` (l.195).
  Preservar íntegro el bloque de comentario l.158-163 (gotcha de hidratar `resourcesSeeded` ANTES de `loadComponents()`/`loadResources()`) justo antes de `const saved = ...`, y el comentario del backfill de grupos (l.187-189).
  Imports en cabecera:
  - `import { loadState, readSeedState } from '../core/persistence.js';`
  - `import { loadComponents, getComponents, loadPanelState, loadResources, getResources, loadResourcePanelState, loadResourcesSeeded, loadTags, loadTagPanelState, loadAppTitle, loadGroups, loadTableText } from '../core/state.js';`
  - `import { deriveMissingGroups } from '../core/group.js';`
  - `import { syncFontFaces } from '../ui/fontFaceRegistry.js';`
  - `import { showToast } from '../ui/toast.js';`
  - `import { t } from '../core/i18n.js';`
  - `import { seedDefaultResources } from '../data/defaultResources.js';`
  Cabecera de comentario: p. ej. `// Arranque del estado: recupera lo guardado (o semilla/valores por defecto), hidrata cada sub-estado en orden y sincroniza tipografías. Capa app/: por encima de core/ y ui/.`

- [ ] **`src/main.js` — reducir a cableado.** Tras las extracciones anteriores, dejar el fichero así:
  - Imports: quitar los que ya no usa (`CURRENT_VERSION`, `DEFAULT_RESOURCES`, `createResource`, `deriveMissingGroups`, `loadState`, `readSeedState`, `saveState` sí se mantiene, y de `core/state.js` quitar `loadComponents`, `loadPanelState`, `loadResources`, `loadResourcePanelState`, `loadResourcesSeeded`, `getResourcesSeeded` **NO** — lo usa `persistState`, revisar uno a uno, `loadTags`, `loadTagPanelState`, `loadAppTitle`, `loadGroups`, `loadTableText`, `markResourcesSeeded`, `addResource`). Mantener los que siguen en uso: `MODES`, `getState`, `getComponents`, `getPanelState`, `getResources`, `getResourcePanelState`, `getResourcesSeeded`, `getTags`, `getTagPanelState`, `getAppTitle`, `getGroups`, `getTableText`. Revisar el import de `t` de `core/i18n.js`: si tras las extracciones `main.js` ya no llama a `t()` en ningún sitio, quitarlo; `initI18n` se mantiene.
  - Añadir: `import { renderAppVersion } from './ui/appVersion.js';` y `import { hydrateStateOnStartup } from './app/bootState.js';`
  - Quitar del cuerpo: la definición de `renderAppVersion` (l.42-76), `DEFAULT_RESOURCE_NAME_KEY` + `seedDefaultResources` (l.123-138), `bootFromSeedOrDefaults` (l.143-156), todo el bloque `const saved = loadState(); if (...) {...}` (l.165-193) y el `syncFontFaces(getResources());` final (l.195).
  - Sustituir todo ese bloque de arranque de estado por una única llamada `hydrateStateOnStartup();`, colocada **en el mismo punto del flujo** en que hoy empieza `const saved = loadState()` — es decir, después de `initGlobalShortcuts({...})` (l.117-121), respetando que las suscripciones `on(...)` ya están registradas antes de hidratar (igual que hoy: las suscripciones se registran en l.98-115, la hidratación empieza en l.165).
  - `renderAll()` sigue llamando a `renderAppVersion(versionEl)` (ahora la importada). Verificar que `versionEl` (`document.getElementById('app-version')`) se sigue capturando en `main.js` (l.40) — sí, esa parte no se mueve.
  - **Orden final de `main.js`**: `showSplashScreen()` → `initI18n()` → captura de los 5 elementos del DOM → definición de `renderActiveMode`/`renderAll`/`persistState` → suscripciones `on(...)` → `initGlobalShortcuts({...})` → `hydrateStateOnStartup()`. Nota: hoy el primer `renderAll` ocurre implícitamente por los eventos `*:changed` que emiten los `load*` durante la hidratación; eso se mantiene porque las suscripciones se registran antes de `hydrateStateOnStartup()`. **Verificar en la implementación** que no se pierde ningún `renderAll` inicial: si al arrancar con estado válido no se emitiera ningún evento (caso improbable, pero p. ej. si todos los `load*` con datos vacíos no emiten), habría que añadir un `renderAll()` explícito tras `hydrateStateOnStartup()`. Comprobar el comportamiento real de los `load*` de `core/state.js` antes de decidir; si hoy funciona sin `renderAll()` explícito, dejarlo igual.

- [ ] **`src/index.html` — sin cambios.** Sigue cargando `main.js` como `<script type="module" src="main.js">`. `build.py` recorre el grafo de imports desde `main.js`, así que `ui/appVersion.js` y `app/bootState.js` entran solos en el bundle. No hay que registrar nada.

- [ ] **Comprobación de grafo de build.** Tras los cambios, verificar que `src/scripts/build.py` sigue resolviendo todos los imports desde `main.js` sin error (nuevo directorio `src/app/` incluido) — ejecutar el build una vez y confirmar que genera `src/_output/versions/index-v{NNNN}.html` sin fallos.

## (c) Architecture changes

Afecta a la organización de capas descrita en la arquitectura. Ficheros de `design/docs/architecture/` a actualizar:

- **`001-overview.md`** — sección "Layered architecture":
  - Añadir la capa `app/` al diagrama de capas: `app/ → bootstrap del arranque de estado; junto con main.js, los dos puntos que conocen y cablean varias capas`.
  - Actualizar el bloque de dependencias: añadir `app/* ──▶ core/*, ui/*, data/*` y matizar "`main.js` is the only point that knows and wires all layers" → ahora `main.js` y `app/bootState.js` son los puntos que cablean capas (`main.js`: splash/i18n, elementos del DOM, render, eventBus, shortcuts; `app/bootState.js`: recuperación e hidratación del estado al arrancar).
  - En el resumen de capas, `main.js` pasa a describirse como "bootstrap: monta splash/i18n, localiza los contenedores, orquesta el repintado, registra suscripciones y atajos, y delega el arranque de estado en `app/bootState.js`".

- **`007-persistence-build.md`**:
  - Sección "Persistence and file save" / bloque "Startup (main.js)": el pseudocódigo `loadState() ... bootFromSeedOrDefaults()` y `bootFromSeedOrDefaults() [local to main.js]` pasa a `app/bootState.js` (`hydrateStateOnStartup()`); `bootFromSeedOrDefaults()` deja de ser "local to main.js" y es una función interna de `app/bootState.js`.
  - Sección "Default resources (`data/defaultResources.js`, `main.js`)": `seedDefaultResources()` deja de estar en `main.js` y vive en `data/defaultResources.js`. Actualizar el encabezado de la sección a solo `data/defaultResources.js`.
  - Cualquier referencia a `main.js` como sitio del `showToast` del caso corrupto: ahora ocurre dentro de `hydrateStateOnStartup()` (`app/bootState.js`).
  - Nota "Asset inlining" / build: mencionar que `build.py` recorre imports desde `main.js` e incluye `app/` igual que `core/ui/modes/data`.

- **`006-ui-layer.md`**:
  - La referencia a `main.js#renderAppVersion` pasa a `ui/appVersion.js` → `renderAppVersion(el)`. Añadir una entrada breve para `ui/appVersion.js` en la lista de módulos UI (paralela a la mención de `#app-version` que ya existe), o actualizar la referencia existente. Describir: construye el contenido de `#app-version` (nombre versionado + enlace al repo + texto libre de `getTableText()` si lo hay), repintado desde `main.js#renderAll` y en vivo vía `tableText:changed`.

- **`008-code-conventions.md`** — opcional: si la lista de capas/carpetas de `src/` se enumera en algún punto, añadir `app/`.

## (d) Style changes

No aplica. No se modifica ni se extiende el sistema visual: `renderAppVersion` se traslada sin cambios de markup, clases ni tokens. Las clases BEM `app-version__*` ya están documentadas en `design/docs/style/004-naming-and-patterns.md` y siguen igual.

## (e) Verification

- [ ] **Sesión totalmente nueva.** Con `localStorage` limpio (`bgfactory:state` ausente) y sin `<script id="initial-state">` con contenido: al cargar, la galería de recursos muestra los 2 recursos de ejemplo (una imagen y una tipografía) con su nombre en el idioma activo, y no aparece ningún aviso. Recargar: los recursos de ejemplo no se duplican ni reaparecen si se borran.
- [ ] **Estado guardado válido.** Con un `bgfactory:state` correcto de la versión actual: al cargar se recupera todo (piezas, recursos, etiquetas, agrupaciones, título, texto de la mesa, estado de los paneles) sin ningún aviso, y no se siembran recursos de ejemplo aunque el guardado no tuviera la marca `resourcesSeeded`.
- [ ] **Estado guardado no recuperable.** Con un `bgfactory:state` ilegible, sin array de componentes, o de otra versión: al cargar aparece el aviso breve (toast) "no se ha podido recuperar el estado guardado" y la app arranca desde la semilla embebida o los valores por defecto.
- [ ] **Semilla embebida.** Con `<script id="initial-state">` con un estado válido y sin `bgfactory:state`: al cargar se recupera desde la semilla y no se siembran recursos de ejemplo.
- [ ] **Backfill de agrupaciones.** Con un guardado antiguo sin `componentGroups` pero con piezas que tienen `groupId`: al cargar se reconstruye una entrada de agrupación por cada `groupId` presente.
- [ ] **Bloque de nombre/versión.** En pantalla se ve "BG Factory" con el número de versión y el enlace al repositorio (abre en pestaña nueva). Con texto libre configurado en Ajustes → "Texto en la mesa": aparece encima, separado por una línea fina, y se actualiza en vivo al editarlo sin recargar.
- [ ] **Repintado general al arrancar.** Al cargar, la aplicación muestra el modo activo (juego o edición) correctamente renderizado, el título de cabecera y la barra de modo — sin quedarse en blanco.
- [ ] **Atajos de teclado.** En modo edición: ESC/ENTER/DEL sobre modales, y DEL/flechas sobre la selección de piezas, siguen funcionando.
- [ ] **Guardado automático.** Tras cualquier cambio (mover una pieza, editar el título, cambiar de idioma, etc.) el estado se persiste: recargar lo mantiene.
- [ ] **`npm test` pasa** en su totalidad y `src/test/TRACEABILITY.md` se regenera sin anomalías.
- [ ] **Build.** `python src/scripts/build.py` genera `src/_output/versions/index-v{NNNN}.html` sin errores y ese fichero, abierto directo (`file://`), arranca con el mismo comportamiento.
- [ ] **`src/main.js`** queda en ~60-75 líneas y sin lógica propia (sin construcción de DOM, sin siembra de recursos, sin hidratación de estado).
