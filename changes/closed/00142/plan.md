- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance**:
- No se toca el contenido del menú contextual en sí (`ui/contextMenu.js`, `specificItems`, bloqueo/desbloqueo) — solo si se abre o no.
- No se toca el comportamiento del click derecho en Modo Edición (no existe hoy y este cambio no lo introduce).
- No se añade ninguna opción adicional al selector más allá de "Ninguno" / "Abrir menú contextual" (p.ej. no se permite elegir una acción específica distinta del menú completo) — eso quedaría fuera de lo pedido en `description.md`.

**Dudas resueltas con el usuario** (ya recogidas en `description.md`, se repiten aquí en clave técnica):
- "Ninguno" desactiva el menú contextual entero (no solo `specificItems`) → en `onContextMenu` de `playMode.js`, si `accionClickDerecho === 'ninguno'`, no se llama a `openContextMenu` en absoluto (tampoco se fija `selectedComponentId` ni se vuelve a renderizar la tabla, ya que no hay nada que mostrar seleccionado).
- Componentes preexistentes migran a `'menuContextual'`, no a `'ninguno'` → nueva función `migrateAccionClickDerecho` en `core/state.js`, mismo patrón que `migrateBloqueado`.
- Aplica a los 6 tipos → la sección "Interacciones programadas" de `componentModal.js` deja de condicionarse solo a `typeInteractions.length > 0`.
- Se sincroniza entre copias vinculadas → se añade a `syncCopyWithOriginal` en `core/component.js`.

## (b) Solución técnica

1. **`core/component.js`**:
   - `createComponent({ ... })`: añadir el parámetro `accionClickDerecho = 'ninguno'` a la firma (junto al resto de campos generales, p.ej. tras `interaccionesDesactivadas`) y al objeto devuelto.
   - `syncCopyWithOriginal(copy, original)`: añadir `accionClickDerecho: original.accionClickDerecho` al objeto devuelto, junto a `interaccionesDesactivadas` — mismo criterio (campo de configuración general que sí se sincroniza, a diferencia de `bloqueado`/`oculto`).
   - `cloneComponent`/`createCopy` no necesitan cambios: ya copian el resto de campos con `{ ...component }`, así que `accionClickDerecho` se propaga automáticamente al clonar/copiar.

2. **`core/state.js`**:
   - Nueva función `migrateAccionClickDerecho(components)`, junto a `migrateBloqueado` (mismo fichero, misma zona): para cada componente sin el campo (`component.accionClickDerecho === undefined`), fijar `component.accionClickDerecho = 'menuContextual'` (conserva el comportamiento actual de componentes ya guardados).
   - Añadir la llamada `migrateAccionClickDerecho(components);` dentro de `loadComponents`, junto a las demás migraciones (p.ej. justo después de `migrateBloqueado(components);`).

3. **`core/interactions.js`**: sin cambios — `TYPE_INTERACTIONS`/`isInteractionActive` siguen gobernando solo las interacciones de click izquierdo por tipo; el nuevo campo es independiente y se consulta directamente (`component.accionClickDerecho`), no a través de este módulo.

4. **`ui/componentModal.js`** (sección "Interacciones programadas", hoy condicionada a `typeInteractions.length > 0`, líneas ~421-470):
   - Cambiar la condición de renderizado de la sección: debe crearse/mostrarse siempre (ya no solo si `typeInteractions.length > 0`), porque ahora aloja también la fila de click derecho, aplicable a los 6 tipos.
   - Dentro de esa sección, tras el bucle que pinta una fila por cada interacción de `typeInteractions` (o en su lugar si `typeInteractions.length === 0`), añadir una fila más con el mismo patrón (`div.modal__field` + `label` + `select` + `createHelpIcon`):
     - Label: "Click derecho".
     - Opciones del `<select>`: `'menuContextual'` → "Abrir menú contextual", `'ninguno'` → "Ninguno".
     - Valor inicial: `workingComponent.accionClickDerecho` (ya viene poblado por `createComponent()`/el componente existente tras la migración).
     - Listener `change`: `workingComponent.accionClickDerecho = select.value;` (mutación directa sobre `workingComponent`, mismo patrón que el resto de campos de esta modal — se persiste al pulsar "Aceptar", vía `onAccept(workingComponent, isNew)`).
     - Texto del `createHelpIcon`: algo como `Si eliges "Ninguno", el click derecho sobre este componente no hace nada en Modo Juego (no se puede bloquear/desbloquear ni acceder a sus acciones específicas desde ahí). El resto de interacciones no se ven afectadas.`
   - No hace falta tocar `validateId()`/`isDadoConfigValid()` ni el resto del flujo de guardado: el campo se lee directamente de `workingComponent` como cualquier otro campo general mutado in-place.

5. **`modes/play/playMode.js`** (`onContextMenu`, dentro de `renderComponentsOnTable`):
   - Al principio del callback, si `component.accionClickDerecho === 'ninguno'`, retornar inmediatamente sin hacer nada (no fijar `selectedComponentId`, no llamar a `renderTable()`, no abrir `openContextMenu`).
   - Si es `'menuContextual'` (o está ausente por algún borde no migrado — tratar como `'menuContextual'` por seguridad, ya que es el valor migrado), continuar con el comportamiento actual sin cambios.
   - No hace falta tocar `interactionsByType`/`getInteractionItemsFor`: siguen describiendo lo que pasaría *si* el menú se abre (fila "Clic derecho" = "Abrir este menú"); ese texto solo se ve dentro del propio menú contextual, que con `'ninguno'` directamente no se abre.

6. **Orden de implementación**: 1 → 2 (modelo y migración) antes que 4 (UI que lee/escribe el campo) antes que 5 (consumo en Modo Juego), para poder probar cada capa con el campo ya presente en los componentes.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 ("Modelo de datos de componente"):

- Añadir al bloque de código del modelo genérico (tras `interaccionesDesactivadas: string[], // ...`) la nueva línea: `accionClickDerecho: 'ninguno' | 'menuContextual', // qué hace el click derecho en Modo Juego ('ninguno' por defecto — cambio 00142)`.
- Añadir un párrafo (mismo estilo que el de `interaccionesDesactivadas`, tras él) explicando: el campo se inicializa a `'ninguno'`, es editable desde la pestaña "Generales" (sección "Interacciones programadas", que a partir de este cambio se muestra siempre, no solo para tipos con entradas en `TYPE_INTERACTIONS`); `modes/play/playMode.js` → `onContextMenu` no abre `ui/contextMenu.js` cuando vale `'ninguno'`; componentes guardados antes de este cambio se migran a `'menuContextual'` (`core/state.js`, `migrateAccionClickDerecho`) para conservar su comportamiento previo, ya que hasta ahora el menú contextual se abría siempre sin ser configurable.
- En la sección 3 ("Menú contextual de componente en modo juego", cambio 00088), añadir una frase indicando que desde el cambio 00142 esta apertura es condicional a `component.accionClickDerecho !== 'ninguno'`.
