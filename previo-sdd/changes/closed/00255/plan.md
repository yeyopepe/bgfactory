- **Creation date**: 2026-09-09

## (a) Functional notes

**Fuera de alcance:**

- No se prueba el resto del catálogo de propiedades de la ventana de configuración del dado más allá del reajuste del resultado (`reconcileResultado`).
- La muestra de texto en la tipografía elegida y la selección de una fuente de la galería quedan cubiertas por la batería de recursos/tipografías, no por ésta.
- No se crean fixtures ni juegos de datos de ejemplo: cada caso construye los dados que necesita a partir de `createDefaultComponent('dado')` más ajustes puntuales.
- No se toca código de producción. Nada de lo añadido llega al bundle entregable (`src/scripts/build.py` recorre imports desde `src/main.js`; `src/test/` no es alcanzable).
- No se prueba la extrusión/`profundidad` del dado ni el redimensionado con manejadores de esquina sobre la mesa (mecánicas compartidas, cubiertas por otras baterías).
- No se comprueba el posicionamiento visual del temblor (coordenadas exactas del `transform: translate`), sólo que durante la tirada hay `transform` no vacío y que al terminar vuelve a `''`.
- El mapa de trazabilidad (`src/test/TRACEABILITY.md`) se regenera solo en cada `npm test`; no se edita a mano.

**Dudas resueltas con el usuario:** ninguna abierta por chat. Decisión técnica tomada en este plan (no requería consulta): el motor de test (`src/test/harness.js`) **no** tiene temporizadores falsos y ningún test existente adelanta timers; el caso `FT-020-08` (tirada completa) espera el tiempo real de la animación con `await new Promise((r) => setTimeout(r, DICE_ROLL_DURATION_MS + 400))` (~1,4 s) dentro de un `it` async, y `restoreAllMocks()` en `afterEach`. Es el único caso lento de la batería; el resto es instantáneo.

## (b) Technical solution

- [x] **`src/test/functional/dado.test.js` — crear el fichero y su cabecera.** Fichero nuevo, estructura calcada de `src/test/functional/tablero-simple.test.js`. Cabecera de comentario resumiendo qué valida (defaults del modelo, posibles por número máximo de caras / por lista, validez de lista, tirada determinista con azar fijado, silueta 2D según nº de posibles, reajuste automático del resultado, lanzamiento en modo juego) y repitiendo el `[gotcha]` de aislamiento: `src/modes/edit/editMode.js` mantiene `selectedComponentIds` como estado de módulo que `resetState()` NO limpia → ids de componente distintos por caso en los casos con selección en modo edición.

- [x] **`src/test/functional/dado.test.js` — imports, `registerFeature` y andamiaje del `describe`.** De `../harness.js`: `describe, it, expect, beforeEach, afterEach, registerFeature`. De `../helpers.js`: `resetState, mountEditMode, mountPlayMode, mockRandom, restoreAllMocks`. De `../../core/state.js`: `getComponents, addComponent`. De `../../core/component.js`: `createComponent`. De `../../core/dice.js`: `parseListaValores, isListaValoresValida, getPosibleValores, getResultadoInicial, esResultadoValido, tirarDado`. De `../../ui/componentModal.js`: `createDefaultComponent, openComponentModal`. Llamar `registerFeature({ primary: 20 })` a nivel de módulo. `describe('020 — Dado', () => { ... })` con `beforeEach(resetState)`, `afterEach(() => { restoreAllMocks(); document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()); })`.

- [x] **`src/test/functional/dado.test.js` — helper local `addDado(id, propsExtra, compExtra)`.** Análogo a `addBoard` de 018: `const c = createDefaultComponent('dado'); c.id = id; Object.assign(c.properties, propsExtra); Object.assign(c, compExtra); addComponent(c); return c;`. Definir también `const diceEl = (root) => root.querySelector('.dice');` y `const resultText = (root) => root.querySelector('.dice__result')?.textContent;`.

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-01 · valores por defecto de un dado recién creado', ...)` (nivel state).** `const c = createDefaultComponent('dado');` afirmar: `c.width` === `100`, `c.height` === `100`; `c.profundidad` === `4` (sensación de grosor por extrusión); `c.subirAlMoverInteractuar` === `true`; `c.properties` con `toEqual({ colorCuerpo: '#888888', colorNumeros: '#000000', modoCaras: 'numeroMaximo', numeroMaximoCaras: 6, listaValores: '', fuenteResourceId: null, resultadoActual: '1' })`. Matiz del alta: `const bare = createComponent({ type: 'dado' });` → `expect(Object.keys(bare.properties)).toHaveLength(0)`, `expect(bare.width).toBeNull()`, `expect(bare.height).toBeNull()`.

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-02 · configuración por número máximo de caras', ...)` (nivel state).** Sobre `getPosibleValores`/`getResultadoInicial`/`esResultadoValido` con `properties` planos (no hace falta crear componente):
  - `getPosibleValores({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 4 })` con `toEqual(['1','2','3','4'])`.
  - `getPosibleValores({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 20 })` → `toHaveLength(20)`, primer elemento `'1'`, último `'20'`.
  - Sin máximo: `getPosibleValores({ modoCaras: 'numeroMaximo' })` (o `numeroMaximoCaras: 0`) → `toHaveLength(6)` (fallback `|| 6`).
  - `getResultadoInicial({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 4 })` === `'1'`.
  - `esResultadoValido('3', { numeroMaximoCaras: 4 })` === `true`; `esResultadoValido('5', { numeroMaximoCaras: 4 })` === `false`; `esResultadoValido('0', { numeroMaximoCaras: 4 })` === `false`.

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-03 · configuración por lista de valores', ...)` (nivel state).**
  - `parseListaValores(' a , b ,c')` con `toEqual(['a','b','c'])` (recorta espacios de cada valor).
  - `parseListaValores('a,,c')` con `toEqual(['a','','c'])` (una posición vacía cuenta como una cara más).
  - `getPosibleValores({ modoCaras: 'lista', listaValores: 'x, y, z' })` con `toEqual(['x','y','z'])`.
  - `getResultadoInicial({ modoCaras: 'lista', listaValores: 'x, y' })` === `'x'`.
  - `getResultadoInicial({ modoCaras: 'lista', listaValores: ', y' })` === `''` (el primero es una cara vacía).

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-04 · validez de una lista de valores', ...)` (nivel state).** `expect(isListaValoresValida('a,b')).toBe(true)`; `expect(isListaValoresValida('a')).toBe(false)` (un solo valor); `expect(isListaValoresValida(',,')).toBe(false)` (varias posiciones, todas vacías → `['','','']`); `expect(isListaValoresValida(' , ')).toBe(false)` (`['','']` tras trim); `expect(isListaValoresValida('a,')).toBe(true)` (dos posiciones, una con contenido → `['a','']`).

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-05 · tirada al azar (determinista)', ...)` (nivel state).** Con `mockRandom`:
  - `mockRandom([0]);` `expect(tirarDado({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 6 })).toBe('1')` (`Math.floor(0 * 6)` = 0 → primer posible).
  - `mockRandom([0.999]);` `expect(tirarDado({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 6 })).toBe('6')` (`Math.floor(0.999 * 6)` = 5 → último).
  - `mockRandom([0.5]);` con lista `'a,b,c,d'` → resultado `'c'` (`Math.floor(0.5 * 4)` = 2) y `expect(getPosibleValores({ modoCaras:'lista', listaValores:'a,b,c,d' })).toContain(tirarDado(...))` tras re-`mockRandom` con cualquier valor, para afirmar pertenencia al conjunto.
  - `afterEach` ya llama `restoreAllMocks()`.

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-06 · dibujo sobre la mesa: silueta según nº de posibles', ...)` (nivel ui, `mountPlayMode`).** Para cada configuración, montar y localizar el `<svg>` hijo de `.dice` (`diceEl(content).querySelector('svg')`):
  - 4 posibles (`{ modoCaras: 'lista', listaValores: 'a,b,c,d' }`): triángulo → contar `<polygon>` (el de relleno de 3 vértices + el `<polygon>` de contorno final = 2) y al menos una `<line>`. Comprobar que el primer `<polygon>` tiene 3 pares de coordenadas en `points` (`getAttribute('points').trim().split(/\s+/).length === 3`).
  - 6 posibles (default `numeroMaximoCaras: 6`): cuadrado liso → primer `<polygon>` con 4 pares de coordenadas y `svg.querySelectorAll('line')` con `toHaveLength(0)`.
  - 8 posibles (`{ modoCaras: 'lista', listaValores: 'a,b,c,d,e,f,g,h' }`): rombo → primer `<polygon>` con 4 pares de coordenadas y al menos una `<line>` (diagonal). (Se distingue del cuadrado por tener línea; ambos tienen 4 vértices.)
  - 9 o más (`listaValores` con 9 valores) y respaldo (p. ej. `numeroMaximoCaras: 3`): esfera facetada → `svg.querySelectorAll('polygon').length` ≥ 11 (10 facetas + contorno) y `svg.querySelectorAll('line').length` === `10`.
  - En todos: `expect(resultText(content)).toBe('1')` (el `.dice__result` muestra el `resultadoActual`, por defecto `'1'`), centrado (no hace falta afirmar la geometría del centrado, sólo el `textContent`).

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-07 · reajuste automático del resultado', ...)` (nivel state + ui).**
  - Regla pura: partir de `props = { modoCaras: 'numeroMaximo', numeroMaximoCaras: 6, resultadoActual: '5' }`; bajar a `numeroMaximoCaras: 3`; replicar la lógica de `reconcileResultado`: `if (!esResultadoValido(props.resultadoActual, props)) props.resultadoActual = getResultadoInicial(props);` → `expect(props.resultadoActual).toBe('1')`. Contraprueba: con `resultadoActual: '2'` y `numeroMaximoCaras: 3`, sigue siendo válido → no cambia.
  - Efecto vía modal (nivel ui): `addDado('dado-modal', { numeroMaximoCaras: 6, resultadoActual: '5' });` `mountEditMode();` `const target = getComponents().find((c) => c.id === 'dado-modal');` `openComponentModal({ component: target, onAccept() {} });`. Localizar en `.modal-overlay .modal` el `<input type="number">` de `numeroMaximoCaras` (el que tiene `min`/`max` correspondientes a caras — 2 y 100 según `renderDadoSpecificFields`; confirmar los valores exactos de `min`/`max` al implementar mirando ese método). Poner `input.value = '3'` y disparar `input.dispatchEvent(new Event('input', { bubbles: true }))`. Como `openComponentModal` hace `workingComponent = { ...component }` (shallow, `properties` compartido), afirmar `expect(target.properties.resultadoActual).toBe('1')` directo sobre el componente del estado (`reconcileResultado` se dispara en el `input`).

- [x] **`src/test/functional/dado.test.js` — `it('FT-020-08 · lanzamiento en modo juego', async ...)` (nivel ui, async).**
  - Contraste de clase: `addDado('dado-juego');` `let content = mountPlayMode();` → `expect(diceEl(content).classList.contains('dice--clickable')).toBe(true)`. `resetState(); addDado('dado-edit');` `content = mountEditMode();` → `expect(diceEl(content).classList.contains('dice--clickable')).toBe(false)` (en edición es arrastrable/seleccionable, no lanzable).
  - Tirada completa con azar fijado: `resetState();` `mockRandom(new Array(64).fill(0.999));` (cubre los ticks de parpadeo del `setInterval` de 70 ms durante ~1 s más el `tirarDado` final; con `0.999` el resultado final de 6 caras es `'6'`). `addDado('dado-tira', { numeroMaximoCaras: 6, resultadoActual: '1' });` `content = mountPlayMode();` `const dice = diceEl(content);`. Disparar `dice.dispatchEvent(new MouseEvent('click', { bubbles: true }))`. Esperar: `await new Promise((r) => setTimeout(r, 250 + DICE_ROLL_DURATION_MS + 400));` — definir `const DICE_ROLL_DURATION_MS = 1000;` local en el fichero (constante de referencia; el render usa la suya). Tras la espera, sin remontar (la animación muta el DOM in situ): `expect(content.querySelector('.dice__result').textContent).toBe('6')`; `expect(getComponents().find((c) => c.id === 'dado-tira').properties.resultadoActual).toBe('6')` (`onDiceResult` en `playMode.js` hace `replaceComponent` con `resultadoActual`); `expect(dice.style.transform).toBe('')` (deja de temblar).
  - Clic durante la tirada se ignora: opcionalmente, disparar un segundo `click` inmediatamente tras el primero y comprobar tras la espera que el resultado sigue siendo el esperado una sola tirada (no obligatorio si complica; el punto principal es el resultado final estable).
  - Este `it` es async y espera tiempo real; `afterEach` llama `restoreAllMocks()`. No deben quedar `setInterval`/`setTimeout` colgando: la espera de ~1,65 s garantiza que el `setTimeout` de cierre del render ya limpió su `setInterval` antes de acabar el caso.

## (e) Verification

- [x] `npm test` termina con código de salida `0`: `Total: N — OK: N — FALLOS: 0`, sin ningún `✗`.
- [x] En la salida de `npm test` aparece `functional/dado.test.js` con sus 8 casos `FT-020-01`…`FT-020-08` y todos en verde. El caso `FT-020-08` puede tardar ~1,5 s; el resto es instantáneo.
- [x] `src/test/TRACEABILITY.md`, regenerado por ese `npm test`, ya no lista la funcionalidad 20 en "Funcionalidades sin ningún test"; en la tabla `| Funcionalidad | Tests |` la fila de la funcionalidad 20 lista `FT-020-01` … `FT-020-08`.
- [x] `src/test/TRACEABILITY.md` no gana ninguna línea en "Tests que declaran una funcionalidad inexistente"; `npm test` no falla por anomalía de trazabilidad.
- [x] `git status` sólo muestra como añadido `src/test/functional/dado.test.js` y como modificado `src/test/TRACEABILITY.md`; ningún fichero bajo `src/` fuera de `src/test/` aparece tocado.
- [x] Ejecutar `npm test` dos veces seguidas da el mismo resultado (la batería no deja timers colgando entre ficheros: `FT-020-08` espera a que termine la tirada y `afterEach` restaura los mocks).
