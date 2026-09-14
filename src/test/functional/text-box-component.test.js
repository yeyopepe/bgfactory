// Funcionalidad 017 — Componente "cuadro de texto".
// Nivel state + ui, mismo patrón que dado.test.js/tablero-simple.test.js.
//
// `createDefaultComponent('texto')` no aplica ningún valor especial (a
// diferencia de 'dado'/'tableroSimple'/'carta'…): `properties` nace vacío y
// `width`/`height` null — los valores por defecto documentados (tamaño de
// fuente 16, color de texto negro, fondo transparente) son fallbacks que
// aplica la modal de edición al pintar el campo, no el modelo creado.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getComponents, addComponent } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { createDefaultComponent, openComponentModal } from '../../ui/componentModal.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 17 });

describe('017 — Cuadro de texto', () => {
  beforeEach(resetState);
  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
  });

  it('FT-017-01 · un cuadro de texto recién creado no fija tamaño ni propiedades: se calculan al configurarlo', () => {
    const bare = createComponent({ type: 'texto' });
    expect(Object.keys(bare.properties)).toHaveLength(0);
    expect(bare.width).toBeNull();
    expect(bare.height).toBeNull();

    const c = createDefaultComponent('texto');
    expect(c.type).toBe('texto');
    expect(c.properties.contenido).toBeFalsy();
  });

  it('FT-017-02 · la modal de edición aplica los valores por defecto: tamaño de fuente 16, texto negro, fondo transparente', () => {
    const c = createDefaultComponent('texto');
    c.id = 'texto-defaults';
    addComponent(c);
    mountEditMode();

    const target = getComponents().find((comp) => comp.id === 'texto-defaults');
    openComponentModal({ component: target, onAccept() {} });

    const modal = document.querySelector('.modal-overlay .modal');
    const fontSizeInput = [...modal.querySelectorAll('input')].find((el) => el.type === 'number' && el.value === '16');
    expect(fontSizeInput).toBeTruthy();

    const textColorInput = modal.querySelector('input[type=color]');
    expect(textColorInput.value.toLowerCase()).toBe('#000000');
  });

  it('FT-017-03 · el contenido, tamaño de fuente y colores son editables y se guardan en properties', () => {
    const c = createDefaultComponent('texto');
    c.id = 'texto-edit';
    addComponent(c);
    mountEditMode();

    const target = getComponents().find((comp) => comp.id === 'texto-edit');
    openComponentModal({ component: target, onAccept: (updated) => { target.properties = updated.properties; } });

    const modal = document.querySelector('.modal-overlay .modal');
    const specificTab = [...modal.querySelectorAll('.modal__tab')].find((tab) => tab.textContent === t('componentModal.tab.specific'));
    specificTab.click();

    // Ojo: la pestaña "Generales" también tiene un <textarea> (tooltip), presente
    // en el DOM aunque su pestaña no esté activa (solo se alterna `display`) —
    // localizarlo por su `rows` (el de contenido se crea con rows=3, el de
    // tooltip no fija ese atributo) en vez de por orden en el documento.
    const contentInput = [...modal.querySelectorAll('textarea')].find((ta) => ta.rows === 3);
    contentInput.value = 'Hola mundo';
    contentInput.dispatchEvent(new Event('input', { bubbles: true }));

    const fontSizeInput = [...modal.querySelectorAll('input')].find((el) => el.type === 'number' && el.min === '8' && el.max === '72');
    fontSizeInput.value = '24';
    fontSizeInput.dispatchEvent(new Event('input', { bubbles: true }));

    modal.querySelector('.btn-accept').click();

    expect(target.properties.contenido).toBe('Hola mundo');
    expect(target.properties.tamañoFuente).toBe(24);
  });
});
