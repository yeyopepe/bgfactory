// Funcionalidad 020 — Componente "dado".
//
// Valida los valores por defecto del modelo, la configuración por número
// máximo de caras y por lista de valores, la validez de una lista de
// valores, la tirada al azar (determinista con `mockRandom`), la silueta 2D
// según el número de resultados posibles, el reajuste automático del
// resultado cuando la configuración cambia, y el lanzamiento en modo juego.
//
// [gotcha] aislamiento: `src/modes/edit/editMode.js` mantiene
// `selectedComponentIds` como estado de módulo que `resetState()` NO limpia.
// Los casos que ejercitan selección en modo edición usan ids de componente
// distintos por caso.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode, mockRandom, restoreAllMocks } from '../helpers.js';
import { getComponents, addComponent } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import {
  parseListaValores, isListaValoresValida, getPosibleValores,
  getResultadoInicial, esResultadoValido, tirarDado,
} from '../../core/dice.js';
import { createDefaultComponent, openComponentModal } from '../../ui/componentModal.js';

registerFeature({ primary: 20 });

describe('020 — Dado', () => {
  beforeEach(resetState);
  afterEach(() => {
    restoreAllMocks();
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
  });

  function addDado(id, propsExtra = {}, compExtra = {}) {
    const c = createDefaultComponent('dado');
    c.id = id;
    Object.assign(c.properties, propsExtra);
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  const diceEl = (root) => root.querySelector('.dice');
  const resultText = (root) => root.querySelector('.dice__result')?.textContent;

  it('FT-020-01 · valores por defecto de un dado recién creado', () => {
    const c = createDefaultComponent('dado');
    expect(c.width).toBe(100);
    expect(c.height).toBe(100);
    expect(c.profundidad).toBe(4);
    expect(c.subirAlMoverInteractuar).toBe(true);
    expect(c.properties).toEqual({
      colorCuerpo: '#888888',
      colorNumeros: '#000000',
      modoCaras: 'numeroMaximo',
      numeroMaximoCaras: 6,
      listaValores: '',
      fuenteResourceId: null,
      resultadoActual: '1',
    });

    const bare = createComponent({ type: 'dado' });
    expect(Object.keys(bare.properties)).toHaveLength(0);
    expect(bare.width).toBeNull();
    expect(bare.height).toBeNull();
  });

  it('FT-020-02 · configuración por número máximo de caras', () => {
    expect(getPosibleValores({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 4 })).toEqual(['1', '2', '3', '4']);

    const veinte = getPosibleValores({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 20 });
    expect(veinte).toHaveLength(20);
    expect(veinte[0]).toBe('1');
    expect(veinte[19]).toBe('20');

    expect(getPosibleValores({ modoCaras: 'numeroMaximo' })).toHaveLength(6);

    expect(getResultadoInicial({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 4 })).toBe('1');

    expect(esResultadoValido('3', { numeroMaximoCaras: 4 })).toBe(true);
    expect(esResultadoValido('5', { numeroMaximoCaras: 4 })).toBe(false);
    expect(esResultadoValido('0', { numeroMaximoCaras: 4 })).toBe(false);
  });

  it('FT-020-03 · configuración por lista de valores', () => {
    expect(parseListaValores(' a , b ,c')).toEqual(['a', 'b', 'c']);
    expect(parseListaValores('a,,c')).toEqual(['a', '', 'c']);
    expect(getPosibleValores({ modoCaras: 'lista', listaValores: 'x, y, z' })).toEqual(['x', 'y', 'z']);
    expect(getResultadoInicial({ modoCaras: 'lista', listaValores: 'x, y' })).toBe('x');
    expect(getResultadoInicial({ modoCaras: 'lista', listaValores: ', y' })).toBe('');
  });

  it('FT-020-04 · validez de una lista de valores', () => {
    expect(isListaValoresValida('a,b')).toBe(true);
    expect(isListaValoresValida('a')).toBe(false);
    expect(isListaValoresValida(',,')).toBe(false);
    expect(isListaValoresValida(' , ')).toBe(false);
    expect(isListaValoresValida('a,')).toBe(true);
  });

  it('FT-020-05 · tirada al azar (determinista)', () => {
    mockRandom([0]);
    expect(tirarDado({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 6 })).toBe('1');

    mockRandom([0.999]);
    expect(tirarDado({ modoCaras: 'numeroMaximo', numeroMaximoCaras: 6 })).toBe('6');

    mockRandom([0.5]);
    expect(tirarDado({ modoCaras: 'lista', listaValores: 'a,b,c,d' })).toBe('c');

    mockRandom([0.1]);
    expect(getPosibleValores({ modoCaras: 'lista', listaValores: 'a,b,c,d' }))
      .toContain(tirarDado({ modoCaras: 'lista', listaValores: 'a,b,c,d' }));
  });

  it('FT-020-06 · dibujo sobre la mesa: silueta según nº de posibles', () => {
    // 4 posibles: triángulo.
    addDado('d-4', { modoCaras: 'lista', listaValores: 'a,b,c,d' });
    let content = mountPlayMode();
    let svg = diceEl(content).querySelector('svg');
    expect(svg.querySelectorAll('polygon')).toHaveLength(2);
    expect(svg.querySelectorAll('line').length).toBeGreaterThan(0);
    expect(svg.querySelector('polygon').getAttribute('points').trim().split(/\s+/)).toHaveLength(3);
    expect(resultText(content)).toBe('1');

    // 6 posibles (default): cuadrado liso.
    resetState();
    addDado('d-6');
    content = mountPlayMode();
    svg = diceEl(content).querySelector('svg');
    expect(svg.querySelector('polygon').getAttribute('points').trim().split(/\s+/)).toHaveLength(4);
    expect(svg.querySelectorAll('line')).toHaveLength(0);
    expect(resultText(content)).toBe('1');

    // 8 posibles: rombo.
    resetState();
    addDado('d-8', { modoCaras: 'lista', listaValores: 'a,b,c,d,e,f,g,h' });
    content = mountPlayMode();
    svg = diceEl(content).querySelector('svg');
    expect(svg.querySelector('polygon').getAttribute('points').trim().split(/\s+/)).toHaveLength(4);
    expect(svg.querySelectorAll('line').length).toBeGreaterThan(0);
    expect(resultText(content)).toBe('1');

    // 9 o más: esfera facetada.
    resetState();
    addDado('d-9', { modoCaras: 'lista', listaValores: 'a,b,c,d,e,f,g,h,i' });
    content = mountPlayMode();
    svg = diceEl(content).querySelector('svg');
    expect(svg.querySelectorAll('polygon').length).toBeGreaterThan(10);
    expect(svg.querySelectorAll('line')).toHaveLength(10);
    expect(resultText(content)).toBe('1');

    // Respaldo: cualquier otra cantidad (p. ej. 3) también cae en la esfera facetada.
    resetState();
    addDado('d-3', { numeroMaximoCaras: 3 });
    content = mountPlayMode();
    svg = diceEl(content).querySelector('svg');
    expect(svg.querySelectorAll('polygon').length).toBeGreaterThan(10);
    expect(svg.querySelectorAll('line')).toHaveLength(10);
    expect(resultText(content)).toBe('1');
  });

  it('FT-020-07 · reajuste automático del resultado', () => {
    const props = { modoCaras: 'numeroMaximo', numeroMaximoCaras: 6, resultadoActual: '5' };
    props.numeroMaximoCaras = 3;
    if (!esResultadoValido(props.resultadoActual, props)) props.resultadoActual = getResultadoInicial(props);
    expect(props.resultadoActual).toBe('1');

    const props2 = { modoCaras: 'numeroMaximo', numeroMaximoCaras: 6, resultadoActual: '2' };
    props2.numeroMaximoCaras = 3;
    if (!esResultadoValido(props2.resultadoActual, props2)) props2.resultadoActual = getResultadoInicial(props2);
    expect(props2.resultadoActual).toBe('2');

    // Efecto vía modal.
    addDado('dado-modal', { numeroMaximoCaras: 6, resultadoActual: '5' });
    mountEditMode();
    const target = getComponents().find((c) => c.id === 'dado-modal');
    openComponentModal({ component: target, onAccept() {} });

    const modal = document.querySelector('.modal-overlay .modal');
    const input = [...modal.querySelectorAll('input[type=number]')].find(
      (el) => el.min === '2' && el.max === '100',
    );
    expect(input).toBeTruthy();

    input.value = '3';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(target.properties.resultadoActual).toBe('1');
  });

  it('FT-020-08 · lanzamiento en modo juego', async () => {
    const DICE_ROLL_DURATION_MS = 1000;

    // Nota de implementación: el dado recibe `dice--movable` en ambos modos
    // (es arrastrable en los dos: playMode.js y editMode.js pasan siempre
    // `onMove` a `renderComponentsOnTable`). `dice--clickable` y el listener de
    // `click` que lanza el dado se registran en un `if` independiente del
    // arrastre, activo mientras se pase `onDiceResult` (solo modo juego) y la
    // interacción 'lanzar' esté activa — con independencia de si el dado es
    // arrastrable o está bloqueado, mismo patrón que 'carta'/'mazo'.
    addDado('dado-juego');
    let content = mountPlayMode();
    expect(diceEl(content).classList.contains('dice--movable')).toBe(true);
    expect(diceEl(content).classList.contains('dice--clickable')).toBe(true);

    resetState();
    addDado('dado-edit');
    content = mountEditMode();
    expect(diceEl(content).classList.contains('dice--movable')).toBe(true);

    resetState();
    mockRandom(new Array(64).fill(0.999));
    addDado('dado-tira', { numeroMaximoCaras: 6, resultadoActual: '1' });
    content = mountPlayMode();
    const dice = diceEl(content);

    dice.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 250 + DICE_ROLL_DURATION_MS + 400));

    expect(content.querySelector('.dice__result').textContent).toBe('6');
    expect(getComponents().find((c) => c.id === 'dado-tira').properties.resultadoActual).toBe('6');
    expect(dice.style.transform).toBe('');
  });

  it('FT-020-09 · pulsar (sin arrastrar) un dado no bloqueado lo lanza', async () => {
    const DICE_ROLL_DURATION_MS = 1000;

    // Regresión: el dado no bloqueado es arrastrable, pero una pulsación sin
    // desplazamiento debe lanzarlo. `beginDragLift` reordena el nodo en el DOM
    // y, si se hace ya en `mousedown`, el navegador no sintetiza el `click`
    // posterior. Debe diferirse al primer `mousemove` (mismo patrón que
    // 'carta'/'mazo'); aquí se simula mousedown→mouseup sin mousemove y se
    // comprueba que el nodo no se ha reordenado (no lleva `.lifted`), lo que
    // permite que el `click` que sigue lance el dado.
    mockRandom(new Array(64).fill(0.999));
    const dado = addDado('dado-pulsar', { numeroMaximoCaras: 6, resultadoActual: '1' });
    const content = mountPlayMode();
    const dice = diceEl(content);

    expect(dice.classList.contains('dice--movable')).toBe(true);

    dice.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    expect(dice.classList.contains('lifted')).toBe(false);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    expect(dice.classList.contains('lifted')).toBe(false);

    dice.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 250 + DICE_ROLL_DURATION_MS + 400));

    expect(content.querySelector('.dice__result').textContent).toBe('6');
    expect(getComponents().find((c) => c.id === dado.id).properties.resultadoActual).toBe('6');
    expect(dice.style.transform).toBe('');
  });
});
