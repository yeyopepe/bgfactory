// Funcionalidad 025 — Identificación de componentes al pasar el ratón.
//
// Valida: etiqueta identificativa en modo edición (siempre visible, sin
// depender de ningún checkbox); en modo juego, ausencia de etiqueta/tooltip
// por defecto, tooltip con el identificador cuando no hay texto propio,
// tooltip con formato básico saneado cuando sí lo hay; formato del
// identificador "Tipo: id" por tipo, incluida la excepción de
// `tableroPersonalizado` (sin etiqueta i18n propia); variables de texto
// `{cards_current}`; título de componente siempre visible (a diferencia del
// tooltip); valores por defecto del modelo; y el checkbox "Mostrar tooltip"
// del modal (caso ligero).
//
// [gotcha] aislamiento: `src/modes/edit/editMode.js` mantiene
// `selectedComponentIds` como estado de módulo que `resetState()` NO limpia —
// los casos usan ids de componente distintos por caso.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { getComponents, addComponent } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { getAvailableVariables, resolveTextVariables } from '../../core/textVariables.js';
import { createDefaultComponent, openComponentModal } from '../../ui/componentModal.js';
import { formatComponentIdentifier } from '../../ui/componentRenderer.js';

registerFeature({ primary: 25 });

describe('025 — Identificación al pasar el ratón', () => {
  beforeEach(resetState);
  afterEach(() => document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()));

  function addComp(type, id, compExtra, propsExtra) {
    const c = createDefaultComponent(type);
    c.id = id;
    if (propsExtra) Object.assign(c.properties, propsExtra);
    if (compExtra) Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  const ROOT_SELECTOR_BY_TYPE = {
    texto: '.text-box',
    tableroSimple: '.board',
    tableroPersonalizado: '.tablero-personalizado',
    dado: '.dice',
    documento: '.document-viewer',
    carta: '.carta',
    mazo: '.carta',
  };

  it('FT-025-01 · etiqueta identificativa en modo edición', () => {
    for (const type of Object.keys(ROOT_SELECTOR_BY_TYPE)) {
      resetState();
      addComp(type, `c-${type}`);
      const content = mountEditMode();
      const node = content.querySelector(ROOT_SELECTOR_BY_TYPE[type]);
      const label = node.querySelector('.component-id-label');
      expect(label).toBeTruthy();
      expect(label.textContent.endsWith(`: c-${type}`)).toBe(true);
    }

    // La etiqueta se pinta siempre en edición, sin depender de ningún checkbox.
    resetState();
    addComp('tableroSimple', 'c-defaults');
    const content = mountEditMode();
    expect(content.querySelector('.board .component-id-label')).toBeTruthy();
  });

  it('FT-025-02 · modo juego sin "Mostrar tooltip"', () => {
    addComp('tableroSimple', 'c1');
    let content = mountPlayMode();
    let node = content.querySelector('.board');
    expect(node.querySelector('.component-id-label')).toBeNull();
    expect(node.querySelector('.component-tooltip')).toBeNull();

    resetState();
    addComp('dado', 'c2');
    content = mountPlayMode();
    node = content.querySelector('.dice');
    expect(node.querySelector('.component-id-label')).toBeNull();
    expect(node.querySelector('.component-tooltip')).toBeNull();
  });

  it('FT-025-03 · modo juego con "Mostrar tooltip" y sin texto propio', () => {
    addComp('dado', 'd7', { mostrarTooltip: true });
    const content = mountPlayMode();
    const node = content.querySelector('.dice');
    expect(node.classList.contains('component-tooltip-host')).toBe(true);
    const tip = node.querySelector('.component-tooltip');
    expect(tip).toBeTruthy();
    expect(tip.textContent).toBe(formatComponentIdentifier({ type: 'dado', id: 'd7' }));
  });

  it('FT-025-04 · modo juego con "Mostrar tooltip" y texto propio', () => {
    addComp('tableroSimple', 'b3', {
      mostrarTooltip: true,
      tooltipTexto: 'Hola <b>fuerte</b> <script>alert(1)</script>',
    });
    const content = mountPlayMode();
    const tip = content.querySelector('.board .component-tooltip');
    expect(tip).toBeTruthy();
    expect(tip.innerHTML).toContain('<b>fuerte</b>');
    expect(tip.querySelector('script')).toBeNull();
    const bold = tip.querySelector('b');
    expect(bold).toBeTruthy();
    expect(bold.textContent).toBe('fuerte');
  });

  it('FT-025-05 · formato del identificador por tipo', () => {
    const expected = {
      texto: 'Texto: x1',
      tableroSimple: 'Tablero simple: x1',
      dado: 'Dado Configurable: x1',
      documento: 'Documento: x1',
      carta: 'Carta/Ficha: x1',
      mazo: 'Mazo: x1',
    };
    for (const [type, text] of Object.entries(expected)) {
      expect(formatComponentIdentifier({ type, id: 'x1' })).toBe(text);
    }

    // tableroPersonalizado no tiene clave en COMPONENT_IDENTIFIER_TYPE_KEY →
    // cae al nombre interno del tipo.
    expect(formatComponentIdentifier({ type: 'tableroPersonalizado', id: 'x1' })).toBe('tableroPersonalizado: x1');

    resetState();
    addComp('tableroPersonalizado', 'tp1');
    const content = mountEditMode();
    const label = content.querySelector('.tablero-personalizado .component-id-label');
    expect(label).toBeTruthy();
    expect(label.textContent.startsWith('tableroPersonalizado: ')).toBe(true);
  });

  it('FT-025-06 · variables de texto', () => {
    expect(getAvailableVariables({ type: 'mazo', properties: { cartaIds: ['a', 'b', 'c'] } })).toEqual({ cards_current: '3' });
    expect(getAvailableVariables({ type: 'mazo', properties: {} })).toEqual({ cards_current: '0' });
    expect(getAvailableVariables({ type: 'dado', properties: {} })).toEqual({});

    expect(resolveTextVariables('Quedan {cards_current} cartas', { type: 'mazo', properties: { cartaIds: ['a', 'b'] } })).toBe('Quedan 2 cartas');
    expect(resolveTextVariables('Valor {cards_current}', { type: 'carta', properties: {} })).toBe('Valor {cards_current}');
    expect(resolveTextVariables('Hola {desconocida}', { type: 'mazo', properties: { cartaIds: [] } })).toBe('Hola {desconocida}');
  });

  it('FT-025-07 · título de componente en modo juego', () => {
    addComp('dado', 'd1', { mostrarTitulo: true, tituloTexto: 'Dado de ataque' });
    let content = mountPlayMode();
    let node = content.querySelector('.dice');
    const title = node.querySelector('.component-title-label');
    expect(title).toBeTruthy();
    expect(title.textContent).toBe('Dado de ataque');
    expect(node.classList.contains('component-tooltip-host')).toBe(false);

    resetState();
    addComp('dado', 'd2', { mostrarTitulo: true, tituloTexto: '' });
    content = mountPlayMode();
    expect(content.querySelector('.dice .component-title-label')).toBeNull();

    resetState();
    addComp('mazo', 'm1', { mostrarTitulo: true, tituloTexto: '{cards_current} cartas' });
    content = mountPlayMode();
    node = content.querySelector('.carta');
    expect(node.querySelector('.component-title-label').textContent).toBe('0 cartas');
  });

  it('FT-025-08 · valores por defecto del modelo', () => {
    for (const type of ['texto', 'tableroSimple', 'tableroPersonalizado', 'dado', 'documento', 'carta']) {
      const c = createDefaultComponent(type);
      expect(c.mostrarTooltip ?? false).toBe(false);
      expect(c.tooltipTexto ?? '').toBe('');
    }

    const m = createDefaultComponent('mazo');
    expect(m.mostrarTooltip).toBe(true);
    expect(m.tooltipTexto).toBe('Pulsa para sacar la primera carta.');

    expect(createComponent({ type: 'dado' }).mostrarTooltip ?? false).toBe(false);
  });

  it('FT-025-09 · checkbox "Mostrar tooltip" en el modal (caso ligero)', () => {
    addComp('tableroSimple', 'b9');
    mountEditMode();
    const target = getComponents().find((c) => c.id === 'b9');
    openComponentModal({ component: target, onAccept() {} });
    const modal = document.querySelector('.modal-overlay .modal');

    const textarea = modal.querySelector('textarea');
    expect(textarea).toBeTruthy();
    // Sección "Ayuda jugador": dos checkboxes (título, tooltip); el de
    // tooltip es el último antes del <textarea> (único de esta pestaña).
    const checkboxes = [...textarea.closest('fieldset').querySelectorAll('input[type=checkbox]')];
    const checkbox = checkboxes[checkboxes.length - 1];
    expect(checkbox).toBeTruthy();

    expect(checkbox.checked).toBe(false);
    expect(textarea.disabled).toBe(true);

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    expect(textarea.disabled).toBe(false);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    expect(textarea.disabled).toBe(true);
  });
});
