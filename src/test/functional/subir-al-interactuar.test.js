// Funcionalidad 013 — Subir al mover/interactuar.
//
// Valida el valor por defecto de `subirAlMoverInteractuar` según el tipo de
// componente, la migración de guardados antiguos sin el campo, el efecto en
// Modo Juego (arrastrar, lanzar dado, voltear carta, sacar carta de un mazo
// suben el componente a `order` 1 cuando está marcado), su ausencia de efecto
// cuando está desmarcado, su independencia de "Bloqueado", su exclusividad de
// Modo Juego (en Modo Edición no reordena), y la herencia del valor efectivo
// de grupo (`getEffectiveGeneralProps`).
//
// [gotcha] el runner no carga CSS: el apilado se comprueba por `order` del
// modelo, no por z-index — mismo criterio que orden-apilado.test.js.

import {
  describe, it, expect, beforeEach, afterEach, registerFeature,
} from '../harness.js';
import { resetState, mountEditMode, mountPlayMode, mockRandom, restoreAllMocks } from '../helpers.js';
import { getComponents, addComponent, reorderComponent, loadGroups } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { getEffectiveGeneralProps } from '../../core/group.js';
import { createDefaultComponent } from '../../ui/componentModal.js';

registerFeature({ primary: 13 });

describe('013 — Subir al mover/interactuar', () => {
  beforeEach(resetState);

  afterEach(() => {
    restoreAllMocks();
    document.querySelectorAll('.modal-overlay, .context-menu').forEach((o) => o.remove());
  });

  function addComp(type, id, compExtra = {}) {
    const c = createDefaultComponent(type);
    c.id = id;
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  function orderOf(id) {
    return getComponents().find((c) => c.id === id).order;
  }

  // Arrastre real: mousedown en el nodo + mousemove/mouseup en document, con
  // desplazamiento — mismo patrón de eventos que dado/carta/documento en
  // ui/componentRenderer.js (mousedown en el nodo, mousemove/mouseup en document).
  function dragTo(node, dx, dy) {
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 0, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: dx, clientY: dy }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: dx, clientY: dy }));
  }

  it('FT-013-01 · valores por defecto del flag por tipo (state)', () => {
    expect(createDefaultComponent('carta').subirAlMoverInteractuar).toBe(true);
    expect(createDefaultComponent('dado').subirAlMoverInteractuar).toBe(true);
    expect(createDefaultComponent('mazo').subirAlMoverInteractuar).toBe(true);

    expect(createDefaultComponent('texto').subirAlMoverInteractuar).toBe(false);
    expect(createDefaultComponent('tableroSimple').subirAlMoverInteractuar).toBe(false);
    expect(createDefaultComponent('documento').subirAlMoverInteractuar).toBe(false);

    expect(createComponent({ type: 'carta' }).subirAlMoverInteractuar).toBe(false);
  });

  it('FT-013-02 · migración de guardado antiguo sin el campo (state)', () => {
    const c = createComponent({ type: 'texto' });
    delete c.subirAlMoverInteractuar;
    c.id = 't-old';
    addComponent(c);
    reorderComponent('t-old', 3);
    addComp('texto', 't2');
    addComp('texto', 't3');

    const before = orderOf('t-old');
    mountPlayMode();
    const world = document.querySelector('.infinite-table__world');
    const node = [...world.querySelectorAll('.text-box')][0];
    dragTo(node, 40, 40);

    expect(orderOf('t-old')).toBe(before);
  });

  it('FT-013-03 · con el flag marcado, arrastrar en Modo Juego sube a order 1', () => {
    addComp('texto', 't3', { properties: { contenido: 't3' }, subirAlMoverInteractuar: true });
    addComp('texto', 't2', { properties: { contenido: 't2' } });
    addComp('texto', 't1', { properties: { contenido: 't1' } });

    const content = mountPlayMode();
    const world = content.querySelector('.infinite-table__world');
    const node = [...world.querySelectorAll('.text-box')].find((el) => el.firstChild.textContent === 't3');
    expect(orderOf('t3')).toBe(3);

    dragTo(node, 30, 30);

    expect(orderOf('t3')).toBe(1);
  });

  it('FT-013-04 · con el flag desmarcado, arrastrar NO reordena', () => {
    addComp('texto', 't3', { properties: { contenido: 't3' }, subirAlMoverInteractuar: false });
    addComp('texto', 't2', { properties: { contenido: 't2' } });
    addComp('texto', 't1', { properties: { contenido: 't1' } });

    const content = mountPlayMode();
    const world = content.querySelector('.infinite-table__world');
    const node = [...world.querySelectorAll('.text-box')].find((el) => el.firstChild.textContent === 't3');
    expect(orderOf('t3')).toBe(3);

    dragTo(node, 30, 30);

    expect(orderOf('t3')).toBe(3);
  });

  it('FT-013-05 · lanzar dado en Modo Juego sube a order 1', async () => {
    const d1 = addComp('dado', 'd1', { subirAlMoverInteractuar: true });
    addComp('texto', 't1');
    addComp('texto', 't2');
    expect(d1.subirAlMoverInteractuar).toBe(true);
    reorderComponent('d1', 3);
    expect(orderOf('d1')).toBe(3);

    mockRandom(new Array(64).fill(0.999));
    const content = mountPlayMode();
    const dice = content.querySelector('.dice');

    dice.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250 + 1000 + 400));

    expect(orderOf('d1')).toBe(1);
  });

  it('FT-013-06 · voltear carta en Modo Juego sube a order 1', () => {
    const c1 = addComp('carta', 'c1', { subirAlMoverInteractuar: true });
    addComp('texto', 't1');
    addComp('texto', 't2');
    expect(c1.subirAlMoverInteractuar).toBe(true);
    reorderComponent('c1', 3);
    expect(orderOf('c1')).toBe(3);

    const content = mountPlayMode();
    const carta = content.querySelector('.carta');
    carta.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(orderOf('c1')).toBe(1);
    expect(getComponents().find((c) => c.id === 'c1').properties.caraActual).toBe('frontal');
  });

  it('FT-013-07 · sacar carta de un mazo en Modo Juego sube a order 1', () => {
    const carta = addComp('carta', 'carta-en-mazo');
    const m1 = addComp('mazo', 'm1', { subirAlMoverInteractuar: true, properties: { cartaIds: [carta.id] } });
    expect(m1.subirAlMoverInteractuar).toBe(true);
    addComp('texto', 't1');
    reorderComponent('m1', 2);
    expect(orderOf('m1')).toBe(2);

    const content = mountPlayMode();
    const mazoCandidates = [...content.querySelectorAll('.infinite-table__world .carta')];
    const mazoNode = mazoCandidates.find((el) => el.classList.contains('mazo--clickable'));
    expect(mazoNode).toBeTruthy();
    mazoNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(orderOf('m1')).toBe(1);
  });

  it('FT-013-08 · independencia de "bloqueado"', () => {
    const c1 = addComp('carta', 'c1', { subirAlMoverInteractuar: true, bloqueado: 'juego' });
    addComp('texto', 't1');
    addComp('texto', 't2');
    reorderComponent('c1', 3);
    expect(orderOf('c1')).toBe(3);
    expect(c1.bloqueado).toBe('juego');

    const content = mountPlayMode();
    const carta = content.querySelector('.carta');
    expect(carta.classList.contains('carta--movable')).toBe(false);
    expect(carta.classList.contains('carta--clickable')).toBe(true);

    carta.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(orderOf('c1')).toBe(1);
  });

  it('FT-013-09 · exclusivo de Modo Juego: en Modo Edición arrastrar no reordena por este flag', () => {
    addComp('texto', 't1', { properties: { contenido: 't1' } });
    addComp('texto', 't2', { properties: { contenido: 't2' } });
    addComp('texto', 't3', { properties: { contenido: 't3' }, subirAlMoverInteractuar: true });
    reorderComponent('t3', 3);
    expect(orderOf('t3')).toBe(3);

    const content = mountEditMode();
    const world = content.querySelector('.infinite-table__world');
    const node = [...world.querySelectorAll('.text-box')].find((el) => el.firstChild.textContent === 't3');
    dragTo(node, 30, 30);

    expect(orderOf('t3')).toBe(3);
  });

  it('FT-013-10 · override de grupo vía getEffectiveGeneralProps', () => {
    const t1 = addComp('texto', 't1', { properties: { contenido: 't1' }, subirAlMoverInteractuar: false, groupId: 'g1' });
    addComp('texto', 't2', { properties: { contenido: 't2' } });
    loadGroups([{ id: 'g1', bloqueado: 'ninguno', etiquetaIds: [], subirAlMoverInteractuar: true }]);

    expect(getEffectiveGeneralProps(t1, [{ id: 'g1', bloqueado: 'ninguno', etiquetaIds: [], subirAlMoverInteractuar: true }]).subirAlMoverInteractuar).toBe(true);

    reorderComponent('t1', 2);
    expect(orderOf('t1')).toBe(2);

    const content = mountPlayMode();
    const world = content.querySelector('.infinite-table__world');
    const node = [...world.querySelectorAll('.text-box')].find((el) => el.firstChild.textContent === 't1');
    dragTo(node, 30, 30);

    expect(orderOf('t1')).toBe(1);
  });
});
