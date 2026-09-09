// Funcionalidad 012 — Orden de apilado en la mesa. Valida: propiedad `order`
// del componente; alta (nuevo → order 1, empuja al resto); clonado (clon →
// order 1); borrado (recompacta 1..n sin huecos); reorderComponent
// (desplazamiento por colisión, clamp fuera de rango, no-op a la misma
// posición); loadComponents/compactOrders normaliza `order` a 1..n contiguo;
// reorderGroupBlock (mínimo); columna "Orden" del panel (<input type=number>,
// solo dígitos, confirmar con change, vacío restaura, deshabilitado en
// miembro de grupo, no selecciona la fila); orden de pintado en la mesa
// (order descendente) en modo edición y juego.
// [gotcha] src/ui/componentList.js mantiene columnSort/columnFilters/
// filterText como estado de módulo que resetState() NO limpia — se monta el
// panel una vez con la lista vacía antes de sembrar datos.
// [gotcha] src/modes/edit/editMode.js mantiene selectedComponentIds como
// estado de módulo que resetState() NO limpia — ids de componente distintos
// por caso en los it que ejerciten selección.
// [gotcha] El runner no carga el CSS: el apilado se comprueba por orden de
// appendChild (worldEl.children), no por z-index.

import {
  describe, it, expect, beforeEach, afterEach, registerFeature,
} from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import {
  getComponents, addComponent, removeComponent, reorderComponent, reorderGroupBlock,
  loadComponents, loadGroups, setPanelState,
} from '../../core/state.js';
import { createComponent, cloneComponent } from '../../core/component.js';
import { on } from '../../core/eventBus.js';

registerFeature({ primary: 12 });

describe('012 — Orden de apilado en la mesa', () => {
  beforeEach(resetState);

  afterEach(() => {
    document.querySelectorAll('.modal-overlay, .context-menu').forEach((o) => o.remove());
  });

  function mkComp(id, extra = {}) {
    const c = createComponent({ type: 'texto' });
    c.id = id;
    Object.assign(c, extra);
    return c;
  }

  function addN(ids) {
    ids.forEach((id) => addComponent(mkComp(id)));
  }

  function orderOf(id) {
    return getComponents().find((c) => c.id === id).order;
  }

  function ordersById() {
    return Object.fromEntries(getComponents().map((c) => [c.id, c.order]));
  }

  // Cada componente 'texto' se pinta como .text-box con su properties.contenido
  // como textContent del nodo interno — se usa como marcador de identidad ya
  // que el renderer no expone data-id en el nodo raíz.
  function seedWithContentMarkers(ids) {
    ids.forEach((id) => addComponent(mkComp(id, { properties: { contenido: id } })));
  }

  function worldChildrenIds(content) {
    const world = content.querySelector('.infinite-table__world');
    // El primer hijo de cada .text-box es el div de contenido con
    // properties.contenido como textContent puro (el .text-box raíz puede
    // llevar además una etiqueta identificativa u otras insignias).
    return [...world.children]
      .filter((el) => el.classList.contains('text-box'))
      .map((el) => el.firstChild.textContent);
  }

  it('FT-012-01 · order como propiedad: alta asigna 1 y empuja al resto', () => {
    addComponent(mkComp('a'));
    expect(orderOf('a')).toBe(1);

    addComponent(mkComp('b'));
    expect(orderOf('b')).toBe(1);
    expect(orderOf('a')).toBe(2);

    addComponent(mkComp('c'));
    expect(ordersById()).toEqual({ c: 1, b: 2, a: 3 });

    expect(createComponent({ type: 'texto' }).order).toBeNull();

    const seen = [];
    const off = on('components:changed', () => seen.push(1));
    addComponent(mkComp('d'));
    expect(seen.length).toBeGreaterThan(0);
    off();
  });

  it('FT-012-02 · clonado: el clon queda en order 1 e independiente', () => {
    addN(['a', 'b']);
    const original = getComponents().find((c) => c.id === 'a');
    original.groupId = 'g-x';

    const clone = cloneComponent(original, getComponents());
    expect(clone.order).toBeNull();
    expect(clone.groupId).toBeNull();

    addComponent(clone);
    expect(orderOf(clone.id)).toBe(1);
    expect(orderOf('b')).toBe(2);
    expect(orderOf('a')).toBe(3);
  });

  it('FT-012-03 · borrado: recompacta a 1..n sin huecos', () => {
    addN(['a', 'b', 'c', 'd']);
    removeComponent('c');
    expect(ordersById()).toEqual({ d: 1, b: 2, a: 3 });

    removeComponent('d');
    expect(ordersById()).toEqual({ b: 1, a: 2 });

    const vals = getComponents().map((c) => c.order).sort((x, y) => x - y);
    expect(vals).toEqual([1, 2]);
  });

  it('FT-012-04 · reorderComponent: desplazamiento por colisión', () => {
    addN(['a', 'b', 'c', 'd', 'e']);

    reorderComponent('a', 2);
    expect(orderOf('a')).toBe(2);
    expect(ordersById()).toEqual({ e: 1, a: 2, d: 3, c: 4, b: 5 });

    reorderComponent('e', 4);
    expect(ordersById()).toEqual({ a: 1, d: 2, c: 3, e: 4, b: 5 });

    const vals = getComponents().map((c) => c.order).sort((x, y) => x - y);
    expect(vals).toEqual([1, 2, 3, 4, 5]);
  });

  it('FT-012-05 · reorderComponent: clamp fuera de rango y no-op a la misma posición', () => {
    addN(['a', 'b', 'c']);

    reorderComponent('a', 99);
    expect(orderOf('a')).toBe(3);

    reorderComponent('a', 0);
    expect(orderOf('a')).toBe(1);
    expect(ordersById()).toEqual({ a: 1, c: 2, b: 3 });

    reorderComponent('a', -5);
    expect(orderOf('a')).toBe(1);

    const seen = [];
    const off = on('components:changed', () => seen.push(1));
    reorderComponent('a', 1);
    expect(seen).toEqual([]);
    off();

    const seen2 = [];
    const off2 = on('components:changed', () => seen2.push(1));
    reorderComponent('a', 3);
    expect(seen2.length).toBeGreaterThan(0);
    off2();
  });

  it('FT-012-06 · loadComponents normaliza order a 1..n contiguo por el order de cada componente', () => {
    loadComponents([mkComp('a', { order: 10 }), mkComp('b', { order: 3 }), mkComp('c', { order: 7 })]);
    expect(ordersById()).toEqual({ b: 1, c: 2, a: 3 });

    // Empates de order: se resuelven de forma estable por el orden del array.
    loadComponents([mkComp('m', { order: 5 }), mkComp('n', { order: 5 }), mkComp('o', { order: 1 })]);
    expect(ordersById()).toEqual({ o: 1, m: 2, n: 3 });
  });

  it('FT-012-07 · reorderGroupBlock: mueve el bloque preservando el orden relativo', () => {
    loadComponents([
      mkComp('a', { order: 1 }),
      mkComp('b', { order: 2 }),
      mkComp('m1', { order: 3 }),
      mkComp('m2', { order: 4 }),
      mkComp('c', { order: 5 }),
      mkComp('d', { order: 6 }),
    ]);

    reorderGroupBlock(['m1', 'm2'], 1);
    expect(orderOf('m1')).toBe(1);
    expect(orderOf('m2')).toBe(2);
    expect(ordersById()).toEqual({
      m1: 1, m2: 2, a: 3, b: 4, c: 5, d: 6,
    });

    reorderGroupBlock(['m1', 'm2'], 99);
    expect(orderOf('m1')).toBe(5);
    expect(orderOf('m2')).toBe(6);

    const vals = getComponents().map((c) => c.order).sort((x, y) => x - y);
    expect(vals).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('FT-012-08 · columna "Orden" del panel: solo dígitos, confirmar, vacío restaura', () => {
    mountEditMode();
    addN(['a', 'b', 'c']);
    mountEditMode();

    let input = document.querySelector('.component-list__row[data-id="a"] .component-list__order-input');
    expect(input.type).toBe('number');
    expect(input.min).toBe('1');
    expect(input.max).toBe('3');
    expect(input.value).toBe('3');

    // [gotcha] el input es type="number": el propio DOM ya descarta cualquier
    // value no numérico (asignar "2x" deja el campo en ''), así que el saneado
    // en vivo del listener 'input' (replace(/\D+/g, '')) nunca llega a
    // ejercitarse con un valor mixto por esta vía — solo se puede comprobar que
    // un valor puramente numérico se conserva tal cual.
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('2');

    input.value = '1';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(orderOf('a')).toBe(1);
    expect(ordersById()).toEqual({ a: 1, c: 2, b: 3 });

    input = document.querySelector('.component-list__row[data-id="a"] .component-list__order-input');
    input.value = '9';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(orderOf('a')).toBe(3);
    expect(input.value).toBe('3');

    input = document.querySelector('.component-list__row[data-id="a"] .component-list__order-input');
    input.value = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.value).toBe('3');
    expect(orderOf('a')).toBe(3);
  });

  it('FT-012-09 · columna "Orden": deshabilitada en miembro de grupo y no selecciona la fila', () => {
    mountEditMode();
    addComponent(mkComp('gm-loose'));
    addComponent(mkComp('gm-a', { groupId: 'grp-9' }));
    addComponent(mkComp('gm-b', { groupId: 'grp-9' }));
    loadGroups([{ id: 'grp-9', etiquetaIds: [] }]);
    setPanelState({ expandedGroupIds: ['grp-9'] });
    mountEditMode();

    const groupInput = document.querySelector('.component-list__row--member[data-id="gm-a"] .component-list__order-input');
    expect(groupInput.disabled).toBe(true);

    const looseInput = document.querySelector('.component-list__row[data-id="gm-loose"] .component-list__order-input');
    expect(looseInput.disabled).toBe(false);

    const looseRow = document.querySelector('.component-list__row[data-id="gm-loose"]');
    looseInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(looseRow.classList.contains('component-list__row--selected')).toBe(false);

    const rows = [...document.querySelectorAll('.component-list__row[data-id]')].filter((r) => !r.classList.contains('component-list__row--group'));
    const topLevelIds = rows.filter((r) => !r.classList.contains('component-list__row--member')).map((r) => r.dataset.id);
    expect(topLevelIds).toEqual(['gm-loose']);
  });

  it('FT-012-10 · apilado en la mesa: order más alto se pinta primero', () => {
    seedWithContentMarkers(['a', 'b', 'c']);

    const content = mountEditMode();
    expect(worldChildrenIds(content)).toEqual(['a', 'b', 'c']);

    // c estaba en order 1 (arriba del todo); moverlo a la posición 3 (n=3) lo
    // deja abajo del todo, y b/a se compactan un puesto hacia arriba:
    // resultado a=2, b=1, c=3 — pintado desc (order más alto primero): c, a, b.
    reorderComponent('c', 3);
    expect(ordersById()).toEqual({ c: 3, b: 1, a: 2 });
    const content2 = mountEditMode();
    expect(worldChildrenIds(content2)).toEqual(['c', 'a', 'b']);

    const contentPlay = mountPlayMode();
    expect(worldChildrenIds(contentPlay)).toEqual(['c', 'a', 'b']);

    getComponents().find((c) => c.id === 'a').oculto = true;
    const contentPlay2 = mountPlayMode();
    expect(worldChildrenIds(contentPlay2)).toEqual(['c', 'b']);

    const contentEdit = mountEditMode();
    expect(worldChildrenIds(contentEdit)).toContain('a');
  });

  it('FT-012-11 · reorderComponent(id, 1) deja el componente arriba (subir al frente)', () => {
    addN(['a', 'b', 'c', 'd']);
    reorderComponent('a', 1);
    expect(orderOf('a')).toBe(1);
    expect(ordersById()).toEqual({
      a: 1, d: 2, c: 3, b: 4,
    });
  });
});
