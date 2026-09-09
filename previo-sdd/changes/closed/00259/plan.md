- **Creation date**: 2026-09-09

## (a) Functional notes

**Out of scope:**

- No se toca código de producción. Nada de lo añadido llega al bundle entregable
  (`src/scripts/build.py` solo recorre imports desde `src/main.js`).
- `src/test/TRACEABILITY.md` se regenera solo en cada `npm test` — no se edita a mano.
- **Flujo de agrupar/desagrupar** (crear grupo, deshacer grupo, menú contextual
  "Agrupar"/"Desagrupar"): es de la funcionalidad 034. Aquí solo se prueba el efecto de
  `reorderGroupBlock` sobre los números de `order`, de forma mínima.
- **"Subir al frente al mover/interactuar" en modo juego** (arrastre, tirada de dado,
  volteo de carta que llaman a `reorderComponent(id, 1)`): es de las funcionalidades
  013/014. Aquí, como mucho, se comprueba que `reorderComponent(id, 1)` deja el componente
  en el primer puesto.
- **Resto del panel flotante de componentes** (selección, resaltado, arrastre,
  redimensionado, otras columnas, filtros): funcionalidad 003, ya cubierta por
  `component-panel.test.js`.
- **Posicionamiento y z-index CSS:** el runner no carga la hoja de estilos
  (`test.decision.no-main-js`); solo se comprueba el orden de los nodos en el DOM (orden de
  `appendChild`).

**Doubts resolved with the user:**

- ¿Qué se mete de grupos y de "subir al frente"? → Núcleo de la 012 sin duplicar 034 ni
  013: `reorderGroupBlock` se prueba de forma mínima (preserva orden relativo y hace
  hueco); `subirAlMoverInteractuar` solo de refilón (que `reorderComponent(id,1)` deja
  arriba).
- ¿Reparto state/ui? → Mayoría `state` (lógica de `order` en `core/state.js` y
  `core/component.js`), más algunos `ui` de panel ("Orden") y mesa (apilado).
- ¿Relaciones? → Relacionar 00259 con la tanda de cobertura 00254–00258 (ya registrado en
  `.metadata.json`).

## (b) Technical solution

Fichero nuevo: `src/test/functional/orden-apilado.test.js`.

- [x] **`src/test/functional/orden-apilado.test.js` — crear el fichero y su cabecera.**
  Fichero nuevo, estructura calcada de `src/test/functional/dado.test.js` /
  `src/test/functional/component-panel.test.js`. Cabecera de comentario resumiendo qué
  valida: propiedad `order` del componente; alta (nuevo → `order 1`, empuja al resto);
  clonado (clon → `order 1`); borrado (recompacta `1..n` sin huecos); `reorderComponent`
  (desplazamiento por colisión, clamp fuera de rango, no-op a la misma posición);
  `loadComponents`/`compactOrders` al cargar guardados sin `order`; `reorderGroupBlock`
  (mínimo); columna "Orden" del panel (`<input type=number>`, solo dígitos, confirmar con
  `change`, vacío restaura, deshabilitado en miembro de grupo, no selecciona la fila);
  orden de pintado en la mesa (`order` descendente) en modo edición y juego. Repetir los
  `[gotcha]`:
  - `src/ui/componentList.js` mantiene `columnSort`/`columnFilters`/`filterText` como
    estado de módulo que `resetState()` NO limpia → `beforeEach` monta una vez la lista
    vacía antes de sembrar datos.
  - `src/modes/edit/editMode.js` mantiene `selectedComponentIds` como estado de módulo que
    `resetState()` NO limpia → ids de componente distintos por caso en los `it` que
    ejerciten selección.
  - El runner no carga el CSS: el apilado se comprueba por orden de `appendChild` (posición
    en el array de hijos del `worldEl`), no por z-index.

- [x] **`src/test/functional/orden-apilado.test.js` — imports, `registerFeature` y
  andamiaje del `describe`.**
  - De `../harness.js`: `describe, it, expect, beforeEach, afterEach, registerFeature`.
  - De `../helpers.js`: `resetState, mountEditMode, mountPlayMode`.
  - De `../../core/state.js`: `getComponents, addComponent, removeComponent,
    reorderComponent, reorderGroupBlock, loadComponents, loadGroups`.
  - De `../../core/component.js`: `createComponent, cloneComponent`.
  - De `../../core/eventBus.js`: `on`.
  - De `../../ui/componentList.js`: `renderComponentList` (confirmar el nombre real del
    export al implementar; en `component-panel.test.js` ya se monta este panel — replicar
    su forma de montaje exacta, incluidos los callbacks `onReorder`/`onReorderGroup`
    cableados a `reorderComponent`/`reorderGroupBlock`).
  - `registerFeature({ primary: 12 })`.
  - `describe('012 — Orden de apilado en la mesa', () => { ... })` con
    `beforeEach(resetState)` y
    `afterEach(() => document.querySelectorAll('.modal-overlay, .context-menu').forEach((o) => o.remove()))`.

- [x] **`src/test/functional/orden-apilado.test.js` — helpers locales.**
  - `mkComp(id, extra = {})` → `const c = createComponent({ type: 'texto' }); c.id = id; Object.assign(c, extra); return c;`
  - `addN(ids)` → `ids.forEach((id) => addComponent(mkComp(id)));` (añade en orden; recuerda
    que cada `addComponent` pone el nuevo en `order 1` y empuja al resto).
  - `orderOf(id)` → `getComponents().find((c) => c.id === id).order`
  - `ordersById()` → `Object.fromEntries(getComponents().map((c) => [c.id, c.order]))`
  - `worldChildrenIds(content)` — devuelve el array de ids de los componentes pintados en
    la mesa, **en orden de aparición en el DOM**. Confirmar al implementar el selector real
    del contenedor de mundo y de cada nodo de componente (en `component-transform.test.js` /
    `infinite-table.test.js` ya se parsea el `worldEl`). Si el render no expone el id en el
    DOM, montar cada caso `ui` con **un componente por posición** y clases raíz distintas, o
    usar el orden de `worldEl.children` mapeado por índice contra el array de componentes
    ordenado por `order` desc (que es justo lo que hace `renderComponentsOnTable`).

- [x] **`it('FT-012-01 · order como propiedad: alta asigna 1 y empuja al resto', ...)`
  (nivel state).**
  - `addComponent(mkComp('a'));` → `expect(orderOf('a')).toBe(1);`
  - `addComponent(mkComp('b'));` → `expect(orderOf('b')).toBe(1); expect(orderOf('a')).toBe(2);`
  - `addComponent(mkComp('c'));` → `expect(ordersById()).toEqual({ c: 1, b: 2, a: 3 });`
  - Comprobar que `createComponent({ type: 'texto' })` "pelado" trae `order` sin resolver:
    `expect(createComponent({ type: 'texto' }).order).toBeNull();` (el valor real lo pone
    `addComponent`).
  - Comprobar que `addComponent` emite `components:changed`:
    `const seen = []; const off = on('components:changed', () => seen.push(1)); addComponent(mkComp('d')); expect(seen.length).toBeGreaterThan(0); off();`

- [x] **`it('FT-012-02 · clonado: el clon queda en order 1 e independiente', ...)`
  (nivel state).**
  - `addN(['a', 'b']);` (estado: `b`=1, `a`=2)
  - `const original = getComponents().find((c) => c.id === 'a'); original.groupId = 'g-x';`
    (para comprobar que el clon NO hereda el grupo).
  - `const clone = cloneComponent(original, getComponents());`
    `expect(clone.order).toBeNull();` (nace sin resolver)
    `expect(clone.groupId).toBeNull();` (independiente)
  - `addComponent(clone);` → `expect(orderOf(clone.id)).toBe(1);`
    `expect(orderOf('b')).toBe(2); expect(orderOf('a')).toBe(3);`

- [x] **`it('FT-012-03 · borrado: recompacta a 1..n sin huecos', ...)` (nivel state).**
  - `addN(['a', 'b', 'c', 'd']);` (estado: `d`=1, `c`=2, `b`=3, `a`=4)
  - `removeComponent('c');` → `expect(ordersById()).toEqual({ d: 1, b: 2, a: 3 });`
    (los órdenes restantes quedan consecutivos 1..3, sin el hueco del 2).
  - `removeComponent('d');` → `expect(ordersById()).toEqual({ b: 1, a: 2 });`
  - Comprobar el orden total tras cada borrado:
    `const vals = getComponents().map((c) => c.order).sort((x, y) => x - y); expect(vals).toEqual([1, 2]);`

- [x] **`it('FT-012-04 · reorderComponent: desplazamiento por colisión', ...)`
  (nivel state).**
  - `addN(['a', 'b', 'c', 'd', 'e']);` (estado: `e`=1, `d`=2, `c`=3, `b`=4, `a`=5)
  - Mover `a` (order 5) a la posición 2:
    `reorderComponent('a', 2);`
    → `expect(orderOf('a')).toBe(2);`
    y el que estaba en 2 y los de detrás bajan un puesto:
    `expect(ordersById()).toEqual({ e: 1, a: 2, d: 3, c: 4, b: 5 });`
  - Mover `e` (order 1) a la posición 4:
    `reorderComponent('e', 4);`
    → `expect(ordersById()).toEqual({ a: 1, d: 2, c: 3, e: 4, b: 5 });`
    (se saca de 1 — los de detrás se compactan — y se inserta en 4 — el que estaba en 4 y
    detrás suben).
  - Comprobar que sigue siendo una permutación de 1..n:
    `const vals = getComponents().map((c) => c.order).sort((x, y) => x - y); expect(vals).toEqual([1, 2, 3, 4, 5]);`

- [x] **`it('FT-012-05 · reorderComponent: clamp fuera de rango y no-op a la misma
  posición', ...)` (nivel state).**
  - `addN(['a', 'b', 'c']);` (estado: `c`=1, `b`=2, `a`=3)
  - `reorderComponent('a', 99);` → `expect(orderOf('a')).toBe(3);` (mayor que n → se ajusta
    a n).
  - `reorderComponent('a', 0);` → `expect(orderOf('a')).toBe(1);`
    `expect(ordersById()).toEqual({ a: 1, c: 2, b: 3 });` (menor que 1 → se ajusta a 1).
  - `reorderComponent('a', -5);` → `expect(orderOf('a')).toBe(1);` (sigue en 1).
  - No-op: partiendo de `a`=1, `const seen = []; const off = on('components:changed', () => seen.push(1)); reorderComponent('a', 1); expect(seen).toEqual([]); off();`
    (mover a la posición que ya ocupa no emite el evento).
  - Movimiento efectivo sí emite: `const seen2 = []; const off2 = on('components:changed', () => seen2.push(1)); reorderComponent('a', 3); expect(seen2.length).toBeGreaterThan(0); off2();`

- [x] **`it('FT-012-06 · loadComponents normaliza order a 1..n y migra guardados sin
  order', ...)` (nivel state).**
  - Guardado con `order` presentes pero con huecos/desorden:
    `loadComponents([mkComp('a', { order: 10 }), mkComp('b', { order: 3 }), mkComp('c', { order: 7 })]);`
    → ordena por `order` ascendente y reasigna 1..n:
    `expect(ordersById()).toEqual({ b: 1, c: 2, a: 3 });`
  - Guardado **sin** el campo `order` (borrar la propiedad antes de cargar):
    `const x = mkComp('x'); delete x.order; const y = mkComp('y'); delete y.order; const z = mkComp('z'); delete z.order; loadComponents([x, y, z]);`
    → migra por su posición en el array:
    `expect(ordersById()).toEqual({ x: 1, y: 2, z: 3 });`
  - Guardado con `order` inválido (`null`, `NaN`, string):
    `loadComponents([mkComp('p', { order: null }), mkComp('q', { order: 'foo' }), mkComp('r', { order: 2 })]);`
    → `r` (order válido 2) va después de los que caen a su índice+1; comprobar que el
    resultado es una permutación de 1..3 y que `r` conserva su posición relativa según la
    regla de `compactOrders` (los inválidos usan índice+1: `p`→1, `q`→2, `r`→2 por su
    `order`; el `sort` es estable → confirmar el resultado exacto al implementar y fijarlo
    en el `toEqual`).

- [x] **`it('FT-012-07 · reorderGroupBlock: mueve el bloque preservando el orden relativo',
  ...)` (nivel state, MÍNIMO).**
  - Montar 6 componentes y marcar 2 como un bloque contiguo de grupo. Al implementar,
    confirmar la precondición real de `reorderGroupBlock`: espera `memberIds` cuyo `order`
    ya sea contiguo (lo garantiza el flujo de "Agrupar" de la 034). Construir el estado con
    `loadComponents` fijando `order` a mano: p.ej. `m1`(order 3) y `m2`(order 4) como
    bloque, y `a`(1), `b`(2), `c`(5), `d`(6) alrededor.
  - `reorderGroupBlock(['m1', 'm2'], 1);`
    → el bloque se mueve al inicio preservando `m1` antes que `m2`:
    `expect(orderOf('m1')).toBe(1); expect(orderOf('m2')).toBe(2);`
    y el resto se desplaza para hacer hueco:
    `expect(ordersById()).toEqual({ m1: 1, m2: 2, a: 3, b: 4, c: 5, d: 6 });`
  - Clamp del inicio del bloque para que quepa entero (`k`=2, n=6 → inicio máximo 5):
    `reorderGroupBlock(['m1', 'm2'], 99);`
    → `expect(orderOf('m1')).toBe(5); expect(orderOf('m2')).toBe(6);`
  - Comprobar que sigue siendo permutación de 1..6.

- [x] **`it('FT-012-08 · columna "Orden" del panel: solo dígitos, confirmar, vacío
  restaura', ...)` (nivel ui).**
  - `beforeEach`-style dentro del caso: montar el panel una vez con la lista vacía para
    poner a cero el estado de módulo de `componentList.js`, luego sembrar y re-montar.
    Replicar el patrón exacto de `component-panel.test.js` (mismo `renderComponentList` con
    los mismos callbacks). Cablear `onReorder: (component, parsed) => reorderComponent(component.id, parsed)`.
  - Sembrar `addN(['a', 'b', 'c']);` (estado: `c`=1, `b`=2, `a`=3) y montar el panel en un
    host del DOM.
  - Localizar el `<input.component-list__order-input>` de la fila de `a`. Comprobar
    `input.type === 'number'`, `input.min === '1'`, `input.max === '3'`, `input.value === '3'`.
  - Solo dígitos (evento `input`): `input.value = '2x'; input.dispatchEvent(new Event('input', { bubbles: true }));`
    → `expect(input.value).toBe('2');` (se descartan los no-dígitos en vivo).
  - Confirmar (evento `change`): `input.value = '1'; input.dispatchEvent(new Event('change', { bubbles: true }));`
    → `expect(orderOf('a')).toBe(1);` `expect(ordersById()).toEqual({ a: 1, c: 2, b: 3 });`
  - Valor fuera de rango al confirmar: re-montar / re-localizar el input de `a` (ahora
    order 1). `input.value = '9'; input.dispatchEvent(new Event('change', { bubbles: true }));`
    → `expect(orderOf('a')).toBe(3);` (clamp a n) y `expect(input.value).toBe('3');` (el
    campo se reescribe con el valor acotado).
  - Valor vacío al confirmar restaura: `input` de `a` (order 3). `input.value = ''; input.dispatchEvent(new Event('change', { bubbles: true }));`
    → `expect(input.value).toBe('3');` (restaura `component.order`) y `expect(orderOf('a')).toBe(3);`
    (sin cambio).

- [x] **`it('FT-012-09 · columna "Orden": deshabilitada en miembro de grupo y no selecciona
  la fila', ...)` (nivel ui).**
  - Sembrar 3 componentes y hacer que 2 sean miembros de un grupo (`groupId` + `loadGroups`
    con el registro del grupo, forma exacta a confirmar leyendo `componentList.js` /
    `component-panel.test.js`).
  - Montar el panel. Localizar el `<input.component-list__order-input>` de una fila que sea
    miembro de grupo → `expect(input.disabled).toBe(true);`
  - Localizar el input de un componente **suelto** → `expect(input.disabled).toBe(false);`
  - Clic sobre el input no selecciona la fila: registrar el estado de selección antes,
    `input.dispatchEvent(new MouseEvent('click', { bubbles: true }));`, y comprobar que la
    fila no ha quedado con la clase de seleccionada (confirmar el selector real de
    "fila seleccionada" en `componentList.js`; el handler hace `event.stopPropagation()` en
    `click`).
  - Orden de las filas de nivel superior sin ordenación por columna activa: comprobar que
    las filas se pintan en orden ascendente de `order` (la de `order 1` arriba). Parsear el
    orden de `<tr>` del `<tbody>` del panel y compararlo con
    `getComponents().slice().sort((x, y) => x.order - y.order).map((c) => c.id)`.

- [x] **`it('FT-012-10 · apilado en la mesa: order más alto se pinta primero', ...)`
  (nivel ui).**
  - `addN(['a', 'b', 'c']);` (estado: `c`=1, `b`=2, `a`=3)
  - **Modo edición:** `const content = mountEditMode();`
    `expect(worldChildrenIds(content)).toEqual(['a', 'b', 'c']);`
    (el de `order` más alto — `a`, order 3 — es el primer hijo = pintado primero = por
    debajo; el de `order 1` — `c` — es el último hijo = por encima).
  - Reordenar y re-montar: `reorderComponent('c', 3);` (ahora `a`=1, `b`=2, `c`=3)
    `const content2 = mountEditMode();`
    `expect(worldChildrenIds(content2)).toEqual(['c', 'b', 'a']);`
  - **Modo juego:** `const contentPlay = mountPlayMode();`
    `expect(worldChildrenIds(contentPlay)).toEqual(['c', 'b', 'a']);` (mismo criterio que
    edición).
  - **Modo juego filtra ocultos antes de pintar:**
    `getComponents().find((c) => c.id === 'b').oculto = true;`
    `const contentPlay2 = mountPlayMode();`
    `expect(worldChildrenIds(contentPlay2)).toEqual(['c', 'a']);` (`b` no se pinta) y el
    orden relativo de los que quedan se mantiene por `order` desc.
  - **En modo edición el oculto sí se pinta:** `const contentEdit = mountEditMode();`
    `expect(worldChildrenIds(contentEdit)).toContain('b');`

- [x] **`it('FT-012-11 · reorderComponent(id, 1) deja el componente arriba (subir al
  frente)', ...)` (nivel state, de refilón).**
  - `addN(['a', 'b', 'c', 'd']);` (estado: `d`=1, `c`=2, `b`=3, `a`=4)
  - `reorderComponent('a', 1);` → `expect(orderOf('a')).toBe(1);`
    `expect(ordersById()).toEqual({ a: 1, d: 2, c: 3, b: 4 });`
  - Nota en el comentario del caso: la interacción de modo juego que dispara esto
    (`subirAlMoverInteractuar` tras arrastre/tirada/volteo) es de las funcionalidades
    013/014; aquí solo se fija que el efecto de `reorderComponent(id, 1)` sobre el `order`
    es "queda el primero".

- [x] **Ejecutar la batería y revisar la trazabilidad.** `npm test` desde la raíz del
  repo. Todos los `FT-012-*` en verde. `src/test/TRACEABILITY.md` regenerado: la fila de la
  funcionalidad 012 pasa de `—` a listar `FT-012-01, …, FT-012-11`, y ya no aparece en
  "Funcionalidades sin ningún test". Ajustar los `toEqual` marcados como "confirmar al
  implementar" (resultado exacto de `compactOrders` con inválidos, forma del registro de
  grupo, selector del `worldEl` y de fila seleccionada, nombre del export de
  `componentList.js`) con los valores reales del código.

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/011-functional-test-framework.md`** — en la
  sección "## Test files", añadir una fila a la tabla `| File | Feature | Level |`:
  `functional/orden-apilado.test.js` → `012` → `state + ui`. Mismo criterio que la tanda
  00254–00257. No hay otro cambio de arquitectura: la lógica de `order` ya está documentada
  en `architecture/002-component-model.md` (sección "`order` logic") y coincide con el
  código — no se modifica.

## (d) Style changes

No aplica: no se añade ni modifica ningún patrón visual. Los tests solo verifican
estructura de DOM y estado ya existentes.

## (e) Verification

- [x] `npm test` termina con código 0: todos los tests en verde, sin fallos y sin anomalía
  de trazabilidad.
- [x] En la salida de `npm test`, el recuento de casos incluye los nuevos `FT-012-01`…
  `FT-012-11` (11 casos nuevos), todos como `OK`.
- [x] `src/test/TRACEABILITY.md` (regenerado por `npm test`): la fila
  "012 — Orden de apilado en la mesa" ya no muestra `—` sino `FT-012-01, …, FT-012-11`.
- [x] En `src/test/TRACEABILITY.md`, la sección "Funcionalidades sin ningún test" ya **no**
  lista la 012.
- [x] En `src/test/TRACEABILITY.md`, la sección "Tests que declaran una funcionalidad
  inexistente" sigue diciendo "Ninguna".
- [x] `git status` no muestra cambios en ningún fichero de `src/` fuera de
  `src/test/functional/orden-apilado.test.js` y el regenerado `src/test/TRACEABILITY.md`.
  Ningún cambio en código de producción (`src/core/`, `src/ui/`, `src/modes/`, `src/main.js`).
- [x] Abrir la app en el navegador (modo dev): la columna "Orden" del panel de componentes
  y el apilado en la mesa siguen comportándose igual que antes (confirma que no se ha
  colado ningún cambio de producción).
