- **Name**: Baterías de tests funcionales de las funcionalidades 13, 14 y 21 (y limpieza de doc de la 31)
- **Code**: 00260
- **Type**: change
- **Creation date**: 2026-09-09

## Full description

Se piden baterías de tests funcionales (los tests automáticos de desarrollo del proyecto, que no forman parte del producto entregable) para cuatro funcionalidades que hoy no tienen ninguna prueba que las cubra: la 13 ("Subir al mover/interactuar"), la 14 ("Interacciones programadas de un componente"), la 21 ("Componente Visor de documentos") y la 31 ("Guardar a fichero"). Todo dentro de este mismo cambio.

### Alcance real: 13, 14 y 21

Al analizar la petición se ha comprobado que la funcionalidad **31 ("Guardar a fichero") ya no existe en el producto**: el botón "Guardar" del modo edición que descargaba una copia autocontenida del proyecto fue retirado en una versión anterior y hoy la aplicación solo ofrece "Importar" y "Exportar" (esta última genera un fichero de intercambio de componentes, que es la funcionalidad 32). No se puede escribir una batería de pruebas para algo que no está implementado, así que la 31 queda fuera del alcance de pruebas.

En su lugar, por la 31 este cambio hace una **limpieza de documentación**: se retira/archiva la ficha de la funcionalidad 31, se actualiza el índice de funcionalidades, y se deja de listar la 31 como "funcionalidad pendiente de tener tests" allí donde aparezca.

Por tanto, este cambio crea baterías de tests nuevas para **tres** funcionalidades: 13, 14 y 21. Cada una en su propio fichero de pruebas, siguiendo exactamente los mismos criterios y estilo que las baterías ya existentes del proyecto (un fichero por funcionalidad, mezcla de pruebas de lógica interna y de interfaz, reutilizando las utilidades de prueba que ya hay, sin datos de ejemplo nuevos salvo que algún caso concreto lo haga más legible). El cambio no se considera terminado hasta que toda la batería de pruebas del proyecto pasa correctamente y el mapa de trazabilidad funcionalidad↔tests queda regenerado sin anomalías.

### Batería de la funcionalidad 13 — "Subir al mover/interactuar"

Cubre:

- **Valor por defecto de la casilla** según el tipo de componente: viene marcada de fábrica en "Carta/Ficha", "Dado" y "Mazo"; desmarcada en el resto de tipos. Un componente guardado antes de que existiera esta casilla se comporta como si estuviera desmarcada.
- **Efecto en Modo Juego con la casilla marcada**: cada vez que el componente se mueve (arrastre) o resuelve su interacción propia (voltear una carta, lanzar un dado, sacar carta de un mazo), pasa automáticamente a colocarse encima de todos los demás componentes de la mesa.
- **Con la casilla desmarcada**: ninguna de esas acciones cambia el orden de apilado; el componente conserva la posición que tuviera.
- **Independencia respecto a "Bloqueado"**: un componente bloqueado en juego no se puede arrastrar, pero si resuelve su interacción propia (voltear, lanzar) sí se recoloca arriba, igual que hoy.
- **Exclusivo de Modo Juego**: mover el componente en modo edición nunca lo recoloca por esta casilla.
- **Herencia de grupo**: si el componente pertenece a un grupo, el valor efectivo de la casilla es el que resuelve la lógica de propiedades efectivas del grupo.

### Batería de la funcionalidad 14 — "Interacciones programadas de un componente"

Cubre:

- **Qué interacción de click izquierdo tiene cada tipo**: "Dado" → lanzar dado; "Carta/Ficha" → voltear carta; "Mazo" → sacar carta de arriba; los tipos sin interacción de este tipo ("Cuadro de texto", "Tablero simple", "Visor de documentos") no ofrecen ninguna.
- **La sección "Interacciones programadas"** de la pestaña "Interacciones" de la ventana de configuración: un desplegable por cada interacción de click izquierdo del tipo, con las opciones "Ninguna" y el nombre de la interacción (esta última seleccionada por defecto); y una fila fija "Click derecho" con las opciones "Ninguno" y "Abrir menú contextual", presente para todos los tipos por igual.
- **Valores por defecto**: un componente nuevo nace con todas sus interacciones de click izquierdo activas y con el click derecho en "Ninguno". Un componente guardado antes de esta funcionalidad se comporta con todas las interacciones activas, pero su click derecho se comporta como "Abrir menú contextual" (se conserva el comportamiento que tenía antes), que es deliberadamente distinto del valor por defecto de un componente nuevo.
- **Efecto de desactivar una interacción de click izquierdo en Modo Juego**: el click sobre ese componente deja de disparar esa acción concreta (el dado no se lanza, la carta no voltea, el mazo no saca carta), sin afectar a nada más: el arrastre, el doble-click del dado que abre el resultado a tamaño grande, y el menú contextual siguen funcionando igual.
- **Efecto de poner el click derecho en "Ninguno"**: el botón derecho sobre ese componente en Modo Juego no hace nada — ni lo selecciona ni abre el menú contextual. El resto de interacciones no se ve afectada.
- **Reflejo en la sección informativa "Interacciones" del propio menú contextual de Modo Juego**: su fila "Clic izquierdo" pasa a mostrar "Ninguno" cuando esa interacción está desactivada.
- **Sincronización en un componente tipo "Copia"**: las interacciones de click izquierdo desactivadas se sincronizan automáticamente con el componente original. Respecto a si el ajuste de click derecho también se sincroniza, la ficha funcional de la 14 dice que sí pero la documentación técnica de datos no lo recoge; se verificará contra el código real al planificar y la prueba se escribirá conforme a lo que haga el código (ver Notas técnicas).

### Batería de la funcionalidad 21 — "Componente Visor de documentos"

Cubre:

- **Conversión de Markdown a HTML**: un caso representativo que ejercite variedad de Markdown enriquecido (encabezado, negrita, tabla, lista de tareas, texto tachado), sin pretender reproducir de forma exhaustiva todo lo que soporta la librería usada.
- **Saneado del HTML**: se elimina cualquier `<script>`, cualquier manejador de evento incrustado en un atributo y cualquier enlace que apunte a `javascript:` (incluido con espacios por delante), y se conserva el resto del contenido y de los atributos. Se incluyen casos con HTML potencialmente peligroso pegado por el usuario, como cobertura de regresión de esa barrera de saneado (el estado del proyecto se guarda como un único fichero HTML autocontenido).
- **Valores por defecto del componente**: se crea con un tamaño fijo inicial y con el formato de contenido en "Markdown"; al cambiar entre contenido de tipo "Texto" y de tipo "URL" no se pierde la configuración de la opción que queda inactiva.
- **Representación sobre la mesa con contenido de tipo Texto**: se muestra el contenido ya convertido y saneado; se interpreta como Markdown o como HTML según el formato elegido.
- **Representación con contenido de tipo URL**: la página externa se muestra embebida de forma aislada; si no consigue cargarse (falla la carga o se agota el tiempo de espera) se muestra superpuesto el aviso "No se pudo cargar el contenido" (detección best-effort).
- **Componente sin contenido**: se muestra simplemente la hoja en blanco, sin ningún aviso.
- **Ajuste al ancho y scroll vertical**: se comprueba de forma acotada, ya que el entorno de pruebas no carga los estilos (mismo criterio que otras baterías existentes: se verifica la estructura, no la maquetación exacta).

### Documentación que se actualiza en este cambio

- La ficha de arquitectura del marco de tests funcionales: se añaden las tres nuevas baterías (13, 14 y 21) a su tabla de ficheros de test.
- El mapa de trazabilidad funcionalidad↔tests se regenera automáticamente al pasar la batería (no se edita a mano).
- Por la funcionalidad 31: se archiva/retira su ficha funcional, se actualiza el índice de funcionalidades y se deja de listarla como funcionalidad sin tests.

## Technical notes

Cambio exclusivamente de tests (`src/test/functional/*.test.js`, dev-only) más ajustes de documentación. No toca código de producción. Sin puntos de seguridad pendientes: los tests no entran en el entregable (`src/scripts/build.py` recorre imports desde `src/main.js`); la batería 021 aporta cobertura de regresión al saneado de HTML.

### Inconsistencias detectadas documentación ↔ código (manda el código)

1. **Funcionalidad 31 obsoleta.** `previo-sdd/design/docs/features/031-guardar-a-fichero.md` describe un botón "Guardar" en modo edición que descarga un HTML autocontenido con el estado embebido. Esa funcionalidad ya no existe: `src/core/fileExport.js` solo expone `downloadJson(filename, data)`; `src/ui/editModeToggle.js` solo monta "Importar"/"Exportar" (JSON de componentes, funcionalidad 032). Lo confirma `previo-sdd/design/docs/architecture/007-persistence-build.md`, sección "File save": *"there is no whole-app 'Guardar' action any more … `buildExportHtml`/`downloadHtml` … has since been removed"*. Acción para `pv-do`: archivar/retirar `031-guardar-a-fichero.md`, actualizar `previo-sdd/design/docs/features/INDEX.md`, y quitar la 31 de la lista de "funcionalidades sin test" de `011-functional-test-framework.md` y de cualquier otro doc.
2. **Sincronización de `accionClickDerecho` en Copias.** `previo-sdd/design/docs/architecture/002-component-model.md`, sección "Linked copies (copyOf)", lista "Always propagated" de `syncCopyWithOriginal`: incluye `interaccionesDesactivadas` pero **no** menciona `accionClickDerecho`, mientras que `014-interacciones-programadas-de-un-componente.md` afirma que el ajuste de click derecho **sí** se sincroniza con el original. `pv-how` debe verificar en `src/core/component.js` (`syncCopyWithOriginal`) el comportamiento real: si no propaga `accionClickDerecho`, corregir la ficha funcional 014 (y/o 002); si sí lo propaga, añadirlo a la lista de "Always propagated" de 002. La batería 014 se escribe según el código real.
3. El identificador de tipo en código para el "Visor de documentos" es `'documento'` (el nombre visible es "Visor de documentos"). `003-component-types.md` ya lo documenta correctamente.

### Puntos de anclaje en el código (para `pv-how`)

- `src/core/interactions.js`: `TYPE_INTERACTIONS` (`dado`→`lanzar`, `carta`→`voltear`, `mazo`→`sacarCarta`), `getInteractionsForType(type)`, `isInteractionActive(component, key)` (lee `component.interaccionesDesactivadas`).
- `src/modes/play/playMode.js`: los callbacks `onMove` / `onDiceResult` / `onCartaFlip` / `onMazoDraw` llaman `reorderComponent(id, 1)` si `getEffectiveGeneralProps(component, groups).subirAlMoverInteractuar`; `onContextMenu` hace `return` temprano si `component.accionClickDerecho === 'ninguno'`; `getInteractionItemsFor` / `interactionsByType` gobiernan la sección informativa "Interacciones" del menú (fila "Clic izquierdo" → "Ninguno" cuando la interacción está desactivada).
- `src/ui/componentRenderer.js`: rama `component.type === 'documento'` (~línea 1449): `.document-viewer` / `.document-viewer__content` / `.document-viewer__error`, `<iframe sandbox="allow-scripts allow-same-origin allow-popups">`, `content.innerHTML = sanitizeHtml(props.formato === 'html' ? props.contenido : markdownToHtml(props.contenido))`. El gating de las clases `dice--clickable` / `carta--clickable` y de los listeners de click va por `isInteractionActive(component, 'lanzar'|'voltear')`; `onMazoDraw` va por `isInteractionActive(component, 'sacarCarta')`.
- `src/core/markdown.js` (`markdownToHtml(text)`, envuelve `src/vendor/marked.js`), `src/core/sanitizeHtml.js` (`sanitizeHtml(html)`, basado en `<template>`, quita `<script>`, atributos `on*`, y `javascript:` en `href`/`src`).
- `src/core/component.js`: `createComponent`, `syncCopyWithOriginal`, `NON_SYNCED_PROPERTY_KEYS`; `createDefaultComponent` vive en `src/ui/componentModal.js`. Migración `migrateAccionClickDerecho` en `src/core/state.js` (`loadComponents`): un guardado sin `accionClickDerecho` → `'menuContextual'`.
- Utilidades de test ya disponibles (`src/test/helpers.js`): `resetState`, `mountEditMode`, `mountPlayMode`, `loadFixture`, `mockRandom`, `restoreAllMocks`, `captureDownload`/`getLastDownload`, `dispatchContextMenu`, `getOpenContextMenu`. Motor (`src/test/harness.js`): `describe` / `it` (nombre con prefijo `FT-<NNN>-<nn>`) / `expect` / `beforeEach` / `afterEach` / `registerFeature`.
- Ficheros de test propuestos (nombres orientativos, a confirmar en `pv-how`): `src/test/functional/subir-al-interactuar.test.js` (`registerFeature({ primary: 13 })`), `src/test/functional/interacciones-programadas.test.js` (`registerFeature({ primary: 14 })`, secundaria 5 si un caso ejercita sincronización de Copia), `src/test/functional/visor-documentos.test.js` (`registerFeature({ primary: 21 })`).
- Actualizar la tabla "## Test files" de `previo-sdd/design/docs/architecture/011-functional-test-framework.md` con las tres filas nuevas.
