- **Name**: Batería de tests funcionales para el título de cabecera editable (funcionalidad 030)
- **Code**: 00243
- **Type**: change
- **Creation date**: 2026-09-06

## Full description

Se añade una batería de pruebas automáticas que valida la funcionalidad 030 ("Título de cabecera editable") de principio a fin, usando el marco de pruebas funcionales que ya tiene el proyecto (definido y construido en el cambio 00238, ya cerrado). Es una ampliación de la cobertura de pruebas: **no se cambia ninguna funcionalidad de la aplicación** ni la ficha funcional de 030; solo se añade y ajusta material de pruebas.

### Qué comportamiento se valida

La funcionalidad 030 dice que el título de la cabecera (el texto junto a la versión, en la franja superior) se puede editar mientras se está en modo edición, y que ese texto se refleja también en el título de la pestaña del navegador. La batería comprueba, de forma observable:

1. **Valor por defecto**: al arrancar sin nada guardado, el título es "BG Factory".
2. **Cambio de título**: al fijar un título nuevo, el valor cambia y se emite el aviso de cambio correspondiente (el que dispara el autoguardado y el repintado).
3. **Entrar en edición**: en modo edición, al pasar el ratón el título muestra un icono de lápiz; al hacer click sobre él, el título se convierte en un campo de texto con el texto actual dentro.
4. **Confirmar con Enter**: al escribir en el campo y pulsar Enter, el título pasa al nuevo texto y la cabecera vuelve a su aspecto normal (con lápiz, sin campo de texto).
5. **Confirmar al perder el foco**: sacar el foco del campo confirma igual que Enter.
6. **Confirmar vacío**: si se confirma el campo vacío (o solo con espacios), se recupera el texto que había justo antes de empezar a editar; el título no cambia y no se emite ningún aviso de cambio.
7. **Título de la pestaña**: tras confirmar un título nuevo, el título de la pestaña del navegador pasa a ser "&lt;nuevo título&gt; v.NNNNN".
8. **Solo lectura en modo juego**: en modo juego, la cabecera muestra "&lt;título&gt; v.NNNNN" como texto plano, sin lápiz ni campo de texto, y un click sobre ella no abre la edición.
9. **La versión nunca se edita**: la marca de versión ("v.NNNNN") aparece siempre y, cuando el título está en modo edición, queda fuera del campo de texto editable.

### Cómo encaja en el marco de pruebas existente

- Se crea un fichero de pruebas nuevo dedicado a la funcionalidad 030, con los nueve casos anteriores. Los dos primeros son de "nivel estado" (solo lógica y datos, sin pantalla); los siete restantes son de "nivel interfaz" (pintan la cabecera real y simulan clicks, escritura, Enter y pérdida de foco).
- El marco de pruebas hoy no tiene una pieza reutilizable para montar la cabecera del título (sí la tiene para la barra de modos y la barra de edición). Se añade esa pieza reutilizable, del mismo estilo que las que ya existen, para que los casos de interfaz la usen y el punto de montaje quede en un solo sitio.
- Dos ficheros de pruebas que ya existen ejercitan de pasada el título de cabecera —el de autoguardado (guarda y recupera el título, y comprueba el valor por defecto cuando falta) y el de exportar/importar (comprueba que el fichero exportado incluye el título)—. Se marcan esos dos ficheros como **cobertura secundaria** de la funcionalidad 030, de modo que el documento de trazabilidad que genera el marco muestre que 030 está cubierta tanto por su batería propia como, de forma incidental, por autoguardado y por exportación. No se duplican esos casos en la batería nueva.

### Decisiones de alcance acordadas

- **Criterio general**: se ha optado, en cada elección, por lo que mejora la mantenibilidad del conjunto de pruebas.
- **Pieza reutilizable para la cabecera**: se añade (en lugar de que cada caso monte la cabecera por su cuenta), porque centraliza el montaje y aísla los casos de futuros cambios internos en cómo se pinta el título.
- **Cobertura secundaria en ficheros ajenos**: se marca (cambio de una sola línea en cada uno), en lugar de añadir a la batería nueva casos de guardado/exportación que ya existen en otro sitio. Así la trazabilidad refleja la realidad sin código repetido.

### Fuera de alcance

- La funcionalidad 031 ("Guardar a fichero", que precarga el nombre de fichero con el título de la cabecera): es otra funcionalidad; su prueba, si procede, iría en una batería propia de 031, a lo sumo declarando 030 como cobertura secundaria.
- La traducción del título a varios idiomas y cualquier comprobación de estilo visual (colores, medidas): el marco de pruebas no valida estilo.
- Cualquier cambio en el código de la aplicación o en la ficha funcional de 030.
- Alta de datos de ejemplo ("fixtures"): todos los casos parten de estado vacío y construyen lo que necesitan.

## Technical notes

### Funcionalidad 030 — mecanismo real (para `pv-how`)

- **Estado** en `core/state.js`: variable de módulo `appTitle`, por defecto `DEFAULT_APP_TITLE = 'BG Factory'` (de `core/appTitle.js`). API: `getAppTitle()`, `setAppTitle(t)` (emite evento **síncrono** `appTitle:changed`), `loadAppTitle(t)` (hidratación, sin evento).
- **Render** en `ui/appTitle.js#renderAppTitle(h1)` sobre el `<h1 id="app-title">` de `index.html`. Tres estados:
  - modo juego → texto plano `getFullAppTitle()` = `"<título> v.NNNNN"`, sin interacción;
  - modo edición sin editar → `renderHoverable`: texto + icono lápiz; `container.onclick` pone `editing = true` y repinta;
  - modo edición editando → `renderEditing`: `<input class="app-title__input">` con el título actual + `<span class="app-title__version">` no editable.
- **Confirmar edición** (`renderEditing`): el `<input>` confirma con `blur` (llama a `confirm()`) y con Enter (`keydown` Enter → `input.blur()`). `confirm()` hace `trim` del valor y `editing = false`; si no queda vacío → `setAppTitle(trimmed)` (emite `appTitle:changed`, y `main.js#renderAll` repinta el `h1` con `editing` en `false`); si queda vacío → `renderAppTitle(container)` directo, que recupera el texto previo (el estado nunca se cambió) y **no** emite `appTitle:changed`.
- **Título de pestaña**: `renderAppTitle` hace `document.title = getFullAppTitle(getAppTitle())` en **cada** render, en ambos modos.
- **Versión**: `formatVersion()` = `` `v.${CURRENT_VERSION.slice(1)}` ``. Nunca editable; en estado de edición va en un `<span>` aparte del `<input>`.
- **Flag `editing`**: booleano transitorio de módulo en `ui/appTitle.js`, no persiste (mismo patrón que `selectedComponentId` en `playMode.js`).
- **Selectores confirmados vivos** en `ui/appTitle.js` (revísalos de nuevo al planificar): contenedor hoverable clase `app-title--hoverable`, icono lápiz `.app-title__pencil`, contenedor en edición `app-title--editing`, campo `.app-title__input`, versión `.app-title__version`.
- **Persistencia autoguardado**: `core/persistence.js#saveState(...)` serializa `appTitle` en `localStorage` (clave `bgfactory:state`); `main.js` suscribe `persistState` a `appTitle:changed`. `parseState`/`loadState`: `appTitle` cae a `DEFAULT_APP_TITLE` si falta / vacío / no-string.
- **Export JSON**: `buildComponentsExport(components, resources, tags, componentGroups, appTitle)` incluye `appTitle`; `parseImportedComponents` lo devuelve (o `null` si falta/vacío).

### Contrato del marco de pruebas hoy (para `pv-how`)

- `src/test/harness.js`: `describe`, `it` (nombre con prefijo `FT-<NNN>-<nn>`), `beforeEach`/`afterEach` (raíz o bloque, `async` permitido), `expect` → `toBe` / `toEqual` / `toBeTruthy` / `toBeFalsy` / `toBeNull` / `toContain` / `toHaveLength` / `toBeGreaterThan` / `toThrow`, `registerFeature({ primary, secondary })` una vez por fichero, `run()`.
- `src/test/helpers.js`: `resetState()` (entre otras cosas hace `loadAppTitle(DEFAULT_APP_TITLE)` y limpia `localStorage`), `mountEditMode()` / `mountPlayMode()` (i18n + `setMode` + `mountChrome` + render `#content`; devuelven `#content`), `mountChrome()` (pinta `#mode-switcher` + `#edit-toolbar`), `loadFixture`, `mockRandom`, `captureDownload` / `getLastDownload` (async), `injectFileImport`, `restoreAllMocks`, `dispatchContextMenu`, `getOpenContextMenu`.
- **Hueco**: ningún helper monta hoy el `#app-title` ni llama a `renderAppTitle`. `mountChrome` solo hace `#mode-switcher` + `#edit-toolbar`. La `runner-page.html` sí tiene el `<h1 id="app-title">` vacío.
- **Aislamiento**: recarga de página de Playwright por **fichero** de test; el `beforeEach` dentro del fichero solo hace `resetState()` + limpiar `localStorage`.
- **Convención de códigos**: `FT-<NNN>-<nn>`, `<NNN>` = número de ficha de `design/docs/features/` (principal), `<nn>` = correlativo de dos dígitos. La ficha `030` existe en `design/docs/features/INDEX.md` → sin anomalía de trazabilidad.
- Doc de arquitectura de referencia: `011-functional-test-framework.md` y `007-persistence-build.md`. **Sin inconsistencias doc ↔ código** detectadas.

### Trabajo previsto (a afinar en `pv-how`)

- **Fichero nuevo** `src/test/functional/app-title.test.js`, `registerFeature({ primary: 30 })`, `beforeEach(resetState)`. Casos `FT-030-01` … `FT-030-09` según la lista de "Qué comportamiento se valida":
  - `FT-030-01` (estado): tras `resetState()`, `getAppTitle()` === `'BG Factory'`.
  - `FT-030-02` (estado): `setAppTitle('X')` → `getAppTitle()` === `'X'` y el espía sobre `on('appTitle:changed')` (de `core/eventBus.js`, `off` en un `afterEach`) recibió `'X'`.
  - `FT-030-03` (interfaz): modo edición; `#app-title` contiene `.app-title__pencil` y no `<input>`; `click` sobre el contenedor → aparece `.app-title__input` con `value` = título actual.
  - `FT-030-04` (interfaz): escribir en el `<input>` + `keydown` `key:'Enter'` → `getAppTitle()` = nuevo texto y `#app-title` vuelve a estado no-edición (lápiz visible, sin `<input>`).
  - `FT-030-05` (interfaz): `blur` del `<input>` → mismo resultado que `FT-030-04`.
  - `FT-030-06` (interfaz): confirmar con el `<input>` vacío o solo espacios → `getAppTitle()` no cambia y el espía no recibe nada.
  - `FT-030-07` (interfaz): tras confirmar un título nuevo, `document.title` === `` `${nuevo} v.NNNNN` `` (`getFullAppTitle`).
  - `FT-030-08` (interfaz): modo juego; `#app-title` es texto plano `"<título> v.NNNNN"`, sin `.app-title__pencil` ni `<input>`; un `click` no abre edición.
  - `FT-030-09` (interfaz): `formatVersion()` (`v.NNNNN`) aparece siempre; en edición está en `<span class="app-title__version">` fuera del `<input>`.
- **Helper nuevo** en `src/test/helpers.js`: `mountAppTitle()` → `ensureI18n()` + `renderAppTitle(document.getElementById('app-title'))`; devuelve el nodo `#app-title`. Se llama tras cada cambio de modo/estado que el caso quiera ver reflejado, igual que hace `main.js#renderAll`. Mismo patrón que `mountChrome()`. Actualizar el bloque de contrato en `011-functional-test-framework.md` para incluirlo.
- **Cobertura secundaria de 030** en ficheros existentes (una línea en cada uno):
  - `src/test/functional/autosave.test.js`: `registerFeature({ primary: 29, secondary: [30] })`.
  - `src/test/functional/export-import.test.js`: `registerFeature({ primary: 32, secondary: [30] })`.
  - Resultado esperado en `src/test/TRACEABILITY.md`: fila `030` con `FT-030-01 … FT-030-09` y, además, los `FT-029-*` / `FT-032-*` marcados `(secundaria)` bajo la fila `030`.
- **Notas de aislamiento a documentar en el propio fichero de test**:
  - `document.title` es global a la página headless y `renderAppTitle` lo reescribe en cada render; con la recarga por fichero + `resetState()` en `beforeEach` (deja `appTitle` por defecto) basta. `afterEach` que restaure `document.title`: opcional, no añadir salvo contaminación observada.
  - El flag `editing` de `ui/appTitle.js` nace en `false` con la recarga por fichero. Cada caso de interfaz debe dejar el título **confirmado** (Enter/blur) para no arrastrar `editing = true` al siguiente caso; el orden natural de los casos ya lo hace.
- **Verificación** (para `pv-how`/`pv-do`): `npm test` desde la raíz termina en verde, `src/test/TRACEABILITY.md` regenerado con la fila `030` poblada (principal + secundarias), sin anomalías, exit code 0.

### Seguridad

Ningún punto pendiente. No se añade dependencia (`playwright` ya es `devDependency` desde 00238, fuera del bundle); no hay red, autenticación, secretos ni datos de usuario reales. Los tests usan el `localStorage` del navegador headless y lo limpian entre casos.

### Relación

Relacionado con el cambio **00238** (framework de tests funcionales, cerrado): esta batería es una aplicación de ese framework a una funcionalidad concreta.
