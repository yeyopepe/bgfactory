- **Creation date**: 2026-09-09

## (a) Functional notes

**Out of scope:**

- No se toca código de producción. Nada de lo añadido llega al bundle entregable
  (`src/scripts/build.py` solo recorre imports desde `src/main.js`; ningún fichero de
  `src/test/` es alcanzable desde ahí).
- El mapa de trazabilidad (`src/test/TRACEABILITY.md`) se regenera solo en cada
  `npm test` — no se edita a mano en este cambio.
- **Cierre con Escape del panel de Configuración (funcionalidad 038):** la ficha 038 dice
  que el panel se cierra "con la tecla Escape", pero `src/ui/settingsModal.js` **no**
  implementa ningún manejador de `keydown`/Escape. Los tests reflejan el comportamiento
  real (botón "Cerrar" + `mousedown`+`click` sobre el overlay) y **no** afirman cierre con
  Escape. Se corrige la ficha 038 para quitar la mención a Escape (ver sección (c)). Si se
  decidiera que Escape debe implementarse de verdad, sería un cambio de producción aparte,
  fuera del alcance de esta batería.
- **Catálogo exhaustivo campo por campo de la ficha 040:** se comprueba la
  presencia/ausencia condicionada por tipo de las secciones y campos distintivos, no la
  posición vertical exacta de cada fila de las Tablas A y B.
- **Lógica interna de los sub-modales del componente** (Editor visual, Editar figura,
  Elegir imagen, etc.): fuera de alcance; como mucho se comprueba que el botón que abre
  cada uno existe en su pestaña.
- **Re-verificar la estructura de 5 pestañas y la validación de id** ya cubierta por
  `component-modal-tabs.test.js` (funcionalidad 002): los casos de 040 se centran en lo
  propio del catálogo (secciones/campos por tipo, modales de grupo y etiqueta). Se acepta
  un solapamiento mínimo e inevitable al afirmar el orden de las 5 pestañas como ancla de
  los casos de 040.
- **Aspecto visual / `:hover` / z-index CSS:** el runner no carga la hoja de estilos
  (`test.decision.no-main-js`); solo se comprueba la existencia y el orden de los nodos en
  el DOM.

**Doubts resolved with the user:**

- ¿Cómo tratar el cierre con Escape del panel (ficha 038 lo menciona, el código no lo
  implementa)? → El test refleja el código real (botón + clic fuera) y se anota la
  discrepancia; la ficha 038 se corrige para quitar Escape. No se toca producción.
- ¿Alcance de la 040 (ficha de catálogo)? → Estructura observable de los 3 modales de
  propiedades: nº y orden de pestañas, presencia de secciones/campos por tipo, footer, y
  las claves i18n de los rótulos. Sin re-verificar lo ya cubierto por
  `component-modal-tabs.test.js`.
- ¿Un fichero por funcionalidad o uno para ambas? → Uno por funcionalidad
  (`multi-idioma.test.js` + `catalogo-propiedades.test.js`), coherente con la tanda
  00254–00257.
- ¿Cómo cubrir el cambio de idioma en caliente y la actualización de modales abiertos? →
  `setLanguage` + evento `language:changed` + re-render en vivo del panel de
  Configuración, a nivel `state` y a nivel `ui`.

## (b) Technical solution

### Fichero 1 — `src/test/functional/multi-idioma.test.js` (funcionalidad 038)

- [x] **`src/test/functional/multi-idioma.test.js` — crear el fichero y su cabecera.**
  Fichero nuevo. Cabecera de comentario resumiendo qué valida: detección de idioma por
  `navigator.language` y prioridad de la preferencia guardada; cambio de idioma en caliente
  (`setLanguage`, evento `language:changed`, no-op); resolución de `t()` (cadena de
  respaldo, interpolación, plural); integridad de catálogos (`CATALOG_EN ⊆ CATALOG_ES`);
  panel de Configuración (`openSettingsModal`): apertura, contenido, texto de la mesa,
  re-render en vivo al cambiar el idioma, cierre. Anotar el `[gotcha]` de que el runner no
  carga `main.js` ni el CSS, y que `resetState()` de `helpers.js` ya borra
  `localStorage['bgfactory:lang']` y `['bgfactory:state']`.

- [x] **`src/test/functional/multi-idioma.test.js` — imports, `registerFeature` y andamiaje
  del `describe`.**
  - De `../harness.js`: `describe, it, expect, beforeEach, afterEach, registerFeature`.
  - De `../helpers.js`: `resetState`.
  - De `../../core/i18n.js`: `initI18n, getLanguage, setLanguage, t, SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE`.
  - De `../../core/eventBus.js`: `on`.
  - De `../../core/state.js`: `getTableText, setTableText`.
  - De `../../core/appTitle.js`: `getVersionedProductName`.
  - De `../../data/i18n.es.js`: `CATALOG_ES`. De `../../data/i18n.en.js`: `CATALOG_EN`.
  - De `../../ui/settingsModal.js`: `openSettingsModal`.
  - `registerFeature({ primary: 38 })`.
  - `describe('038 — Aplicación multi-idioma y panel de configuración', () => { ... })` con
    `beforeEach(() => { resetState(); initI18n(); })` (deja el idioma resuelto y el
    `document.title` fijado) y `afterEach(() => { document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()); try { localStorage.removeItem('bgfactory:lang'); } catch {} initI18n(); })` para no dejar el idioma activo contaminado entre casos.

- [x] **`src/test/functional/multi-idioma.test.js` — helpers locales.**
  - `setStoredLang(code)` → `try { localStorage.setItem('bgfactory:lang', code); } catch {}`.
  - `clearStoredLang()` → `try { localStorage.removeItem('bgfactory:lang'); } catch {}`.
  - `withNavigatorLanguage(value, fn)` — parchea `navigator.language` con
    `Object.defineProperty(navigator, 'language', { value, configurable: true })`, ejecuta
    `fn()`, y restaura el descriptor original en un `finally` (guardar
    `Object.getOwnPropertyDescriptor(Navigator.prototype, 'language') || Object.getOwnPropertyDescriptor(navigator, 'language')`).
  - `openSettings()` → `openSettingsModal(); return document.querySelector('.modal-overlay');`
  - `settingsSelect(overlay)` → `overlay.querySelector('select')`.
  - `settingsTextarea(overlay)` → `overlay.querySelector('#settings-table-text')`.

- [x] **`it('FT-038-01 · detección automática de idioma por navigator.language', ...)`
  (nivel state).**
  - `clearStoredLang();` `withNavigatorLanguage('es-ES', () => { initI18n(); expect(getLanguage()).toBe('es'); });`
  - `clearStoredLang();` `withNavigatorLanguage('en-GB', () => { initI18n(); expect(getLanguage()).toBe('en'); });`
  - `clearStoredLang();` `withNavigatorLanguage('fr-FR', () => { initI18n(); expect(getLanguage()).toBe('en'); });` (cualquier no-`es` → `en`).
  - Comprobar que la autodetección **no** se persiste: tras el caso `fr-FR`,
    `expect(localStorage.getItem('bgfactory:lang')).toBeNull();` (envuelto en try/catch por
    si `localStorage` no está disponible — si lanza, omitir esta aserción).

- [x] **`it('FT-038-02 · la preferencia guardada tiene prioridad sobre la detección', ...)`
  (nivel state).**
  - `setStoredLang('en');` `withNavigatorLanguage('es-ES', () => { initI18n(); expect(getLanguage()).toBe('en'); });` (guardado `en` gana pese a navegador español).
  - `setStoredLang('es');` `withNavigatorLanguage('en-US', () => { initI18n(); expect(getLanguage()).toBe('es'); });`
  - `setStoredLang('de');` (valor no soportado) `withNavigatorLanguage('es-ES', () => { initI18n(); expect(getLanguage()).toBe('es'); });` (no soportado → autodetección).

- [x] **`it('FT-038-03 · cambio de idioma en caliente: estado, persistencia y evento', ...)`
  (nivel state).**
  - `setStoredLang('es'); initI18n(); expect(getLanguage()).toBe('es');`
  - Suscribir un espía al evento: `const seen = []; const off = on('language:changed', (code) => seen.push(code));`
  - `setLanguage('en');` → `expect(getLanguage()).toBe('en')`, `expect(seen).toEqual(['en'])`,
    y (try/catch) `expect(localStorage.getItem('bgfactory:lang')).toBe('en')`.
  - `setLanguage('en');` de nuevo (ya activo) → `expect(seen).toEqual(['en'])` (sigue con un
    solo elemento: no-op, no re-emite).
  - `setLanguage('de');` (no soportado) → `expect(getLanguage()).toBe('en')`,
    `expect(seen).toEqual(['en'])` (no-op).
  - `off();` al final.
  - Comprobar `SUPPORTED_LANGUAGES` y `DEFAULT_LANGUAGE`:
    `expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en'])`, `expect(DEFAULT_LANGUAGE).toBe('es')`.

- [x] **`it('FT-038-04 · resolución de t(): respaldo, interpolación y plural', ...)`
  (nivel state).**
  - Con idioma activo `en` (`setLanguage('en')`): elegir una clave que exista en ambos
    catálogos (p.ej. `'common.accept'`) y comprobar `expect(t('common.accept')).toBe(CATALOG_EN['common.accept'])`.
  - Respaldo a `es`: buscar en el fichero, al implementar, una clave presente en
    `CATALOG_ES` pero **no** en `CATALOG_EN` (`Object.keys(CATALOG_ES).find((k) => !(k in CATALOG_EN))`); si existe alguna, `expect(t(esaClave)).toBe(CATALOG_ES[esaClave])`. Si
    `CATALOG_EN` estuviera completo y no hubiera ninguna, omitir esta sub-aserción con un
    comentario (el catálogo inglés está completo ahora mismo).
  - Clave inexistente: `expect(t('clave.que.no.existe')).toBe('clave.que.no.existe')`.
  - Interpolación: usar una clave del catálogo que contenga `{...}` (al implementar,
    localizar una con `Object.entries(CATALOG_ES).find(([, v]) => typeof v === 'string' && /\{\w+\}/.test(v))`), o, si se prefiere algo estable, comprobar la interpolación con
    `tagModal.editTitle` = `'Etiqueta: {name}'`: `expect(t('tagModal.editTitle', { name: 'X' })).toBe('Etiqueta: X')`.
  - Plural: `tagModal.elementsLabel` = `'Elementos de la etiqueta ({count})'` no es
    `{one, other}`; para el plural buscar al implementar una entrada objeto
    (`Object.entries(CATALOG_ES).find(([, v]) => v && typeof v === 'object')`) y comprobar
    `t(clave, { count: 1 })` === `entry.one` y `t(clave, { count: 3 })` === `entry.other`. Si
    no hubiera ninguna entrada plural en el catálogo, omitir con comentario.

- [x] **`it('FT-038-05 · integridad de catálogos: CATALOG_EN ⊆ CATALOG_ES', ...)`
  (nivel state).**
  - `const missing = Object.keys(CATALOG_EN).filter((k) => !(k in CATALOG_ES));`
    `expect(missing).toEqual([]);` (toda clave inglesa existe también en español).
  - `expect(Object.keys(CATALOG_ES).length).toBeGreaterThan(0);`
  - Comprobar que el español es superconjunto o igual:
    `expect(Object.keys(CATALOG_ES).length).toBeGreaterThan(Object.keys(CATALOG_EN).length - 1);`
    (es decir, `|ES| >= |EN|`).

- [x] **`it('FT-038-06 · panel de Configuración: apertura y contenido', ...)` (nivel ui).**
  - `setLanguage('es'); const overlay = openSettings();`
  - `expect(overlay).toBeTruthy();` `expect(overlay.querySelector('.modal')).toBeTruthy();`
  - Cabecera: `expect(overlay.querySelector('.modal__header').textContent).toBe(t('settings.title'));`
  - Selector de idioma: `const sel = settingsSelect(overlay);` `const opts = [...sel.options].map((o) => o.value);`
    `expect(opts).toEqual(['es', 'en']);`
    `expect([...sel.options].map((o) => o.textContent)).toEqual(['Español', 'English']);`
    (literales fijos, no traducidos) y `expect(sel.value).toBe('es')` (la actual marcada).
  - Campo texto de la mesa: `const ta = settingsTextarea(overlay);` `expect(ta).toBeTruthy();`
    `expect(ta.tagName).toBe('TEXTAREA');` `expect(ta.maxLength).toBe(500);`
    `expect(ta.value).toBe(getTableText());` (== `''` tras `resetState`).
  - Nota/hint: `expect(overlay.querySelector('.modal__hint').textContent).toBe(t('settings.tableText.hint'));`
  - Línea de versión: `expect(overlay.querySelector('.settings-modal__version').textContent).toBe(getVersionedProductName());`
    y que empieza por `'BG Factory'` (`expect(overlay.querySelector('.settings-modal__version').textContent.startsWith('BG Factory')).toBe(true)`).
  - Enlace al repositorio: `const a = overlay.querySelector('.settings-modal__repo a');`
    `expect(a.getAttribute('href')).toBe('https://github.com/yeyopepe/bgfactory');`
    `expect(a.getAttribute('target')).toBe('_blank');`
    `expect(a.getAttribute('rel')).toBe('noopener');`
    `expect(a.textContent).toBe(t('appVersion.repoLink'));`
  - Footer: `const btn = overlay.querySelector('.modal__footer .btn-cancel');`
    `expect(btn.textContent).toBe(t('common.close'));`

- [x] **`it('FT-038-07 · texto en la mesa: escritura en vivo, round-trip y texto plano', ...)`
  (nivel ui + state).**
  - `expect(getTableText()).toBe('');` (default vacío).
  - `const overlay = openSettings(); const ta = settingsTextarea(overlay);`
  - `ta.value = 'línea 1\nlínea 2'; ta.dispatchEvent(new Event('input', { bubbles: true }));`
    → `expect(getTableText()).toBe('línea 1\nlínea 2');` (setTableText al instante).
  - Round-trip directo: `setTableText('abc'); expect(getTableText()).toBe('abc');`
  - Texto plano: `ta.value = '<b>hola</b>'; ta.dispatchEvent(new Event('input', { bubbles: true }));`
    → `expect(getTableText()).toBe('<b>hola</b>');` (se guarda tal cual; el pintado como
    texto plano en la esquina de la mesa lo cubre `version-indicator.test.js` /
    funcionalidad 037 — aquí basta con que `setTableText` no interprete nada).
  - `resetState()` deja el texto vacío: `resetState(); expect(getTableText()).toBe('');`

- [x] **`it('FT-038-08 · cambio de idioma con el panel abierto: re-render sin cerrar', ...)`
  (nivel ui).**
  - `setLanguage('es'); const overlay = openSettings();`
  - `expect(overlay.querySelector('.modal__header').textContent).toBe(CATALOG_ES['settings.title']);`
  - Cambiar el idioma vía el `<select>`:
    `const sel = settingsSelect(overlay); sel.value = 'en'; sel.dispatchEvent(new Event('change', { bubbles: true }));`
  - `expect(getLanguage()).toBe('en');`
  - El overlay sigue en el DOM (no se cerró):
    `expect(document.body.contains(overlay)).toBe(true);`
  - El contenido está re-renderizado en inglés:
    `expect(overlay.querySelector('.modal__header').textContent).toBe(CATALOG_EN['settings.title']);`
    y el footer: `expect(overlay.querySelector('.modal__footer .btn-cancel').textContent).toBe(CATALOG_EN['common.close']);`
  - Reforzar con un `setLanguage` externo (no vía el `<select>`): volver a `es` con
    `setLanguage('es')` y comprobar que el header vuelve a
    `CATALOG_ES['settings.title']` y el overlay sigue presente.

- [x] **`it('FT-038-09 · cierre del panel por botón y por clic fuera; baja de la
  suscripción', ...)` (nivel ui).**
  - Cierre por botón: `let overlay = openSettings();`
    `overlay.querySelector('.modal__footer .btn-cancel').dispatchEvent(new MouseEvent('click', { bubbles: true }));`
    → `expect(document.body.contains(overlay)).toBe(false);`
  - Cierre por clic fuera (secuencia `mousedown`+`click` sobre el overlay):
    `overlay = openSettings();`
    `overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, target: overlay }));`
    (el handler usa `e.target === overlay`; disparar el evento directamente sobre `overlay`
    hace que `e.target` sea `overlay`)
    `overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));`
    → `expect(document.body.contains(overlay)).toBe(false);`
  - Un `mousedown` dentro del panel seguido de `click` **no** cierra:
    `overlay = openSettings();`
    `overlay.querySelector('.modal').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));`
    `overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));`
    → `expect(document.body.contains(overlay)).toBe(true);` (se cierra al final con el botón
    para limpiar).
  - Baja de la suscripción tras cerrar: cerrar el panel, luego
    `setLanguage(getLanguage() === 'es' ? 'en' : 'es');` y comprobar que no lanza y que no
    queda ningún `.modal-overlay` en el DOM
    (`expect(document.querySelectorAll('.modal-overlay').length).toBe(0)`). (El
    `renderContent` del panel cerrado ya no se invoca porque `close()` hizo
    `offLanguageChanged()`.)

### Fichero 2 — `src/test/functional/catalogo-propiedades.test.js` (funcionalidad 040)

- [x] **`src/test/functional/catalogo-propiedades.test.js` — crear el fichero y su
  cabecera.**
  Fichero nuevo. Cabecera de comentario: valida la estructura observable de las tres
  ventanas de propiedades (modal de componente: 5 pestañas + secciones/campos condicionados
  por tipo + footer; modal de grupo; modal de etiqueta) y los valores por defecto del
  modelo. Anotar que no re-verifica la validación de id / número de pestañas que ya cubre
  `component-modal-tabs.test.js` (funcionalidad 002), y el `[gotcha]` de aislamiento de
  `selectedComponentIds` de `editMode.js` (ids distintos por caso) y de que el runner no
  carga el CSS.

- [x] **`src/test/functional/catalogo-propiedades.test.js` — imports, `registerFeature` y
  andamiaje.**
  - De `../harness.js`: `describe, it, expect, beforeEach, afterEach, registerFeature`.
  - De `../helpers.js`: `resetState, mountEditMode`.
  - De `../../core/state.js`: `getComponents, addComponent, loadGroups, loadTags`.
  - De `../../core/component.js`: `createComponent`.
  - De `../../ui/componentModal.js`: `createDefaultComponent, openComponentModal,
    DEFAULT_BOARD_PROPERTIES, DEFAULT_DADO_PROPERTIES, DEFAULT_DOCUMENTO_PROPERTIES,
    DEFAULT_CARTA_PROPERTIES, DEFAULT_MAZO_PROPERTIES,
    DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`.
  - De `../../ui/groupModal.js`: `openGroupModal`.
  - De `../../ui/tagModal.js`: `openTagModal`.
  - De `../../core/i18n.js`: `initI18n, t`.
  - `registerFeature({ primary: 40 })`.
  - `describe('040 — Catálogo de propiedades de componentes, grupos y etiquetas', () => { ... })`
    con `beforeEach(() => { resetState(); initI18n(); })` y
    `afterEach(() => document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()))`.

- [x] **`src/test/functional/catalogo-propiedades.test.js` — helpers locales.**
  - `addComp(type, id)` → `const c = createDefaultComponent(type); c.id = id; addComponent(c); return c;`
  - `openComponentModalFor(type, id)` — `resetState(); initI18n(); const c = addComp(type, id); mountEditMode(); const target = getComponents().find((x) => x.id === id); openComponentModal({ component: target, onAccept() {}, onDelete() {} }); return document.querySelector('.modal-overlay .modal');`
  - `tabButtons(modal)` → `[...modal.querySelectorAll('.modal__tabs .modal__tab')]`
  - `tabLabels(modal)` → `tabButtons(modal).map((b) => b.textContent)`
  - `activateTab(modal, label)` — busca el `.modal__tab` cuyo `textContent === label`, hace
    `click`, y devuelve el `div` de contenido correspondiente. Como `switchTab` sólo togglea
    `display`, para leer el contenido de una pestaña basta con
    `[...modal.querySelectorAll('.modal__content > div')]` y quedarse con el que tenga
    `style.display !== 'none'` tras el click.
  - `modalText(modal)` → `modal.textContent` (para aserciones de "contiene el rótulo X" con
    `expect(modalText(modal)).toContain(t('clave'))` tras activar la pestaña que toque).
  - `footerButtons(modal)` → `[...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)`

- [x] **`it('FT-040-01 · modal de componente: 5 pestañas en orden y "Generales" activa', ...)`
  (nivel ui).**
  - `const modal = openComponentModalFor('dado', 'd-tabs');`
  - `expect(tabLabels(modal)).toEqual([t('componentModal.tab.general'), t('componentModal.tab.visual'), t('componentModal.tab.specific'), t('componentModal.tab.interacciones'), t('componentModal.tab.copias')]);`
  - La pestaña activa al abrir es "Generales":
    `expect(tabButtons(modal)[0].classList.contains('active')).toBe(true);`
    y las demás no.

- [x] **`it('FT-040-02 · modal de componente: footer (Eliminar/Cancelar/Aceptar) y estado
  de Aceptar', ...)` (nivel ui).**
  - Editando un componente existente:
    `const modal = openComponentModalFor('texto', 'tx-footer');`
    `expect(footerButtons(modal)).toEqual([t('common.delete'), t('common.cancel'), t('common.accept')]);`
    (confirmar al implementar el orden real leyendo el footer de `componentModal.js`; si
    difiere, ajustar el `toEqual` al orden que pinta el código).
  - `const accept = [...modal.querySelectorAll('.modal__footer button')].find((b) => b.textContent === t('common.accept'));`
    `expect(accept.disabled).toBe(false);` (id válido de partida).
  - Vaciar el id: `const idInput = modal.querySelector('.modal__field input[type=text]'); idInput.value = ''; idInput.dispatchEvent(new Event('input', { bubbles: true }));`
    → `expect(accept.disabled).toBe(true);` (Aceptar deshabilitado con id inválido).
  - Creando (sin `component`): `resetState(); initI18n(); mountEditMode(); openComponentModal({ component: null, onAccept() {} }); const m2 = document.querySelector('.modal-overlay .modal');`
    `expect([...m2.querySelectorAll('.modal__footer button')].some((b) => b.textContent === t('common.delete'))).toBe(false);`
    (sin botón Eliminar al crear).

- [x] **`it('FT-040-03 · pestaña "Generales": secciones comunes a todos los tipos', ...)`
  (nivel ui).**
  - `const modal = openComponentModalFor('carta', 'ca-gen');` (la pestaña "Generales" ya
    está activa).
  - Campo "Identificador" arriba: `expect(modal.querySelector('.modal__field label').textContent).toBe(t('componentModal.idLabel'));`
    y que su `<input>` es el primer campo del contenido de la pestaña.
  - Sección "General" (fieldset con legend `t('common.general')`): comprobar que existe un
    `.modal__section > .modal__section-title` con ese texto, y que dentro (o en la pestaña)
    aparecen los rótulos de Bloqueado (`componentModal.locked`), Oculto
    (`componentModal.hidden`) y Subir al mover/interactuar (`componentModal.raiseOnMove`) —
    `expect(modalText(modal)).toContain(t('componentModal.hidden'))`, etc. (Confirmar las
    claves exactas de "Bloqueado" y "Subir al mover/interactuar" al implementar leyendo
    `componentModal.js`.)
  - Sección "Ayuda jugador" (`componentModal.playerHelp`): rótulos "Mostrar título"
    (`componentModal.showTitle`), botón "Editar título de componente…"
    (`componentModal.editTitle`), "Mostrar tooltip" (`componentModal.showTooltip`),
    "Texto del tooltip" (`componentModal.tooltipText`). Comprobar presencia por `toContain`.
  - Sección "Etiquetas" (`componentModal.tagsLegend`): con `loadTags([])` no hay casillas,
    pero el botón "Crear nueva etiqueta…" (`componentModal.createNewTag`) está presente.
    Comprobar `expect(modalText(modal)).toContain(t('componentModal.tagsLegend'))`.

- [x] **`it('FT-040-04 · pestaña "Apariencia": secciones condicionadas por tipo', ...)`
  (nivel ui).**
  Para cada tipo, abrir el modal, activar la pestaña "Apariencia" y comprobar la
  presencia/ausencia de cada legend de sección por su clave i18n:
  - `sizeLegend` (`componentModal.sizeLegend`, "Tamaño"): **presente en todos**. Comprobar
    con `dado`, `texto`, `mazo`.
  - `styleLegend` (`componentModal.styleLegend`, "Estilo"): **solo `dado`**. Comprobar
    presente en `dado`, ausente en `texto` y `mazo`.
  - `shapeLegend` (`componentModal.shapeLegend`, "Forma"): **solo `mazo`**. Presente en
    `mazo`, ausente en `dado` y `tableroSimple`.
  - Borde (`common.border` — confirmar la clave real leyendo `componentModal.js`, la ficha
    040 la cita como `common.border`): **solo `tableroSimple` y `tableroPersonalizado`**.
    Presente en ambos, ausente en `dado` y `texto`.
  - Extrusión (`componentModal.extrusionLegend` / `componentModal.borderLegend.extrusion` —
    confirmar): **presente en todos**.
  - Efecto (`common.visual` — confirmar): **solo `texto`, `tableroSimple`,
    `tableroPersonalizado`**. Presente en `texto`, ausente en `dado` y `mazo`.
  Implementarlo con un helper `apparienceText(type)` que abra el modal, active "Apariencia"
  y devuelva el `textContent` del contenido de esa pestaña, y luego un bloque de
  `expect(...).toContain / no-contain` por tipo. Para el "no contiene", usar
  `expect(text.includes(t('clave'))).toBe(false)`.

- [x] **`it('FT-040-05 · pestaña "Específicas": contenido distintivo por tipo', ...)`
  (nivel ui).**
  Helper `specificText(type)` (abrir modal, activar `t('componentModal.tab.specific')`,
  devolver `textContent`). Comprobar el bloque distintivo de:
  - `texto`: contiene el rótulo "Contenido" (`common.content`).
  - `dado`: contiene `componentModal.facesConfig` ("Configuración de caras"),
    `componentModal.maxNumber` ("Número máximo de caras"), `componentModal.valueList`
    ("Lista de valores") y `componentModal.chooseFont` / `componentModal.fontTypeLabel`
    ("Tipografía del resultado") — confirmar claves al implementar.
  - `mazo`: contiene `componentModal.revealedCardsLegend` ("Cartas reveladas"),
    `componentModal.imageLegend` ("Imagen") y `componentModal.viewMazoContent`
    ("Ver contenido del mazo").
  - `carta`: contiene `componentModal.proportionLabel` ("Proporción"),
    `componentModal.editCardDesign` ("Editar diseño de la carta") y
    `componentModal.cardStyleLegend` ("Estilo").
  Cruzar mínimamente que el contenido de `texto` **no** contiene "Configuración de caras"
  (las pestañas "Específicas" no comparten contenido entre tipos).

- [x] **`it('FT-040-06 · pestaña "Interacciones": presente para todos, sección
  "Interacciones programadas" con "Click derecho"', ...)` (nivel ui).**
  - Para `texto` (un tipo sin interacciones de clic izquierdo) y para `dado`:
    abrir modal, comprobar que existe la pestaña
    `t('componentModal.tab.interacciones')` en `tabLabels(modal)`, activarla y comprobar
    `expect(text).toContain(t('componentModal.programmedInteractions'))` y
    `expect(text).toContain(t('componentModal.rightClickLabel'))` (fila fija "Click
    derecho" que hace que la pestaña nunca quede vacía).

- [x] **`it('FT-040-07 · pestaña "Copias": mensaje sin copias', ...)` (nivel ui).**
  - `const modal = openComponentModalFor('dado', 'd-cop');`
  - Activar `t('componentModal.tab.copias')`; comprobar
    `expect(text).toContain(t('componentModal.noCopies'))` (el componente no tiene copias
    vinculadas). Nota: la clave `componentModal.noCopies` = "Este objeto no tiene copias."
    (no "Sin copias").

- [x] **`it('FT-040-08 · valores por defecto del modelo por tipo', ...)` (nivel state).**
  - Para cada tipo, `createDefaultComponent(type)` y comprobar `c.properties` contra la
    constante `DEFAULT_*_PROPERTIES` correspondiente:
    - `dado` → `expect(c.properties).toEqual(DEFAULT_DADO_PROPERTIES)` **salvo** las claves
      resueltas en el spread (p.ej. `resultadoActual`): comprobar
      `expect(c.properties).toEqual({ ...DEFAULT_DADO_PROPERTIES, resultadoActual: '1' })`
      o, más robusto, comprobar clave a clave las estáticas
      (`colorCuerpo`, `colorNumeros`, `modoCaras`, `numeroMaximoCaras`, `listaValores`,
      `fuenteResourceId`). Reutilizar lo que ya hace `dado.test.js` FT-020-01 como
      referencia del shape exacto.
    - `tableroSimple` / `tableroPersonalizado` → contra `DEFAULT_BOARD_PROPERTIES` /
      `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`.
    - `documento` → contra `DEFAULT_DOCUMENTO_PROPERTIES`.
    - `carta` → contra `DEFAULT_CARTA_PROPERTIES`.
    - `mazo` → contra `DEFAULT_MAZO_PROPERTIES` (ojo: `textoCartaRevelada` es un getter
      i18n resuelto en el spread → comparar con `{ ...DEFAULT_MAZO_PROPERTIES }` capturado
      al momento, o clave a clave las estáticas).
  - Además, `createComponent({ type })` "pelado" (sin defaults del modal):
    `expect(Object.keys(createComponent({ type: 'dado' }).properties)).toHaveLength(0)` y
    `expect(createComponent({ type: 'dado' }).width).toBeNull()` (mismo patrón que
    `dado.test.js`).

- [x] **`it('FT-040-09 · modal de grupo: una pestaña "General", campos y footer', ...)`
  (nivel ui).**
  - `resetState(); initI18n();` `loadGroups([{ id: 'g1', /* forma mínima de grupo */ }]);`
    — confirmar al implementar la forma exacta que `openGroupModal` espera para `group`
    (leer `groupModal.js`); si necesita miembros o propiedades efectivas, construir un
    grupo con dos componentes reales y `loadGroups` con su registro. Alternativa más simple
    si `openGroupModal` acepta `group: null` para "nuevo grupo": usar esa vía.
  - `openGroupModal({ group, onAccept() {}, onCancel() {} }); const modal = document.querySelector('.modal-overlay .modal');`
  - Cabecera: `expect(modal.querySelector('.modal__header').textContent).toBe(t('groupModal.title'));`
  - Pestañas: `expect([...modal.querySelectorAll('.modal__tab')].map((b) => b.textContent)).toEqual([t('common.general')]);`
    (una sola pestaña "General").
  - Campo "Id del grupo": `expect(modalText(modal)).toContain(t('groupModal.idLabel'));`
  - Sección "General": rótulos Bloqueado (`componentModal.locked`), Oculto
    (`componentModal.hidden`), Mostrar tooltip (`groupModal.showTooltip`), Mostrar título
    (`componentModal.showTitle`), Subir al mover/interactuar (`componentModal.raiseOnMove`)
    — `toContain` por cada uno (reutiliza las claves i18n del componente donde aplica).
  - Sección "Etiquetas": `expect(modalText(modal)).toContain(t('componentModal.tagsLegend'));`
  - Footer: `expect([...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)).toEqual([t('common.cancel'), t('common.save')]);`
    (Cancelar + Guardar, **no** Aceptar, **sin** Eliminar). Confirmar el orden real al
    implementar.
  - Ausencia de otras pestañas:
    `expect(modalText(modal).includes(t('componentModal.tab.visual'))).toBe(false);`
    (no hay pestaña "Apariencia").

- [x] **`it('FT-040-10 · modal de etiqueta: crear vs editar', ...)` (nivel ui).**
  - **Crear** (`tag: null`): `openTagModal({ tag: null, onAccept() {} }); let modal = document.querySelector('.modal-overlay .modal');`
    - Título: `expect(modal.querySelector('.modal__header').textContent).toBe(t('tagModal.newTitle'));`
    - Sin pestañas: `expect(modal.querySelectorAll('.modal__tab').length).toBe(0);`
    - Campo "Nombre": `expect(modalText(modal)).toContain(t('tagModal.nameLabel'));`
    - Sin lista de elementos: `expect(modalText(modal).includes(t('tagModal.elementsLabel', { count: 0 }).replace(/\(\d+\)/, '')) ).toBe(false);`
      (más simple: comprobar que no hay ningún botón "Sacar" —
      `expect([...modal.querySelectorAll('button')].some((b) => b.textContent === t('tagModal.remove'))).toBe(false)`).
    - Footer sin Eliminar:
      `expect([...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)).toEqual([t('common.cancel'), t('common.accept')]);`
      (confirmar orden real; al crear no hay "Eliminar").
    - Aceptar deshabilitado con nombre vacío: localizar el `<input type="text">` del nombre,
      dejarlo vacío y comprobar que el botón `t('common.accept')` tiene `disabled === true`.
      Cerrar/limpiar el overlay.
  - **Editar** (`tag` existente con nombre y, opcionalmente, elementos): construir una
    etiqueta real (`loadTags([{ id: 'et1', name: 'Rojas' }])` — confirmar shape en
    `tagModal.js`) y `openTagModal({ tag: laEtiqueta, onAccept() {}, onDelete() {}, onRemoveFromTag() {}, onRemoveGroupFromTag() {} });`
    - Título: `expect(modal.querySelector('.modal__header').textContent).toBe(t('tagModal.editTitle', { name: 'Rojas' }));`
    - Lista "Elementos de la etiqueta (N)": `expect(modalText(modal)).toContain('Elementos de la etiqueta')`
      (o comparar con `t('tagModal.elementsLabel', { count: 0 })` = "Elementos de la
      etiqueta (0)" cuando la etiqueta no tiene miembros, con el mensaje `tagModal.empty`).
    - Footer con Eliminar:
      `expect([...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)).toEqual([t('common.delete'), t('common.cancel'), t('common.accept')]);`
      (confirmar orden real; al editar sí hay "Eliminar").

- [x] **Ejecutar la batería completa y revisar la trazabilidad.** `npm test` desde la raíz
  del repo. Todos los casos `FT-038-*` y `FT-040-*` en verde. `src/test/TRACEABILITY.md`
  regenerado: las filas de las funcionalidades 038 y 040 pasan de `—` a listar sus
  `FT-038-*` / `FT-040-*`, y ninguna funcionalidad aparece en "Tests que declaran una
  funcionalidad inexistente". Ajustar los `toEqual` de orden de footer / claves i18n que se
  hayan dejado marcados como "confirmar al implementar" con los valores reales del código.

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/011-functional-test-framework.md`** — en la
  sección "## Test files", añadir dos filas a la tabla `| File | Feature | Level |`:
  `functional/multi-idioma.test.js` → `038` → `state + ui`, y
  `functional/catalogo-propiedades.test.js` → `040` → `state + ui`. (Esa tabla no es un
  inventario vivo pero registra el enlace funcionalidad↔fichero de cada test; la tanda
  00254–00257 siguió el mismo criterio.) No hay otro cambio de arquitectura: el framework
  de tests no cambia, solo se añaden ficheros que encajan en el contrato ya documentado.

## (d) Style changes

No aplica: no se añade ni modifica ningún patrón visual de la aplicación. Los tests solo
verifican estructura de DOM ya existente.

## (e) Verification

- [x] `npm test` termina con código 0: todos los tests en verde, sin fallos y sin anomalía
  de trazabilidad.
- [x] En la salida de `npm test`, el recuento de casos incluye los nuevos `FT-038-01`…
  `FT-038-09` y `FT-040-01`…`FT-040-10` (19 casos nuevos), todos como `OK`.
- [x] `src/test/TRACEABILITY.md` (regenerado por `npm test`): la fila
  "038 — Aplicación multi-idioma y panel de configuración" ya no muestra `—` sino
  `FT-038-01, …, FT-038-09`; la fila "040 — Catálogo de propiedades de componentes, grupos
  y etiquetas" ya no muestra `—` sino `FT-040-01, …, FT-040-10`.
- [x] En `src/test/TRACEABILITY.md`, la sección "Funcionalidades sin ningún test" ya **no**
  lista la 038 ni la 040.
- [x] En `src/test/TRACEABILITY.md`, la sección "Tests que declaran una funcionalidad
  inexistente" sigue diciendo "Ninguna".
- [x] `git status` no muestra cambios en ningún fichero de `src/` fuera de
  `src/test/functional/multi-idioma.test.js`, `src/test/functional/catalogo-propiedades.test.js`
  y el regenerado `src/test/TRACEABILITY.md`. Ningún cambio en código de producción
  (`src/core/`, `src/ui/`, `src/modes/`, `src/main.js`, `src/data/`).
- [x] Abrir la app en el navegador (modo dev) y comprobar de un vistazo que el panel de
  Configuración y los modales de propiedades siguen funcionando igual que antes (los tests
  no tocan producción, así que esto solo confirma que no se ha colado ningún cambio).
