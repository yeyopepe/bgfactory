- **Name**: Refactor de mantenibilidad de main.js — extracción de responsabilidades
- **Code**: 00261
- **Type**: change
- **Creation date**: 2026-09-09

## Full description

### Qué se pide

El fichero de arranque de la aplicación se ha vuelto demasiado largo y hace demasiadas cosas a la vez: hoy mezcla, en un solo sitio, la puesta en marcha visual, la construcción de una parte de la interfaz (el bloque de nombre/versión que aparece en pantalla), la siembra de los recursos de ejemplo de una sesión nueva, toda la secuencia de recuperación del estado guardado al arrancar, el registro de las reacciones a cambios y el cableado de los atajos de teclado.

El objetivo de este cambio es puramente de **mantenibilidad**: repartir esas responsabilidades de forma que cada una viva en el lugar que le corresponde, dejando el fichero de arranque como una lista corta y legible de pasos de puesta en marcha. **No cambia absolutamente ningún comportamiento observable de la aplicación**: al terminar, el usuario ve y hace exactamente lo mismo que antes, con la misma secuencia de arranque, los mismos avisos y los mismos resultados en todos los casos (sesión nueva, estado guardado válido, estado guardado no recuperable, semilla embebida).

### Cómo se reparte

Se separan tres bloques que hoy están en el arranque y que en realidad son funcionalidad propia, no "pegamento" entre piezas:

1. **La construcción del bloque de nombre y versión en pantalla** (el que muestra "BG Factory" con su número de versión, el enlace al repositorio y, si el usuario lo ha configurado, su texto libre encima). Pasa a ser un elemento de interfaz más, con su propio sitio, igual que ya lo es el título editable de la cabecera.

2. **La siembra de los recursos de ejemplo** que se añaden a la galería únicamente en una sesión totalmente nueva (una imagen de ejemplo y una tipografía de ejemplo, con su nombre traducido al idioma activo). Pasa a vivir junto a la propia definición de esos recursos de ejemplo.

3. **Toda la secuencia de recuperación del estado al arrancar**: intentar leer lo guardado, distinguir si es recuperable o no, mostrar el aviso correspondiente si no lo es, recuperar en orden cada parte del estado (piezas de la mesa, recursos, etiquetas, agrupaciones, título, texto de la mesa, preferencias de los paneles y la marca de "recursos de ejemplo ya sembrados"), reconstruir agrupaciones que falten en guardados antiguos, y caer a la semilla embebida o a los valores por defecto cuando no hay nada recuperable. Pasa a ser un único paso de arranque con nombre propio.

Lo que **permanece en el fichero de arranque** es lo que de verdad es su cometido: encender la pantalla de bienvenida y el idioma, localizar los contenedores fijos de la página, orquestar el repintado general, registrar qué se repinta y qué se guarda ante cada cambio, y conectar los atajos de teclado.

### Comportamiento que debe quedar intacto (casos a verificar)

- **Sesión totalmente nueva** (sin nada guardado y sin semilla embebida): se siembran los dos recursos de ejemplo con su nombre en el idioma activo y se marca que ya se han sembrado.
- **Estado guardado válido**: se recupera todo tal cual, sin ningún aviso, y sin volver a sembrar recursos de ejemplo aunque la marca correspondiente no estuviera puesta.
- **Estado guardado no recuperable** (ilegible, sin piezas, o de otra versión): se arranca desde la semilla embebida o los valores por defecto y se muestra el mismo aviso breve que hoy.
- **Semilla embebida presente**: se recupera desde ella sin sembrar recursos de ejemplo.
- **Guardados antiguos sin registro de agrupaciones**: se siguen reconstruyendo las agrupaciones a partir de las piezas que ya las referenciaban.
- La pantalla de bienvenida, el idioma, el bloque de nombre/versión (incluido su texto libre configurable, que se repinta en vivo al editarlo), los atajos de teclado y el guardado automático ante cada cambio se comportan igual que antes.

### Alcance

- No se añade ni se modifica ninguna funcionalidad de cara al usuario.
- No cambia qué se guarda, ni dónde, ni en qué formato.
- No hay roles ni permisos implicados.
- Por ser una reorganización interna sin cambio de comportamiento, no se añaden pruebas nuevas: las pruebas funcionales existentes son la red de seguridad y deben seguir pasando sin modificarlas. El cambio no se considera terminado hasta que la batería de pruebas pasa y su informe de trazabilidad se regenera sin anomalías.

## Technical notes

- **Estado actual**: `src/main.js` (~196 líneas) concentra 10 responsabilidades. Su rol documentado en `design/docs/architecture/001-overview.md` es solo *"bootstrap: wires the previous layers"*.

- **Extracción 1 — bloque de versión**: `renderAppVersion()` (hoy `main.js` l.42-76) → nuevo fichero `src/ui/appVersion.js`, export `renderAppVersion(el)`. Paralelo directo de `src/ui/appTitle.js` sobre `#app-title`. La doc de estilo `design/docs/style/004-naming-and-patterns.md` ya trata `#app-version` como bloque BEM (`.app-version__name`, `.app-version__repo`, `.app-version__table-text`, `.app-version__separator`). Dependencias que se llevará: `CURRENT_VERSION` (`data/version.js`), `t` (`core/i18n.js`), `getTableText` (`core/state.js`). Mantener el literal `'BG Factory ' + CURRENT_VERSION` y el literal de URL del repo tal cual (nota: ese literal de URL está triplicado en el proyecto — aquí, `ui/settingsModal.js` y `ui/splashScreen.js` —; este refactor NO lo centraliza, solo lo traslada).

- **Extracción 2 — siembra de recursos**: `DEFAULT_RESOURCE_NAME_KEY` (mapa id→clave i18n, l.125-128) + `seedDefaultResources()` (l.130-138) → `src/data/defaultResources.js` (ya contiene `DEFAULT_RESOURCES`), export `seedDefaultResources()`. Se llevará las dependencias `createResource` (`core/resource.js`), `addResource`/`markResourcesSeeded` (`core/state.js`), `t` (`core/i18n.js`). Verificar que no introduce ciclo de imports: hoy `data/` solo depende de `data/version.js`; `core/resource.js`, `core/state.js`, `core/i18n.js` no importan de `data/defaultResources.js` (confirmar en `pv-how`). Preservar el comentario del gotcha "flag a true antes de añadir: cada `addResource()` dispara autoguardado síncrono".

- **Extracción 3 — arranque de estado**: `bootFromSeedOrDefaults()` (l.143-156) + bloque de arranque l.165-195 (`loadState()`, rama `saved?.error === 'corrupt'` con `showToast(t('toast.stateRecoverFailedCorrupt'))`, hidratación de `panelState`/`resourcePanelState`/`tagPanelState`/`appTitle`/`tableText`/`resourcesSeeded`/`components`/`resources`/`tags`/`groups`, backfill con `deriveMissingGroups`) + `syncFontFaces(getResources())` final → nuevo `src/core/bootState.js`, export `hydrateStateOnStartup()` (sin retorno; efectos sobre `core/state.js`).
  - **Orden crítico a preservar exactamente**: `loadResourcesSeeded(...)` ANTES de `loadComponents()`/`loadResources()` — esas dos emiten `components:changed`/`resources:changed` que disparan autoguardado síncrono, que persistiría `resourcesSeeded=false` si el flag no está hidratado. Comentario del gotcha (l.158-163) debe viajar con el código.
  - `syncFontFaces` inicial debe ejecutarse DESPUÉS de que el estado de recursos esté hidratado, igual que hoy (última línea del fichero).
  - Dependencias que se llevará: `loadState`/`readSeedState` (`core/persistence.js`), todos los `load*`/`get*`/`markResourcesSeeded` de `core/state.js`, `deriveMissingGroups` (`core/group.js`), `syncFontFaces` (`ui/fontFaceRegistry.js`), `showToast` (`ui/toast.js`), `t` (`core/i18n.js`), `seedDefaultResources` (tras la extracción 2, desde `data/defaultResources.js`).
  - `core/bootState.js` importando de `ui/fontFaceRegistry.js` y `ui/toast.js`: rompe la regla "core depende solo de core" del diagrama de capas de `001-overview.md`. Evaluar en `pv-how`: o bien se acepta como excepción documentada (es código de arranque, no lógica de dominio `core`), o bien `syncFontFaces`/`showToast` se quedan invocados desde `main.js` tras llamar a `hydrateStateOnStartup()`. Decisión para `pv-how`.

- **Permanece en `main.js`**: `showSplashScreen()` + `initI18n()`; captura de `#mode-switcher`/`#edit-toolbar`/`#content`/`#app-title`/`#app-version`; `renderActiveMode()`/`renderAll()`/`persistState()`; las ~18 suscripciones `on(...)` (l.98-115) — opcionalmente agrupadas en una función local `wireEventBus()` en el mismo fichero por legibilidad, sin moverlas a otro módulo; `initGlobalShortcuts({...})` con sus callbacks.

- **Documentación técnica a actualizar cuando se implemente** (no es inconsistencia doc-vs-código: la doc es correcta hoy, quedará desactualizada tras el refactor):
  - `design/docs/architecture/007-persistence-build.md`: cita `bootFromSeedOrDefaults()` como *"local to main.js"* y `seedDefaultResources()` bajo *"Default resources (data/defaultResources.js, main.js)"*; la sección "Startup (main.js)".
  - `design/docs/architecture/006-ui-layer.md`: cita `main.js#renderAppVersion`.
  - `design/docs/architecture/001-overview.md`: diagrama de capas, descripción de `main.js`.

- No se detectó ninguna inconsistencia entre documentación y código durante el análisis.

- Restricción del usuario, textual: "asegúrate de mantener toda la funcionalidad actual intacta y no introducir bugs".

- Seguridad: `pv-internal-tech-security` no reporta ninguna categoría aplicable (no hay entrada de usuario nueva, secretos, transporte ni API; es reorganización de código interno).
