// Funcionalidad 001 — Mesa infinita con navegación pan/zoom (incluye "Ajustar zoom").
// Nivel interfaz: monta la mesa real (ui/table.js) sobre un contenedor con tamaño
// y comprueba el efecto de pan/zoom sobre worldEl.style.transform, los topes de
// zoom, y el reencuadre fitToBounds. El botón "Ajustar zoom" se comprueba montado
// en #mode-switcher en ambos modos (lo pinta renderModeSwitcher vía mountChrome()).
//
// Aislamiento: cameraX/cameraY/zoom son estado de módulo de ui/table.js que
// resetState() NO limpia. beforeEach y afterEach llaman fitToBounds(null) para
// dejar la cámara en la vista neutra (translate(0px, 0px) scale(1)).

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { createInfiniteTable, fitToBounds } from '../../ui/table.js';
import { getComponentsBounds } from '../../ui/componentRenderer.js';
import { getComponents, addComponent } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';

registerFeature({ primary: 1 });

const TRANSFORM_RE = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+)\)/;

function parseTransform(el) {
  const m = TRANSFORM_RE.exec(el.style.transform || '');
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]), zoom: parseFloat(m[3]) };
}

// Monta la mesa real sobre un contenedor dimensionado y adjuntado a document.body
// (necesario para que getBoundingClientRect() mida en fitToBounds y en el zoom).
// El CSS de la app no se carga en el runner, así que las dimensiones se fijan
// inline tanto en el host como en el propio viewport de la mesa.
function mountSizedTable() {
  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = '800px';
  host.style.height = '600px';
  document.body.appendChild(host);
  const { el, worldEl } = createInfiniteTable(host);
  el.style.position = 'absolute';
  el.style.width = '800px';
  el.style.height = '600px';
  el.style.overflow = 'hidden';
  return { host, viewport: el, worldEl };
}

describe('001 — Mesa infinita con navegación pan/zoom', () => {
  let mounted = [];

  beforeEach(() => {
    resetState();
    fitToBounds(null);
  });

  afterEach(() => {
    for (const host of mounted) host.remove();
    mounted = [];
    fitToBounds(null);
  });

  function sizedTable() {
    const t = mountSizedTable();
    mounted.push(t.host);
    return t;
  }

  it('FT-001-01 · arrastrar la mesa desplaza worldEl', () => {
    const { viewport, worldEl } = sizedTable();
    const before = parseTransform(worldEl);
    expect(before).toEqual({ x: 0, y: 0, zoom: 1 });

    viewport.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 160, clientY: 130, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const after = parseTransform(worldEl);
    expect(after.x).toBe(60);
    expect(after.y).toBe(30);
    expect(after.zoom).toBe(1);
  });

  it('FT-001-02 · la rueda hace zoom y respeta el tope máximo (2.5)', () => {
    const { viewport, worldEl } = sizedTable();
    for (let i = 0; i < 40; i += 1) {
      viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: 400, clientY: 300, bubbles: true, cancelable: true }));
    }
    const after = parseTransform(worldEl);
    expect(after.zoom).toBe(2.5);
  });

  it('FT-001-03 · la rueda respeta el tope mínimo (0.5)', () => {
    const { viewport, worldEl } = sizedTable();
    for (let i = 0; i < 40; i += 1) {
      viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, clientX: 400, clientY: 300, bubbles: true, cancelable: true }));
    }
    const after = parseTransform(worldEl);
    expect(after.zoom).toBe(0.5);
  });

  it('FT-001-04 · fitToBounds(null) deja la vista neutra', () => {
    const { viewport, worldEl } = sizedTable();
    viewport.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: 100, clientY: 100, bubbles: true, cancelable: true }));

    fitToBounds(null);

    expect(parseTransform(worldEl)).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('FT-001-05 · fitToBounds(bounds) reencuadra acotando al rango de zoom', () => {
    const { worldEl } = sizedTable();

    // Caja diminuta: el zoom "ideal" sería enorme, pero se acota al máximo 2.5.
    fitToBounds({ minX: 0, minY: 0, maxX: 20, maxY: 20 });
    expect(parseTransform(worldEl).zoom).toBe(2.5);

    // Caja gigantesca: el zoom "ideal" sería minúsculo, pero se acota al mínimo 0.5.
    fitToBounds({ minX: 0, minY: 0, maxX: 100000, maxY: 100000 });
    expect(parseTransform(worldEl).zoom).toBe(0.5);
  });

  it('FT-001-06 · el botón "Ajustar zoom" está en #mode-switcher en ambos modos', () => {
    mountPlayMode();
    expect(document.getElementById('mode-switcher').querySelector('.mode-switcher__fit-btn')).toBeTruthy();

    mountEditMode();
    expect(document.getElementById('mode-switcher').querySelector('.mode-switcher__fit-btn')).toBeTruthy();
  });

  it('FT-001-07 · pulsar "Ajustar zoom" sin componentes deja la vista neutra', () => {
    // El modo monta su PROPIA mesa (createInfiniteTable dentro de #content), que
    // pasa a ser la activeViewport sobre la que actúa fitToBounds y el botón.
    const content = mountPlayMode();
    const worldEl = content.querySelector('.infinite-table__world');
    expect(worldEl).toBeTruthy();

    // Dejar esa cámara en un estado NO neutro con un arrastre sobre su viewport.
    const viewport = content.querySelector('.infinite-table');
    viewport.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(parseTransform(worldEl)).toEqual({ x: 150, y: 150, zoom: 1 });

    expect(getComponentsBounds(getComponents())).toBeNull();
    document.getElementById('mode-switcher').querySelector('.mode-switcher__fit-btn').click();

    // Sin componentes, getComponentsBounds es null → fitToBounds(null) → vista neutra.
    expect(parseTransform(worldEl)).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('FT-001-08 · pulsar "Ajustar zoom" con componentes reencuadra dentro del rango', () => {
    addComponent(createDefaultComponent('carta'));
    const content = mountEditMode();
    const worldEl = content.querySelector('.infinite-table__world');
    expect(worldEl).toBeTruthy();

    // Estado de partida: vista neutra sobre la mesa del modo.
    const viewport = content.querySelector('.infinite-table');
    viewport.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: 40, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const before = parseTransform(worldEl);
    expect(before).toEqual({ x: 40, y: 40, zoom: 1 });

    const bounds = getComponentsBounds(getComponents());
    expect(bounds).toBeTruthy();
    document.getElementById('mode-switcher').querySelector('.mode-switcher__fit-btn').click();

    const after = parseTransform(worldEl);
    expect(after).toBeTruthy();
    // El reencuadre ha movido la cámara respecto al estado previo.
    const moved = after.x !== before.x || after.y !== before.y || after.zoom !== before.zoom;
    expect(moved).toBe(true);
    // Y el zoom resultante queda dentro de los topes [0.5, 2.5].
    expect(after.zoom >= 0.5 && after.zoom <= 2.5).toBe(true);
  });
});
