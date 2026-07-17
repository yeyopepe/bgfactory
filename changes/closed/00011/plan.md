# Plan — 00011 Persistencia de estado en localStorage y guardado a fichero

## (a) Anotaciones funcionales

**Fuera de alcance:**
- Sincronización entre navegadores, dispositivos o perfiles.
- Historial/versionado de estados guardados en localStorage (solo se conserva el último).
- Cualquier concepto de usuario, partida o sesión — sigue siendo una app individual y local.
- Migrar datos existentes: no hay ningún estado persistido hoy (esta es la entrada que lo introduce).

**Dudas resueltas con el usuario durante esta planificación:**
- **¿Qué pasa si en el mismo navegador se abren varias copias descargadas distintas (p.ej. resultado de varios "Guardar como...")?** Bajo `file://`, la mayoría de navegadores (Chrome en particular) no aíslan `localStorage` por fichero: todas las páginas locales comparten el mismo origen. Se opta por el comportamiento simple: `localStorage` es un único slot por navegador/perfil, tal como ya describía `description.md`. Si ya hay algo guardado en ese navegador, prevalece sobre el contenido propio del fichero que se abre; el contenido propio del fichero (su "semilla") solo se usa si no hay nada guardado todavía en ese navegador. Se acepta como comportamiento conocido que abrir copias distintas en el mismo navegador puede mostrar el estado de la última copia editada, no el de la copia concreta que se abre.

**Preguntas ya resueltas en `description.md`** (qué se guarda, dónde está el botón, comportamiento de "guardar" al no poder sobrescribir de verdad, aviso ante estado corrupto/incompatible): se dan por válidas, sin cambios.

## (b) Solución técnica

1. **`src/core/persistence.js`** (nuevo módulo en `core/`, junto a `state.js`/`eventBus.js`):
   - `STORAGE_KEY` fijo (p.ej. `'errantes:state'`).
   - `saveState(components)`: serializa `{ version: CURRENT_VERSION, components }` a JSON y lo escribe en `localStorage[STORAGE_KEY]`. Envuelto en try/catch (cuota excedida u otro fallo de `localStorage` no debe romper la app; si falla, no hace nada más).
   - `loadState()`: lee `localStorage[STORAGE_KEY]`; si no existe, devuelve `null`. Si existe, intenta `JSON.parse`; si falla el parseo, o el JSON no tiene la forma esperada (`components` no es array), o `version` no coincide con `CURRENT_VERSION`, devuelve `{ error: true }`. Si es válido, devuelve `{ components }`.
   - Se sitúa en `core/` porque es lógica de persistencia del modelo de datos (lee/escribe la forma de `state.components`), no de interfaz.

2. **Autoguardado** — enganchar `persistence.js` a los cambios de estado:
   - En `src/main.js`, importar `saveState` y suscribirse a `components:changed` (`on('components:changed', (components) => saveState(components))`), junto a las suscripciones ya existentes (`renderAll`). Se guarda en cada alta/edición/borrado/movimiento/redimensionado, ya que todos esos flujos pasan por `addComponent`/`replaceComponent`/`removeComponent`/`loadComponents` y todos emiten `components:changed`.
   - No se persiste `mode` (play/edit): es un detalle de interfaz en el momento, no de contenido — ya resuelto en `description.md`.

3. **Arranque condicionado** — sustituir la siembra incondicional de `src/main.js` (líneas ~38-47):
   - Al arrancar, llamar a `loadState()`.
     - Si devuelve `{ components }` válido: `loadComponents(components)` en vez de crear el componente de ejemplo.
     - Si devuelve `{ error: true }`: mostrar un aviso breve (ver punto 4) y sembrar el componente de ejemplo por defecto (comportamiento actual, sin bloquear la carga).
     - Si devuelve `null` (nunca se ha guardado nada en este navegador): comprobar si el propio documento lleva un estado "semilla" embebido (ver punto 5); si lo lleva y es válido, `loadComponents(seedComponents)`; si no, sembrar el componente de ejemplo por defecto (comportamiento actual).

4. **Aviso breve reutilizable** — no existe hoy ningún patrón de notificación/toast en el proyecto (`ui/`, `styles/main.css`). Crear **`src/ui/toast.js`**:
   - Exporta `showToast(message)`: crea (o reutiliza) un contenedor fijo en el DOM y muestra el mensaje unos segundos con una transición simple, luego lo retira. Sin dependencias externas, consistente con el resto de `ui/`.
   - Estilos correspondientes en `src/styles/main.css` (BEM, siguiendo `STYLE_BIBLE.md`).
   - Se usa tanto para el aviso de estado corrupto/incompatible (punto 3) como para la confirmación de guardado a fichero (punto 7), reutilizando el mismo mecanismo.

5. **Estado "semilla" embebido en el HTML** (mecanismo que soporta tanto el arranque en 3 como el guardado en 6-7):
   - En `src/index.html`, añadir un `<script type="application/json" id="initial-state"></script>` vacío (sin contenido: significa "sin semilla propia", como hoy).
   - `src/core/persistence.js` expone también `readSeedState()`: lee `document.getElementById('initial-state')`, y si tiene contenido no vacío, intenta parsearlo (mismo formato `{ version, components }`, mismas validaciones que `loadState`); devuelve `{ components }` o `null`.
   - Este mismo `<script>` sobrevive al build (`scripts/build.py` copia `index.html` casi literal, solo quita el `<link>`/`<script type="module">` e inyecta CSS/JS) y sobrevive a la descarga en tiempo de ejecución (punto 6), porque ambos parten de clonar el documento actual.

6. **`src/core/fileExport.js`** (nuevo módulo, `core/` porque genera la serialización del documento+estado, sin conocer UI):
   - `buildExportHtml(components)`: clona el documento actual (`document.documentElement.outerHTML`, con el `<!doctype html>` delante — `document.doctype` serializado con `new XMLSerializer()` o el literal `'<!doctype html>\n'`, ya que es el único doctype que usa el proyecto), y dentro de esa copia reemplaza el contenido del `<script id="initial-state">` por `JSON.stringify({ version: CURRENT_VERSION, components })`. Devuelve el string HTML resultante.
   - `downloadHtml(filename, htmlContent)`: crea un `Blob` (`text/html`), un `<a>` temporal con `download=filename` y `URL.createObjectURL`, dispara el click, libera el object URL. Utilidad genérica sin conocer el modelo de componente.
   - Justificación de por qué clonar el documento vivo (en vez de reconstruirlo desde cero): es la única forma de producir una copia fiel del HTML autocontenido actual (CSS/JS ya embebidos por el build) sin reimplementar el propio `build.py` en el navegador.

7. **Botón de guardar** en `src/ui/editModeToggle.js` (`renderEditToolbar()`):
   - Añadir, junto al botón "Salir del modo edición", un control con dos acciones ("Guardar" / "Guardar como...") — un `<select>`/menú simple (sin necesidad de replicar el desplegable custom de `design_boton-guardar.html`, que es solo referencia visual de maquetación, no de marcado ni de arquitectura).
   - **Guardar**: obtiene el nombre de fichero actual con `decodeURIComponent(location.pathname.split('/').pop())` (nombre real del fichero abierto, sea cual sea); si no se puede determinar (p.ej. página sin `location.pathname` de fichero), usa un nombre por defecto razonable (p.ej. `errantes.html`). Llama a `buildExportHtml(getComponents())` + `downloadHtml(nombre, html)`.
   - **Guardar como...**: pide un nombre nuevo (p.ej. `prompt()` nativo, precargado con el nombre actual) y hace lo mismo con ese nombre.
   - Tras la descarga, `showToast('Guardado como "<nombre>"')` (mismo mecanismo del punto 4).
   - Solo se muestra en modo edición (ya es así, `renderEditToolbar` ya comprueba `getState().mode !== MODES.EDIT`).

**Orden de implementación:** 1 → 4 → 2 y 3 (dependen de 1) → 5 → 6 (depende de 5 y de `CURRENT_VERSION`) → 7 (depende de 6 y 4).

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md` necesita actualizarse en:

- **§1 y §6**: ya están desactualizadas respecto al código actual independientemente de este cambio (dicen `/scripts` y `src/_output/index.html`, cuando hoy es `src/scripts/build.py` y `src/_output/versions/index-v{NNNN}.html`) — corregir de paso, ya que este cambio toca directamente el mecanismo de build/entregable.
- **§2 (capas)**: añadir `core/persistence.js` y `core/fileExport.js` al listado de `core/`.
- **Nueva sección** (o ampliar §6) describiendo el mecanismo de persistencia: autoguardado en `localStorage` enganchado a `components:changed`, el `<script id="initial-state">` como semilla embebida en `index.html` (vacío en el fuente, rellenado al descargar), y el flujo de "Guardar"/"Guardar como..." reutilizando ese mismo mecanismo para producir una copia autocontenida con estado embebido.
- **§5 (capa UI)**: añadir `ui/toast.js` al listado, y describir brevemente el nuevo control de guardado en `ui/editModeToggle.js`.
