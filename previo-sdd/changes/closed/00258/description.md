- **Name**: Batería de tests para las funcionalidades 038 (Aplicación multi-idioma y panel de configuración) y 040 (Catálogo de propiedades de componentes, grupos y etiquetas)
- **Code**: 00258
- **Type**: change
- **Creation date**: 2026-09-09

## Full description

Las funcionalidades 038 ("Aplicación multi-idioma y panel de configuración") y 040
("Catálogo de propiedades de componentes, grupos y etiquetas") no tienen actualmente
ningún test funcional que las valide: en el mapa de trazabilidad funcionalidad ↔ tests
aparecen ambas sin ningún test asociado. La regla de cobertura del proyecto exige que
toda funcionalidad que aporta comportamiento tenga sus tests, así que estas dos lagunas
hay que cerrarlas.

Este cambio consiste en añadir esas dos baterías de tests: dos conjuntos nuevos de casos
de prueba automatizados, uno dedicado en exclusiva a la funcionalidad 038 y otro a la 040.
Es la continuación de la misma tanda de cierre de lagunas de cobertura que los cambios
00254 (funcionalidad 19), 00255 (funcionalidad 20), 00256 (funcionalidad 23) y 00257
(funcionalidad 25). Se toman como plantilla los conjuntos de tests ya existentes de esa
misma tanda.

No cambia ningún comportamiento de la aplicación: es trabajo de cobertura de pruebas, no
de producto. Nada de lo que se añade llega a la aplicación entregable. El mapa de
trazabilidad se regenera solo al pasar la batería de tests.

### Alcance acordado con el usuario

- **Un conjunto de tests por funcionalidad** (coherente con la tanda 00254–00257): uno
  para la 038 y otro para la 040, cada uno declarando su funcionalidad principal y con
  códigos de caso `FT-038-nn` y `FT-040-nn` respectivamente.
- Para la 038, el comportamiento de idioma se cubre tanto a nivel lógico (detección,
  cambio, persistencia, resolución de textos) como a nivel de interfaz (el panel de
  Configuración: apertura, contenido y actualización en vivo al cambiar el idioma con el
  panel abierto).
- Para la 040 (una "ficha de catálogo": un inventario de pestañas, secciones y campos de
  las tres ventanas de propiedades), el alcance es **la estructura observable de esas tres
  ventanas**: qué pestañas hay y en qué orden, qué secciones y campos aparecen o no según
  el tipo de componente, y el footer de cada ventana. No se reverifica lo que ya cubre el
  conjunto de tests de la funcionalidad 002 (número de pestañas y validación de
  identificador), salvo lo que es propio del catálogo.

### Qué comportamientos de la funcionalidad 038 se validan

1. **Detección automática de idioma al arrancar.** La primera vez, sin ninguna preferencia
   guardada, el idioma se deduce del idioma del navegador: si es español, arranca en
   español; en cualquier otro caso, en inglés. Esa deducción automática no se guarda como
   preferencia.
2. **La preferencia guardada tiene prioridad.** Si hay un idioma elegido guardado, se
   respeta por encima de la detección automática en las siguientes visitas. Si el valor
   guardado no existe o no es uno de los idiomas soportados, se vuelve a la detección
   automática.
3. **Cambio de idioma en caliente.** Elegir otro idioma cambia el idioma activo, guarda esa
   elección y avisa al resto de la aplicación de que el idioma ha cambiado. Elegir el
   idioma que ya está activo, o un idioma no soportado, no hace nada.
4. **Resolución de textos.** Cada texto se busca primero en el idioma activo, luego en
   español (referencia canónica) y, si no está en ninguno, se muestra la propia clave. Los
   textos admiten sustituir parámetros dentro del texto y elegir forma singular o plural
   según una cantidad. Los idiomas soportados son español e inglés, y el idioma por
   defecto es el español.
5. **Catálogos de textos.** El catálogo español está completo (es la referencia). Toda
   clave que exista en el catálogo inglés existe también en el español: el inglés puede
   ser un subconjunto, nunca al revés.
6. **Panel de Configuración: apertura y contenido.** Al abrirlo aparece una ventana con el
   aspecto estándar de la aplicación que contiene, de arriba a abajo: un selector de
   idioma con las opciones "Español" y "English" (cada una escrita en su idioma, no
   traducidas) y la actual marcada; un campo "Texto en la mesa" para escribir un texto
   libre de varias líneas, con el texto actual ya cargado; una nota bajo el campo; la
   versión actual como texto de solo lectura, que siempre muestra "BG Factory" seguido de
   la versión con independencia del título que el usuario le haya dado a su partida; un
   enlace al repositorio en GitHub que abre en una pestaña nueva y cuyo texto sigue el
   idioma activo; y un botón "Cerrar".
7. **Texto en la mesa.** Escribir o borrar en el campo actualiza el texto de la mesa al
   instante. El valor por defecto es vacío. Se guarda y se recupera tal cual. Se muestra
   como texto plano, sin interpretar HTML ni ningún otro código. Es una preferencia local
   del navegador: no se incluye al exportar una partida.
8. **Cambio de idioma con el panel abierto.** Si se cambia el idioma mientras el panel de
   Configuración está abierto, todo su contenido se vuelve a mostrar en el nuevo idioma
   sin que la ventana se cierre. El panel deja de reaccionar a los cambios de idioma en
   cuanto se cierra.
9. **Cierre del panel.** La ventana se cierra con el botón "Cerrar" y pulsando fuera del
   panel. Por cualquiera de las dos vías, el panel deja de estar suscrito a los cambios de
   idioma.

### Qué comportamientos de la funcionalidad 040 se validan

**Ventana de propiedades del componente:**

1. **Estructura de pestañas.** La ventana tiene exactamente cinco pestañas y en este
   orden: "Generales", "Apariencia", "Específicas", "Interacciones" y "Copias". La pestaña
   activa al abrir es siempre "Generales".
2. **Footer común.** Botones "Eliminar" (solo al editar un componente que ya existe),
   "Cancelar" y "Aceptar". "Aceptar" queda deshabilitado si el identificador no es válido.
3. **Pestaña "Generales" (común a todos los tipos).** Campo "Identificador" arriba del
   todo; sección "General" con Bloqueado, Oculto en modo juego y Subir al
   mover/interactuar; sección "Ayuda al jugador" con Mostrar título y "Editar título de
   componente…", y Mostrar tooltip y "Texto del tooltip"; sección "Etiquetas" con las
   casillas de etiquetas existentes y "Crear nueva etiqueta…".
4. **Pestaña "Apariencia" (según tipo).** "Tamaño" siempre presente (Alto, Ancho, Mantener
   proporción); "Estilo" solo para el dado; "Forma" solo para el mazo; "Borde" solo para
   los tableros (simple y personalizado); "Extrusión" siempre presente; "Efecto" solo para
   cuadro de texto y los dos tableros. Se comprueba con un componente de cada tipo
   relevante que la sección aparece o no según corresponde.
5. **Pestaña "Específicas" (según tipo).** El contenido cambia por completo según el tipo.
   Se comprueba el bloque distintivo de, al menos: cuadro de texto ("Contenido"), dado
   ("Configuración de caras", "Número máximo de caras", "Lista de valores", "Tipografía
   del resultado"), mazo ("Cartas reveladas", "Imagen", "Ver contenido del mazo") y carta
   ("Proporción", "Editar diseño de la carta", "Estilo").
6. **Pestaña "Interacciones".** Siempre presente para todos los tipos; contiene la sección
   "Interacciones programadas" con al menos la fila fija "Clic derecho", de modo que nunca
   queda vacía.
7. **Pestaña "Copias".** Muestra el mensaje "Sin copias" cuando el componente no tiene
   copias vinculadas.
8. **Valores por defecto del modelo.** Un componente recién creado de cada tipo (dado,
   tablero simple, tablero personalizado, visor de documentos, carta, mazo) tiene las
   propiedades por defecto documentadas para ese tipo.

**Ventana "Propiedades del grupo":**

9. Una sola pestaña, "General". Campo "Id del grupo". Sección "General" con Bloqueado,
   Oculto, Mostrar tooltip, Mostrar título de componente y Subir al mover/interactuar.
   Sección "Etiquetas". Footer con "Cancelar" y "Guardar" (no "Aceptar"), sin botón
   "Eliminar". Reutiliza los mismos rótulos que la pestaña "Generales" del componente
   donde aplica. No tiene pestañas "Apariencia", "Específicas" ni "Copias", ni campos de
   tamaño.

**Ventana "Propiedades de la etiqueta":**

10. Sin pestañas ni secciones. El título es "Nueva etiqueta" al crear y "Etiqueta:
    {nombre}" al editar. Campo "Nombre". Al editar una etiqueta que ya existe: lista
    "Elementos de la etiqueta (N)" con un botón "Sacar" por elemento; footer con
    "Eliminar" (solo al editar), "Cancelar" y "Aceptar" ("Aceptar" deshabilitado si el
    nombre no es válido). Al crear: sin lista de elementos y sin botón "Eliminar".

### Fuera de alcance

- El catálogo exhaustivo campo por campo de las tablas de la ficha 040 (la posición
  vertical exacta de cada campo por tipo): se comprueba la presencia o ausencia de las
  secciones y campos distintivos según el tipo, no la posición numérica de cada fila.
- La lógica interna de cada sub-ventana que se abre desde la ventana de propiedades del
  componente (el editor visual, la edición de figura, la elección de imagen, etc.): la
  ficha 040 las cataloga, pero su comportamiento lo cubren o lo cubrirán sus propias
  fichas. Aquí solo se comprueba, como mucho, que el botón que abre cada una existe en la
  pestaña que corresponde.
- El aspecto visual y los estilos: la batería de tests no carga la hoja de estilos, así
  que solo se comprueba la existencia y el orden de los elementos, no su apariencia ni su
  comportamiento al pasar el ratón.
- Reverificar la validación de identificador y el número de pestañas que ya cubre el
  conjunto de tests de la funcionalidad 002.
- No se toca código de producción. El mapa de trazabilidad se regenera solo al pasar la
  batería de tests.

### Relación con otras entradas

Misma tanda de cierre de lagunas de cobertura que los cambios 00254, 00255, 00256 y
00257.

## Technical notes

- **Framework de tests:** `src/test/`, dev-only. Descrito en
  `previo-sdd/design/docs/architecture/011-functional-test-framework.md`. Motor propio en
  navegador headless (`src/test/harness.js`); niveles `state` (importar `core/*`, llamar
  acciones, comprobar getters/eventos) y `ui` (`mountEditMode()` / `mountPlayMode()` de
  `src/test/helpers.js`, comprobar el DOM de `#content` + estado). Un fichero por
  funcionalidad o grupo, con `registerFeature({ primary, secondary? })` una vez por
  fichero y casos nombrados `FT-<NNN>-<nn>`. `src/test/TRACEABILITY.md` se regenera en
  cada `npm test` (no editar a mano). El runner **no** carga `main.js` ni el CSS
  (`test.decision.no-main-js`): el código de render que solo vive en `main.js` y no está
  exportado hay que replicarlo mínimamente dentro del fichero de test (patrón ya usado en
  `src/test/functional/version-indicator.test.js` con `renderAppVersionInto`).
- **Ficheros nuevos propuestos:** `src/test/functional/multi-idioma.test.js`
  (`registerFeature({ primary: 38 })`) y `src/test/functional/catalogo-propiedades.test.js`
  (`registerFeature({ primary: 40 })`). Plantillas de referencia:
  `src/test/functional/dado.test.js`, `.../version-indicator.test.js`,
  `.../component-modal-tabs.test.js`.
- **Funcionalidad 038 — módulos implicados:**
  - `src/core/i18n.js`: `initI18n()`, `getLanguage()`, `getLocale()`, `setLanguage(code)`,
    `t(key, params?)`, `SUPPORTED_LANGUAGES = ['es','en']`, `DEFAULT_LANGUAGE = 'es'`.
    Detección de arranque: `localStorage['bgfactory:lang']` si está en
    `SUPPORTED_LANGUAGES`, si no `navigator.language.startsWith('es') ? 'es' : 'en'` (la
    autodetección no se persiste). `setLanguage`: no-op si el código no está soportado o
    ya es el activo; si aplica, escribe `localStorage['bgfactory:lang']` (try/catch),
    cambia el idioma activo, llama a `applyDocumentLanguage()` (fija
    `document.documentElement.lang` y `document.title`) y emite `'language:changed'` con el
    código. `t()`: cadena de respaldo `CATALOG[activo][clave]` → `CATALOG['es'][clave]` →
    `clave`; plural con entrada `{ one, other }` + `params.count`; interpolación de
    `{nombre}` con `params`.
  - `src/data/i18n.es.js` (`CATALOG_ES`, referencia canónica completa) y
    `src/data/i18n.en.js` (`CATALOG_EN`, puede ser subconjunto). Objetos de datos puros.
  - `src/ui/settingsModal.js`: `openSettingsModal()` monta `.modal-overlay > .modal` en
    `document.body`. `renderContent()` construye: cabecera `t('settings.title')`; `<select>`
    de idioma con opciones literales fijas `{ es: 'Español', en: 'English' }`, `change` →
    `setLanguage`; `<hr class="modal__separator">`; `<textarea id="settings-table-text">`
    (`rows=3`, `maxLength=500`) con valor `getTableText()`, `input` → `setTableText`; hint
    `p.modal__hint`; otro separador; `div.settings-modal__version` =
    `getVersionedProductName()`; `div.settings-modal__repo > a`
    `href="https://github.com/yeyopepe/bgfactory"`, `target="_blank"`, `rel="noopener"`,
    texto `t('appVersion.repoLink')`; footer `button.btn-cancel` con texto
    `t('common.close')` → `close()`. Se suscribe con `on('language:changed', renderContent)`
    al abrir y se da de baja en `close()`. Cierre: botón "Cerrar" o `mousedown` sobre el
    overlay seguido de `click` sobre el overlay (secuencia, no un simple `click`, para no
    cerrar si el arrastre empezó dentro del panel).
  - `src/core/appTitle.js`: `getVersionedProductName()`, `formatVersion()` (derivan de
    `CURRENT_VERSION` en `src/data/version.js`).
  - `src/core/state.js`: `getTableText()` / `setTableText()`. `resetState()` de
    `helpers.js` llama a `loadTableText('')`. El texto de la mesa no está en
    `serializedFields` ni en el JSON de exportación.
  - Persistencia de idioma: clave `localStorage` `bgfactory:lang`, separada del slot de
    estado `bgfactory:state`. `resetState()` también borra `bgfactory:lang`.
  - `mountEditMode`/`mountPlayMode` llaman a `ensureI18n` de forma idempotente.
- **DISCREPANCIA doc ↔ código (038):** la ficha
  `previo-sdd/design/docs/features/038-aplicacion-multi-idioma-y-panel-de-configuracion.md`
  dice que el panel de Configuración se cierra también "con la tecla Escape", pero
  `src/ui/settingsModal.js` **no** tiene ningún manejador de `keydown`/Escape: solo cierra
  con el botón "Cerrar" y con clic fuera del panel. Los tests de 038 reflejan el
  comportamiento real (botón + clic fuera) y **no** afirman cierre con Escape. Sugerencia
  de cambio de doc para `pv-how`: quitar la mención a Escape de la ficha 038, o abrir una
  entrada aparte si se decide que Escape debe implementarse (sería tocar código de
  producción, fuera del alcance de este cambio). Además, la ficha habla de cerrar
  "pulsando fuera del panel"; el código lo implementa como `mousedown` + `click` sobre el
  overlay: los tests reproducen esa secuencia.
- **Funcionalidad 040 — módulos implicados:**
  - `src/ui/componentModal.js`: `openComponentModal({ component, onAccept, onDelete })`
    monta `.modal-overlay > .modal` en `document.body` con `.modal__tabs` y 5
    `.modal__tab` (`general`, `visual` = "Apariencia", `specific` = "Específicas",
    `interacciones`, `copias`; claves i18n `componentModal.tab.general` / `.visual` /
    `.specific` / `.interacciones` / `.copias`); footer con botón de eliminar solo al
    editar y botón de aceptar deshabilitado con id inválido. `createDefaultComponent(type)`
    y las constantes exportadas `DEFAULT_BOARD_PROPERTIES`, `DEFAULT_DADO_PROPERTIES`,
    `DEFAULT_DOCUMENTO_PROPERTIES`, `DEFAULT_CARTA_PROPERTIES`, `DEFAULT_MAZO_PROPERTIES`,
    `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`.
  - `src/ui/groupModal.js`: `openGroupModal({ group, onAccept, onCancel })`. Una pestaña
    "General". Reutiliza claves i18n de la pestaña "Generales" del componente
    (`componentModal.hidden`, `componentModal.showTitle`, `componentModal.raiseOnMove`,
    `componentModal.tagsLegend`). Footer con `common.cancel` y `common.save`.
  - `src/ui/tagModal.js`: `openTagModal({ tag, onAccept, onDelete, onRemoveFromTag,
    onRemoveGroupFromTag })`. Sin pestañas. Título `tagModal.newTitle` /
    `tagModal.editTitle`. Footer con `common.delete` (solo al editar), `common.cancel`,
    `common.accept`.
  - Catálogo completo de claves i18n, propiedades del modelo y condiciones de visibilidad
    por tipo: `previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md`
    (Tablas A y B). Fichas técnicas de apoyo: `architecture/002-component-model.md`,
    `architecture/003-component-types.md`, `architecture/006-ui-layer.md`,
    `architecture/005-modes.md`, `architecture/004-groups-resources.md`.
  - Ya existe `src/test/functional/component-modal-tabs.test.js` (funcionalidad 002, con
    `primary: 2`, códigos continuando desde `FT-002-13`) que cubre la estructura de 5
    pestañas y la validación de id. Los tests de 040 deben centrarse en lo propio del
    catálogo (secciones y campos por tipo, modales de grupo y etiqueta) y no duplicar eso.
- **Nivel de los casos:** 038 mezcla `state` (i18n, catálogos, `getTableText`/
  `setTableText`) y `ui` (panel de Configuración). 040 es sobre todo `ui`
  (`openComponentModal`/`openGroupModal`/`openTagModal` + comprobación del DOM), con algún
  caso `state` para los valores por defecto del modelo.
- **Seguridad:** cambio dev-only, no entra en el entregable, no toca red, dependencias ni
  secretos. Los tests solo verifican comportamiento existente (texto de la mesa pintado
  con `textContent`; enlace a GitHub ya con `rel="noopener"`). Sin puntos pendientes.
