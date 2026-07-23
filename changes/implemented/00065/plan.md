# Plan técnico — 00065

## (a) Anotaciones funcionales

**Fuera de alcance:**
- Validar o avisar de referencias rotas *antes* de exportar (si se deselecciona un componente cuyo recurso/mazo sí queda marcado, o viceversa) — la descripción funcional dice explícitamente que exportar sigue sin validar nada, igual que hoy.
- Cualquier gestión de mazos más allá de la creación automática ante referencia rota (editar/borrar mazo sigue fuera de alcance, como ya lo estaba en el change 00053).
- Deshacer/cancelar una importación ya aplicada (no hay "undo"; si el resultado no es el esperado, el usuario tendría que reimportar o deshacer manualmente).

**Dudas resueltas con el usuario:**
- P: En la modal de confirmación final de importación, el desplegable "Comportamiento ante id duplicado" (Sobrescribir el existente / Mantener ambos) ¿qué opción viene seleccionada por defecto?
  R: "Sobrescribir el existente".

## (b) Solución técnica

1. **`core/importMerge.js` (módulo nuevo, capa `core`)** — toda la lógica de fusión de una importación, sin DOM, para mantener `core` libre de UI (`ARCHITECTURE.md` sección 2):
   - `nextImportedId(baseId, existingIds)`: análogo a `nextCloneId` (`core/component.js`) pero con sufijo `-imported`/`-imported(n)` en vez de `(n)`, y genérico (no asume que `baseId` es un id de componente) — recibe directamente el `Set`/array de ids ya usados del tipo correspondiente (componente, recurso o mazo), no una lista de componentes.
   - `mergeImportedGame({ mode, conflictMode, existingComponents, existingResources, existingDecks, selectedComponents, selectedResources, selectedDecks })`:
     - **Modo "Sobrescribir todo el juego"**: parte de listas vacías; inserta directamente los seleccionados (no puede haber conflicto de id al partir de vacío, tal como indica la descripción funcional).
     - **Modo "Añadir a lo existente"**: para cada tipo (componentes, recursos, mazos) por separado, recorre los elementos seleccionados; si el id ya existe en la colección existente de ese mismo tipo:
       - `conflictMode: 'overwrite'` → sustituye el elemento existente por el importado, conservando el id.
       - `conflictMode: 'keepBoth'` → renombra el id del importado con `nextImportedId` (contra los ids ya existentes **más** los ya asignados en esta misma importación, para no colisionar entre sí) y lo añade como nuevo.
       - Si no hay colisión, se añade tal cual.
     - **Remapeo de referencias entre elementos importados**: los recursos y mazos deben resolverse (con su fusión y posible renombrado) *antes* que los componentes, para poder construir un mapa `idOriginal → idFinal` por tipo; al fusionar los componentes seleccionados, sus referencias a recursos (`image`, `imagenResourceId`, `fuenteResourceId`, en cualquier nivel de `properties`, mismo criterio que `collectResourceRefs` de `core/resource.js`) y a mazos (`properties.deckId`) que apunten a un id renombrado se reescriben al nuevo id antes de insertarlos. Las referencias de componentes **ya existentes** (no importados) no se tocan — siguen apuntando al recurso/mazo original, que no cambia de id.
     - **Resolución de referencias rotas tras la fusión** (recorre el array de componentes final, solo los recién insertados/reemplazados por esta importación — los componentes preexistentes no tocados no pueden haber quedado con una referencia rota que no tuvieran ya): reutiliza el mismo criterio de recorrido que `collectResourceRefs`/`getComponentsWithMissingResources` (`core/resource.js`) y `getComponentsWithMissingDeck` (`core/deck.js`) para detectar, campo a campo (no solo por componente), qué referencias apuntan a un id ausente de la colección final:
       - Recurso ausente → se pone ese campo a `null` (se tolera igual que ya tolera hoy la app un recurso borrado en uso).
       - Mazo ausente (`properties.deckId`) → se crea un mazo nuevo con ese mismo id (`createDeck({ id, name: id })`, ya que no hay más información disponible) y se añade a la colección de mazos resultante — comprobando primero si ya se creó en esta misma importación (para no duplicar cuando varios componentes referencian el mismo mazo ausente), mismo criterio idempotente que ya sigue `addResource`/`addComponent`.
     - Devuelve `{ components, resources, decks, report }`, donde `report` es un array de filas `{ componentId, tipoError: 'recurso' | 'mazo', solucion: string, elemento: string }` — una fila por cada referencia rota detectada (un componente puede generar varias filas), en el mismo orden en que se detectan. Para el nombre a mostrar en `elemento`, buscar primero si ese id coincide con un recurso/mazo presente en el fichero importado completo (esté o no seleccionado) y usar su `name`; si no se encuentra, mostrar el id tal cual.
   - Sin dependencias de `ui/*` ni de `core/state.js` (recibe y devuelve datos planos, quien la invoca decide cómo aplicarlo al estado — mismo principio que `core/component.js`/`core/resource.js`).

2. **`ui/elementSelectionModal.js` (módulo nuevo, reutilizado por exportar e importar)** — la lista agrupada en tres bloques (Componentes/Recursos/Mazos), cada bloque con su checkbox "seleccionar todo el bloque" (marca/desmarca de golpe los checks de ese bloque, ítem 1 de las aclaraciones del usuario) y la lista de checks individuales debajo, cada ítem con texto identificativo:
   - Componentes: mismo formato que `formatComponentIdentifier` de `ui/componentRenderer.js` (`"<Tipo>: <id>"`) para reutilizar un criterio ya establecido en la app, en vez de inventar uno nuevo.
   - Recursos y mazos: `resource.name` / `deck.name`.
   - Expone algo como `createElementSelectionGroups(container, { components, resources, decks }, { onSelectionChange })` que devuelve `getSelection()` (`{ componentIds, resourceIds, deckIds }`, arrays); usado tanto por la modal de selección de exportación como por la primera modal de importación, evitando duplicar la construcción de los tres bloques.
   - Sigue el patrón de "componente" de `STYLE_BIBLE.md` sección 8 (función que crea y devuelve/rellena un `HTMLElement`, `classList` para estados) y BEM nuevo (ver (d)).

3. **`ui/exportSelectionModal.js` (módulo nuevo)** — sustituye el `prompt()` actual del botón "Exportar". Expone `openExportSelectionModal({ components, resources, decks, defaultFilename, onAccept })`: campo de nombre de fichero (mismo valor por defecto que hoy, `errantes-componentes.json`) + los tres bloques de `ui/elementSelectionModal.js`, todos marcados por defecto. Botón "Exportar" (en vez de "Aceptar", mismo estilo `.btn-accept`) deshabilitado si no queda ningún elemento marcado en ningún bloque (independientemente del nombre de fichero). Al aceptar, invoca `onAccept({ filename, componentIds, resourceIds, deckIds })`.

4. **`ui/importSelectionModal.js` (módulo nuevo)** — primera modal del flujo de importar, mismo patrón que la de exportar pero sin campo de nombre de fichero, mostrando los elementos del fichero leído (`parseImportedComponents`), todos marcados por defecto; botón "Continuar" deshabilitado si no queda ningún elemento marcado. `onAccept({ componentIds, resourceIds, deckIds })`.

5. **`ui/importConfirmModal.js` (módulo nuevo)** — segunda modal del flujo de importar: dos `<select>` (mismo patrón que `ui/boardPatternModal.js`, sin tabs):
   - "Modo de importación": `Añadir a lo existente` (seleccionado por defecto) / `Sobrescribir todo el juego`.
   - "Comportamiento ante id duplicado": `Sobrescribir el existente` (seleccionado por defecto, ver (a)) / `Mantener ambos` — visible siempre (no se oculta en modo "Sobrescribir", pero técnicamente no se usa en ese modo, tal como indica la descripción funcional: "en Sobrescribir no puede haber duplicados porque se parte de vacío").
   - Botones "Cancelar"/"Importar" (`.btn-accept`). `onAccept({ mode, conflictMode })`.

6. **`ui/importReportModal.js` (módulo nuevo)** — modal de informe final, mismo patrón `modal-overlay`/`modal` con una tabla (reutilizando la estructura de tabla ya usada en `ui/componentList.js`/`ui/resourceList.js`, adaptada a las 4 columnas del informe: "Componente afectado", "Error", "Solución", "Elemento erróneo/faltante"), botón "Cerrar" (`.btn-cancel`). Expone `openImportReportModal(report)`, donde `report` es el array devuelto por `mergeImportedGame`.

7. **`ui/editModeToggle.js` — reescritura del flujo de exportar/importar:**
   - `exportComponentsAs`/el listener de "Exportar" pasan a abrir `openExportSelectionModal` en vez de `prompt()`; al aceptar, filtran `getComponents()`/`getResources()`/`getDecks()` por los ids seleccionados (sin tocar `buildComponentsExport`, que sigue recibiendo listas ya filtradas — no hace falta cambiar su firma) y descargan con `downloadJson` igual que hoy.
   - `importComponentsFromFile` deja de usar `confirm()`: tras `parseImportedComponents`, si es válido, abre `openImportSelectionModal` con el contenido leído; al aceptar esa modal, abre `openImportConfirmModal`; al aceptar esta, filtra los seleccionados por id, invoca `mergeImportedGame` (`core/importMerge.js`) con el resultado de ambas modales y el estado actual (`getComponents()`/`getResources()`/`getDecks()`), aplica el resultado con `loadComponents`/`loadResources`/`loadDecks` (`core/state.js`, ya usados hoy) y, si `report.length > 0`, abre `openImportReportModal(report)`.
   - Las funciones `getComponentsWithMissingResources`/`getComponentsWithMissingDeck` que hoy se invocan tras importar (para el aviso "referencias incompletas" vía `showErrorModal`) dejan de usarse en este flujo — las sustituye el `report` que ya devuelve `mergeImportedGame` con más detalle. Sus otros usos (si los hubiera fuera de este fichero) no se tocan; comprobar en la implementación que no queden imports huérfanos en `editModeToggle.js`.

8. **Ficheros de prueba (`src/test/*.json`, `ARCHITECTURE.md` sección 7)**: no requieren cambio de formato (el import sigue leyendo el mismo `{ version, components, resources, decks }`), no hace falta tocarlos.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:

- **Sección 5** (capa UI): actualizar la entrada de `ui/editModeToggle.js` para reflejar que exportar/importar ya no usan `prompt()`/`confirm()` nativos, sino las nuevas modales (`ui/exportSelectionModal.js`, `ui/importSelectionModal.js`, `ui/importConfirmModal.js`, `ui/importReportModal.js`) y el módulo de selección compartido `ui/elementSelectionModal.js`; añadir una entrada para cada módulo nuevo siguiendo el mismo formato que las entradas ya existentes de esa sección.
- **Sección 6.1** (Persistencia y guardado a fichero): actualizar la descripción de "Guardar a fichero"/exportar-importar para reflejar el nuevo flujo con selección y las reglas de fusión (modo añadir/sobrescribir, resolución de conflicto de id, autocreación de mazo/pérdida de recurso ante referencia rota tras importar), referenciando el nuevo `core/importMerge.js`.
- Añadir `core/importMerge.js` al listado/descripción de módulos de la capa `core` (no hay una lista exhaustiva de `core/*` en el documento actual fuera de las secciones temáticas — añadirlo donde ya se describe `core/persistence.js`/`core/fileExport.js`, sección 6.1, dado que es el módulo que da soporte a exportar/importar).

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- **Nueva convención — lista de selección agrupada (checklist)**: documentar el patrón nuevo introducido por `ui/elementSelectionModal.js` (bloque con checkbox "seleccionar todo" + lista de checks individuales), con su nomenclatura BEM (p. ej. `.element-selection-group`, `.element-selection-group__select-all`, `.element-selection-group__item`) para que cualquier lista de selección múltiple futura lo reutilice en vez de crear un patrón ad-hoc — mismo criterio que ya se sigue con `.resize-handle`/`.help-icon` (sección 11/12 del documento).
- **Modales más anchas**: `ui/exportSelectionModal.js`/`ui/importSelectionModal.js` necesitan más espacio que el `.modal { max-width: 500px }` por defecto (sección 2/5 del documento no cubre modales grandes salvo la excepción ya documentada de `ui/cardEditorModal.js`) — documentar esta segunda excepción de `max-width` propio (reutilizando el mismo criterio que ya justifica el de `cardEditorModal`: modal con más contenido que el formulario simple habitual) en vez de dejarla como excepción no catalogada.
- **Tabla del informe de importación**: si `ui/importReportModal.js` reutiliza el estilo de tabla ya existente (`.component-list`/`.resource-panel` tablas) sin introducir clases nuevas de fondo, no hace falta documentar nada adicional; si en la implementación hiciera falta una variante visual nueva (p. ej. para una tabla dentro de un modal en vez de un panel flotante), documentarla en la sección 7 (BEM) siguiendo el mismo criterio.
