- **Name**: Ampliar la cobertura de tests de las funcionalidades ya cubiertas parcialmente
- **Code**: 00241
- **Type**: change
- **Creation date**: 2026-09-06

## Full description

Ocho funcionalidades del proyecto tienen hoy **algún** test funcional, pero ninguna cubre su comportamiento completo: cada una tiene entre uno y tres casos que validan un camino feliz muy concreto, dejando fuera la mayor parte de lo que describe su ficha funcional (casos límite, estados alternos, ramas condicionales, validaciones). Este cambio consiste en llevar esas ocho baterías al nivel de "cubren todo el comportamiento observable de su ficha", añadiendo los casos que faltan.

Las ocho funcionalidades y su cobertura actual:

| Funcionalidad | Casos hoy |
|---|---|
| 002 — Alta/edición/borrado de componentes con modal de tabs | 3 (crear una carta; crear uno de cada tipo básico; eliminar) |
| 005 — Elementos tipo Copia, vinculados y sincronizados con un original | 1 (un cambio de diseño del original se propaga a la copia) |
| 016 — Componente oculto en modo juego | 1 (oculto no se pinta en juego y sí en edición con su insignia) |
| 022 — Componente "carta" | 0 propios (solo cobertura secundaria desde el test de la 005) |
| 029 — Autoguardado en el navegador | 2 (tras crear un componente el estado guardado lo contiene; una nueva carga lo recupera) |
| 032 — Exportar/importar componentes en JSON, con selección | 1 (exportar produce el formato esperado y reimportar reproduce el componente) |
| 036 — Contenido de ejemplo al arrancar una partida nueva | 1 (arranque nuevo: sin componentes y con los recursos de ejemplo sembrados) |
| 039 — Barra de controles superior: modos, importar y exportar | 2 (alternar de modo emite el evento; la barra pinta Importar/Exportar/Modo según el modo) |

El informe de trazabilidad funcionalidad ↔ tests no se edita a mano: se regenera al ejecutar la batería y reflejará por sí solo la cobertura ampliada. Las fichas funcionales de estas ocho funcionalidades ya están revisadas y son correctas; este cambio **no** las modifica.

### Qué comportamientos faltan por cubrir, por funcionalidad

Lista de partida de los huecos detectados frente a cada ficha. La lista definitiva y su desglose en casos concretos (`FT-NNN-nn`) los fija la fase de planificación; aquí se acota el alcance.

**002 — Alta/edición/borrado de componentes**
- Validación del identificador: no se permite vacío; no se permite duplicado de otro componente existente.
- Al editar un componente ya existente aparece la acción "Eliminar" (no aparece al crear uno nuevo); pide confirmación; al confirmar borra el componente y, si era el seleccionado en el editor, limpia también esa selección.
- La modal previa de tipos ofrece los 7 tipos ("Cuadro de texto", "Tablero simple", "Tablero personalizado", "Dado Configurable", "Visor de documentos", "Carta/Ficha", "Mazo"); al aceptar, el componente se crea de inmediato con los valores por defecto de ese tipo.
- El tipo de un componente no se puede cambiar una vez creado.
- La modal siempre abre con la pestaña "Generales" activa.
- La pestaña "Generales" contiene el desplegable "Bloqueado" ("Ninguno" por defecto para cualquier tipo) y los checkboxes "Oculto", "Mostrar tooltip" y "Subir al mover/interactuar" (con sus valores por defecto por tipo).
- Editar una propiedad de un componente existente y aceptar deja esa propiedad cambiada en el estado.

**005 — Elementos tipo Copia**
- El id de una copia es el del original con sufijo `-COPY-XXX` (3 dígitos, primer hueco libre); al borrar una copia, su hueco se reutiliza en la siguiente.
- Cambiar el id del original renombra automáticamente los ids de todas sus copias, conservando el sufijo.
- Qué se sincroniza al editar el original: tipo/nombre/imagen/tamaño/etiqueta y propiedades de diseño del tipo. Qué NO se sincroniza: posición en la mesa, orden de apilado y resultado de interacción (cara de carta, resultado de dado) — cada copia independiente.
- "Bloqueado" y "Oculto" con checkbox "Sincronizado" propio: marcado, siguen al original; desmarcado, la copia tiene su propio valor; al volver a marcar, adopta el valor actual del original.
- No se admiten copias de copias.
- Borrado en cascada: al eliminar el original se eliminan todas sus copias; eliminar una copia no afecta al original ni a las demás.
- "Copia" no es un tipo del alta de componentes.
- Distintivo visual en modo edición: insignia roja permanente sobre la copia; contorno y etiqueta en rojo mientras está seleccionada o bajo el cursor; nada de esto en modo juego.

**016 — Componente oculto en modo juego**
- El checkbox "Oculto" está desmarcado por defecto; un componente sin ese campo se comporta como desmarcado.
- Un componente oculto, en modo juego: no se pinta, no se puede seleccionar ni interactuar, no aparece en el menú contextual.
- En modo edición un componente oculto se sigue mostrando, seleccionando, moviendo, redimensionando y editando con normalidad, con su insignia de ojo tachado.
- La insignia de "Oculto" y la de "Bloqueado" conviven sin solaparse cuando el componente tiene ambas.
- Cubrir el comportamiento para varios tipos de componente, no solo "carta".

**022 — Componente "carta"** (batería propia, hoy inexistente)
- Al crear una carta nace mostrando la cara **trasera** (modo juego y modo edición).
- En modo juego, un click sobre la carta voltea entre cara frontal y trasera; el volteo funciona esté "Bloqueado" o no.
- Proporción por defecto Poker vertical 5:7; el redimensionado en la mesa mantiene la proporción configurada para las proporciones fijas.
- Proporciones "Circular" y "Libre": el redimensionado no fuerza ratio (ancho y alto independientes); al crear/cambiar a "Circular" nace con ancho = alto.
- Proporciones hexagonales y triangulares: ratio fijo al redimensionar.
- Una cara sin diseño se muestra en blanco con la proporción configurada, sin aviso.
- El diseño de cada cara es propio de esa carta (no hay plantillas compartidas).

**029 — Autoguardado en el navegador**
- El autoguardado dispara ante alta, edición, movimiento, redimensionado y borrado de un componente (no solo alta).
- Se guarda también el estado de los tres paneles flotantes (Componentes, Recursos, Etiquetas): posición, ancho, colapsado/expandido y ancho de columna donde aplica; se recupera al recargar.
- Se guardan también las etiquetas y el título de cabecera; se recuperan al recargar.
- Al abrir con estado guardado de la **misma versión**: se restaura tal cual, sin aviso.
- Al abrir con estado guardado de **otra versión**: se arranca con la semilla/contenido por defecto (no se restaura ese estado).
- Al abrir con estado guardado **corrupto/ilegible**: mismo arranque de respaldo.
- Al abrir **sin nada guardado**: arranque limpio.
- Un guardado anterior a esta funcionalidad al que le falte algún dato de panel/etiquetas arranca esa parte con sus valores por defecto.

**032 — Exportar/importar componentes en JSON**
- Exportar solo incluye los elementos marcados (checks por bloque y por elemento); "Exportar" deshabilitado si no queda ninguno marcado.
- El fichero exportado incluye la versión de la app y el título de cabecera actual (el título siempre, no forma parte de la selección).
- Importar acepta un fichero de versión distinta a la actual.
- Fichero no válido (vacío, JSON corrupto, sin lista de componentes reconocible): se reporta como error.
- Modo "Sobrescribir todo el juego": borra el contenido actual y deja solo lo seleccionado.
- Modo "Añadir a lo existente": conserva el contenido actual y suma lo seleccionado.
- Ante id duplicado en modo "Añadir": "Sobrescribir el existente" reemplaza; "Mantener ambos" conserva el importado con id nuevo y renombra el original con sufijo `-imported` (y `-imported(2)`, ... ante nuevas colisiones). Aplicado por tipo (componentes/recursos/etiquetas con su propio espacio de ids).
- Tras la fusión: un componente que referencia un recurso ausente se añade sin ese recurso; si referencia una etiqueta ausente se crea una etiqueta con ese id (una vez por id), salvo que ya exista una con ese nombre (normalizado), en cuyo caso se reutiliza; etiquetas importadas con nombre en colisión se renombran con sufijo " (importado)".
- Con título en el fichero: en modo "Sobrescribir" el título actual se reemplaza por el importado; en modo "Añadir" se conserva el actual; un fichero sin título nunca cambia el título.
- El modo (juego/edición) en el que queda la app tras importar es el mismo desde el que se lanzó la importación; cancelar/abortar en cualquier paso no modifica el juego ni el modo.

**036 — Contenido de ejemplo al arrancar una partida nueva**
- Al arrancar sin nada guardado, la galería arranca con 2 recursos de ejemplo: una imagen y una tipografía, uno por cada tipo de recurso admitido.
- Los recursos de ejemplo son editables y eliminables como cualquier otro.
- Una partida guardada con una versión anterior sin este contenido lo recibe una única vez al abrirse, sin sobrescribir lo que el usuario ya tenga.
- Con contenido de ejemplo ya sembrado, no se vuelve a sembrar en aperturas posteriores.

**039 — Barra de controles superior**
- En modo juego la fila de cabecera muestra: "Importar", "Exportar", separador, "Modo Edición", "Ajustar zoom", "Configuración".
- En modo edición la cabecera muestra "Modo Juego", "Ajustar zoom", "Configuración", y una segunda franja debajo con "Importar" y "Exportar".
- El botón de cambio de modo se llama "Modo Edición" estando en juego y "Modo Juego" estando en edición, siempre en el mismo sitio de la cabecera.
- "Importar" y "Exportar" tienen el mismo aspecto en los dos modos.
- "Ajustar zoom" encuadra la vista para que todos los elementos quepan en pantalla.
- "Configuración" abre el panel de ajustes.

### Preguntas de alcance resueltas

- **¿Qué entra en este cambio?** Ampliar la cobertura de estas ocho funcionalidades hasta cubrir su comportamiento observable. No entra la funcionalidad 026 (cambio 00240, aparte) ni ninguna de las ~31 funcionalidades hoy sin ningún test.
- **¿Se reescriben los tests actuales o solo se añaden casos?** Por defecto se añaden casos nuevos a las baterías existentes, conservando los actuales. Si al ampliar una batería se detecta que un caso actual está mal planteado o es redundante, la planificación puede reordenarlo; no es el objetivo.
- **¿Se toca el informe de trazabilidad a mano?** No: se regenera solo.
- **¿Se modifican las fichas funcionales?** No: ya están completas y correctas.
- **¿Nivel de los tests?** El que corresponda a cada caso, siguiendo el criterio ya usado en la batería actual: nivel estado cuando el comportamiento se puede ejercitar con las funciones públicas del núcleo, nivel interfaz cuando depende del DOM renderizado o de un evento de usuario real.
- **Criterio de "cobertura completa":** un caso por comportamiento observable de la ficha, casos límite y ramas condicionales incluidos, con código `FT-NNN-nn` correlativo (continuando la numeración existente de cada funcionalidad) como prefijo del nombre del caso.
- **¿Puede este cambio destapar bugs?** Sí: al cubrir comportamiento no probado hasta ahora, algún caso nuevo podría fallar contra el código real. Cada fallo así se trata por las vías del proyecto (corrección o cambio) fuera de este cambio; el objetivo aquí es la batería, no arreglar lo que aflore.

## Technical notes

- **Framework de tests:** motor propio descrito en `previo-sdd/design/docs/architecture/011-functional-test-framework.md`. Tests en `src/test/functional/*.test.js`, ejecutados con `npm test` (servidor estático sobre `src/` + Chromium headless vía Playwright, un fichero por recarga). Cada fichero declara `registerFeature({ primary, secondary })` y sus casos llevan el código `FT-<NNN>-<nn>` como prefijo del nombre. `src/test/traceability.js` regenera `src/test/TRACEABILITY.md` al final de cada ejecución. Códigos de salida: `0` OK; `1` fallo de test o anomalía de trazabilidad; `2` navegador headless no instalado (`npm run test:setup`).
- **Ficheros de test existentes y su funcionalidad:**
  - `src/test/functional/component-crud.test.js` → 002 (nivel estado; `getComponents`/`addComponent`/`removeComponent` de `core/state.js`, `createDefaultComponent` de `ui/componentModal.js`).
  - `src/test/functional/synced-copies.test.js` → 005 principal, 022 secundaria (nivel interfaz; `createCopy`/`updateComponent` de `core/component.js`, `replaceComponent` de `core/state.js` que dispara `syncCopyWithOriginal`, `mountEditMode`).
  - `src/test/functional/hidden-in-play.test.js` → 016 (nivel interfaz; `mountPlayMode`/`mountEditMode`, clase `.component-hidden-badge`).
  - `src/test/functional/autosave.test.js` → 029 (nivel estado; `saveState`/`loadState` de `core/persistence.js`, `CURRENT_VERSION` de `data/version.js`, clave `localStorage` `bgfactory:state`).
  - `src/test/functional/export-import.test.js` → 032 (nivel estado; `buildComponentsExport`/`parseImportedComponents` de `core/persistence.js`, `downloadJson` de `core/fileExport.js`, helpers `captureDownload`/`getLastDownload`/`injectFileImport`).
  - `src/test/functional/fresh-boot.test.js` → 036 (nivel estado; `getResourcesSeeded`/`markResourcesSeeded`/`addResource` de `core/state.js`, `createResource` de `core/resource.js`, `DEFAULT_RESOURCES` de `data/defaultResources.js`).
  - `src/test/functional/top-controls.test.js` → 039 (FT-039-01 nivel estado, FT-039-02 nivel interfaz; `setMode`/`getState`/`MODES` de `core/state.js`, `on` de `core/eventBus.js`, `t` de `core/i18n.js`, `renderModeSwitcher`/`renderEditToolbar` de `ui/editModeToggle.js`, ids DOM `#edit-toolbar`/`#mode-switcher`).
- **Helpers disponibles** (`src/test/helpers.js`): `resetState`, `mountEditMode`, `mountPlayMode`, `mountChrome`, `loadFixture`, `mockRandom`, `captureDownload`/`getLastDownload`, `injectFileImport`, `restoreAllMocks`. Los fixtures viven en `src/test/fixtures/*.json` y se cargan con `loadFixture(nombre)` por el mismo camino que "Importar". `pv-how` debe decidir, por cada caso nuevo, si le basta con lo existente o necesita un helper/fixture nuevo; los helpers nuevos van en `helpers.js`, no en el motor (`harness.js`, `run.js`, `traceability.js`).
- **Aserciones disponibles** (`harness.js`, `expect`): `toBe`, `toEqual`, `toBeTruthy`, `toBeFalsy`, `toBeNull`, `toContain`, `toHaveLength`, `toBeGreaterThan`, `toThrow`. No hay `toBeGreaterThanOrEqual`, `toMatch`, `not`, `toThrow(mensaje)` ni spies/mocks de función genéricos — si un caso los necesita, `pv-how` decide si se amplía `expect` (toca el motor, requiere justificación) o se reescribe la aserción con lo que hay.
- **i18n:** los textos visibles vienen de `t()` (claves en `src/data/i18n.es.js` / `i18n.en.js`). Los casos de nivel interfaz deben comparar contra `t('clave')`, no contra literales, como ya hace `top-controls.test.js`.
- **Numeración de casos:** continuar la serie de cada funcionalidad: 002 desde `FT-002-04`, 005 desde `FT-005-02`, 016 desde `FT-016-02`, 022 desde `FT-022-01` (batería propia nueva; hoy solo tiene cobertura secundaria), 029 desde `FT-029-03`, 032 desde `FT-032-02`, 036 desde `FT-036-02`, 039 desde `FT-039-03`.
- **Persistencia (029/032/036):** `saveState(...)` toma 10 argumentos posicionales (componentes, panelState, recursos, resourcePanelState, resourcesSeeded, tags, tagPanelState, groups, appTitle, tableText) — ver el helper `persist()` de `autosave.test.js`. `loadState()` devuelve `{ error?, components, ... }`. En producción quien encadena los disparos de autoguardado son los listeners de `main.js` (no cubiertos por los tests, que van por `core/persistence.js` directamente).
- **Copias (005):** `createCopy(original, getComponents())` fija `copyOf` y `sincronizado: true`. La sincronización se dispara desde `replaceComponent` (`core/state.js#syncCopyWithOriginal`). El renombrado en cascada de ids y el borrado en cascada también viven en `core/state.js` — `pv-how` debe localizar las funciones exactas.
- **Carta (022):** `createDefaultComponent('carta')` fija `properties` con `cloneCartaProperties(DEFAULT_CARTA_PROPERTIES)`, `width`/`height` según `DEFAULT_CARTA_WIDTH` y `getProporcionRatio`. La cara mostrada es `properties.caraActual`; el volteo en modo juego pasa por el callback `onCartaFlip` de `renderComponentsOnTable` (`playMode.js`). Proporciones y ratios en `core/` (buscar `getProporcionRatio`, `proporcion`).
- **Modo edición/juego (039, 016):** `mountEditMode()`/`mountPlayMode()` montan `#content` + la "cromática" (`#edit-toolbar`, `#mode-switcher`) vía `mountChrome()`. `setMode(MODES.EDIT|PLAY)` emite `mode:changed` en el `eventBus`.
- **Sin inconsistencias detectadas** entre las fichas de estas ocho funcionalidades y el código real en esta fase de análisis funcional; la verificación fina por caso corresponde a `pv-how`.
- Sin componente visual nuevo ni datos estructurados nuevos: es ampliación de baterías de prueba sobre comportamiento ya existente y documentado.
