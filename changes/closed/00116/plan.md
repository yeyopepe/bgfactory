## (a) Anotaciones funcionales

**Fuera de alcance**: no se toca el resto del menú contextual (descripción "Tipo: id" + dato extra, acciones generales/específicas), ni la tabla estática `interactionsByType` en lo que respecta a "Doble clic izquierdo"/"Clic derecho" — ninguna de las dos líneas depende de "Interacciones programadas" (00115) y no cambian. Tampoco se toca `core/interactions.js` ni `componentModal.js`/`componentRenderer.js` (ya funcionan bien; el bug está solo en la información mostrada en el menú contextual de Modo Juego).

**Dudas resueltas con el usuario**: ver `description.md` — el bloque afectado es el informativo de clicks ("Clic izquierdo: ..."), no la línea de descripción "Tipo: id" ni el dato extra.

## (b) Solución técnica

Causa raíz: `src/modes/play/playMode.js` mantiene una constante estática `interactionsByType` (definida antes del cambio 00115) con el texto fijo de "Clic izquierdo" por `type`, y la pasa tal cual (`interactionsByType[component.type] || []`) como `interactionItems` al abrir el menú contextual (`onContextMenu`, línea ~219). No consulta en ningún momento `interaccionesDesactivadas` del componente ni `core/interactions.js` (`isInteractionActive`), añadido por el cambio 00115 — de ahí que el texto no cambie aunque la interacción esté desactivada.

1. **`src/modes/play/playMode.js`**:
   - Importar `isInteractionActive` de `../../core/interactions.js` (junto a los imports ya existentes de `core/`).
   - En el callback `onContextMenu` (línea ~147 en adelante), donde hoy se calcula `interactionsByType[component.type] || []` para pasarlo como `interactionItems` (línea ~219), sustituir por un cálculo que:
     - Tome como base `interactionsByType[component.type] || []` (se mantiene la tabla estática: sigue siendo la única fuente de los textos de "Doble clic izquierdo" y "Clic derecho", y del label "Clic izquierdo").
     - Si el tipo tiene alguna interacción de click programada (mismo type set que ya cubre `interactionsByType` con un valor distinto de "Ninguno" en la fila "Clic izquierdo": `dado`, `carta`, `mazo`) y esa interacción está desactivada en este componente concreto (`!isInteractionActive(component, key)`, con `key` = `'lanzar'`/`'voltear'`/`'sacarCarta'` según el tipo), sustituir el `value` de esa primera fila ("Clic izquierdo") por `'Ninguno'`, sin tocar las demás filas.
     - Para el resto de tipos (`texto`, `tablero`, `documento`), o cuando la interacción sigue activa, el array queda igual que hoy (sin cambios de comportamiento).
   - Implementación concreta: no mutar el array de `interactionsByType` (es una constante de módulo compartida entre renders); construir un array nuevo (`map`) solo cuando haga falta sustituir la primera fila, dejando el resto de casos con el array original tal cual.

2. No hace falta tocar `core/interactions.js` — ya expone `isInteractionActive(component, key)`, que es justo lo que falta consultar aquí. Tampoco hace falta un mapeo `type` → `key` nuevo: puede resolverse con un `switch`/objeto local mínimo en `playMode.js` (`{ dado: 'lanzar', carta: 'voltear', mazo: 'sacarCarta' }`) ya que es la única función que necesita cruzar "fila de `interactionsByType` a corregir" con "key de `core/interactions.js`" — no se añade a `core/interactions.js` para no acoplar ese registro (agnóstico de UI) al formato concreto del menú contextual de `playMode.js`.

## Orden de implementación

1. `src/modes/play/playMode.js` (único fichero a tocar).
