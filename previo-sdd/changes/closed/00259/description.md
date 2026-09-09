- **Name**: Batería de tests para la funcionalidad 012 (Orden de apilado en la mesa)
- **Code**: 00259
- **Type**: change
- **Creation date**: 2026-09-09

## Full description

La funcionalidad 012 ("Orden de apilado en la mesa") no tiene actualmente ningún test
funcional que la valide: en el mapa de trazabilidad funcionalidad ↔ tests aparece sin
ningún test asociado. La regla de cobertura del proyecto exige que toda funcionalidad que
aporta comportamiento tenga sus tests, así que esta laguna hay que cerrarla.

Este cambio consiste en añadir esa batería de tests: un conjunto nuevo de casos de prueba
automatizados dedicado en exclusiva a la funcionalidad 012. Es la continuación de la misma
tanda de cierre de lagunas de cobertura que los cambios 00254 (funcionalidad 19), 00255
(funcionalidad 20), 00256 (funcionalidad 23), 00257 (funcionalidad 25) y 00258
(funcionalidades 038 y 040). Se toman como plantilla los conjuntos de tests ya existentes
de esa tanda.

No cambia ningún comportamiento de la aplicación: es trabajo de cobertura de pruebas, no
de producto. Nada de lo que se añade llega a la aplicación entregable. El mapa de
trazabilidad se regenera solo al pasar la batería de tests.

### Alcance acordado con el usuario

- **Un único conjunto de tests nuevo** para la funcionalidad 012, con códigos de caso
  `FT-012-nn`.
- **Reparto de niveles:** la mayoría de casos a nivel lógico (la lógica del orden), más
  algunos casos de interfaz montando el panel flotante de componentes (columna "Orden") y
  la mesa (orden de apilado de los elementos).
- **Núcleo de la funcionalidad 012, sin duplicar lo que es de otras fichas:** el
  movimiento de un bloque de grupo se prueba de forma **mínima** (solo su efecto sobre los
  números de orden) porque la ficha 012 lo menciona explícitamente, pero el flujo de
  agrupar y desagrupar en sí es de la funcionalidad 034. El "subir al frente" automático
  en modo juego solo se toca de refilón; su interacción de juego es de las funcionalidades
  013 y 014.

### Qué comportamientos de la funcionalidad 012 se validan

1. **El orden como propiedad del componente.** Cada componente tiene un orden explícito, un
   número entero, donde 1 es el componente más arriba en la mesa y n (el número total de
   componentes) el más abajo. Este orden sustituye al orden de inserción/creación anterior.
   Un componente recién creado nace sin un valor de orden asignado; el valor real siempre
   lo resuelve la capa que conoce la lista entera de componentes.

2. **Alta de un componente.** Al añadir un componente nuevo se le asigna el primer puesto
   (queda por encima de todos) y todos los que ya había bajan un puesto. Se avisa del
   cambio de la lista de componentes.

3. **Clonado de un componente.** Al clonar un componente ya existente, el clon también
   queda en el primer puesto, como un componente nuevo, empujando al resto hacia abajo. El
   clon nace independiente, sin grupo.

4. **Borrado de un componente.** Al eliminar un componente, los órdenes restantes se
   recalculan para seguir siendo consecutivos de 1 a n, sin huecos.

5. **Recolocar un componente a una posición dada.**
   - Mover un componente a otra posición desplaza a los demás: se saca de su hueco actual
     (los que estaban detrás se compactan) y se inserta en la posición pedida (el que
     estaba en esa posición y los de detrás bajan un puesto para dejarle sitio). Es
     exactamente lo que describe la ficha: si el valor coincide con el de otro componente,
     ese componente y los que había detrás se desplazan un puesto.
   - Un valor fuera de rango (menor que 1 o mayor que n) se ajusta al límite más cercano
     (queda entre 1 y n).
   - Mover a la posición que ya ocupa no hace nada.
   - Tras un movimiento efectivo se avisa del cambio de la lista de componentes.

6. **Carga de una partida guardada.** Al cargar una lista de componentes, sus órdenes se
   normalizan a valores consecutivos de 1 a n. Una partida guardada sin la propiedad de
   orden, o con valores inválidos, se migra en silencio a partir de su orden de inserción.

7. **Movimiento de un bloque de grupo (mínimo).** Mover a la vez un bloque de varios
   miembros de un grupo, dentro del mismo espacio de orden de 1 a n, preserva el orden
   relativo entre los miembros del bloque y hace hueco desplazando al resto. La posición de
   inicio del bloque se ajusta para que quepa entero. El flujo de agrupar/desagrupar es de
   la funcionalidad 034; aquí solo se comprueba el efecto sobre el orden.

8. **Columna "Orden" del panel flotante de componentes.**
   - El cuadro de la columna "Orden" de cada fila de componente solo admite dígitos: al
     escribir se descartan al instante los caracteres que no sean dígitos.
   - Al confirmar (perder el foco o pulsar Enter): un valor vacío descarta el cambio y
     restaura el orden anterior del componente; un valor fuera de rango se ajusta al rango
     válido; un valor válido reordena la lista y actualiza el apilado en la mesa.
   - En una fila que es miembro de un grupo, el cuadro de "Orden" está deshabilitado (el
     orden del miembro se edita como bloque desde la fila del grupo).
   - Pulsar sobre el cuadro de "Orden" no selecciona la fila.
   - Con la ordenación por columnas inactiva, las filas de nivel superior del panel se
     muestran ordenadas ascendentemente por su orden, y los miembros de un grupo siempre
     por su propio orden.

9. **Orden de pintado en la mesa (modo edición y modo juego).** Al dibujar los componentes
   en la mesa, el de orden más alto se pinta primero (queda visualmente debajo) y el de
   orden 1 se pinta el último (queda visualmente encima). El resultado es el mismo en modo
   edición y en modo juego. En modo juego, los componentes ocultos se filtran antes de
   pintar.

10. **Persistencia.** El orden se guarda como parte del estado del componente, igual que el
    resto de sus propiedades (autoguardado en el navegador, funcionalidad 029). Basta con
    comprobar que la propiedad de orden queda fijada en cada componente tras cada
    operación; el autoguardado en sí lo cubre su propia funcionalidad.

### Fuera de alcance

- El flujo de agrupar y desagrupar en sí (crear grupo, deshacer grupo, menú contextual
  "Agrupar"/"Desagrupar"): es de la funcionalidad 034. Aquí solo se prueba el efecto del
  movimiento de bloque sobre los números de orden, de forma mínima.
- La interacción de "subir al frente al mover/interactuar" en modo juego (arrastre, tirada
  de dado, volteo de carta): es de las funcionalidades 013 y 014. Aquí, como mucho, se
  comprueba que recolocar un componente a la posición 1 lo deja en el primer puesto.
- El comportamiento del panel flotante más allá de la columna "Orden" (selección,
  resaltado, arrastre, redimensionado, otras columnas, filtros): es de la funcionalidad
  003, ya cubierta por su propia batería de tests.
- El posicionamiento y los estilos visuales: la batería de tests no carga la hoja de
  estilos, así que solo se comprueba el orden de los elementos en el árbol de la página, no
  su apariencia ni su apilado por CSS.
- No se toca código de producción. El mapa de trazabilidad se regenera solo al pasar la
  batería de tests.

### Relación con otras entradas

Misma tanda de cierre de lagunas de cobertura de tests que los cambios 00254, 00255,
00256, 00257 y 00258.

## Technical notes

- **Framework de tests:** `src/test/`, dev-only. Descrito en
  `previo-sdd/design/docs/architecture/011-functional-test-framework.md`. Motor propio en
  navegador headless (`src/test/harness.js`); niveles `state` (importar `core/*`, llamar
  acciones, comprobar getters/eventos) y `ui` (`mountEditMode()` / `mountPlayMode()` de
  `src/test/helpers.js`, comprobar el DOM de `#content` + estado). Un fichero por
  funcionalidad, con `registerFeature({ primary: 12 })` una vez por fichero y casos
  nombrados `FT-012-<nn>`. `src/test/TRACEABILITY.md` se regenera en cada `npm test` (no
  editar a mano). El runner **no** carga `main.js` ni el CSS (`test.decision.no-main-js`).
  Fichero nuevo propuesto en `src/test/functional/` (nombre a decidir por `pv-how`, p.ej.
  `orden-apilado.test.js`). Plantillas de referencia:
  `src/test/functional/dado.test.js`, `src/test/functional/component-panel.test.js`.
- **[gotcha]** `src/ui/componentList.js` mantiene estado de módulo (`columnSort`,
  `columnFilters`, `filterText`) que `resetState()` **no** limpia: el patrón de la tanda
  (`component-panel.test.js`, `column-header-menu.test.js`) es que `beforeEach` monta una
  vez la lista vacía para ponerlo a cero antes de sembrar datos.
- **[gotcha]** `src/modes/edit/editMode.js` mantiene `selectedComponentIds` como estado de
  módulo que `resetState()` **no** limpia: los casos `ui` que ejerciten selección usan ids
  de componente distintos por caso.
- **Campo del modelo:** `order: number` en el componente
  (`architecture/002-component-model.md`, sección "`order` logic"). `1` = arriba del todo,
  `n` = abajo del todo (`n` = total de componentes). `createComponent()` lo declara con
  default `null`; el valor real lo resuelve siempre `src/core/state.js`. Se persiste como
  parte del estado del componente (autoguardado, funcionalidad 029).
- **Toda la lógica vive en `src/core/state.js`:**
  - `compactOrders(components)` (función interna, no exportada): ordena por `order` actual
    (o por índice + 1 en el array si `order` falta o no es entero — migración silenciosa de
    guardados anteriores), luego reasigna `1..n` contiguos mutando en el sitio.
  - `addComponent(component)`: `state.components.forEach(c => c.order += 1)` y luego
    `component.order = 1`, `push`, `emit('components:changed')`.
  - `removeComponent(id)`: filtra el id (y borra en cascada las copias vinculadas con
    `copyOf === id`), luego `compactOrders(state.components)`. También disuelve un grupo que
    quede con ≤ 1 miembro.
  - `reorderComponent(id, rawOrder)`: `n = state.components.length`;
    `newOrder = Math.min(Math.max(rawOrder, 1), n)`; no-op si `newOrder === oldOrder`; si
    no: cada otro componente con `order > oldOrder` decrementa 1, luego cada otro con
    `order >= newOrder` incrementa 1, luego `component.order = newOrder`;
    `emit('components:changed')`.
  - `loadComponents(components)`: pasa la lista por `compactOrders` al cargar.
  - `reorderGroupBlock(memberIds, rawTargetOrder)`: mueve un bloque contiguo de N ids a la
    vez dentro del espacio `1..n` compartido, preservando el orden relativo interno del
    bloque, con la posición de inicio del bloque acotada a `[1, n-k+1]` (`k` = tamaño del
    bloque). También lo usa la acción "Agrupar" del menú contextual (funcionalidad 034).
  - `modes/play/playMode.js` llama a `reorderComponent(id, 1)` tras cada interacción de
    modo juego sobre componentes con `subirAlMoverInteractuar` (`'carta'` / `'dado'` lo
    traen a `true` por defecto). Funcionalidades 013/014, fuera de alcance salvo de
    refilón.
- **`src/core/component.js`:** `cloneComponent(component, components)` construye el clon con
  `order: null` → `addComponent` lo resuelve a `order = 1`. El clon nace con
  `groupId: null`.
- **Columna "Orden" del panel (`src/ui/componentList.js`):**
  - Definición de columna: `{ key: 'orden', filterable: false, getValue: (c) => c.order }`
    — solo ordena, nunca filtra.
  - `computeDisplayedList`: sin ordenación por columna activa, las filas de nivel superior
    se ordenan por `(a.order ?? 0) - (b.order ?? 0)` ascendente; los miembros de un grupo
    siempre por su propio `order` ascendente; la fila sintética de un grupo colapsado toma
    `order: sortedMembers[0].order`.
  - **Fila de componente individual:** `<input type="number">` con clase
    `component-list__order-input`, `min=1`, `max=total`, `value=component.order`,
    `disabled` cuando el componente es miembro de grupo (`isGroupMember`). Listener `click`
    → `stopPropagation` (no selecciona la fila). Evento `input` →
    `value.replace(/\D+/g, '')` (descarta no-dígitos en vivo). Evento `change` (salta en
    blur o Enter): si `value === ''` → restaura `component.order` y termina; si no,
    `parsed = Math.min(Math.max(parseInt(value, 10), 1), total)`, reescribe el valor
    acotado en el campo, llama a `onReorder(component, parsed)` → cableado a
    `reorderComponent`.
  - **Fila de grupo:** `groupOrderInput` (clase `component-list__order-input`, no
    `type=number`), `value = component.order`; el handler `input` descarta no-dígitos
    (`replace(/\D+/g, '')`); vacío al confirmar restaura; `onReorderGroup(component.id,
    memberIds, parsed)` → cableado a `reorderGroupBlock`.
- **Apilado en la mesa (`src/ui/componentRenderer.js`, `renderComponentsOnTable`):**
  `const stackedComponents = [...components].sort((a, b) => (b.order ?? 0) - (a.order ?? 0))`
  — el de `order` más alto se pinta primero (queda debajo), el de `order = 1` se pinta el
  último (`appendChild` posterior = por encima). Tanto modo juego como modo edición usan
  `renderComponentsOnTable`. Modo juego filtra los componentes `oculto` antes. Un elemento
  arrastrado que se "sube" aparte se hace `appendChild` al final de `worldEl` sin tocar
  `order`.
- **Sin inconsistencias doc ↔ código:** `reorderComponent` (clamp, colisión desplaza),
  compactación al borrar, `order = 1` al crear/clonar, solo dígitos en el input, restaurar
  con valor vacío al confirmar, y persistencia como estado del componente — todo coincide
  con la ficha funcional 012.
- **Seguridad:** cambio dev-only, no entra en el entregable, sin red, dependencias ni
  secretos. El único punto tangencial (validación de entrada en el campo "Orden") queda
  cubierto: los tests solo verifican el saneado existente (`replace(/\D+/g, '')` +
  `parseInt` + clamp), no introducen un camino de entrada nuevo. Sin puntos pendientes.
