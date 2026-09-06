// Funcionalidad 022 — Componente "carta".
// FT-022-01/02/05/06/08 nivel estado; FT-022-03/04/07 nivel interfaz.

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountPlayMode } from '../helpers.js';
import { getComponents, addComponent, replaceComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createDefaultComponent, DEFAULT_CARTA_PROPERTIES } from '../../ui/componentModal.js';
import { getProporcionRatio, isRectShape, CARD_PROPORTIONS } from '../../core/cardProportions.js';

registerFeature({ primary: 22 });

const DEFAULT_CARTA_WIDTH = 180; // ui/componentModal.js (constante privada)

describe('022 — Componente "carta"', () => {
  beforeEach(resetState);

  it('FT-022-01 · una carta nueva nace mostrando la cara trasera', () => {
    const c = createDefaultComponent('carta');
    expect(c.properties.caraActual).toBe('trasera');
    expect(DEFAULT_CARTA_PROPERTIES.caraActual).toBe('trasera');
  });

  it('FT-022-02 · proporción por defecto 5:7, tamaño coherente con esa proporción', () => {
    const c = createDefaultComponent('carta');
    expect(c.properties.proporcion).toBe('5:7');
    expect(c.width).toBe(DEFAULT_CARTA_WIDTH);
    expect(c.height).toBe(DEFAULT_CARTA_WIDTH / getProporcionRatio('5:7'));
  });

  it('FT-022-03 · en modo juego, un click voltea la carta trasera↔frontal (interfaz)', () => {
    const c = createDefaultComponent('carta');
    addComponent(c);
    const content = mountPlayMode();
    const carta = content.querySelector('.carta.carta--clickable');
    expect(carta).toBeTruthy();

    carta.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(getComponents()[0].properties.caraActual).toBe('frontal');

    // Segundo click: vuelve a la trasera (remontamos porque el render se recrea).
    const content2 = mountPlayMode();
    content2.querySelector('.carta.carta--clickable').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(getComponents()[0].properties.caraActual).toBe('trasera');
  });

  it('FT-022-04 · el volteo funciona con la carta bloqueada (interfaz)', () => {
    const c = createDefaultComponent('carta');
    c.bloqueado = 'juego';
    addComponent(c);
    const content = mountPlayMode();
    const carta = content.querySelector('.carta.carta--clickable');
    expect(carta).toBeTruthy(); // sigue siendo clicable pese a estar bloqueada
    carta.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(getComponents()[0].properties.caraActual).toBe('frontal');
  });

  it('FT-022-05 · la proporción "circular" deja la carta con ancho = alto', () => {
    // Al elegir "circular" en la modal, ui/componentModal.js recalcula
    // height = width / getProporcionRatio('circular'); ratio 1 ⇒ width == height.
    expect(getProporcionRatio('circular')).toBe(1);
    const width = DEFAULT_CARTA_WIDTH;
    const height = width / getProporcionRatio('circular');
    expect(height).toBe(width);
    expect(CARD_PROPORTIONS.find((p) => p.value === 'circular').shape).toBe('circular');
  });

  it('FT-022-06 · hexagonales y triangulares tienen ratio fijo; rect vs no-rect', () => {
    expect(getProporcionRatio('hex-vertical')).toBe(Math.sqrt(3) / 2);
    expect(getProporcionRatio('triangulo')).toBe(1);
    expect(CARD_PROPORTIONS.find((p) => p.value === 'hex-vertical').shape).toBe('hex-vertical');
    expect(CARD_PROPORTIONS.find((p) => p.value === 'triangulo').shape).toBe('triangulo');
    expect(isRectShape('5:7')).toBe(true);
    expect(isRectShape('circular')).toBe(false);
    expect(isRectShape('hex-vertical')).toBe(false);
    expect(isRectShape('triangulo')).toBe(false);
  });

  it('FT-022-07 · una cara sin diseño se pinta sin aviso (interfaz)', () => {
    addComponent(createDefaultComponent('carta'));
    const content = mountPlayMode();
    const carta = content.querySelector('.carta');
    expect(carta).toBeTruthy();
    // No hay overlay de error/aviso dentro de la carta en blanco.
    expect(carta.querySelectorAll('.document-viewer__error').length).toBe(0);
    expect(carta.textContent.trim()).toBe('');
  });

  it('FT-022-08 · el diseño de cada carta es propio, no compartido', () => {
    const a = createDefaultComponent('carta');
    a.id = 'carta-a';
    const b = createDefaultComponent('carta');
    b.id = 'carta-b';
    addComponent(a);
    addComponent(b);

    const ca = getComponents().find((c) => c.id === 'carta-a');
    replaceComponent('carta-a', updateComponent(ca, {
      properties: { caraFrontal: { ...ca.properties.caraFrontal, bordeGrosor: 5 } },
    }));

    expect(getComponents().find((c) => c.id === 'carta-a').properties.caraFrontal.bordeGrosor).toBe(5);
    expect(getComponents().find((c) => c.id === 'carta-b').properties.caraFrontal.bordeGrosor).toBe(0);
  });
});
