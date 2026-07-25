# Plan — 00087: Eliminar tipo "Ficha" y renombrar "Carta" a "Carta/Ficha"

## (a) Anotaciones funcionales

**Fuera de alcance:**

- No se toca el identificador interno de datos (`type: 'carta'` sigue siendo el mismo valor). Solo se elimina `type: 'ficha'` como tipo dado de alta, migrándose siempre a `'carta'`.
- No se amplía el aviso de errores de conversión a los flujos de arranque (localStorage / HTML embebido). Ahí la migración sigue siendo 100% silenciosa, incluso ante datos corruptos (ver mapeo de errores más abajo).
- No se actualizan las tres entradas de `changes/inProgress` que mencionan "ficha" (00080, 00086, 00052) — quedan con texto desactualizado, a revisar en otro momento (ya anotado en `description.md`).
- No se toca `src/test/errantes-componentes (1).json` (contiene una ficha de ejemplo, útil tal cual para probar manualmente la migración/el aviso de errores tras implementar).

**Dudas resueltas:** ninguna duda técnica nueva ha requerido confirmación del usuario — `description.md` ya deja resueltas todas las de alcance funcional, y el resto de decisiones de diseño (qué cuenta como error, formato exacto del mapeo) se ha podido derivar sin ambigüedad de la documentación técnica y el código real (ver apartado (b)).

## (b) Solución técnica

### 1. Nuevo módulo de migración `core/fichaMigration.js`

Módulo puro (sin dependencias de otras capas, mismo criterio que `core/cardProportions.js`), punto único reutilizado tanto por la migración silenciosa como por el aviso de errores de importación:

- `migrateFichaProperties(properties)` → `{ properties: <CartaProperties>, errors: string[] }`. Nunca lanza excepción; siempre devuelve un `properties` de carta válido (best-effort) más una lista de errores (vacía si no hay ninguno). Mapeo, con nombres de campo reales del modelo (`ARCHITECTURE.md` sección 4, `ui/componentModal.js` `DEFAULT_FICHA_PROPERTIES`/`DEFAULT_CARTA_PROPERTIES`):
  - `properties` ausente o no es un objeto → error `"Falta la configuración de diseño (properties)"`; se trata como ficha vacía (sin forma/fondo) a efectos del resto del mapeo.
  - `forma`: `'circular'` → `proporcion: 'circular'`; `'cuadrada'` → `proporcion: '1:1'`; cualquier otro valor (o ausente) → error `` `Forma no reconocida ("<valor>")` `` (o `"Falta la forma de la ficha"` si está ausente), con fallback a `proporcion: '1:1'` para el best-effort.
  - `bordeColor`/`bordeGrosor`: se copian tal cual a `bordeColor`/`bordeGrosor` de **ambas** `caraFrontal`/`caraTrasera`; si no son válidos (`bordeColor` no string, `bordeGrosor` no número en `[0,20]`), no es error — se usan los valores por defecto de `DEFAULT_CARTA_PROPERTIES` (`'#000000'` / `0`), igual que ya hace `ui/componentModal.js` con `??`/`||` en otros tipos.
  - Según `fondoTipo`:
    - `'imagen'`: si `imagenResourceId` es string y `ajusteImagen` es un objeto con `zoom`/`posX`/`posY` numéricos finitos, se copian tal cual a `imagenResourceId`/`ajusteImagen` de ambas caras (mismo shape que ya usa `'ficha'`, sin cambios). Si `ajusteImagen` no tiene esa forma → error `"Ajuste de imagen con datos incompletos"` (no se copia imagen, la cara queda sin diseño). Si falta `imagenResourceId` (pero `ajusteImagen` es válido), no es error: la cara queda sin imagen, igual que una carta sin diseño hoy.
    - `'texto'`: `texto` (si no es string, se trata como `''`) se traslada como un único `TextBox` que ocupa toda la carta, en ambas caras: `{ id: crypto.randomUUID(), contenido: texto, fuenteResourceId: null, tamañoFuente: 16, color: '#000000', x: 0, y: 0, width: CARD_DESIGN_WIDTH, height: CARD_DESIGN_WIDTH / getProporcionRatio(proporcion), bordeActivo: false, bordeColor: '#000000', bordeGrosor: 2, bordeTipo: 'continua', colorFondo: properties.colorFondo || '' }` (usa `core/cardProportions.js`, `CARD_DESIGN_WIDTH`/`getProporcionRatio`, para que el tamaño en "unidades de diseño" sea coherente con `proporcion`). No es un caso de error.
    - `'color'` (o `fondoTipo` ausente/no reconocido) y sin `imagenResourceId`/`texto` aprovechables: no hay equivalente en el modelo de carta — `colorFondo` se pierde sin aviso (mismo criterio ya documentado para "carta sin diseño"). No es un caso de error.
  - `caraFrontal`/`caraTrasera` resultantes son siempre un objeto completo con el shape de `DEFAULT_CARTA_PROPERTIES` (incluido `transparenciaImagen: 0`), copiado idéntico en ambas caras (la ficha no distingue frontal/trasera).
- `migrateFichaComponent(component)` → `{ component: <objeto componente con type: 'carta'>, errors: string[] }`: envuelve `migrateFichaProperties`, y construye el componente resultante con `type: 'carta'`, `properties: <resultado>`, `properties.deckId: null`, `properties.caraActual: 'frontal'` (fijo, no `'trasera'` como al crear una carta nueva — para que la migración se note de inmediato), y el resto de campos generales del componente (`id`, `x`, `y`, `width`, `height`, `bloqueado`, `mostrarTooltip`, `subirAlMoverInteractuar`, `order`) sin tocar.

### 2. Migración silenciosa al cargar (`core/state.js`, `loadComponents`)

- Añadir una función interna `migrateFichas(components)` (mismo patrón que `compactOrders`, mutando/reemplazando en el array recibido) que recorre `components`, y para cada uno con `type === 'ficha'` llama a `migrateFichaComponent` (importado de `core/fichaMigration.js`) y sustituye el componente por el resultado — **ignorando siempre `errors`** (best-effort, nunca bloquea el arranque, mismo criterio que la migración silenciosa de `order` ya documentada en `ARCHITECTURE.md` sección 4).
- Invocar `migrateFichas(components)` al principio de `loadComponents(components)`, antes de `compactOrders(components)`. Esto cubre automáticamente los dos puntos de entrada de arranque (`main.js`: `loadComponents(saved.components)` desde `localStorage` y `loadComponents(seed.components)` desde el HTML embebido), sin tocar `main.js`.

### 3. Aviso de errores en la importación explícita (`ui/editModeToggle.js`, `importComponentsFromFile`)

En el flujo actual (`src/ui/editModeToggle.js:46-86`), tras `openImportConfirmModal` (se conocen `mode`/`conflictMode`) y antes de llamar a `mergeImportedGame`:

1. Calcular `selectedComponents = byIds(result.components, componentIds)` (ya se hace hoy, inline en la llamada a `mergeImportedGame` — se extrae a una variable).
2. Para cada componente de `selectedComponents` con `type === 'ficha'`, llamar a `migrateFichaComponent`. Acumular:
   - `migratedSelectedComponents`: `selectedComponents` con cada ficha sustituida por su `component` migrado (los no-ficha, sin tocar).
   - `conversionErrors`: lista `{ componentId, errors }` de las fichas cuyo `errors` no está vacío.
3. Extraer a una función local `proceedWithImport(components)` el cuerpo que hoy sigue a la construcción de `selectedComponents` (llamada a `mergeImportedGame` con esos `components` como `selectedComponents`, y el `loadComponents`/`loadResources`/`loadDecks`/`openImportReportModal` posteriores) — sin cambios de comportamiento salvo recibir los componentes ya migrados.
4. Si `conversionErrors` está vacío, invocar `proceedWithImport(migratedSelectedComponents)` directamente (comportamiento actual, con fichas ya migradas en vez de sin migrar).
5. Si no está vacío, abrir la nueva modal `openImportConversionErrorModal({ errors: conversionErrors, onContinue, onAbort })` (ver punto 4) **antes** de tocar el estado:
   - `onContinue`: llama a `proceedWithImport(migratedSelectedComponents.filter(c => !conversionErrors.some(e => e.componentId === c.id)))` — las fichas con error quedan fuera, el resto (incluidas las fichas migradas sin error) se importa con normalidad.
   - `onAbort`: no hace nada (no se ha llamado a `mergeImportedGame` ni a `loadComponents`/`loadResources`/`loadDecks` en ningún momento previo — la partida actual queda intacta).

### 4. Nueva modal `ui/importConversionErrorModal.js`

Nuevo fichero, siguiendo el patrón visual de referencia (`design_aviso-errores-conversion-fichas.html`), construido combinando patrones ya existentes (sin CSS nuevo):

- Estructura `modal-overlay`/`modal import-report-modal` (reutiliza la clase ya existente de `ui/importReportModal.js`, `max-width: 640px`, `STYLE_BIBLE.md` sección 12.4 — no se crea una clase de bloque nueva).
- Cabecera `modal__header modal__header--error` con `modal__error-icon` ("!") y título "Errores al convertir fichas" (mismo patrón que `ui/errorModal.js`).
- Contenido: párrafo introductorio + tabla `import-report-modal__table` (misma clase que `ui/importReportModal.js`) con columnas "Ficha afectada" / "Error" — una fila por cada entrada de `errors` (si una ficha tiene varios errores, se listan concatenados en la misma celda).
- Pie con dos botones (patrón de `ui/deckDeleteConfirmModal.js`, confirmación con consecuencias): `btn-cancel` "Abortar importación" → invoca `onAbort()` y cierra; `btn-accept` "Continuar sin esas fichas" → invoca `onContinue()` y cierra. A diferencia de `errorModal.js`/`importReportModal.js`, el cierre por click fuera del overlay o por ESC (`ui/globalShortcuts.js`, que ya mapea ESC → `.btn-cancel` del `.modal-overlay` visible) equivale a "Abortar" (mismo botón).
- Firma: `openImportConversionErrorModal({ errors, onContinue, onAbort })`, donde `errors` es `{ componentId, errors: string[] }[]`.

### 5. Eliminar el tipo "Ficha" del alta y renombrar la etiqueta de "Carta"

- `src/ui/componentTypeModal.js`: quitar la entrada `{ value: 'ficha', label: 'Ficha' }` de `COMPONENT_TYPES`; cambiar `{ value: 'carta', label: 'Carta' }` → `{ value: 'carta', label: 'Carta/Ficha' }`.
- `src/ui/componentRenderer.js`: en `COMPONENT_TYPE_LABELS` (línea ~189), quitar la entrada `ficha: 'Ficha'` y cambiar `carta: 'Carta'` → `carta: 'Carta/Ficha'`. Como tras el paso 2 ningún componente en memoria puede tener ya `type === 'ficha'` (se migra siempre al cargar), eliminar también la rama completa de renderizado `else if (component.type === 'ficha') { ... }` (líneas ~887-1038) — código muerto tras la migración.
- `src/ui/componentModal.js`: eliminar `DEFAULT_FICHA_PROPERTIES`, `DEFAULT_FICHA_SIZE` y la rama `else if (type === 'ficha') { ... }` de `createDefaultComponent` (ya no se puede dar de alta); eliminar el bloque completo de campos específicos de `'ficha'` en la pestaña "Específicas" (forma, borde, tipo de fondo condicional, texto, imagen — el bloque que usa `DEFAULT_FICHA_PROPERTIES` en las líneas ~810-1040) por el mismo motivo.
- Revisar `src/ui/imageAdjustModal.js` (comentario de cabecera que cita a `'ficha'` como su único uso sin `faces`) y ajustar el comentario para reflejar que ahora también lo usa `'carta'` sin distinción (ya lo usa hoy con `faces`, el comentario queda desactualizado tras retirar `'ficha'`, no el comportamiento).

### 6. Documentación funcional (`design/docs/FEATURES.md`)

Alcance ya acotado por `description.md` ("cualquier ayuda contextual o texto de la documentación funcional que mencione 'Carta'/'Ficha' como tipos"). Actualizar, tras implementar el resto:

- Eliminar la sección `### Componente "ficha"` completa.
- Sustituir cualquier mención de "Ficha" como tipo de componente por "Carta/Ficha" (o fusionar con las menciones ya existentes de "Carta" donde ambas coexistían en la misma frase — p. ej. las líneas que dicen "salvo 'Ficha' y 'Carta'" pasan a decir simplemente "salvo 'Carta/Ficha'").
- Añadir una nota breve en la sección de "Carta" o en persistencia/importación (la que ya toque `ms-do` al hacer esta actualización) sobre la migración automática de fichas antiguas y el aviso de errores en la importación explícita, con el mismo nivel de detalle funcional que el resto del documento (sin tecnicismos de implementación).

### Orden de implementación sugerido

1. `core/fichaMigration.js` (módulo puro, sin dependencias — se puede probar de forma aislada).
2. Migración silenciosa en `core/state.js`.
3. Aviso de errores + modal nueva en el flujo de importación (`ui/editModeToggle.js` + `ui/importConversionErrorModal.js`).
4. Retirada del tipo y renombrado de etiqueta (`componentTypeModal.js`, `componentRenderer.js`, `componentModal.js`, `imageAdjustModal.js`) — se deja para el final porque, hasta este punto, `type: 'ficha'` ya no puede aparecer en memoria (todo pasa por la migración), así que retirar su renderizado/edición es seguro.
5. Actualización de `FEATURES.md`.

## (c) Cambios de arquitectura

`docs.tech.architectureDocPath` = `design/docs/ARCHITECTURE.md`. Esta solución elimina un tipo de componente documentado y añade un módulo de migración nuevo, así que sí aplica:

- **Sección 4, "Tipos de componente implementados"**: eliminar por completo el bullet `**'ficha'** (cambio 00029): ...`. En el bullet de `'carta'`, añadir una nota indicando que desde este cambio (00087) su etiqueta visible en la interfaz es "Carta/Ficha" (el identificador de datos `'carta'` no cambia) y que absorbe el caso de uso de la antigua `'ficha'` (piezas/tokens simples).
- **Sección 4** (o una subsección nueva 4.3 "Migración de componentes 'ficha'"): documentar el nuevo módulo `core/fichaMigration.js` (`migrateFichaProperties`/`migrateFichaComponent`) y su mapeo de campos (forma→proporción, borde tal cual, imagen tal cual, texto→`TextBox` de carta completo, pérdida silenciosa del color de fondo sólido), y que `core/state.js` (`loadComponents`) lo invoca de forma silenciosa (mismo patrón que la migración de `order` ya documentada) para los dos puntos de arranque.
- **Sección 5, módulos UI**: en el bullet de `ui/componentRenderer.js`, quitar las referencias a `'ficha'` (la mención de "seis tipos" pasa a "cinco tipos"; el ejemplo de `overflow: hidden` interno que cita "`'ficha'` y `'carta'`" pasa a citar solo `'carta'`). En el bullet de `ui/componentTypeModal.js`, actualizar la lista de tipos disponibles (quitar `'ficha'`) y su etiqueta (`'carta'` → "Carta/Ficha"). En el bullet de `ui/componentModal.js`, quitar la mención a la pestaña "Específicas" de `'ficha'`. En el bullet de `ui/imageAdjustModal.js`, actualizar la referencia a que `'ficha'` "es el único que usa `'faces'`" (ya no aplica, y de hecho tampoco era cierto del todo — revisar redacción exacta al tocar el fichero). Añadir un bullet nuevo para `ui/importConversionErrorModal.js` (nuevo módulo, patrón "aviso con dos acciones (continuar/abortar) antes de aplicar un cambio", primer precedente de este patrón junto a `ui/deckDeleteConfirmModal.js`, aunque de dominio distinto).
- **Sección 6.1, "Exportar/Importar con selección"**: documentar el nuevo paso de conversión de fichas con posible aviso de error antes de `mergeImportedGame`, dejando explícito que es el único punto de conversión ficha→carta que puede interrumpirse (a diferencia del arranque).
- **Sección 8, "Funcionalidades transversales"**: en el bullet de "Alta de un tipo de componente nuevo", ya no aplica ningún ajuste (era una lista de reglas, sigue siendo válida en general); no requiere cambio de contenido, solo queda como referencia para futuros tipos.

(No aplica sección (d): no hay `docs.tech.styleBibleDocPath` a tocar — la nueva modal reutiliza clases y patrones ya documentados en `STYLE_BIBLE.md`, sin introducir ninguno nuevo.)
