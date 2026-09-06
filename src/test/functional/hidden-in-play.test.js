// Funcionalidad 016 — Componente oculto en modo juego.
// Nivel interfaz: comprueba que un componente `oculto` no se pinta en la mesa
// en modo juego, y sí en modo edición (con su distintivo).

import { describe, it, expect, beforeEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { addComponent } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';

registerFeature({ primary: 16 });

// type interno → selector del nodo raíz que pinta ui/componentRenderer.js.
const SELECTOR_POR_TIPO = {
  carta: '.carta',
  dado: '.dice',
  tableroSimple: '.board',
};

describe('016 — Componente oculto en modo juego', () => {
  beforeEach(resetState);

  it('FT-016-01 · un componente oculto no se pinta en juego y sí en edición', () => {
    const c = createDefaultComponent('carta');
    c.oculto = true;
    addComponent(c);

    // Modo juego: no se dibuja.
    const playContent = mountPlayMode();
    expect(playContent.querySelectorAll('.carta').length).toBe(0);

    // Modo edición: se dibuja, con la insignia de "oculto".
    const editContent = mountEditMode();
    const cartas = editContent.querySelectorAll('.carta');
    expect(cartas.length).toBe(1);
    expect(cartas[0].querySelectorAll('.component-hidden-badge').length).toBe(1);
  });

  it('FT-016-02 · "oculto" es false por defecto y un componente sin el campo se pinta en juego', () => {
    const c = createDefaultComponent('carta');
    expect(c.oculto).toBe(false);

    delete c.oculto; // guardado antiguo sin el campo
    addComponent(c);
    const playContent = mountPlayMode();
    expect(playContent.querySelectorAll('.carta').length).toBe(1);
  });

  it('FT-016-04 · en modo edición un componente oculto se sigue pudiendo seleccionar y mover', () => {
    const c = createDefaultComponent('carta');
    c.oculto = true;
    addComponent(c);

    const editContent = mountEditMode();
    const carta = editContent.querySelector('.carta');
    expect(carta).toBeTruthy();
    expect(carta.classList.contains('carta--selectable')).toBe(true);
    expect(carta.classList.contains('carta--movable')).toBe(true);
  });

  it('FT-016-05 · la insignia de oculto y la de bloqueado conviven en modo edición', () => {
    const c = createDefaultComponent('carta');
    c.oculto = true;
    c.bloqueado = 'juego';
    addComponent(c);

    const editContent = mountEditMode();
    const carta = editContent.querySelector('.carta');
    expect(carta.querySelectorAll('.component-hidden-badge').length).toBe(1);
    expect(carta.querySelectorAll('.component-lock-badge').length).toBe(1);
  });

  it('FT-016-06 · oculto se respeta para varios tipos, no solo carta', () => {
    for (const [tipo, selector] of Object.entries(SELECTOR_POR_TIPO)) {
      resetState();
      const c = createDefaultComponent(tipo);
      c.oculto = true;
      addComponent(c);

      expect(mountPlayMode().querySelectorAll(selector).length).toBe(0);

      const editContent = mountEditMode();
      expect(editContent.querySelectorAll(selector).length).toBe(1);
      expect(editContent.querySelector(selector).querySelectorAll('.component-hidden-badge').length).toBe(1);
    }
  });
});
