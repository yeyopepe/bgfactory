// Funcionalidad 019 — Componente "tablero personalizado".
//
// Valida los valores por defecto del modelo, el dibujo del borde (biselado/
// plano), la sombra, el redimensionado sin reescalar el contenido, la imagen
// de fondo del diseño, el comportamiento en modo juego y la sección "Visual"
// de la ventana de configuración (sin selector de proporción ni checkbox de
// esquinas redondeadas).
//
// [gotcha] aislamiento: `src/modes/edit/editMode.js` mantiene
// `selectedComponentIds` como estado de módulo que `resetState()` NO limpia.
// Los casos que ejercitan selección en modo edición usan ids de componente
// distintos por caso.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { getComponents, addComponent, loadResources } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { createDefaultComponent, openComponentModal } from '../../ui/componentModal.js';

registerFeature({ primary: 19 });

describe('019 — Tablero personalizado', () => {
  beforeEach(resetState);
  afterEach(() => document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()));

  function addTablero(id, propsExtra = {}, caraExtra = {}, compExtra = {}) {
    const c = createDefaultComponent('tableroPersonalizado');
    c.id = id;
    Object.assign(c.properties, propsExtra);
    Object.assign(c.properties.cara, caraExtra);
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  const tableroEl = (root) => root.querySelector('.tablero-personalizado');

  it('FT-019-01 · valores por defecto de un tablero personalizado recién creado', () => {
    const c = createDefaultComponent('tableroPersonalizado');
    expect(c.width).toBe(300);
    expect(c.height).toBe(200);
    expect(c.properties.biselado).toBe(true);
    expect(c.properties.sombra).toBe(true);
    expect(c.properties.cara.imagenResourceId).toBeNull();
    expect(c.properties.cara.formas).toHaveLength(0);
    expect(c.properties.cara.textBoxes).toHaveLength(0);
    expect(c.properties.cara.bordeGrosor).toBe(2);
    expect(c.properties.cara.bordeColor).toBe('#000000');
    expect(c.properties.cara.transparenciaImagen).toBe(0);
    expect(c.properties.cara.ajusteImagen).toEqual({ zoom: 100, posX: 50, posY: 50, rotation: 0 });

    const bare = createComponent({ type: 'tableroPersonalizado' });
    expect(Object.keys(bare.properties)).toHaveLength(0);
    expect(bare.width).toBeNull();
    expect(bare.height).toBeNull();
  });

  it('FT-019-02 · dibujo del borde biselado', () => {
    addTablero('tp-bisel', { biselado: true }, { bordeColor: '#808080', bordeGrosor: 6 });
    const el = tableroEl(mountPlayMode());
    expect(el.style.borderStyle).toBe('solid');
    expect(el.style.borderWidth).toBe('6px');
    expect(el.style.borderTopColor).toBeTruthy();
    expect(el.style.borderBottomColor).toBeTruthy();
    expect(el.style.borderTopColor === el.style.borderBottomColor).toBe(false);
    expect(el.style.borderLeftColor === el.style.borderTopColor).toBe(true);
    expect(el.style.borderRightColor === el.style.borderBottomColor).toBe(true);
  });

  it('FT-019-03 · dibujo del borde plano', () => {
    addTablero('tp-plano', { biselado: false }, { bordeColor: '#808080', bordeGrosor: 4 });
    const el = tableroEl(mountPlayMode());
    expect(el.style.borderStyle).toBe('solid');
    expect(el.style.borderWidth).toBe('4px');
    expect(el.style.borderTopColor === el.style.borderBottomColor).toBe(true);
    expect(el.style.borderLeftColor === el.style.borderRightColor).toBe(true);
  });

  it('FT-019-04 · dibujo de la sombra: con y sin', () => {
    addTablero('tp-consombra', { sombra: true });
    let content = mountPlayMode();
    expect(tableroEl(content).classList.contains('tablero-personalizado--sin-sombra')).toBe(false);

    resetState();
    addTablero('tp-sinsombra', { sombra: false });
    content = mountPlayMode();
    expect(tableroEl(content).classList.contains('tablero-personalizado--sin-sombra')).toBe(true);
  });

  it('FT-019-05 · redimensionar no reescala el contenido', () => {
    const c = addTablero(
      'tp-resize',
      {},
      {
        formas: [
          { tipo: 'rectangular', x: 20, y: 20, width: 80, height: 60, bordeColor: '#000000', bordeGrosor: 2 },
        ],
        textBoxes: [
          { x: 10, y: 120, width: 100, height: 30, texto: 'X', contenido: 'X' },
        ],
      },
      { width: 400, height: 300 },
    );

    let root = mountPlayMode();
    let tablero = tableroEl(root);
    let tableroContent = [...tablero.children].find(
      (el) => el.tagName === 'DIV' && el.style.position === 'absolute' && el.style.inset === '0px',
    );
    expect(tableroContent.children.length).toBe(2);
    const first = tableroContent.children[0];
    const before = {
      left: first.style.left,
      top: first.style.top,
      width: first.style.width,
      height: first.style.height,
    };

    c.width = 120;
    c.height = 90;
    root = mountPlayMode();
    tablero = tableroEl(root);
    tableroContent = [...tablero.children].find(
      (el) => el.tagName === 'DIV' && el.style.position === 'absolute' && el.style.inset === '0px',
    );
    expect(tableroContent.children.length).toBe(2);
    const after = tableroContent.children[0];
    expect(after.style.left).toBe(before.left);
    expect(after.style.top).toBe(before.top);
    expect(after.style.width).toBe(before.width);
    expect(after.style.height).toBe(before.height);
  });

  it('FT-019-06 · imagen de fondo del diseño', () => {
    loadResources([{ id: 'img-tp', type: 'imagen', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }]);
    addTablero('tp-img-ok', {}, { imagenResourceId: 'img-tp' });
    let root = mountPlayMode();
    let tablero = tableroEl(root);
    let tableroContent = [...tablero.children].find(
      (el) => el.tagName === 'DIV' && el.style.position === 'absolute' && el.style.inset === '0px',
    );
    expect(tableroContent.querySelectorAll('img').length).toBe(1);
    expect(tableroContent.querySelector('img').src).toContain('data:image/png');

    resetState();
    addTablero('tp-img-ko', {}, { imagenResourceId: 'no-existe' });
    root = mountPlayMode();
    tablero = tableroEl(root);
    tableroContent = [...tablero.children].find(
      (el) => el.tagName === 'DIV' && el.style.position === 'absolute' && el.style.inset === '0px',
    );
    expect(tableroContent.querySelectorAll('img').length).toBe(0);
  });

  it('FT-019-07 · comportamiento en modo juego', () => {
    addTablero('tp-juego');
    const content = mountPlayMode();
    const el = tableroEl(content);
    expect(el).toBeTruthy();
    expect(el.classList.contains('tablero-personalizado--selectable')).toBe(false);

    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(document.querySelector('.modal-overlay')).toBeNull();
    expect(content.querySelector('.tablero-personalizado--selected')).toBeNull();

    resetState();
    addTablero('tp-edit');
    expect(tableroEl(mountEditMode()).classList.contains('tablero-personalizado--selectable')).toBe(true);
  });

  it('FT-019-08 · ventana de configuración — sección "Visual"', () => {
    addTablero('tp-modal', { biselado: false, sombra: true });
    mountEditMode();
    const target = getComponents().find((c) => c.id === 'tp-modal');
    openComponentModal({ component: target, onAccept() {} });

    const overlay = document.querySelector('.modal-overlay');
    const modal = overlay.querySelector('.modal');

    const biselado = modal.querySelector('#tablero-personalizado-biselado');
    const sombra = modal.querySelector('#tablero-personalizado-sombra');
    expect(biselado).toBeTruthy();
    expect(sombra).toBeTruthy();
    expect(biselado.type).toBe('checkbox');
    expect(sombra.type).toBe('checkbox');

    expect(biselado.checked).toBe(false);
    expect(sombra.checked).toBe(true);

    biselado.checked = true;
    biselado.dispatchEvent(new Event('change', { bubbles: true }));
    expect(target.properties.biselado).toBe(true);

    sombra.checked = false;
    sombra.dispatchEvent(new Event('change', { bubbles: true }));
    expect(target.properties.sombra).toBe(false);

    // Ausencia de proporción y esquinas redondeadas: en la pestaña "Específicas"
    // ('carta' es quien añade el <select> de proporción vía
    // renderCartaSpecificFields; aquí solo hay el botón de "Editar diseño"),
    // no debe aparecer ningún <select> ni checkbox adicional al margen de los
    // ya comprobados de la sección "Visual".
    const specificTabButton = [...modal.querySelectorAll('.modal__tab')].find(
      (btn) => btn.textContent === 'Específicas',
    );
    specificTabButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const specificContent = [...modal.querySelectorAll('div')].find(
      (div) => div.style.display === 'block' && div.querySelector('button.btn-cancel'),
    );
    expect(specificContent.querySelector('select')).toBeNull();
    expect(specificContent.querySelectorAll('input[type=checkbox]').length).toBe(0);
  });
});
