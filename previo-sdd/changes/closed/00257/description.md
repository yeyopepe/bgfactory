- **Name**: Batería de tests para la funcionalidad 25 (Identificación de componentes al pasar el ratón)
- **Code**: 00257
- **Type**: change
- **Creation date**: 2026-09-08

## Full description

La funcionalidad 25 ("Identificación de componentes al pasar el ratón") no tiene actualmente ningún test funcional que la valide: en el mapa de trazabilidad aparece sin ningún test asociado. La regla de cobertura del framework de tests funcionales del proyecto exige que toda funcionalidad que aporta comportamiento tenga sus tests, así que esta laguna hay que cerrarla.

Este cambio consiste en añadir esa batería de tests: un nuevo conjunto de casos de prueba automatizados dedicado en exclusiva a la funcionalidad 25. Se toma como plantilla el conjunto de tests de la funcionalidad 18 ("Componente tablero simple").

No cambia ningún comportamiento de la aplicación: es trabajo de cobertura de pruebas, no de producto. Nada de lo que se añade llega a la aplicación entregable.

Es parte de la misma tanda de cierre de lagunas de cobertura que los cambios 00254 (funcionalidad 19), 00255 (funcionalidad 20) y 00256 (funcionalidad 23).

### Qué comportamientos de la funcionalidad 25 se validan

1. **Etiqueta identificativa en modo edición.** En modo edición, cualquier componente de la mesa muestra una etiqueta con el formato "Tipo: id", sin poder desactivarse. Se comprueba con un componente de cada tipo relevante.
2. **Modo juego sin "Mostrar tooltip".** En modo juego, un componente cuyo checkbox "Mostrar tooltip" está en su valor por defecto (desactivado) no muestra ni etiqueta identificativa ni tooltip.
3. **Modo juego con "Mostrar tooltip" y sin texto propio.** Con "Mostrar tooltip" activado y el campo "Tooltip" vacío, el componente muestra un tooltip cuyo contenido es el mismo identificador "Tipo: id".
4. **Modo juego con "Mostrar tooltip" y texto propio.** Con "Mostrar tooltip" activado y un texto en "Tooltip" con formato básico (por ejemplo negrita), el tooltip muestra ese texto con el formato aplicado; el marcado peligroso (un `<script>`) no se muestra.
5. **Formato del identificador por tipo.** El identificador "Tipo: id" usa la etiqueta traducida del tipo para cuadro de texto, tablero simple, dado, visor de documentos, carta y mazo. Para "tablero personalizado", que no tiene una etiqueta traducida propia en este mecanismo, el identificador usa el nombre interno del tipo ("tableroPersonalizado: <id>"). (Se documenta como comportamiento observado, no como defecto; queda a criterio de una mejora futura decidir si "tablero personalizado" debe tener también su etiqueta traducida aquí.)
6. **Variables de texto.** El texto del "Tooltip" (y el del "Título") admite variables con la forma `{nombre}`. La primera disponible es `{cards_current}`, que se sustituye por el número de cartas actual sólo en un componente "Mazo"; en cualquier otro tipo se muestra literal, sin sustituir. Una variable desconocida se deja siempre literal.
7. **Título de componente en modo juego.** Con "Mostrar título" activo y un texto de título no vacío, el componente muestra una etiqueta de título siempre visible (a diferencia del tooltip, que sólo aparece al pasar el ratón); con el texto de título vacío no se muestra ninguna etiqueta de título. El texto del título también admite la variable `{cards_current}`.
8. **Valores por defecto del modelo.** El checkbox "Mostrar tooltip" nace desactivado en todos los tipos salvo el "Mazo", que nace con el tooltip activado y con un texto de ayuda. El campo "Tooltip" nace vacío salvo en los tipos que lo fijan.
9. **Checkbox "Mostrar tooltip" en el modal (caso ligero).** Al abrir la ventana de configuración de un componente en modo edición, la pestaña "Generales" (sección "Ayuda jugador") muestra el checkbox "Mostrar tooltip" y el campo de texto "Tooltip"; marcar/desmarcar el checkbox actualiza la configuración del componente, y con el checkbox desmarcado el campo de texto queda deshabilitado.

### Preguntas de alcance resueltas con el usuario

- **¿Incluir un caso sobre el checkbox "Mostrar tooltip" del modal?** → Sí, un caso ligero (FT-025-09): comprobar que el checkbox existe en la pestaña "Generales" y que togglea la configuración del componente.

### Qué queda fuera de alcance

- El saneado exhaustivo del texto del tooltip/título (qué etiquetas concretas de formato pasan y cuáles no) se comprueba de forma mínima (negrita sí, `<script>` no), no etiqueta por etiqueta.
- El posicionamiento visual del tooltip (aparición al pasar el ratón, coordenadas) no se testea, porque el runner de tests no carga la hoja de estilos.
- El catálogo completo de la pestaña "Generales" del modal más allá del checkbox "Mostrar tooltip" y el campo "Tooltip" (ya cubierto tangencialmente por otra batería).

### Criterio de "terminado"

El cambio no se considera completo hasta que la suite de tests del proyecto pasa entera y el mapa de trazabilidad queda regenerado sin anomalías: la línea de la funcionalidad 25, que hoy figura sin ningún test, pasará a listar los códigos de los nuevos casos.

## Technical notes

- Fichero nuevo `src/test/functional/identificacion-hover.test.js`, `registerFeature({ primary: 25 })`, casos `FT-025-<nn>`. Plantilla `tablero-simple.test.js`. Motor propio (`describe`/`it`/`expect` de `../harness.js`); helpers `resetState`/`mountEditMode`/`mountPlayMode` de `../helpers.js`. Niveles: `state` para FT-025-06 y FT-025-08; `ui` para el resto. Marco de referencia: `previo-sdd/design/docs/architecture/011-functional-test-framework.md`.
- Paso de `identifyMode` a `renderComponentsOnTable`: `src/modes/edit/editMode.js` (~línea 736) pasa `identifyMode: 'label'` SIEMPRE; `src/modes/play/playMode.js` (~línea 147) pasa `identifyMode: 'tooltip'` SIEMPRE. No hay un tercer valor.
- `src/ui/componentRenderer.js`:
  - `COMPONENT_IDENTIFIER_TYPE_KEY` (~línea 258) = `{ texto, tableroSimple, dado, documento, carta, mazo }` → claves i18n `'componentIdentifier.type.<tipo>'`. **NO tiene entrada para `'tableroPersonalizado'`**.
  - `formatComponentIdentifier(component)` (~línea 267, **EXPORTADA**) → `key = COMPONENT_IDENTIFIER_TYPE_KEY[component.type]; typeLabel = key ? t(key) : component.type; return \`${typeLabel}: ${component.id}\``. Para `'tableroPersonalizado'` devuelve `tableroPersonalizado: <id>`.
  - `createIdentifierLabel(component)` (~línea 273) → `<span class="component-id-label">` con `textContent = formatComponentIdentifier(component)`.
  - `attachComponentTooltip(element, component)` (~línea 290) → `element.classList.add('component-tooltip-host')`; crea `<span class="component-tooltip">`; si `component.tooltipTexto` → `tooltip.innerHTML = sanitizeBasicTooltipHtml(resolveTextVariables(component.tooltipTexto, component))`; si no → `tooltip.textContent = formatComponentIdentifier(component)`; `element.appendChild(tooltip)`. El texto SIEMPRE sale de `component.tooltipTexto` (nunca de `effective`; `getEffectiveGeneralProps` no expone ese campo).
  - `attachComponentTitle(element, component)` (~línea 308) → `resolvedTexto = resolveTextVariables(component.tituloTexto || '', component)`; si `!resolvedTexto` → `return` (no pinta nodo); si no → `<span class="component-title-label">` con `innerHTML = sanitizeBasicTooltipHtml(resolvedTexto)`, `color`/`backgroundColor` inline; `element.appendChild(label)`. Sin la clase `.component-tooltip-host` (siempre visible, no depende de `:hover`).
  - En CADA rama de tipo del render (`texto` ~693, `tableroSimple` ~836, `tableroPersonalizado` ~1085, `dado` ~1230, `documento` ~1461, `carta` ~1690, `mazo` ~1929): `if (identifyMode === 'tooltip' && effective.mostrarTooltip) attachComponentTooltip(nodo, component); if (identifyMode === 'tooltip' && effective.mostrarTitulo) attachComponentTitle(nodo, component); if (identifyMode === 'label') nodo.appendChild(createIdentifierLabel(component));` — mismo patrón en las 7 ramas. `effective` = `getEffectiveGeneralProps(component, groups)` (override de grupo). `mostrarTooltip` y `mostrarTitulo` SÍ pueden venir de override de grupo vía `effective`; el TEXTO (`tooltipTexto`/`tituloTexto`) siempre del componente.
- `src/core/textVariables.js`:
  - `getAvailableVariables(component)` → si `component.type === 'mazo'`, `{ cards_current: String((component.properties.cartaIds || []).length) }`; si no, `{}`.
  - `resolveTextVariables(text, component)` → `text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match))`. Una variable no aplicable al tipo se deja literal, nunca cadena vacía.
- Modelo: `src/core/component.js` `createComponent` — `mostrarTooltip` por defecto `false`; `tooltipTexto` por defecto ausente/`''`. `src/ui/componentModal.js` `createDefaultComponent('mazo')` fuerza `component.mostrarTooltip = true` y `component.tooltipTexto = 'Pulsa para sacar la primera carta.'` (mismo dato que el cambio 00256). `FT-025-08` confirma el default genérico y la excepción del mazo.
- Modal: `src/ui/componentModal.js` (~línea 595): `tooltipCheckbox.checked = workingComponent.mostrarTooltip ?? false`; listener `'change'` → `workingComponent.mostrarTooltip = tooltipCheckbox.checked`. `tooltipTextarea` (~línea 623): `value = workingComponent.tooltipTexto ?? ''`; `'input'` → `workingComponent.tooltipTexto = tooltipTextarea.value`; `tooltipTextarea.disabled` ligado a `!mostrarTooltip` (~línea 1841). Sección "Ayuda jugador" dentro de la pestaña "Generales". `openComponentModal` monta `.modal-overlay` en `document.body` y hace `workingComponent = { ...component }` (copia superficial). `afterEach` debe limpiar `.modal-overlay`.
- Aislamiento: `src/modes/edit/editMode.js` mantiene `selectedComponentIds` como estado de módulo que `resetState()` no limpia — los casos con selección en modo edición usan ids distintos por caso (mismo `[gotcha]` que `tablero-simple.test.js`).
- Checklist de seguridad (`pv-internal-tech-security`): ninguna categoría aplicable — fichero de test dev-only, nunca entra en el bundle. El path `sanitizeBasicTooltipHtml` + `innerHTML` sobre `tooltipTexto` es código de producción existente; añadir un test que lo ejercita no crea superficie nueva.
- No se han detectado inconsistencias entre la documentación (funcionalidad 025, arquitectura 003 modelo general) y el código para esta funcionalidad. (La inconsistencia de la imagen propia del mazo pertenece al cambio 00256, no a este.)
