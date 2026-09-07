- **Creation date**: 2026-09-07

## (a) Functional notes

**Out of scope:**

- No se modifica ni un solo fichero de producción (`src/core/**`, `src/ui/**`, `src/modes/**`, `src/main.js`). Si al escribir los tests aflora un bug real en alguna de las cuatro funcionalidades, se documenta como `fix` aparte (no se corrige aquí) y el test que lo destapa se marca temporalmente o se ajusta a la expectativa correcta con un comentario `// BUG 00xxx`.
- **Arrastre real** del panel por su cabecera y del manejador de redimensionado (gestos `mousemove` píxel a píxel): fuera. Sin CSS cargado en el runner, `getBoundingClientRect()` devuelve cajas 0×0 y `attachResizeHandle`/`handleMouseMove` no producen deltas fiables. Se valida en su lugar el **contrato de callbacks** (`onPanelMove`/`onPanelResize`/`onColumnResize`/`onToggleCollapse` → `setPanelState`/`setResourcePanelState`) y la **relectura** de un `panelState`/`resourcePanelState` sembrado al montar.
- **Cabecera de tabla fija al hacer scroll** (fix 00173): es `position: sticky` puro en CSS, sin lógica JS que aseverar. Fuera.
- **Conversión real a WebP** al pulsar "Cambiar imagen…" del modal de recurso Imagen: ya es competencia de la funcionalidad 010 y requiere un `File` real. Aquí solo se comprueba que `resetView()` se invoca (zoom vuelve a 100 %) tras un cambio de imagen simulado sobre `workingResource`.
- **`ui/tagList.js`** (panel de Etiquetas): la funcionalidad 004 lo cita como tercer panel, pero su funcionalidad primaria es la 008 (sin tests y fuera de esta entrada). El fichero de la 004 declara `secondary: [3, 6]` y ejercita el menú de cabecera sobre Componentes y Recursos, que es donde la mecánica es idéntica. No se toca Etiquetas.

**Doubts resolved with the user:** ninguna pendiente. Todas las decisiones de alcance (reparto en 4 ficheros, reutilizar `mountEditMode` sin helpers de montaje nuevos, persistencia por contrato de callbacks, sin mockups/diagramas) se confirmaron antes de documentar el cambio (ver `description.md`).

## (b) Technical solution

Los cuatro ficheros son nuevos bajo `src/test/functional/`. `src/test/run.js` los recoge solo (`readdir` + filtro `*.test.js` + `sort`), una navegación de página por fichero — no hay nada que registrar en ningún índice. Cada fichero: `import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';` + los helpers de `../helpers.js` que use + imports de `../../core/*` y `../../ui/*`. Matchers disponibles en `harness.js`: `toBe`, `toEqual`, `toBeTruthy`, `toBeFalsy`, `toBeNull`, `toContain`, `toHaveLength`, `toBeGreaterThan`, `toThrow`.

**Patrón común de aislamiento** (mismo gotcha que `edit-context-menu.test.js` / `component-transform.test.js`): `selectedComponentIds` y `panelStackOrder` (`editMode.js`), y `filterText`/`columnSort`/`columnFilters` (`componentList.js` y `resourceList.js` por separado) son estado de módulo que `resetState()` NO limpia. Mitigación aplicada en cada fichero:

- `beforeEach(resetState)` siempre.
- Cada caso usa **ids de componente/recurso distintos**.
- Antes de un caso que dependa del filtro/orden: o se parte de lista vacía (al renderizar con `components.length === 0` / `resources.length === 0` el propio módulo hace `filterText = ''` / `columnSort = null` / `columnFilters = {}`), o se limpia el cuadro de texto explícitamente (`filterInput.value = ''` + `dispatchEvent(new Event('input', { bubbles: true }))`) y se cierra cualquier menú de columna abierto (Esc: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`).
- `afterEach`: cerrar overlays/menús que hayan quedado (`document.querySelectorAll('.modal-overlay, .column-header-menu, .context-menu').forEach(n => n.remove())`).

**Helper local recurrente** (copiar en los ficheros que lo necesiten, criterio de `seedDefaultResources` en `fresh-boot.test.js` — no se toca `helpers.js`):

```js
function addCarta(id, extra = {}) {
  const c = createDefaultComponent('carta');       // de ../../ui/componentModal.js
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);                                  // de ../../core/state.js
  return c;
}
function addImageResource(id, name) {
  const r = createResource({ id, name, type: RESOURCE_TYPES.IMAGE, dataUrl: 'data:image/webp;base64,AA==', fileName: `${name}.webp` });
  addResource(r);
  return r;
}
function clickOn(el, opts = {}) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, ...opts }));
}
```

Solo si al escribir los tests se ve que la apertura del menú de cabecera se repite entre `column-header-menu.test.js` y otros, extraer `openColumnMenuOn(container, colKey)` a `src/test/helpers.js` (busca `th[data-col="<colKey>"]` dentro del `.component-list`/`.resource-list` del container y le hace `click`). Decisión a tomar durante la implementación; por defecto, helper local en el fichero de la 004.

---

- [x] **`src/test/functional/component-panel.test.js` — panel de componentes (func. 003), `registerFeature({ primary: 3 })`.** Nivel state + ui. Imports: `resetState`, `mountEditMode` de `../helpers.js`; `getComponents`, `addComponent`, `removeComponent`, `getPanelState`, `setPanelState`, `loadPanelState`, `loadComponents` de `../../core/state.js`; `cloneComponent`, `nextCloneId`, `createCopy`, `nextCopyId` de `../../core/component.js`; `createDefaultComponent` de `../../ui/componentModal.js`. Casos (`FT-003-01`, `-02`, …):
  - **state — id de clon con sufijo `(n)`**: `nextCloneId('abc', [{id:'abc'}])` → `'abc(1)'`; con `'abc(1)'` presente → `'abc(2)'`; `nextCloneId('abc(1)', [...])` usa raíz `'abc'` (clon de un clon comparte familia). `cloneComponent({id:'abc',x:10,y:20,properties:{},...}, comps)` → `id` según `nextCloneId`, `x`/`y` +30/+30, `order: null`, `groupId: null`, `properties` copia nueva (distinta referencia).
  - **state — reutilización de hueco**: lista con `abc`, `abc(1)`, `abc(2)`; quitar `abc(1)`; `nextCloneId('abc', comps)` → `'abc(1)'` (primer entero libre).
  - **state — id de copia**: `nextCopyId('orig', [])` → `'orig-COPY-001'`; con `orig-COPY-001` (`copyOf:'orig'`) presente → `'orig-COPY-002'`; hueco reutilizable. `createCopy` → `copyOf` = id del original, `sincronizado: true`, `order: null`, `groupId: null`, offset +30/+30.
  - **state — el clon acaba en `order = 1`**: `addComponent(cloneComponent(c, getComponents()))` con 2 componentes previos → el clon queda con `order === 1` y el resto desplazado (usa la lógica real de `addComponent`).
  - **ui — resaltado de fila seleccionada**: `addCarta('sel-1')` + `addCarta('sel-2')`; `mountEditMode()`; `clickOn` sobre `.component-list__row[data-id="sel-1"]` → esa fila tiene `.component-list__row--selected` y `sel-2` no. Releer del DOM vivo tras el click (el panel se re-renderiza).
  - **ui — Ctrl+click selección múltiple**: click plano en `sel-1`, luego `clickOn(row-sel-2, { ctrlKey: true })` → ambas filas `--selected`. `clickOn(row-sel-2, { ctrlKey: true })` de nuevo → `sel-2` deja de estar `--selected`, `sel-1` sigue.
  - **ui — toggle en click plano**: click plano en `sel-1` (única selección) y otra vez click plano en `sel-1` → ninguna fila `--selected`.
  - **ui — botones "Clonar"/"Copiar" ausentes en fila de Copia**: sembrar original `orig` + su copia (`createCopy`, añadida con `addComponent`); montar; en la fila `data-id` de la copia, contar `.component-list__action-btn`: solo "Editar" y "Eliminar" (texto vía `t('common.edit')`/`t('common.delete')`), sin `t('contextMenu.clone')` ni `t('contextMenu.copy')`. En la fila del original sí están los cuatro.
  - **ui — "Clonar"/"Copiar" deshabilitados en componente agrupado**: dos cartas con `groupId: 'grupo-1'`; montar; en la fila de un miembro, el botón "Clonar" y el "Copiar" tienen `disabled === true`; "Editar" y "Eliminar" no.
  - **ui — borrado múltiple abre `bulkDeleteConfirmModal` enumerando**: `sel-1` + `sel-2` + `sel-3`; montar; click plano `sel-1`, Ctrl+click `sel-2` (selección = 2); pulsar el botón "Eliminar" de la fila `sel-1` → aparece `.modal-overlay` con `.bulk-delete-confirm-modal__list` de 2 `<li>` cuyo texto contiene `sel-1` y `sel-2`. **No** se ha llamado a `confirm()` (spiarlo: `window.confirm = () => { throw new Error('no debería'); }` en el caso, restaurar en `afterEach`).
  - **ui — borrado de 1 elemento usa `confirm()` simple**: 1 solo seleccionado; `window.confirm` spy que devuelve `true` y registra la llamada; pulsar "Eliminar" de su fila → `confirm` llamado 1 vez, `getComponents()` ya no contiene ese id, no hay `.bulk-delete-confirm-modal__list`.
  - **ui — filas de grupo plegadas por defecto**: dos cartas `groupId:'grupo-1'` + `getPanelState().expandedGroupIds` vacío; montar; hay una `.component-list__row--group` con `data-id="grupo-1"`, su triángulo es `▸`, y **no** hay filas `.component-list__row--member` visibles. Tras `setPanelState({ expandedGroupIds: ['grupo-1'] })` + re-montar → triángulo `▾` y 2 filas `--member`.
  - **ui — persistencia: relectura de `panelState` al montar**: `loadPanelState({ collapsed: true, width: 420, position: { left: 50, top: 60 }, columnWidths: { id: 120 } })`; `mountEditMode()`; el `.component-panel-container` tiene `style.width === '420px'`, `style.left === '50px'`, `style.top === '60px'`, y el panel está colapsado (no hay `.component-panel__body`). *(Nota impl.: comprobar exactamente qué estilos aplica `renderEditMode` al container desde `getPanelState()` — líneas ~224-234 de `editMode.js` — y asertar solo esos; si `collapsed` se refleja como ausencia de body, asertar eso.)*
  - **ui — la selección NO se persiste**: seleccionar `sel-1` (fila `--selected`); el `panelState` persistido (caso anterior) no contiene ninguna clave de selección; tras `resetState()` + re-montar, ninguna fila `--selected`. Dejar comentado que la selección (`selectedComponentIds`) es estado de sesión y no entra en el autoguardado.
  - **ui — callbacks de persistencia disparan `setPanelState`**: pulsar el botón de colapsar (`.component-panel__header button`, texto `▾`/`▸`) → `getPanelState().collapsed === true`. Pulsar de nuevo → `false`. Esto ejercita `onToggleCollapse` → `setPanelState` → estado real.
  - **ui — traer al frente al interactuar**: `mountEditMode()`; leer `zIndex` inicial de `.component-panel-container` y `.resource-panel-container` (`15+index` sobre `panelStackOrder = ['component','resource','tag']` → component 15, resource 16, tag 17). `document.querySelector('.resource-panel-container').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))` → ahora resource tiene mayor `zIndex` que component. Repetir sobre component → component vuelve a estar por encima. *(Nota: `panelStackOrder` es estado de módulo que no resetea; el caso deja el orden restaurado interactuando con `component` al final. Usar un solo caso para esto.)*

- [x] **`src/test/functional/column-header-menu.test.js` — menú de ordenación/filtrado de cabecera (func. 004), `registerFeature({ primary: 4, secondary: [3, 6] })`.** Nivel state + ui. Imports: `resetState`, `mountEditMode` de `../helpers.js`; `addComponent`, `addResource`, `loadComponents`, `loadResources` de `../../core/state.js`; `createDefaultComponent` de `../../ui/componentModal.js`; `createResource`, `RESOURCE_TYPES` de `../../core/resource.js`; `compareValues` de `../../core/textSort.js`. Helper local `openColumnMenu(container, listSelector, colKey)`: `container.querySelector(\`${listSelector} th[data-col="${colKey}"]\`).dispatchEvent(new MouseEvent('click', { bubbles: true }))`, devuelve `document.querySelector('.column-header-menu')`. Casos (`FT-004-01`, …):
  - **state — `compareValues`**: `compareValues(2, 10) < 0` (numérico); `compareValues('carta-2', 'carta-10') < 0` (numeric:true); `compareValues('Águila', 'aguila') === 0` (sensitivity:'base'); `compareValues('b', 'a') > 0`.
  - **ui — indicador siempre visible en cabeceras interactivas**: montar con 2 componentes; en `.component-list thead`, cada `th[data-col]` de `orden`/`id`/`tipo`/`copia` tiene un `.column-header-menu__indicator` hijo y la clase `column-header--interactive`; el `th[data-col="acciones"]` **no**.
  - **ui — indicador apagado vs destacado**: sin orden ni filtro, el indicador de `id` no tiene `--active`. Abrir su menú, pulsar `.column-header-menu__item` "Ordenar A..Z" (`t('columnMenu.sortAsc')`); re-render; el indicador de `id` ahora tiene `.column-header-menu__indicator--active`.
  - **ui — menú en `document.body` con `position: fixed`**: abrir el menú de `tipo` → `document.body` contiene directamente `.column-header-menu` (no está dentro de `#content`); `getComputedStyle(menu).position === 'fixed'`.
  - **ui — ordenar es toggle y exclusivo por tabla**: 3 cartas con ids `c`, `a`, `b`. Abrir menú de `id`, "Ordenar A..Z" → filas en orden `a`,`b`,`c` (leer `data-id` de `.component-list__row` en orden). Reabrir menú de `id` → el item "Ordenar A..Z" tiene `--active`; pulsarlo de nuevo → vuelve al orden por defecto (por `order`). Activar "Ordenar Z..A" en `id` y luego "Ordenar A..Z" en `tipo` → el menú de `id` ya no marca ninguna ordenación (una sola columna ordenada por tabla).
  - **ui — filtrar por valor**: cartas de tipos mixtos (`carta` y, p.ej., sembrar un `texto` con `createDefaultComponent('texto')`). Abrir menú de `tipo` → el `<select>` tiene `<option value="">` (`t('columnMenu.all')`) + una opción por valor distinto. Elegir el valor de "Carta" (disparar `change`) → solo filas de ese tipo. El indicador de `tipo` pasa a `--active`.
  - **ui — filtros de columna acumulables**: filtrar `tipo` = carta y además `copia` = "No" (`t('common.no')`) → solo filas que cumplen ambos. (Sembrar una copia para que el filtro `copia` tenga efecto discriminante.)
  - **ui — valores del filtro sobre lista completa**: con `tipo` ya filtrado a "Carta", abrir el menú de `copia` → sus opciones siguen incluyendo "Sí" y "No" (se calculan sobre `items` completos que `attachColumnMenu` recibe, no sobre lo ya filtrado).
  - **ui — excepción columna "Orden" (solo ordenar)**: abrir el menú de `th[data-col="orden"]` → tiene los dos `.column-header-menu__item` de ordenar y **no** tiene `.column-header-menu__filter` (`filterable: false` en `COMPONENT_LIST_COLUMN_DEFS`).
  - **ui — "sin resultados" con cabecera visible**: usar el cuadro de texto libre del panel con un texto que no casa nada → el `.component-list thead` sigue presente con sus `th`, y el `tbody` tiene una única fila con `.component-list__empty-filter`. Reabrir el menú de una columna desde esa cabecera y quitar el filtro → vuelven las filas.
  - **ui — el estado de columna sobrevive a un remonte**: ordenar `id` A..Z; `loadComponents(getComponents().map(c => ({...c})))` (fuerza `components:changed`) + re-`mountEditMode`; el estado vive en el módulo `componentList.js`, así que tras re-montar el indicador de `id` sigue `--active` y las filas siguen ordenadas A..Z.
  - **ui — mismo menú sobre el panel de Recursos (secundaria 006)**: sembrar 3 recursos imagen con nombres `Cebra`, `Ave`, `Búho`; montar; abrir menú de `th[data-col="nombre"]` del `.resource-list`, "Ordenar Z..A" → filas en orden `Cebra`,`Búho`,`Ave`. Confirma que `attachColumnMenu` y `columnHeaderMenu` funcionan igual en ambos paneles.

- [x] **`src/test/functional/resource-panel.test.js` — panel de recursos (func. 006), `registerFeature({ primary: 6 })`.** Nivel state + ui. Imports: `resetState`, `mountEditMode` de `../helpers.js`; `addResource`, `addComponent`, `getResources`, `loadResources`, `loadResourcePanelState`, `getResourcePanelState`, `setResourcePanelState` de `../../core/state.js`; `createResource`, `RESOURCE_TYPES`, `getComponentsUsingResource` de `../../core/resource.js`; `createDefaultComponent` de `../../ui/componentModal.js`; `sortByName` de `../../core/textSort.js`. Casos (`FT-006-01`, …):
  - **state — `getComponentsUsingResource`**: componente `carta` con `properties: { caraFrontal: { imagenResourceId: 'img-1' } }` y otro con `image: 'img-1'` → `getComponentsUsingResource('img-1', comps)` devuelve ambos ids (una vez cada uno); recurso no referenciado → `[]`. Un componente que referencia `img-1` dos veces (dos caras) cuenta una sola vez.
  - **state — orden por defecto `sortByName` insensible**: `sortByName([{name:'Águila'},{name:'ave'},{name:'Cebra'}])` → `Águila` y `ave` quedan juntos y `Cebra` al final (comparador `localeCompare` con `sensitivity:'base'`).
  - **ui — tabla y columnas**: 2 recursos imagen; montar; `.resource-list thead` tiene `th[data-col]` `nombre`/`usos`/`tipo`/`acciones` en ese orden; una fila por recurso con nombre en la 1ª celda, número en la de `.resource-list__usos-cell`, etiqueta de tipo (`t('resourceKind.image')`) en la 3ª.
  - **ui — columna "Usos" calculada**: recurso `img-1` referenciado por 2 componentes (sembrar cartas con `properties.caraFrontal.imagenResourceId = 'img-1'`), `img-2` por 0 → la celda `.resource-list__usos-cell` de `img-1` es `"2"`, la de `img-2` es `"0"`. No editable: la celda es `<td>` sin `<input>`.
  - **ui — orden alfabético por nombre en el render**: recursos `Cebra`, `ave`, `Búho`; montar; las filas salen en el orden que dé `sortByName(getResources()).map(r=>r.name)`.
  - **ui — filtro de texto en vivo por nombre**: 3 recursos (`Mapa`, `Ficha`, `Dado`); montar; escribir `"ma"` en `.resource-panel__filter input` (set `value` + `dispatchEvent(new Event('input', {bubbles:true}))`) → solo la fila `Mapa`. Borrar → las 3.
  - **ui — filtro por tipo mostrado**: 1 imagen + 1 tipografía (`createResource({type: RESOURCE_TYPES.FONT, ...})`); filtrar `"tipograf"` → solo la fila de la tipografía (matchea `t('resourceKind.font')`).
  - **ui — filtro por identificador interno**: recurso con `id: 'abc-123'`, nombre `"Fondo"`; filtrar `"abc-123"` → esa fila aparece (matchea `resource.id`).
  - **ui — filtro insensible a mayúsculas y tildes**: recurso `"Águila"`; filtrar `"aguila"` → aparece. Filtrar `"AGUILA"` → aparece.
  - **ui — sin coincidencias**: filtrar `"zzz"` → `tbody` con una fila `.resource-list__empty-filter`, `thead` intacto.
  - **ui — la columna "Usos" no participa en el filtro de texto**: recurso con 5 usos, nombre `"Fondo"`; filtrar `"5"` → no aparece (el `5` de usos no cuenta), filtrar `"fondo"` → aparece.
  - **ui — el texto de filtro es transitorio**: partir de `resources.length === 0` en un remonte (que fuerza `filterText = ''`) o limpiar el input explícitamente; tras `resetState()` (que hace `loadResources([])`), montar y sembrar de nuevo → filtro vacío, todas las filas visibles.
  - **ui — persistencia de `resourcePanelState` independiente**: `loadResourcePanelState({ collapsed: true, width: 400 })`; montar; `.resource-panel-container` con `style.width === '400px'` y colapsado. Pulsar colapsar → `getResourcePanelState().collapsed` togglea. Confirmar que `getPanelState()` (el del panel de componentes) no se ha visto afectado.

- [x] **`src/test/functional/resource-image-modal.test.js` — modal de edición de recurso Imagen (func. 007), `registerFeature({ primary: 7 })`.** Nivel ui. Imports: `resetState` de `../helpers.js`; `openResourceModal` de `../../ui/resourceModal.js`; `RESOURCE_TYPES` de `../../core/resource.js`; `initI18n` de `../../core/i18n.js`. `beforeEach(() => { resetState(); initI18n(); })` (idempotente — el modal usa `t()` y aquí no se monta un modo que lo haga). `afterEach`: `document.querySelectorAll('.modal-overlay').forEach(n => n.remove())`. Helper local:

  ```js
  function openImageModal(overrides = {}) {
    const resource = { id: 'r1', name: 'Foto', type: RESOURCE_TYPES.IMAGE,
      dataUrl: 'data:image/webp;base64,AA==', fileName: 'foto.webp', mimeType: 'image/webp', ...overrides };
    openResourceModal({ resource, onAccept: () => {}, onDelete: () => false });
    return document.querySelector('.modal-overlay .modal');
  }
  function parseTransform(img) {           // "translate(Xpx, Ypx) scale(Z)"
    const m = img.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/);
    return m ? { x: +m[1], y: +m[2], zoom: +m[3] } : null;
  }
  ```

  Casos (`FT-007-01`, …):
  - **modal de imagen es más ancha**: `openImageModal()` → el `.modal` tiene la clase `resource-modal--image`.
  - **estructura**: dentro del modal hay un `input[type="text"]` con `value === 'Foto'` (campo Nombre), un `.resource-modal__image-preview` con `.resource-modal__image-preview__img` (`src` = el `dataUrl`), `.resource-modal__zoom-level`, `.resource-modal__zoom-controls` con 3 `.resource-modal__zoom-btn`, y un botón con texto `t('resourceModal.changeImage')`.
  - **zoom inicial 100 %**: `.resource-modal__zoom-level` es `"100%"`; `parseTransform(img)` → `{ x:0, y:0, zoom:1 }`.
  - **botón `+` acerca centrado**: click en el 1er `.resource-modal__zoom-btn` (zoom in) → `parseTransform().zoom === 1.2` (`zoomAt(0,0,1.2)`), `x`/`y` siguen 0; `.resource-modal__zoom-level` es `"120%"`.
  - **botón `-` aleja; clamp inferior a 100 %**: desde 100 %, click en zoom out (`zoomAt(0,0,1/1.2)`) → `zoom` clamp a `ZOOM_MIN` (1); `x`/`y` forzados a 0; nivel `"100%"`.
  - **clamp superior 500 %**: pulsar zoom in repetidamente (8-10 veces) → `parseTransform().zoom` nunca supera `5`; nivel `"500%"`.
  - **rueda del ratón hace zoom y `preventDefault`**: `const ev = new WheelEvent('wheel', { deltaY: -1, clientX: 10, clientY: 10, bubbles: true, cancelable: true }); previewBox.dispatchEvent(ev)` → `ev.defaultPrevented === true` y `parseTransform().zoom > 1` (factor 1.15). Con `deltaY: 1` desde un zoom >1 → el zoom baja.
  - **botón reset vuelve a 100 % centrada**: hacer zoom in 3 veces, luego click en el 3er `.resource-modal__zoom-btn` (reset) → `parseTransform()` = `{ x:0, y:0, zoom:1 }`, nivel `"100%"`.
  - **indicador de nivel de zoom siempre presente**: tras cada operación anterior, `.resource-modal__zoom-level` existe y su texto casa `/^\d+%$/`.
  - **pan solo con zoom > 100 %**: a 100 %, `img.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }))` + `document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30, bubbles: true }))` → `parseTransform().x === 0` (no hay pan). Hacer zoom in primero (zoom 1.2), repetir el gesto → `parseTransform().x === 50`, `.y === 30`. `document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))` para cerrar el drag.
  - **cambiar imagen reinicia la vista**: cubierto funcionalmente por el caso de reset (el reinicio real al cambiar imagen usa el mismo `resetView()`). Cubrir el disparador concreto necesitaría un `File` real vía `DataTransfer` — fuera de alcance (ver (a)).
  - **modal de Tipografía sin controles de zoom**: `openImageModal({ type: RESOURCE_TYPES.FONT, fileName: 'f.ttf' })` → el `.modal` **no** tiene `resource-modal--image`; no hay `.resource-modal__image-preview`, ni `.resource-modal__zoom-controls`, ni `.resource-modal__zoom-level`; sí hay `.resource-modal__font-preview`.

- [x] **`design/docs/architecture/011-functional-test-framework.md` — actualizar la tabla "Test files".** Añadir 4 filas al final de esa tabla (es un seed, pero la doc la mantiene al día para los ficheros conocidos):
  - `| \`functional/component-panel.test.js\` | 003 | state + ui |`
  - `| \`functional/column-header-menu.test.js\` | 004 (primary), 003 + 006 (secondary) | state + ui |`
  - `| \`functional/resource-panel.test.js\` | 006 | state + ui |`
  - `| \`functional/resource-image-modal.test.js\` | 007 | ui |`
  Añadir, si aporta, una nota breve por fichero en la columna de nivel sobre el gotcha de estado de módulo (`selectedComponentIds`/`filterText`/`columnSort`/`panelStackOrder` que `resetState()` no limpia) — mismo estilo que las notas ya existentes de `edit-context-menu.test.js` / `infinite-table.test.js`.

- [x] **Ejecutar `npm test`** y dejar la batería en verde. Iterar sobre los fallos que sean de test (selectores, timing de re-render, estado de módulo no limpiado). Si un fallo revela un bug real de producción, NO corregirlo aquí: anotarlo en (a) como hallazgo y documentarlo como `fix` aparte; ajustar el test a la expectativa correcta con comentario `// BUG 00xxx pendiente`.

- [x] **Verificar `src/test/TRACEABILITY.md`** regenerado por el `npm test` anterior: 003, 004, 006 y 007 aparecen ya con sus `FT-*` en la tabla de trazabilidad y **desaparecen** de la sección "Funcionalidades sin ningún test"; la sección "Tests que declaran una funcionalidad inexistente" sigue vacía (`_Ninguna._`). Este fichero lo regenera el runner; solo hay que confirmar el resultado y versionarlo.

## (c) Architecture changes

- **`design/docs/architecture/011-functional-test-framework.md`** — sección "Test files": añadir las 4 filas nuevas descritas en la última tarea de (b) (fichero, feature link, nivel), con nota breve del gotcha de estado de módulo donde aplique. No se toca ninguna otra parte de la doc: el flujo del batch, el contrato del engine, los helpers y la traceability no cambian.

## (e) Verification

- [x] `npm test` termina con código de salida `0` y su resumen dice `FALLOS: 0`.
- [x] La salida de `npm test` lista los 4 ficheros nuevos (`component-panel.test.js`, `column-header-menu.test.js`, `resource-panel.test.js`, `resource-image-modal.test.js`) con todos sus casos `FT-003-*` / `FT-004-*` / `FT-006-*` / `FT-007-*` en `OK`.
- [x] `src/test/TRACEABILITY.md` (regenerado): las filas de las funcionalidades 003, 004, 006 y 007 muestran códigos `FT-*` (ya no `—`); ninguna de las cuatro aparece en "Funcionalidades sin ningún test"; "Tests que declaran una funcionalidad inexistente" sigue en `_Ninguna._`.
- [x] `git status` no muestra ningún fichero modificado bajo `src/core/`, `src/ui/`, `src/modes/` ni `src/main.js` — solo ficheros nuevos bajo `src/test/functional/`, el `TRACEABILITY.md` regenerado y la doc `011-functional-test-framework.md`.
- [x] Ejecutar `npm test` una segunda vez seguida: mismo resultado `FALLOS: 0` (los casos son deterministas y no hay fuga de estado de módulo entre ficheros — cada fichero es una navegación de página nueva).
- [x] Abrir un par de los ficheros nuevos y comprobar que cada `it` tiene el prefijo `FT-<NNN>-<nn>` correcto y que cada fichero tiene exactamente un `registerFeature({ primary: … })` con el número de funcionalidad que le toca.
