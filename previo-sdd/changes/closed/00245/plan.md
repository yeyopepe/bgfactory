- **Creation date**: 2026-09-03
- **Risk**: 2/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:**
- Cualquier refactor del sistema i18n: `core/i18n.js` y los catálogos no se tocan salvo para **añadir claves nuevas**.
- No se toca ninguna firma pública, ni el objeto de estado, ni `core/persistence.js` más allá de traducir el literal `detail` de la línea ~78 (`parseImportedComponents`).
- No se toca el formato de export/import JSON ni ningún comportamiento observable — solo el idioma en que se muestran los textos.
- No se traducen los textos que introduce el usuario (nombres de recurso/etiqueta, ids, contenido de componentes) — se mantiene el criterio de 00244.
- Documentación funcional (features 038/039) y de estilo: no cambian de contenido; describen el comportamiento, no la lista de textos. Este fix no la toca.

**Doubts resolved with the user:**
- Confirmado por el invocador (`pv-fix`): es un fix acotado, análisis y solución limitados estrictamente a completar la cobertura de traducción de 00244 (literal → `t('clave')` + claves en los dos catálogos). Sin ampliar alcance.

## (b) Technical solution

Patrón único para todas las tareas: en cada fichero, si no está ya, `import { t } from '<ruta>/core/i18n.js'` (ruta relativa según la capa: `../core/i18n.js` desde `src/ui/`, `../../core/i18n.js` desde `src/modes/edit/`, `./i18n.js` desde `src/core/`); sustituir el literal por `t('clave')`; añadir la clave a `src/data/i18n.es.js` (con el texto español **exacto** actual) y a `src/data/i18n.en.js` (traducción, coherente con el glosario de `design_data_glosario-de-traduccion.md` de 00244: mazo→deck, carta→card, ficha→token, tablero→board, dado→die/dice, etiqueta→tag, recurso→resource, componente→component, grupo→group). Prefijos de dominio coherentes con las claves ya existentes.

### Paneles flotantes — cabeceras de tabla y valores

- [x] **`src/ui/componentList.js` — `headLabels`, columna copia, tipo "Grupo".**
  - `const headLabels = { orden: t('componentList.col.orden'), id: t('componentList.col.id'), tipo: t('componentList.col.tipo'), copia: t('componentList.col.copia'), acciones: t('common.actions') };` (línea ~148).
  - Columna `copia` (línea ~24): `getValue: (c) => (c.copyOf ? t('common.yes') : t('common.no'))`.
  - Fila de grupo (línea ~68): `type: t('componentList.groupRowType')` (valor "Grupo" que se muestra en la columna Tipo de la fila de grupo).
- [x] **`src/ui/resourceList.js` — `headLabels` y menú "+ Añadir recurso".**
  - `const headLabels = { nombre: t('common.name'), usos: t('resourceList.col.usos'), tipo: t('resourceList.col.tipo'), acciones: t('common.actions') };` (línea ~73).
  - `addItem(t('resourceList.addMenu.file'), null, onAddFile)` (~197); `addItem(t('resourceList.addMenu.multiple'), null, onAddMultiple)` (~198); `addItem(t('resourceList.addMenu.folder'), t('resourceList.addMenu.folderNote'), onAddFolder)` (~199).
- [x] **`src/ui/tagList.js` — `headLabels`.**
  - `const headLabels = { nombre: t('common.name'), elementos: t('tagList.col.elementos'), acciones: t('common.actions') };` (línea ~64).

### Modal de componente

- [x] **`src/ui/componentModal.js` — título, pestañas, leyendas, defaults, títulos de sub-modal, tooltip.**
  - `header.textContent = component ? t('componentModal.editTitle') : t('componentModal.createTitle')` (línea ~283).
  - `createTab('general', t('componentModal.tab.general'))` (~333); `createTab('visual', t('componentModal.tab.visual'))` (~338); `createTab('specific', t('componentModal.tab.specific'))` (~939); `createTab('copias', t('componentModal.tab.copias'))` (~943).
  - `extrusionLegend.appendChild(document.createTextNode(t('componentModal.borderLegend.extrusion')))` (~665). *(Ojo: `createTextNode`, no `textContent` — el `<legend>` lleva un checkbox delante.)*
  - `borderLegend.appendChild(document.createTextNode(t('componentModal.borderLegend.border')))` (~1226).
  - `textoCartaRevelada` default: en el objeto de defaults (línea ~163) NO se puede meter `t()` directo si es un objeto de módulo evaluado una vez. **Verificar en implementación**: si `DEFAULT_MAZO_PROPERTIES` (o similar) es `const` de módulo, dejar el valor como cadena vacía `''` y resolver el fallback en el punto de uso; o convertir a getter. Coordinar con `componentRenderer.js` línea ~540 (mismo texto, fallback de render). Clave: `t('mazo.revealZone.default')` = "Carta revelada" / "Revealed card".
  - `fontCurrentName.textContent = resource ? resource.name : t('common.fontDefault')` (~1489). ("Por defecto" / "Default".)
  - `title: t('componentModal.designBoardTitle')` (~1674, "Diseñar tablero personalizado"); `title: t('componentModal.designCardTitle')` (~1727, "Diseñar carta"); `title: t('common.chooseImage')` (~2080, "Elegir imagen").
  - `pasteStyleBtn.title = hasStyleClipboard() ? '' : t('componentModal.pasteStyleDisabledTitle')` (~1807, "Pegar estilo (nada copiado)").
  - **Textos de `createHelpIcon({ text: '...' })`** (~18 ocurrencias, líneas ~489, ~510, ~529, ~559, ~609, ~624, ~667, ~896…): cada uno → `t('help.componentModal.<slug>')`. El texto español actual va literal a `CATALOG_ES`; traducción al inglés a `CATALOG_EN`. Los textos con comillas simples internas y `<b>`/`<i>` etc. se copian tal cual a la clave (van por `textContent` en `helpIcon.js` para texto plano, por `innerHTML` solo si se pasa `html` — aquí es `text`, plano).
- [x] **`src/ui/cardShapeModal.js` — leyenda "Borde", título "Elegir imagen".**
  - `borderLegend.appendChild(document.createTextNode(t('common.border')))` (~341).
  - `title: t('common.chooseImage')` (~276).
- [x] **`src/ui/cardTextBoxModal.js` — leyenda "Borde", "Por defecto".**
  - `borderLegend.appendChild(document.createTextNode(t('common.border')))` (~302).
  - `fontCurrentName.textContent = resource ? resource.name : t('common.fontDefault')` (~60).

### Render y menú contextual

- [x] **`src/ui/componentRenderer.js` — mapa de nombres de tipo, fallback de zona de revelado.**
  - Mapa `{ texto: 'Texto', tableroSimple: 'Tablero simple', dado: 'Dado Configurable', documento: 'Documento', carta: 'Carta/Ficha', mazo: 'Mazo' }` (~línea 259). **Reutilizar las claves `componentType.*` que ya existen** (de 00244): sustituir el uso del mapa por `t('componentType.' + type)` en el punto de consumo, o convertir el mapa a getters. Comprobar quién lo consume (probablemente `formatComponentIdentifier` o el label de identificación) y que el texto resultante coincida con lo que ya devuelve `getComponentTypeLabel` de `componentTypeModal.js` — si es el mismo propósito, usar esa función y eliminar el mapa duplicado. **Decidir en implementación** por la vía de menor cambio; si `getComponentTypeLabel` da exactamente el mismo texto, importarla y usarla.
  - `zone.textContent = mazo.properties?.textoCartaRevelada ?? t('mazo.revealZone.default')` (~540).
- [x] **`src/ui/contextMenu.js` — placeholder del select de etiqueta.**
  - `placeholder.textContent = options.length === 0 ? t('contextMenu.tagSelect.empty') : t('contextMenu.tagSelect.placeholder')` (~61). ("Sin etiquetas" / "Elegir etiqueta…".)

### Otros modales

- [x] **`src/ui/elementSelectionModal.js` — títulos de los bloques del checklist.**
  - `{ key: 'componentIds', title: t('elementSelection.block.components'), ... }` (~23); `{ key: 'resourceIds', title: t('elementSelection.block.resources'), ... }` (~24); `{ key: 'tagIds', title: t('elementSelection.block.tags'), ... }` (~25). ("Componentes"/"Recursos"/"Etiquetas".) Nota: el array se re-crea en cada apertura del modal, un `t()` directo vale.
- [x] **`src/ui/importReportModal.js` — `ERROR_LABELS` y cabeceras de columna.**
  - `ERROR_LABELS` (mapa de módulo, líneas ~7-11): convertir a función `errorLabelFor(tipo)` que devuelve `t('importReport.errorType.' + tipo)`, o resolver `t()` en el punto de consumo (línea ~48). Claves: `importReport.errorType.recurso` = "Recurso no incluido"/"Resource not included"; `.etiqueta` = "Etiqueta no incluida"/"Tag not included"; `.etiquetaDuplicada` = "Nombre de etiqueta duplicado"/"Duplicate tag name".
  - Cabeceras de columna (línea ~34): `for (const label of [t('importReport.col.component'), t('importReport.col.error'), t('importReport.col.solution'), t('importReport.col.element')])`. ("Componente afectado"/"Error"/"Solución"/"Elemento erróneo/faltante".)
- [x] **`src/ui/resourceModal.js` — botones de zoom.**
  - `createZoomButton(t('resourceModal.zoom.in'), ICON_ZOOM_IN)` (~127); `createZoomButton(t('resourceModal.zoom.out'), ICON_ZOOM_OUT)` (~128); `createZoomButton(t('resourceModal.zoom.reset'), ICON_RESET)` (~129). ("Ampliar"/"Reducir"/"Restablecer vista".)
- [x] **`src/ui/resourceReplaceConfirmModal.js` — header.**
  - `header.textContent = names.length === 1 ? t('resourceReplace.titleSingle') : t('resourceReplace.titleMulti')` (~16). ("Recurso duplicado"/"Recursos duplicados".)
- [x] **`src/ui/tagModal.js` — header.**
  - `header.textContent = tag ? t('tagModal.editTitle', { name: tag.name }) : t('tagModal.newTitle')` (~20). Clave `tagModal.editTitle` = `'Etiqueta: {name}'` / `'Tag: {name}'`; `tagModal.newTitle` = "Nueva etiqueta" / "New tag".
- [x] **`src/ui/visualEditorModal.js` — menú "Añadir elemento", maximizar/restaurar, label de cara.**
  - `addItem(t('visualEditor.addMenu.bgImage'), onAddImage)` (~210); `addItem(t('visualEditor.addMenu.bgColor'), onAddColor)` (~211); `addItem(t('visualEditor.addMenu.textBox'), onAddTextBox)` (~212); `addItem(t('visualEditor.addMenu.shape'), onAddShape)` (~213).
  - `const label = maximized ? t('visualEditor.restore') : t('visualEditor.maximize')` (~419). ("Restaurar tamaño"/"Maximizar".)
  - `label: label || t('visualEditor.faceDefault')` (~745, "Diseño"/"Design").
  - `title: t('common.chooseImage')` (~1024).
- [x] **`src/ui/componentCopiesModal.js` — "Sí"/"No".**
  - `text.textContent = isSynced ? t('common.yes') : t('common.no')` (~78).
- [x] **`src/ui/componentTitleModal.js`, `src/ui/copyComponentModal.js`, `src/ui/groupModal.js` — textos de `createHelpIcon`.**
  - Cada `text: '...'` de `createHelpIcon` → `t('help.<modulo>.<slug>')`, con el texto español actual en `CATALOG_ES` y su traducción en `CATALOG_EN`. Varios textos son idénticos entre módulos (p. ej. el de "Oculto") — **reutilizar la misma clave** cuando el texto es literalmente el mismo.
- [x] **`src/modes/edit/editMode.js` — tipo "Grupo" en la lista de afectados.**
  - `...affectedGroupIds.map((id) => ({ id, type: t('componentList.groupRowType') }))` (~línea 418). Misma clave que `componentList.js`.

### Capa core

- [x] **`src/core/importMerge.js` — textos de `solucion`.**
  - `import { t } from './i18n.js'`. Líneas ~222/239/261/272: `solucion: t('importReport.solution.tagRenamed')` / `.componentWithoutResource` / `.tagLinkedToExisting` / `.tagAutoCreated`. Textos español actuales a `CATALOG_ES`, traducción a `CATALOG_EN`.
  - **Verificar ausencia de ciclo**: `i18n.js` importa solo `eventBus.js`, `appTitle.js`, `data/i18n.es.js`, `data/i18n.en.js` (datos puros). `importMerge.js` no está en esa cadena → seguro. `node --check` tras el cambio.
- [x] **`src/core/fichaMigration.js` — mensajes de error de conversión.**
  - `import { t } from './i18n.js'`. Líneas ~35/46/65: `errors.push(t('fichaMigration.error.missingDesign'))` / `t('fichaMigration.error.missingShape')` / `` `${t('fichaMigration.error.unknownShape')} ("${forma}")` `` / `t('fichaMigration.error.incompleteImageAdjust')`. Mantener la interpolación de `forma` fuera de la clave.
- [x] **`src/core/persistence.js` — `detail` de `parseImportedComponents`.**
  - `import { t } from './i18n.js'`. Línea ~78: `return { error: true, detail: t('persistence.importParseError') };`. ("El fichero no contiene un listado de componentes válido." / "The file does not contain a valid component list.")
  - **Verificar ciclo**: `persistence.js` importa `data/version.js` y `core/appTitle.js`. `i18n.js` importa `core/appTitle.js` también. No hay ciclo (`appTitle.js` → solo `version.js`; `i18n.js` no importa `persistence.js`). `node --check` + carga de módulos tras el cambio.

### Cierre

- [x] **`src/data/i18n.es.js` / `src/data/i18n.en.js` — verificar paridad de claves.**
  - Todas las claves nuevas presentes en **ambos** catálogos (mismo conjunto exacto). Comprobar con un script rápido de comparación de `Object.keys` (como se hizo en 00244). Sin duplicados.
- [x] **Verificar que no queda ningún literal de chrome sin `t()`.**
  - `grep -rn` sobre `src/ui/`, `src/modes/`, `src/core/` de patrones `textContent = '[A-ZÁÉÍÓÚÑ]`, `createTextNode('[A-ZÁÉÍÓÚÑ]`, `.title = '[A-ZÁÉÍÓÚÑ]`, `placeholder = '[A-ZÁÉÍÓÚÑ]`, `addItem('[A-ZÁÉÍÓÚÑ]`, `label: '[A-ZÁÉÍÓÚÑ]`, `title: '[A-ZÁÉÍÓÚÑ]`, `text: '[A-ZÁÉÍÓÚÑ]` — filtrando los ya conocidos no-traducibles (símbolos `✓ ! ? % º`, `'Español'`/`'English'`, ids de tipo, teclas). El resultado debe quedar vacío de chrome real.

## (e) Verification

- [x] Abrir la app en inglés (borrar `localStorage['bgfactory:lang']` con `navigator.language` no español, o elegir "English" en el panel de configuración). Entrar en modo edición y abrir los tres paneles flotantes: las cabeceras de tabla están en inglés ("Order/Id/Type/Copy/Actions", "Name/Uses/Type/Actions", "Name/Elements/Actions"). Volver a español: vuelven a "Orden/Id/Tipo/Copia/Acciones", etc.
- [x] Abrir el modal de propiedades de un componente en inglés: el título y las cuatro pestañas ("General/Visual/Specific/Copies") están en inglés. La leyenda "Border"/"Extrusion" de las secciones también.
- [x] Menú "+ Add resource" en inglés: las tres opciones y la nota de "folder" están traducidas. Menú "Add element" del editor visual: las cuatro opciones traducidas.
- [x] Abrir el menú de una columna filtrable y el desplegable de "Add to tag" del menú contextual: el placeholder ("Choose tag…" / "No tags") está traducido.
- [x] Pulsar el icono "?" de ayuda en el modal de componente, el de copia y el de grupo (en inglés): el texto de ayuda está en inglés.
- [x] Editor de un recurso Imagen en inglés: los botones de zoom ("Zoom in / Zoom out / Reset view") y el botón maximizar/restaurar del editor visual están traducidos.
- [x] Provocar una importación que genere el informe final (fichero con una referencia a un recurso no incluido): las cabeceras de columna, los tipos de error y los textos de solución del informe están en el idioma activo. Provocar el error de fichero no válido: el mensaje está traducido.
- [x] Identificar un componente al pasar el ratón / seleccionarlo en modo edición: el nombre de tipo ("Text", "Simple board", "Deck"…) coincide con el idioma activo y con el que muestra el modal "Add component".
- [x] Un mazo sin `textoCartaRevelada` configurado muestra el texto por defecto de la zona de revelado en el idioma activo.
- [x] `grep` de literales de chrome sin `t()` en `src/ui/`, `src/modes/`, `src/core/`: resultado vacío (salvo símbolos, "Español"/"English", ids de tipo y teclas).
- [x] Los dos catálogos `data/i18n.es.js` y `data/i18n.en.js` tienen exactamente el mismo conjunto de claves (comparación de `Object.keys`), sin duplicados.
- [x] `node --check` pasa en todos los ficheros modificados. Carga del grafo de módulos (simulada en node) sin fallo de import circular.
- [x] `python src/scripts/build.py` genera el HTML autocontenido sin error (revertir después el bump de `version.js` y el artefacto de build — no forman parte del fix).
- [x] Ningún cambio en el objeto de estado, la persistencia (`bgfactory:state`) ni el formato de export/import: un juego exportado antes y después del fix produce el mismo JSON.
