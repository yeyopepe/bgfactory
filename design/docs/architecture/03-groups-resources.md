# Etiquetas, recursos, migración de `'ficha'`, portapapeles de estilo

## Modelo de datos de etiqueta

Entidad ligera e independiente para agrupar/organizar elementos por nombre, en colección propia de `core/state.js` (no texto libre suelto en cada componente). Puramente organizativo, sin funcionalidad de juego asociada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único (`crypto.randomUUID()`) |
| `name` | string | Nombre visible en la sección "Etiquetas" (lista de checkboxes) de la pestaña "Generales" |

`core/tag.js` expone:
- `createTag({ id, name })` / `updateTag(tag, changes)` — mismo patrón que `core/resource.js`/`core/component.js`.
- `getComponentsUsingTag(tagId, components)` — filtra `component.etiquetaIds.includes(tagId)`; `etiquetaIds` es siempre propiedad plana de primer nivel (sin recorrido profundo, a diferencia de `isResourceInUse`). Usada para saber qué elementos quedan afectados al borrar una etiqueta.
- `isTagNameTaken(name, tags, excludeId)` — único punto de validación de unicidad de nombre: `true` si alguna etiqueta (con `id !== excludeId`) tiene el mismo nombre tras normalizar (recortado, sin distinguir mayúsculas). Reutilizado por `ui/tagModal.js`, `ui/componentModal.js` (creación de etiqueta desde sección "Etiquetas" de "Generales", disponible para todos los tipos) y `core/importMerge.js` (deduplica nombres tras merge por `id`; para etiqueta referenciada ausente, reutiliza una existente con el mismo nombre en vez de duplicarla — reportado con `tipoError: 'etiquetaDuplicada'`).

`core/state.js` mantiene colección independiente `tags` (`getTags`/`addTag`/`replaceTag`/`removeTag`/`loadTags`, evento `tags:changed`) y `panelState` propio para la ventana "Etiquetas" (`tagPanelState`, shape `{ collapsed, position, width }`, sin `columnWidths`, evento `tagPanelState:changed`). Alta de etiqueta posible al vuelo desde pestaña "Generales" de cualquier componente, o desde panel dedicado "Etiquetas" (`ui/tagList.js`/`ui/tagModal.js`, ver `04-modes.md`), que también permite editar nombre y eliminar.

**Compatibilidad hacia atrás**: cadena de 3 niveles. Guardado hecho con la app anterior a la introducción de "Grupos" tiene esta colección y su `panelState` bajo las claves más antiguas `decks`/`deckPanelState`; guardado hecho tras "Grupos" pero antes de este renombrado a "Etiquetas" las tiene bajo `groups`/`groupPanelState`. `core/persistence.js` (`parseState`/`parseImportedComponents`) encadena la lectura: usa `tags`/`tagPanelState` si están presentes, si no `groups`/`groupPanelState`, si no `decks`/`deckPanelState` — para no perder etiquetas ya creadas en ningún guardado anterior.

## Modelo de datos de recurso (galería)

"Recurso de galería" (imagen o tipografía usada por la partida), independiente del modelo de componente:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único (`crypto.randomUUID()`); `DEFAULT_RESOURCES` es la única excepción — id fijo, ver más abajo |
| `name` | string | Nombre visible en la lista, editable |
| `type` | `'imagen' \| 'tipografia'` | Tipo de recurso |
| `dataUrl` | string | Contenido del fichero embebido como data URI |
| `fileName` | string | Nombre original del fichero |
| `mimeType` | string | Tipo MIME del fichero original |

`core/resource.js` expone:
- `createResource()` / `updateResource()` — mismo patrón que `core/component.js`. `createResource()` acepta `id` opcional (solo usado por `DEFAULT_RESOURCES`) que sustituye al UUID generado por defecto.
- `resourceTypeForFileName(fileName)` — deduce tipo por extensión, `null` si no soportada: `png/jpg/jpeg/gif/svg/webp` → imagen, `ttf/otf/woff/woff2` → tipografía.
- `isResourceInUse(resourceId, components)` / `getComponentsUsingResource(resourceId, components)` — comparten helper local `collectDeepValues(value)` que recorre `component.properties` en profundidad (no solo primer nivel — necesario porque `'carta'` referencia recursos dentro de `properties.caraFrontal`/`caraTrasera` y de cada `textBox`). `isResourceInUse` devuelve booleano; `getComponentsUsingResource` devuelve lista de ids que lo usan (usada por `modes/edit/editMode.js` para identificar en el mensaje de error qué componente(s) bloquean el borrado).

`core/state.js` mantiene colección `resources` (`getResources`/`addResource`/`replaceResource`/`removeResource`/`loadResources`, evento `resources:changed`) y `panelState` propio (`resourcePanelState`, shape `{ collapsed, position, width, columnWidths }` — `columnWidths`: objeto `{ [columna]: pxNumber }` o `null`, evento `resourcePanelState:changed`). También mantiene flag `resourcesSeeded` (`getResourcesSeeded`/`markResourcesSeeded`/`loadResourcesSeeded`, sin evento propio, persistido junto al resto) que recuerda si los recursos por defecto ya se sembraron, para no reponerlos si el usuario los borra.

`data/defaultResources.js` exporta `DEFAULT_RESOURCES`: 38 recursos con los que arranca cualquier sesión totalmente nueva (sin guardado ni semilla). Todos tipo `'imagen'`: 3 fondos de localización (`src/resources/img/localizations/`), 3 imágenes de mochila, 25 de objetos, 7 de reverso de carta de evento (`src/resources/img/{backpack,objects,events}/`). Sembrados en `main.js` (`seedDefaultResources()`) junto al componente de texto de ejemplo. Llevan `id` fijo y legible (nombre de fichero sin extensión) en vez de UUID. Guardado o semilla previa a esta funcionalidad (`resourcesSeeded` ausente o `false`) también los recibe una vez, vía `backfillDefaultResourcesIfNeeded()` (ver `06-persistence-build.md`). Sus `dataUrl`/`fileName`/`mimeType` están en formato WebP, igual que cualquier imagen subida por la app.

Al subir imagen nueva (PNG/JPG/JPEG) desde panel "Recursos" o `ui/resourceModal.js` (reemplazo), `core/imageConversion.js` (`convertImageToWebP(file, dataUrl)`) la convierte automáticamente a WebP con pérdida y calidad alta (`<canvas>` + `toDataURL('image/webp', 0.92)`) antes de guardar, actualizando `dataUrl`/`fileName`/`mimeType`. WebP, SVG y GIF ya subidos se guardan tal cual sin reconversión; si la conversión falla o no está disponible, se guarda el original sin bloquear ni avisar.

## Migración de componentes `'ficha'`

Tipo `'ficha'` (cuadrado o círculo con borde/fondo configurables) retirado: ya no se puede dar de alta. Su etiqueta visible ("Carta/Ficha") pasó a `'carta'`, que absorbe su caso de uso (proporción `'1:1'` o `'circular'`). `core/fichaMigration.js` (módulo puro) expone el mapeo `'ficha'` → `'carta'`:

- `migrateFichaProperties(fichaProperties, componentSize)` → `{ properties, errors }` (`componentSize`: `{ width, height }` del componente `'ficha'` a convertir). Nunca lanza excepción; siempre devuelve `properties` de carta válido (best-effort) más lista de errores (vacía si ninguno).
  - `forma`: `'circular'`/`'cuadrada'` → `proporcion` `'circular'`/`'1:1'` (cualquier otro valor es error, fallback `'1:1'`).
  - `bordeColor`/`bordeGrosor`: se copian tal cual a ambas caras.
  - Según `fondoTipo`: `'imagen'` copia `imagenResourceId`/`ajusteImagen` a ambas caras (un `ajusteImagen` con forma inválida es error); `'texto'` traslada `texto` como un único `TextBox` que ocupa toda la carta en píxeles reales (`x:0, y:0, width: componentSize.width, height: componentSize.height`) con `colorFondo` igual al de la ficha; `'color'` (o ausente) no tiene equivalente — `colorFondo` se pierde sin contar como error.
  - `caraFrontal`/`caraTrasera` resultantes son siempre idénticas (la ficha no distinguía caras). `properties` resultante nace con `medidasReales: true` (no necesita pasar por `migrateCartaMedidasReales`).
- `migrateFichaComponent(component)` → `{ component, errors }`: envuelve la función anterior, fija `type: 'carta'`, `etiquetaIds: []` y `properties.caraActual: 'frontal'` (no `'trasera'`, para que la migración se note) en el resultado; el resto de campos generales no se tocan.

Dos puntos de uso, distinto criterio ante `errors`:

- **Migración silenciosa al cargar** (`core/state.js`, `loadComponents`): función interna `migrateFichas(components)` sustituye en el sitio cualquier `type === 'ficha'` por el resultado de `migrateFichaComponent`, ignorando siempre `errors` (best-effort, nunca bloquea el arranque). Cubre automáticamente los dos puntos de entrada de arranque (`localStorage` y semilla del HTML embebido).
- **Importación explícita** (`ui/editModeToggle.js`, `importComponentsFromFile`, ver `06-persistence-build.md`): único punto de conversión que puede interrumpirse. Cada ficha seleccionada para importar pasa por `migrateFichaComponent` antes de `mergeImportedGame`; si alguna devuelve `errors` no vacíos, se abre `ui/importConversionErrorModal.js` (ver `05-ui-layer.md`) con la lista antes de aplicar ningún cambio. El usuario elige "Continuar sin esas fichas" (se excluyen del `selectedComponents`, resto sigue con normalidad) o "Abortar importación" (no se llama a `mergeImportedGame` ni a `loadComponents`/`loadResources`/`loadTags`, partida actual queda intacta).

## Portapapeles de estilo

`core/styleClipboard.js` (módulo puro): portapapeles de "Copiar/Pegar estilo" de una carta, exclusivo del tipo `'carta'` (estructuralmente ampliable a otros tipos en el futuro). Vive **solo en memoria de módulo** durante la sesión del navegador — nunca se persiste en `localStorage` ni se incluye en guardado/exportado (no forma parte de los campos serializados por `core/persistence.js`). Solo un estilo copiado a la vez: cada `setStyleClipboard(data)` sustituye por completo el anterior, sin historial.

Forma del dato: `{ generales?, proporcion?, caraFrontal?, caraTrasera? }` — solo los bloques marcados al copiar llevan valor.

- `generales` es `{ bloqueado, mostrarTooltip, subirAlMoverInteractuar, oculto, etiquetaIds, etiquetaNames }` — campos generales de primer nivel del componente (no de `properties`), editables en pestaña "Generales" de `ui/componentModal.js`.
- `caraFrontal`/`caraTrasera` tienen el mismo shape que `properties.caraFrontal`/`caraTrasera` de una carta, clonados en profundidad al copiar (`cloneFace`, interno) para que ediciones posteriores de la carta origen no muten el portapapeles.
- `etiquetaNames` es de solo lectura (mismo índice que `etiquetaIds`), guardado solo para mostrar el nombre de cada etiqueta en el mensaje de error si deja de existir al pegar — no se usa para restaurar etiquetas.

Expone `setStyleClipboard(data)`, `getStyleClipboard()` (`null` si nada copiado), `hasStyleClipboard()` (booleano, usado por `ui/componentModal.js` para habilitar/deshabilitar "Pegar estilo"). También `validateStyleClipboardForPaste(clip, { tags, resources })`, función pura que recorre solo los bloques presentes en `clip` y devuelve lista de incidencias `{ elemento, referencia, detalle }` (vacía si todo válido): comprueba que cada id de `clip.generales.etiquetaIds` (si presente) siga existiendo en `tags`, y que `imagenResourceId`/`fuenteResourceId` de cada cara presente (y sus `textBoxes`) sigan existiendo en `resources`. No toca estado ni portapapeles.

Flujo de uso, ambos en `ui/componentModal.js` (`renderCartaSpecificFields`, sección "Estilo de la carta"):

- **Copiar**: botón "Copiar estilo" abre `ui/styleClipboardSelectionModal.js` con checklist de 4 bloques (Generales, Proporción, Cara frontal, Cara trasera), todos marcados por defecto; al confirmar, construye el objeto a guardar a partir de la selección y valores actuales del componente, llama a `setStyleClipboard`, muestra `showToast('Estilo copiado')`.
- **Pegar**: botón "Pegar estilo" (deshabilitado si `!hasStyleClipboard()`) valida primero con `validateStyleClipboardForPaste`; si hay incidencias, abre `ui/styleClipboardErrorModal.js` sin tocar el componente (pegado todo o nada); si no hay incidencias, aplica sobre `workingComponent`/`workingComponent.properties` solo los bloques presentes (clonados de nuevo, sin compartir referencia con el portapapeles), sustituyendo por completo cada bloque de destino, y refresca en pantalla los campos afectados (checkboxes de "Generales" incluida lista de Etiquetas, desplegable de Proporción, tamaño del componente).
