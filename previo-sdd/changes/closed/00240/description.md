- **Name**: Batería de tests funcionales para la funcionalidad 026 (menú contextual en modo juego)
- **Code**: 00240
- **Type**: change
- **Creation date**: 2026-09-06

## Full description

Se quiere dotar a la funcionalidad **026 — Menú contextual de componente en modo juego** de una batería de tests funcionales completa dentro del framework de tests del proyecto. Hoy esa funcionalidad no tiene ningún test que la valide (aparece sin cobertura en el informe de trazabilidad), pese a ser una funcionalidad ya implementada y documentada.

El resultado es un conjunto de casos de prueba automáticos que ejercitan, uno por uno, todos los comportamientos observables descritos en la ficha funcional de la 026: la apertura del menú, la selección que conlleva, su contenido según el tipo y el estado del componente, las acciones que ofrece, la sección informativa de interacciones, y todas las formas de cerrarlo. Cada caso lleva su propio código identificador (FT-026-01, FT-026-02, ...) y valida un único comportamiento, incluidos los casos límite.

La documentación funcional de la 026 ya está revisada y es correcta y completa: este cambio **no** la modifica. El informe de trazabilidad funcionalidad ↔ tests tampoco se edita a mano: se regenera automáticamente al ejecutar la batería y reflejará por sí solo la nueva cobertura de la 026.

### Comportamientos que la batería debe cubrir

Tomados de la ficha funcional de la 026:

1. **Apertura y selección.** Pulsar el botón derecho sobre un componente de la mesa en modo juego lo selecciona (con el mismo resaltado de contorno discontinuo que usa el modo edición) y abre un menú contextual junto al cursor.
2. **Click derecho desactivado.** Si el componente tiene configurado "Ninguno" en el ajuste de click derecho, el botón derecho no hace nada sobre él: ni lo selecciona ni abre el menú. (Nota funcional relevante para los tests: un componente recién creado nace con el click derecho en "Ninguno"; los casos que esperan menú deben activarlo explícitamente en el componente de prueba.)
3. **Primera fila: descripción de solo lectura.** La primera fila del menú es siempre una línea no pulsable con la descripción del componente en el formato "Tipo: identificador".
4. **Propiedad extra de la descripción según el tipo.** Esa línea añade, según el tipo, una propiedad que ayuda a distinguir el componente de otros del mismo tipo: número de caras para un dado, tamaño actual "AnchoxAlto" para un tablero (simple o personalizado), número de cartas para un mazo. Texto, Documento y Carta/Ficha no añaden propiedad extra. Se calcula al abrir el menú a partir del estado actual del componente.
5. **Fila Bloquear / Desbloquear.** Tras una línea divisoria, aparece una fila cuyo texto refleja la acción disponible: "Bloquear" si el componente está desbloqueado, "Desbloquear" si está bloqueado. Al elegirla, el estado de bloqueo del componente cambia en consecuencia y el menú se cierra.
6. **Excepción de la fila Bloquear/Desbloquear en Copias sincronizadas.** Si el componente es una Copia que sigue sincronizada con su original, esta fila no aparece (su estado de bloqueo sigue siempre al del original). Si la Copia ya no está sincronizada, la fila sí aparece.
7. **Acciones específicas por tipo.** Separadas por otra línea divisoria:
   - **Mazo:** "Barajar" (reordena las cartas del mazo) y "Ver contenido...".
   - **Carta:** "Meter en mazo...", que aparece únicamente si existe al menos un mazo en la partida.
   Elegir "Barajar" cambia el orden de las cartas del mazo y cierra el menú. Elegir "Ver contenido..." abre la vista de contenido del mazo y cierra el menú contextual.
8. **Sección "Interacciones" (solo lectura).** Al final del menú, una sección lista qué hace cada tipo de click sobre el componente: "Clic izquierdo", "Doble clic izquierdo" y "Clic derecho", con el efecto de cada uno o "Ninguno" si no tiene nada programado. Para un dado: lanzar el dado / ver el resultado ampliado / abrir este menú. Para un componente sin interacciones (p. ej. un cuadro de texto): "Ninguno" / "Ninguno" / abrir este menú.
9. **Interacción de click izquierdo desactivada.** La fila "Clic izquierdo" muestra "Ninguno" si esa interacción está desactivada para ese componente concreto, aunque su tipo sí tenga una interacción de click por defecto.
10. **Cambio de menú al pulsar sobre otro componente.** Pulsar el botón derecho sobre otro componente mientras hay un menú abierto cierra el anterior, cambia la selección al nuevo componente y abre el menú sobre este.
11. **Cierre del menú.** El menú (y la selección asociada) se cierra al pulsar ESC, al hacer click fuera de él, y al elegir una de las acciones disponibles.
12. **La selección no se persiste.** La selección asociada al menú contextual es estado momentáneo de la sesión de juego: no se guarda y se pierde al recargar la página. Tras un ciclo de guardado y recarga del estado, no queda ningún componente seleccionado.

### Casos de prueba previstos

| Código | Qué valida |
|---|---|
| FT-026-01 | Click derecho sobre un componente con el menú contextual activado: abre el menú junto al cursor y selecciona el componente. |
| FT-026-02 | Click derecho sobre un componente con el click derecho en "Ninguno": no abre menú ni selecciona. |
| FT-026-03 | La primera fila es la descripción de solo lectura "Tipo: identificador" y no responde al click. |
| FT-026-04 | La descripción incluye la propiedad extra correcta por tipo (dado, tablero, mazo) y ninguna para texto/documento/carta. |
| FT-026-05 | Con el componente desbloqueado aparece "Bloquear"; al elegirla, el componente queda bloqueado y el menú se cierra. |
| FT-026-06 | Con el componente bloqueado aparece "Desbloquear"; al elegirla, el componente queda desbloqueado. |
| FT-026-07 | Sobre una Copia sincronizada no aparece la fila Bloquear/Desbloquear; sobre una Copia no sincronizada sí aparece. |
| FT-026-08 | Menú de un mazo: aparecen "Barajar" y "Ver contenido..."; "Barajar" reordena las cartas de forma determinista y cierra el menú. |
| FT-026-09 | "Ver contenido..." de un mazo abre la vista de contenido del mazo y cierra el menú contextual. |
| FT-026-10 | "Meter en mazo..." aparece en el menú de una carta solo si hay al menos un mazo en la partida. |
| FT-026-11 | La sección "Interacciones" lista los tres tipos de click con el efecto correcto para un dado y para un componente sin interacciones. |
| FT-026-12 | "Clic izquierdo" muestra "Ninguno" cuando esa interacción está desactivada para ese componente concreto. |
| FT-026-13 | Pulsar el botón derecho sobre otro componente con un menú abierto: cierra el anterior, cambia la selección y abre el nuevo. |
| FT-026-14 | ESC cierra el menú y limpia la selección. |
| FT-026-15 | Un click fuera del menú lo cierra y limpia la selección. |
| FT-026-16 | Elegir una acción disponible cierra el menú y limpia la selección. |
| FT-026-17 | Tras guardar y recargar el estado, no hay ningún componente seleccionado (la selección del menú no se persiste). |

### Preguntas de alcance resueltas

- **¿Qué entra en este cambio?** Solo la batería de la funcionalidad 026. La ampliación de los tests de las funcionalidades que hoy ya tienen cobertura parcial (002, 005, 016, 022, 029, 032, 036, 039) se documenta y trata como un **cambio separado**, no forma parte de este.
- **¿Se crean tests para las funcionalidades sin ninguna cobertura?** No, salvo la propia 026. Las ~31 funcionalidades hoy sin ningún test quedan fuera.
- **¿Se toca el informe de trazabilidad a mano?** No. Se regenera solo al ejecutar la batería; su cabecera prohíbe editarlo manualmente.
- **¿Se modifica la documentación funcional de la 026?** No: ya está completa y correcta.
- **¿Nivel de los tests?** De interfaz: el menú es un elemento real en pantalla y su apertura depende de un evento de ratón sobre el componente en la mesa, así que los casos montan el modo juego y disparan el evento real.
- **Criterio de "batería completa":** un caso por comportamiento observable de la ficha, casos límite incluidos, con código FT-026-nn correlativo como prefijo del nombre del caso.

## Technical notes

- **Framework de tests:** motor propio descrito en `previo-sdd/design/docs/architecture/011-functional-test-framework.md`. Los tests viven en `src/test/functional/*.test.js`, se ejecutan con `npm test` (levanta un servidor estático sobre `src/` y Chromium headless vía Playwright, un fichero por recarga). Códigos de salida: `0` = todo OK; `1` = algún test falla o hay anomalía de trazabilidad; `2` = navegador headless no instalado (`npm run test:setup`). El informe `src/test/TRACEABILITY.md` lo genera `src/test/traceability.js` al final de cada ejecución cruzando `previo-sdd/design/docs/features/INDEX.md` con los `registerFeature({ primary, secondary })` de cada test.
- **Entregable:** un nuevo fichero `src/test/functional/context-menu-play.test.js` (nombre orientativo; lo fija `pv-how`/`pv-do`) con `registerFeature({ primary: 26 })` y los 17 casos `FT-026-01..17` como `it('FT-026-nn · ...', ...)`.
- **Nivel interfaz:** usar `mountPlayMode()` de `src/test/helpers.js`. El menú es DOM real: `src/ui/contextMenu.js#openContextMenu` lo adjunta a `document.body` con clase `.context-menu` (no dentro de `#content`). Se abre disparando `dispatchEvent(new MouseEvent('contextmenu', { clientX, clientY, bubbles: true }))` sobre el nodo del componente renderizado por `renderComponentsOnTable` (`src/ui/componentRenderer.js`).
- **Montaje del menú en modo juego:** `src/modes/play/playMode.js`, callback `onContextMenu` pasado a `renderComponentsOnTable`. Ahí se calcula: `extra` de la descripción por tipo, `specificItems` (mazo: Barajar/Ver contenido; carta: Meter en mazo si `getComponents().filter(c=>c.type==='mazo').length>0`), `generalItems` (fila lock/unlock, omitida si `component.copyOf && component.sincronizado !== false`), e `interactionItems` vía `getInteractionItemsFor`.
- **Clases DOM relevantes:** `.context-menu`, `.context-menu__description`, `.context-menu__description-main`, `.context-menu__description-extra`, `.context-menu__item`, `.context-menu__item--disabled`, `.context-menu__item-label`, `.context-menu__separator`, `.context-menu__info`, `.context-menu__info-title`, `.context-menu__info-row`, `.context-menu__info-label`, `.context-menu__info-value`, `.context-menu__info-value--none`, `.context-menu__select-row`. Resaltado de selección: `carta--selected`, `dice--selected`, `board--selected`, `tablero-personalizado--selected`, `document-viewer--selected`, `text-box--selected` (el mazo usa `carta--selected`).
- **Textos:** vienen de i18n (`t()`, claves `contextMenu.*` e `interaction.*` en `src/data/i18n.es.js` / `i18n.en.js`). Los tests deben comparar contra `t('clave')`, no contra literales — igual que `src/test/functional/top-controls.test.js`. Claves observadas en `playMode.js`: `contextMenu.lock`, `contextMenu.unlock`, `contextMenu.shuffle`, `contextMenu.viewContent`, `contextMenu.insertIntoMazo`, `contextMenu.interactions`, `contextMenu.extra.faces`, `contextMenu.extra.cards`, `interaction.leftClick`, `interaction.doubleLeftClick`, `interaction.rightClick`, `interaction.value.none`, `interaction.value.openThisMenu`, `interaction.value.rollDie`, `interaction.value.viewResultLarge`, `interaction.value.flipCard`, `interaction.value.drawTopCard`.
- **Descripción "Tipo: id":** `formatComponentIdentifier(component)` en `src/ui/componentRenderer.js` — formato `` `${t('componentIdentifier.type.<tipo>')}: ${component.id}` ``.
- **Estado de bloqueo efectivo:** `getEffectiveGeneralProps(component, groups)` de `src/core/group.js`; `'ninguno'` = desbloqueado. En `playMode.js` la acción alterna entre `bloqueado: 'ninguno'` y `bloqueado: 'juego'` sobre el propio componente.
- **Copias:** `createCopy(original, getComponents())` de `src/core/component.js` deja `copyOf` fijado y `sincronizado: true`. Para el caso no sincronizado, poner `sincronizado: false` en la copia antes de abrir el menú.
- **`createDefaultComponent`** (`src/ui/componentModal.js`) deja `accionClickDerecho: 'ninguno'` → el botón derecho no hace nada. Los casos que esperan menú deben fijar `c.accionClickDerecho = 'menuContextual'` explícitamente. `src/core/state.js` migra componentes antiguos sin ese campo a `'menuContextual'`, pero un componente nuevo de test nace con `'ninguno'`.
- **Barajar determinista:** `mockRandom([...])` (helper existente en `src/test/helpers.js`) para fijar `Math.random` y que `shuffleCartaIds` (`src/core/deck.js`) reordene de forma predecible.
- **Interacción de click desactivada:** `isInteractionActive(component, key)` de `src/core/interactions.js`; `component.interaccionesDesactivadas` es el array de claves desactivadas. `getInteractionItemsFor` en `playMode.js` cambia el `valueKey` de la fila 0 a `interaction.value.none` cuando la interacción del tipo (`CLICK_INTERACTION_KEY_BY_TYPE`: `dado→lanzar`, `carta→voltear`, `mazo→sacarCarta`) no está activa.
- **No persistencia de la selección:** `selectedComponentId` es una variable de módulo en `playMode.js`, fuera de `renderPlayMode`; no pasa por `saveState`/`loadState` (`src/core/persistence.js`). El caso FT-026-17 verifica que un ciclo guardar/cargar no reintroduce selección.
- **Limpieza entre casos:** `beforeEach(resetState)`. Añadir un `afterEach` defensivo que elimine cualquier `.context-menu` residual de `document.body` y dispare un `mousedown` en `document.body`, porque el menú registra listeners globales (`mousedown`, `keydown`) y se adjunta fuera de `#content` — sin limpiarlo puede contaminar el siguiente caso dentro del mismo fichero.
- **Posible helper nuevo:** si algún caso necesita una utilidad que hoy no está en `src/test/helpers.js` (p. ej. un `dispatchContextMenu(el)` o un `getOpenContextMenu()`), `pv-how` decide si se añade a `helpers.js` o se resuelve inline en el propio test. No se modifica el motor (`harness.js`, `run.js`, `traceability.js`).
- **Sin inconsistencia doc ↔ código:** la ficha 026 describe fielmente lo implementado en `playMode.js` + `contextMenu.js`.
- Sin componente visual nuevo ni datos estructurados nuevos: es la definición de una batería de pruebas sobre comportamiento ya existente y documentado.
