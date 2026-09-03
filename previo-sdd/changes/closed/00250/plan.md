- **Creation date**: 2026-09-03
- **Risk**: 3/10 — Low risk — touches some shared surface or several spots, but doesn't touch contracts or data

## (a) Functional notes

**Out of scope:** No se toca ningún otro comportamiento. En concreto: no se añade límite de longitud por reglas de negocio al texto (a lo sumo un `maxlength` amplio en el control, decidido abajo); no se cambia el título editable del juego (`appTitle`) ni dónde se muestra en la cabecera; no se toca el flujo de exportar/importar juego; no se añade migración de estados guardados antiguos (simplemente no traen la clave nueva y se asume `""`); el enlace a GitHub del footer de la mesa se deja tal cual (solo se replica en el modal de Configuración).

**Doubts resolved with the user:**
- Formato del texto → solo texto plano; nunca se interpreta HTML, Markdown ni ningún otro código (`textContent`, `white-space: pre-line`).
- Longitud → sin límite de negocio; se pondrá un `maxlength="500"` en el `<textarea>` únicamente para no romper el layout (valor amplio, coherente con «sin límite» a efectos prácticos).
- Alcance del dato → preferencia global de la app en el navegador/perfil (como el idioma), persistente en `localStorage`, no incluida al exportar/importar un juego.
- Línea separadora → se muestra solo cuando hay texto de usuario; con el campo vacío el footer queda exactamente como hoy.
- Bloque «Versión» del modal de Configuración → debe mostrar SIEMPRE «BG Factory» + versión (hoy muestra el título editable del usuario + versión), y añadir debajo el mismo enlace a GitHub que la esquina de la mesa.

## (b) Technical solution

- [x] **`src/core/appTitle.js` — añadir helper del nombre de producto versionado.** Junto a `formatVersion()` / `getFullAppTitle(appTitle)`, exportar `export function getVersionedProductName() { return \`${DEFAULT_APP_TITLE} ${formatVersion()}\`; }` (usa el `DEFAULT_APP_TITLE = 'BG Factory'` ya definido en este módulo y `formatVersion()` → `\`v.${CURRENT_VERSION.slice(1)}\``). Es la única fuente del literal «BG Factory» + versión con el formato `v.NNNNN`. No se modifica `getFullAppTitle` (lo sigue usando quien quiera el título editable + versión, si aplica).

- [x] **`src/core/state.js` — nuevo campo de estado `tableText`.** Replicar el patrón de `appTitle` (líneas ~24, ~333-344):
  - Módulo: `let tableText = '';` junto a `let appTitle = DEFAULT_APP_TITLE;`.
  - `export function getTableText() { return tableText; }`
  - `export function setTableText(newText) { tableText = typeof newText === 'string' ? newText : ''; emit('tableText:changed', tableText); }` — normaliza a `''` si no es string; emite el evento nuevo.
  - `export function loadTableText(newText) { tableText = typeof newText === 'string' ? newText : ''; }` — hidratación en arranque, no emite (igual criterio que `loadAppTitle`).
  - No hace falta tocar `getState()` (los escalares `appTitle`/`resourcesSeeded` tampoco están en el objeto `state`).

- [x] **`src/core/persistence.js` — persistir `tableText` en el slot `bgfactory:state`.**
  - `saveState(...)`: añadir `tableText` como último parámetro de la firma y al objeto serializado: `JSON.stringify({ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle, tableText })`.
  - `parseState(raw)`: tras la línea de `appTitle`, añadir `const tableText = typeof parsed.tableText === 'string' ? parsed.tableText : '';` y devolverlo en el objeto de éxito (`return { ..., appTitle, tableText };`).
  - **No** tocar `parseImportedComponents` ni `buildComponentsExport` (es preferencia local, como `panelState` / idioma).

- [x] **`src/main.js` — hidratar, persistir y renderizar `tableText`.**
  - Import: añadir `getTableText, loadTableText` al import desde `./core/state.js`.
  - `persistState()`: añadir `getTableText()` como último argumento de la llamada a `saveState(...)` (en el mismo orden que la nueva firma).
  - Suscripciones (junto a `on('appTitle:changed', ...)`): `on('tableText:changed', renderAll);` y `on('tableText:changed', persistState);`.
  - Arranque: en la rama `else if (saved)` (guardado válido), añadir `loadTableText(saved.tableText);` junto a `loadAppTitle(saved.appTitle);`. En `bootFromSeedOrDefaults()`, en la rama `if (seed)`, añadir `loadTableText(seed.tableText);` junto a `loadAppTitle(seed.appTitle)`. (Si falta la clave, `parseState`/`readSeedState` ya devuelven `tableText: ''`.)

- [x] **`src/main.js` — `renderAppVersion(el)`: pintar el texto de la mesa + separador cuando hay contenido.** Antes de crear `nameLine`, leer `const tableText = getTableText();` y, solo si `tableText.trim() !== ''`:
  - `const noteLine = document.createElement('div'); noteLine.className = 'app-version__table-text'; noteLine.textContent = tableText;` (texto plano; los saltos de línea los respeta el CSS `white-space: pre-line`). **Nunca** `innerHTML`.
  - `const sep = document.createElement('hr'); sep.className = 'app-version__separator';`
  - `el.append(noteLine, sep, nameLine, repoLine);` en ese orden. Si `tableText` está vacío, `el.append(nameLine, repoLine);` como ahora (comportamiento intacto).

- [x] **`src/styles/main.css` — estilos del texto de la mesa y del separador.** Junto a las reglas `#app-version` / `#app-version a` (líneas ~3487-3501):
  ```css
  #app-version .app-version__table-text {
    white-space: pre-line;
    margin-bottom: 0.25rem;
  }
  #app-version .app-version__separator {
    border: none;
    border-top: 1px solid var(--border-neutral);
    margin: 0 0 0.25rem;
  }
  ```
  Hereda `font-size: 0.75rem`, `color: var(--text-muted)`, `text-align: right` de `#app-version`. El `<hr>` con `text-align: right` y sin ancho explícito ocupa el ancho del bloque `#app-version` (que se ajusta a su contenido por ser `position: fixed` sin `width`), quedando alineado a la derecha con el resto.

- [x] **`src/data/i18n.es.js` — nuevas claves del bloque «Texto en la mesa».** En la sección `// --- Modal de configuración ---` (junto a `settings.title` / `settings.language.label` / `settings.version.label`):
  ```js
  'settings.tableText.label': 'Texto en la mesa',
  'settings.tableText.hint': 'Aparece en la esquina inferior derecha de la mesa, encima de la versión. Solo texto plano.',
  ```

- [x] **`src/data/i18n.en.js` — mismas claves en inglés.** En la sección `// --- Settings modal ---`:
  ```js
  'settings.tableText.label': 'Text on the table',
  'settings.tableText.hint': 'Shows in the bottom-right corner of the table, above the version. Plain text only.',
  ```

- [x] **`src/ui/settingsModal.js` — nuevo bloque de textarea + ajuste del bloque de versión.**
  - Imports: añadir `getTableText, setTableText` desde `../core/state.js`; añadir `getVersionedProductName` desde `../core/appTitle.js` (sustituye el uso de `getFullAppTitle`); mantener `getAppTitle` solo si sigue usándose en otro sitio del archivo (no lo está → se puede quitar del import junto con `getFullAppTitle`).
  - Tras el bloque de idioma y su `<hr class="modal__separator">`, y **antes** del `<hr>` que precede al bloque de versión, insertar un nuevo `div.modal__field`:
    - `<label>` con `for` apuntando al textarea, `textContent = t('settings.tableText.label')`.
    - `const textarea = document.createElement('textarea'); textarea.rows = 3; textarea.maxLength = 500; textarea.value = getTableText();`
    - `textarea.addEventListener('input', () => setTableText(textarea.value));`
    - Un `<p class="modal__hint">` con `textContent = t('settings.tableText.hint')`.
    - Añadir un `<hr class="modal__separator">` tras este bloque (para separarlo del de versión), replicando el patrón ya existente.
  - Bloque de versión: cambiar `versionValue.textContent = getFullAppTitle(getAppTitle());` por `versionValue.textContent = getVersionedProductName();`.
  - Bajo `versionValue`, añadir el enlace a GitHub replicando el de `renderAppVersion` (`main.js`):
    ```js
    const repoLine = document.createElement('div');
    repoLine.className = 'settings-modal__repo';
    const repoLink = document.createElement('a');
    repoLink.href = 'https://github.com/yeyopepe/bgfactory';
    repoLink.target = '_blank';
    repoLink.rel = 'noopener';
    repoLink.textContent = t('appVersion.repoLink');
    repoLine.appendChild(repoLink);
    versionField.appendChild(repoLine);
    ```
  - `renderContent` ya se re-ejecuta con `on('language:changed', ...)`; el `<textarea>` toma su valor de `getTableText()` en cada render, así que un cambio externo del estado también se refleja al reabrir. No hace falta suscribir `tableText:changed` dentro del modal (el textarea es la única fuente de edición mientras está abierto; volver a renderizar en cada pulsación movería el cursor). El footer de la mesa por detrás sí se actualiza en vivo vía `renderAll`.

- [x] **`src/styles/main.css` — estilo de `.settings-modal__repo`.** Junto a `.settings-modal__version` (línea ~835):
  ```css
  .settings-modal__repo {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }
  .settings-modal__repo a {
    color: inherit;
    text-decoration: underline;
  }
  ```
  (Mismo tratamiento de enlace de texto discreto que `#app-version a`, ref. `005-text-links-and-external-links.md`.)

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/007-persistence-build.md`**:
  - Sección «Autosave (`core/persistence.js`)»: añadir `tableText` a la lista de `persistence.serializedFields` y al objeto que `saveState()` serializa; añadir `tableText:changed` a la lista de eventos suscritos al autoguardado desde `main.js`.
  - Añadir, junto a la nota de `appTitle` («A save with no `appTitle`… → `DEFAULT_APP_TITLE`»), la nota equivalente para `tableText`: si falta o no es string en el guardado/semilla, se asume `''` (sin migración; guardados pre-00250 simplemente no traen la clave).
  - Bloque de arranque (`hydrate panelState/... + loadAppTitle + ...`): añadir `loadTableText` a la secuencia de hidratación del guardado válido y del seed.
- **`previo-sdd/design/docs/architecture/00-namespace.md`**:
  - `persistence.serializedFields`: añadir `tableText` a la lista `[components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle, tableText]` (afirmación, `anchor: src/core/persistence.js`).
  - Añadir nodo para el nuevo estado, análogo a cómo se referencia `appTitle`: `state.tableText: string = ''  concepto.  anchor: src/core/state.js` con nota «preferencia global; NO en `buildComponentsExport`/`parseImportedComponents`».
  - `ui.class.app-version`: actualizar de «`#app-version` contiene `.app-version__name` + `.app-version__repo` (00243)» a que, con `state.tableText` no vacío, antepone `.app-version__table-text` + `.app-version__separator` (00250); con `tableText` vacío queda como 00243.
- **`previo-sdd/design/docs/architecture/010-internationalization-i18n.md`**:
  - Tabla «Components», fila `src/ui/settingsModal.js`: actualizar la descripción del contenido — ya no es solo «language `<select>` + read-only version line (`getFullAppTitle(getAppTitle())`)», sino además el `<textarea>` «Texto en la mesa» (claves `settings.tableText.*`) y la línea de versión ahora fija (`getVersionedProductName()`, «BG Factory» + versión, ya no el título del usuario) con enlace a GitHub replicado del footer.
  - Añadir `tableText:changed` como evento nuevo en `core/eventBus.js` no es i18n; va en 007 y 00-namespace. Aquí solo la parte de `settingsModal`.
- **`previo-sdd/design/docs/architecture/006-ui-layer.md`**:
  - Entrada `ui/settingsModal.js`: actualizar — nuevo bloque `<textarea>` para `state.tableText` (escribe con `setTableText` en `input`), línea de versión fija «BG Factory» + versión vía `getVersionedProductName()` (antes `getFullAppTitle(getAppTitle())`) y enlace a GitHub replicado del `#app-version` de `main.js`.

## (d) Style changes

- **`previo-sdd/design/docs/style/002-componentes-layout.md`**, sección «Version footer (`#app-version`)»:
  - Pasa de «Two lines (00243)» a: con `state.tableText` no vacío, el footer antepone `.app-version__table-text` (texto de usuario, plano, `white-space: pre-line`, respeta `\n`) y `.app-version__separator` (`<hr>`, `border-top: 1px solid var(--border-neutral)`) por encima de `.app-version__name` + `.app-version__repo` (00250). Con `tableText` vacío, sigue siendo exactamente las dos líneas de 00243.
  - Matizar «Fixed project content, not user-editable»: las dos líneas inferiores siguen siendo contenido fijo no editable; la línea superior (`app-version__table-text`) sí es texto libre del usuario, configurable en el panel de Configuración.
- **`previo-sdd/design/docs/style/005-text-links-and-external-links.md`**:
  - «External links», referencia: el enlace al repositorio (`https://github.com/yeyopepe/bgfactory`, `target="_blank"` + `rel="noopener"`, texto `t('appVersion.repoLink')`) aparece ahora en **dos** sitios con el mismo tratamiento: `#app-version a` (footer de la mesa) y `.settings-modal__repo a` (panel de Configuración, 00250). Ambos construidos con `createElement` + asignación de propiedades, nunca `innerHTML`.
- **`previo-sdd/design/docs/style/001-tokens-visual.md`**: no requiere cambios — el separador reutiliza `--border-neutral` y los tamaños/colores ya tabulados (`0.75rem`, `--text-muted`); no se introduce token nuevo.

## (e) Verification

- [x] Abrir el panel de Configuración (icono de engranaje) en modo juego: aparece un bloque «Texto en la mesa» con un `<textarea>` vacío y una nota de ayuda gris debajo; encima el selector de idioma, debajo el bloque «Versión». — Verificado en `src/ui/settingsModal.js` (`renderContent`): orden langField → `<hr>` → tableTextField (`<label>` + `<textarea rows=3 maxLength=500 value=getTableText()>` + `<p class="modal__hint">`) → `<hr>` → versionField.
- [x] El bloque «Versión» muestra «BG Factory v.00254» (versión vigente tras el build) y, debajo, un enlace subrayado «Ver en Github» que abre `https://github.com/yeyopepe/bgfactory` en una pestaña nueva. — `versionValue.textContent = getVersionedProductName()` + `.settings-modal__repo` con `<a target="_blank" rel="noopener">` y `t('appVersion.repoLink')`.
- [x] Cambiar el título del juego (cabecera) a algo distinto de «BG Factory» y reabrir Configuración: el bloque «Versión» sigue mostrando «BG Factory» + versión, no el título nuevo. — `getVersionedProductName()` (`src/core/appTitle.js`) usa `DEFAULT_APP_TITLE`, no `getAppTitle()`.
- [x] Escribir en el `<textarea>` un texto de dos líneas: sin cerrar el modal, la esquina inferior derecha de la mesa muestra ese texto en dos líneas, en gris pequeño alineado a la derecha, con una fina línea horizontal entre el texto y «BG Factory vXXXXX». — `input` → `setTableText` → `tableText:changed` → `renderAll` → `renderAppVersion` antepone `.app-version__table-text` (`white-space: pre-line`) + `.app-version__separator` (`border-top: 1px solid var(--border-neutral)`); `#app-version` hereda `text-align: right`, `font-size: 0.75rem`, `color: var(--text-muted)`.
- [x] Escribir en el `<textarea>` algo con apariencia de HTML (p. ej. `<b>hola</b>`): en la esquina de la mesa se ve literalmente `<b>hola</b>`, no en negrita. — `noteLine.textContent = tableText` (nunca `innerHTML`).
- [x] Borrar todo el contenido del `<textarea>`: la línea de texto y el separador desaparecen al instante de la esquina de la mesa, que queda solo con «BG Factory vXXXXX» y el enlace, sin hueco extra. — rama `tableText.trim() !== ''` en `renderAppVersion`: si vacío, `el.append(nameLine, repoLine)` sin `noteLine`/`separator`.
- [x] Con un texto guardado, recargar la página (F5): el texto sigue apareciendo en la esquina de la mesa y en el `<textarea>` de Configuración. — `persistState` → `saveState(..., getTableText())` (nuevo parámetro, `src/core/persistence.js`); arranque: `loadTableText(saved.tableText)` / `loadTableText(seed.tableText)` en `src/main.js`; `parseState` devuelve `tableText: ''` si falta.
- [x] Exportar el juego a JSON y abrir el fichero: no contiene el texto de la mesa. Importar un juego cualquiera: el texto de la mesa actual no cambia. — `buildComponentsExport` y `parseImportedComponents` no tocados; `tableText` solo en `saveState`/`parseState` (slot `bgfactory:state`).
- [x] Cambiar el idioma a inglés con un texto escrito: el texto del usuario en la esquina de la mesa no cambia; la etiqueta y la nota del campo en Configuración sí pasan a inglés; el enlace pasa a «View on GitHub». — texto de usuario vía `textContent` directo (no `t()`); `settings.tableText.label`/`.hint` presentes en `CATALOG_ES` y `CATALOG_EN`; `renderContent` re-ejecutado por `on('language:changed', ...)` reconstruye el `<textarea>` con `getTableText()` (estado ya guardado en cada `input`).
- [x] Ejecutar `python src/scripts/build.py`: build sin errores → `src/_output/versions/index-v00254.html` (fichero único autónomo). Confirma que todos los módulos resuelven imports/exports tras los cambios.
