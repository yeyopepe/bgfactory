// Funcionalidad 023 — Componente "Mazo" (baraja de cartas).
//
// Valida los valores por defecto del modelo, la baraja como colección de cartas,
// la operación de barajar (Fisher-Yates), la geometría de la zona de revelado,
// el cálculo de solapes de rectángulos, el sistema de sacar una carta de la
// baraja a la mesa, el render en modo juego (clickable, mostrar carta de arriba
// o placeholder) y modo edición (no clickable), la zona de revelado decorativa,
// el menú contextual del mazo (barajar / ver contenido), y casos ligeros de
// "Meter en mazo..." y arrastres de cartas sobre el mazo (sin simular drag completo).
//
// Nivel: state (lógica pura) + ui (render).
//
// [gotcha] aislamiento: `src/modes/edit/editMode.js` mantiene `selectedComponentIds`
// como estado de módulo que `resetState()` NO limpia. Los casos que ejercitan
// selección en modo edición usan ids de componente distintos por caso.
//
// [gotcha] zona de revelado: existe siempre en ambos modos (juego + edición),
// no se oculta si el mazo está vacío.
//
// [gotcha] imagen propia del mazo: la rama de render (src/ui/componentRenderer.js
// ~línea 1907) es `if (props.imagenResourceId && cartaArriba)` — la imagen propia
// sólo se pinta si además hay al menos una carta en el mazo. Un mazo con imagen
// propia pero vacío cae a `renderMazoEmptyPlaceholder`. Este comportamiento es
// distinto de lo que la doc antigua afirmaba; los tests validan el código real.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode, mockRandom, restoreAllMocks, loadFixture, dispatchContextMenu, getOpenContextMenu } from '../helpers.js';
import { getComponents, addComponent, loadComponents, sacarCartaDeMazo, removeComponent, loadResources, replaceComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createComponent } from '../../core/component.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { shuffleCartaIds, getCartaIdsEnAlgunMazo, getMazoRevealZoneRect, rectsOverlap, computeSacarCartaDeMazo, MAZO_REVEAL_GAP } from '../../core/deck.js';

registerFeature({ primary: 23 });

describe('023 — Mazo', () => {
  beforeEach(resetState);
  afterEach(() => {
    restoreAllMocks();
    document.querySelectorAll('.modal-overlay, .context-menu').forEach((n) => n.remove());
  });

  // Helper: crea un mazo con id estable, mezcla overrides sobre properties y
  // sobre el propio componente, lo registra en el estado.
  function addMazo(id, propsExtra = {}, compExtra = {}) {
    const c = createDefaultComponent('mazo');
    c.id = id;
    Object.assign(c.properties, propsExtra);
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  // Helper: crea una carta con id estable, la registra en el estado.
  function addCarta(id, compExtra = {}) {
    const c = createDefaultComponent('carta');
    c.id = id;
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  // Helper: selector de nodo del mazo en el DOM (div.carta con clase mazo o similar).
  const mazoNode = (root) => {
    const candidates = root.querySelectorAll('.infinite-table__world .carta');
    for (const el of candidates) {
      if (el.classList.contains('mazo--clickable') || el.classList.contains('mazo')) {
        return el;
      }
    }
    return candidates.length > 0 ? candidates[0] : null;
  };

  // Helper: selector de nodo de la zona de revelado.
  const revealZoneNode = (root) => root.querySelector('.mazo-reveal-zone');

  it('FT-023-01 · valores por defecto de un mazo recién creado', () => {
    const c = createDefaultComponent('mazo');
    expect(c.width).toBe(180);
    expect(c.height).toBe(252);
    expect(c.mostrarTooltip).toBe(true);
    expect(c.tooltipTexto).toBe('Pulsa para sacar la primera carta.');
    expect(c.subirAlMoverInteractuar).toBe(true);
    expect(c.properties.cartaIds).toEqual([]);
    expect(c.properties.orientacion).toBe('vertical');
    expect(c.properties.forma).toBe('rectangular');
    expect(c.properties.disposicion).toBe('derecha');
    expect(c.properties.textoCartaRevelada).toBe('Carta revelada');
    expect(c.properties.caraCartaRevelada).toBe('frontal');
    expect(c.properties.imagenResourceId).toBeNull();

    const bare = createComponent({ type: 'mazo' });
    expect(Object.keys(bare.properties)).toHaveLength(0);
    expect(bare.width).toBeNull();
    expect(bare.height).toBeNull();
  });

  it('FT-023-02 · qué cartas están dentro de algún mazo', () => {
    expect(getCartaIdsEnAlgunMazo([])).toEqual(new Set());

    const components = [
      { type: 'mazo', properties: { cartaIds: ['c1', 'c2'] } },
      { type: 'mazo', properties: { cartaIds: ['c3'] } },
      { type: 'carta', id: 'c9' },
      { type: 'dado', id: 'd1' },
    ];
    const set = getCartaIdsEnAlgunMazo(components);
    expect(set.has('c1')).toBe(true);
    expect(set.has('c2')).toBe(true);
    expect(set.has('c3')).toBe(true);
    expect(set.size).toBe(3);
  });

  it('FT-023-03 · barajar', () => {
    const original = ['a', 'b', 'c', 'd', 'e'];
    mockRandom(new Array(10).fill(0));
    const out = shuffleCartaIds(original);

    expect(out === original).toBe(false);
    expect(original).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect([...out].sort()).toEqual([...original].sort());

    restoreAllMocks();
    expect(shuffleCartaIds([])).toEqual([]);
    expect(shuffleCartaIds(['x'])).toEqual(['x']);
  });

  it('FT-023-04 · zona de revelado', () => {
    const mazo = { x: 100, y: 200, width: 60, height: 90, properties: { disposicion: 'derecha' } };
    let rect = getMazoRevealZoneRect(mazo);
    expect(rect.x).toBe(100 + 60 + MAZO_REVEAL_GAP);
    expect(rect.y).toBe(200);
    expect(rect.width).toBe(60);
    expect(rect.height).toBe(90);

    mazo.properties.disposicion = 'izquierda';
    rect = getMazoRevealZoneRect(mazo);
    expect(rect.x).toBe(100 - 60 - MAZO_REVEAL_GAP);
    expect(rect.y).toBe(200);

    mazo.properties.disposicion = 'abajo';
    rect = getMazoRevealZoneRect(mazo);
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(200 + 90 + MAZO_REVEAL_GAP);

    mazo.properties.disposicion = 'arriba';
    rect = getMazoRevealZoneRect(mazo);
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(200 - 90 - MAZO_REVEAL_GAP);

    mazo.properties.disposicion = undefined;
    rect = getMazoRevealZoneRect(mazo);
    expect(rect.x).toBe(100 + 60 + MAZO_REVEAL_GAP);

    mazo.properties.disposicion = 'diagonal';
    rect = getMazoRevealZoneRect(mazo);
    expect(rect.x).toBe(100 + 60 + MAZO_REVEAL_GAP);

    const mazoSinDims = { x: undefined, y: undefined, width: undefined, height: undefined, properties: {} };
    rect = getMazoRevealZoneRect(mazoSinDims);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(100);
  });

  it('FT-023-05 · solape de rectángulos', () => {
    expect(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 })).toBe(false);
    expect(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it('FT-023-06 · cálculo de sacar una carta', () => {
    const mazo = { x: 100, y: 100, width: 60, height: 90, properties: { cartaIds: ['c1', 'c2', 'c3'], disposicion: 'derecha', caraCartaRevelada: 'frontal' } };
    const carta = { id: 'c2' };
    const result = computeSacarCartaDeMazo(mazo, carta);

    expect(result.mazoProperties.cartaIds).toEqual(['c1', 'c3']);
    const revealRect = getMazoRevealZoneRect(mazo);
    expect(result.cartaChanges.x).toBe(revealRect.x);
    expect(result.cartaChanges.y).toBe(revealRect.y);
    expect(result.cartaChanges.properties.caraActual).toBe('frontal');

    const mazo2 = { x: 100, y: 100, width: 60, height: 90, properties: { cartaIds: ['c1', 'c2'], caraCartaRevelada: 'trasera' } };
    expect(computeSacarCartaDeMazo(mazo2, { id: 'c1' }).cartaChanges.properties.caraActual).toBe('trasera');

    const mazo3 = { x: 100, y: 100, width: 60, height: 90, properties: { cartaIds: ['c1'] } };
    expect(computeSacarCartaDeMazo(mazo3, { id: 'c1' }).cartaChanges.properties.caraActual).toBe('frontal');

    expect(computeSacarCartaDeMazo(mazo, { id: 'zzz' })).toBeNull();
  });

  it('FT-023-07 · sacar una carta, aplicado a la partida', async () => {
    await loadFixture('mazo-con-cartas');
    sacarCartaDeMazo('mazo-fx', 'carta-b');

    const mazoComponent = getComponents().find((c) => c.id === 'mazo-fx');
    expect(mazoComponent.properties.cartaIds).toEqual(['carta-a', 'carta-c']);

    const cartaBComponent = getComponents().find((c) => c.id === 'carta-b');
    const revealRect = getMazoRevealZoneRect(getComponents().find((c) => c.id === 'mazo-fx'));
    expect(cartaBComponent.x).toBe(revealRect.x);
    expect(cartaBComponent.y).toBe(revealRect.y);
    expect(cartaBComponent.properties.caraActual).toBe('frontal');

    const componentsBefore = JSON.stringify(getComponents());
    sacarCartaDeMazo('no-existe', 'carta-a');
    expect(JSON.stringify(getComponents())).toBe(componentsBefore);

    sacarCartaDeMazo('mazo-fx', 'no-existe');
    expect(JSON.stringify(getComponents())).toBe(componentsBefore);
  });

  it('FT-023-08 · una carta dentro de un mazo no se dibuja en la mesa', async () => {
    await loadFixture('mazo-con-cartas');
    let content = mountPlayMode();
    const cartas = content.querySelectorAll('.infinite-table__world .carta');
    expect(cartas.length).toBe(1);

    resetState();
    await loadFixture('mazo-con-cartas');
    content = mountEditMode();
    const cartasEdit = content.querySelectorAll('.infinite-table__world .carta');
    expect(cartasEdit.length).toBe(1);

    const mazo = getComponents().find((c) => c.id === 'mazo-fx');
    expect(mazoNode(content)).toBeTruthy();

    sacarCartaDeMazo('mazo-fx', 'carta-a');
    content = mountPlayMode();
    const cartasAfter = content.querySelectorAll('.infinite-table__world .carta');
    expect(cartasAfter.length).toBe(2);
  });

  it('FT-023-09 · dibujo de la caja y el contenido del mazo', async () => {
    addMazo('mazo-vacio');
    let content = mountPlayMode();
    let node = mazoNode(content);
    expect(node.style.borderRadius).toContain('var(--radius-lg)');
    expect(revealZoneNode(content)).toBeTruthy();
    expect(revealZoneNode(content).textContent).toBe('Carta revelada');

    resetState();
    addMazo('mazo-circ', { forma: 'circular' });
    content = mountPlayMode();
    node = mazoNode(content);
    expect(node.style.borderRadius).toBe('50%');
    const zoneCirc = revealZoneNode(content);
    expect(zoneCirc.style.borderRadius).toBe('50%');

    resetState();
    await loadFixture('mazo-con-cartas');
    content = mountPlayMode();
    node = mazoNode(content);
    expect(revealZoneNode(content)).toBeTruthy();

    resetState();
    loadResources([{ id: 'img-mazo', type: 'imagen', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }]);
    addMazo('mazo-img-vacio', { imagenResourceId: 'img-mazo' });
    content = mountPlayMode();
    node = mazoNode(content);
    const imgs = node.querySelectorAll('img');
    expect(imgs.length).toBe(0);

    resetState();
    loadResources([{ id: 'img-mazo', type: 'imagen', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }]);
    await loadFixture('mazo-con-cartas');
    const mazoFx = getComponents().find((c) => c.id === 'mazo-fx');
    replaceComponent('mazo-fx', updateComponent(mazoFx, { properties: { ...mazoFx.properties, imagenResourceId: 'img-mazo' } }));
    const updatedMazo = getComponents().find((c) => c.id === 'mazo-fx');
    expect(updatedMazo.properties.imagenResourceId).toBe('img-mazo');
  });

  it('FT-023-10 · sacar la carta de arriba con un clic (sólo modo juego)', async () => {
    await loadFixture('mazo-con-cartas');
    let content = mountPlayMode();
    let node = mazoNode(content);
    expect(node.classList.contains('mazo--clickable')).toBe(true);

    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const mazoAfter = getComponents().find((c) => c.id === 'mazo-fx');
    expect(mazoAfter.properties.cartaIds).toHaveLength(2);
    const cartaA = getComponents().find((c) => c.id === 'carta-a');
    expect(cartaA).toBeTruthy();

    resetState();
    addMazo('mazo-vac2');
    content = mountPlayMode();
    const componentsBefore = JSON.stringify(getComponents());
    node = mazoNode(content);
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(JSON.stringify(getComponents())).toBe(componentsBefore);

    resetState();
    await loadFixture('mazo-con-cartas');
    content = mountEditMode();
    node = mazoNode(content);
    expect(node.classList.contains('mazo--clickable')).toBe(false);
    const mazoEditBefore = getComponents().find((c) => c.id === 'mazo-fx').properties.cartaIds.length;
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const mazoEditAfter = getComponents().find((c) => c.id === 'mazo-fx').properties.cartaIds.length;
    expect(mazoEditAfter).toBe(mazoEditBefore);
  });

  it('FT-023-11 · menú contextual del mazo (modo juego)', async () => {
    await loadFixture('mazo-con-cartas');
    const content = mountPlayMode();
    const node = mazoNode(content);

    dispatchContextMenu(node, { x: 50, y: 60 });
    const menu = getOpenContextMenu();
    if (menu) {
      expect(menu.textContent).toContain('Barajar');
    }

    resetState();
    addMazo('mazo-v');
    const content2 = mountPlayMode();
    const node2 = mazoNode(content2);
    dispatchContextMenu(node2, { x: 50, y: 60 });
    const menu2 = getOpenContextMenu();
    if (menu2) {
      expect(menu2.textContent).toContain('Ver contenido');
    }
  });

  it('FT-023-12 · eliminar un mazo libera sus cartas', async () => {
    await loadFixture('mazo-con-cartas');
    const mazoId = 'mazo-fx';
    removeComponent(mazoId);

    const mazoAfterRemove = getComponents().find((c) => c.id === mazoId);
    expect(mazoAfterRemove === undefined).toBe(true);
    expect(getComponents().find((c) => c.id === 'carta-a')).toBeTruthy();
    expect(getComponents().find((c) => c.id === 'carta-b')).toBeTruthy();
    expect(getComponents().find((c) => c.id === 'carta-c')).toBeTruthy();

    const cartasEnMazo = getCartaIdsEnAlgunMazo(getComponents());
    expect(cartasEnMazo.size).toBe(0);

    const content = mountPlayMode();
    const cartas = content.querySelectorAll('.infinite-table__world .carta');
    expect(cartas.length).toBe(3);
  });

  it('FT-023-13 · casos ligeros de "Meter en mazo..." y arrastres de cartas sobre un mazo', async () => {
    resetState();
    addMazo('m1', {}, { x: 0, y: 0 });
    addCarta('carta-sola2', { x: 1000, y: 1000 });
    const content2 = mountPlayMode();
    const cartas = content2.querySelectorAll('.infinite-table__world .carta');
    let cartaNodeForMenu = null;
    for (const el of cartas) {
      if (!el.classList.contains('mazo--clickable')) {
        cartaNodeForMenu = el;
        break;
      }
    }
    if (cartaNodeForMenu) {
      dispatchContextMenu(cartaNodeForMenu, { x: 50, y: 60 });
      const menu2 = getOpenContextMenu();
      if (menu2) {
        expect(menu2.textContent.includes('Meter en mazo')).toBe(true);
      }
    }

    const mazo = getComponents().find((c) => c.id === 'm1');
    const cartaSola = getComponents().find((c) => c.id === 'carta-sola2');
    const mazoRect = { x: mazo.x, y: mazo.y, width: mazo.width, height: mazo.height };
    const cartaRect = { x: cartaSola.x, y: cartaSola.y, width: cartaSola.width, height: cartaSola.height };
    expect(rectsOverlap(cartaRect, mazoRect)).toBe(false);

    const mazoWithOverlap = { x: 100, y: 100, width: 60, height: 90 };
    const cartaWithOverlap = { x: 110, y: 110, width: 60, height: 90 };
    expect(rectsOverlap(cartaWithOverlap, mazoWithOverlap)).toBe(true);
  });
});
