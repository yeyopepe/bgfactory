// Funcionalidad 035 — Título de componente (incluye su ventana de edición).
// Nivel state + ui:
//   - defaults del modelo (core/component.js)
//   - render de la etiqueta .component-title-label en modo juego (nunca en edición)
//   - override de grupo de `mostrarTitulo` (getEffectiveGeneralProps)
//   - ventana openComponentTitleModal: sincronización slider/campo, clamp 0–100,
//     Cancelar no invoca onAccept

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode } from '../helpers.js';
import { addComponent, loadGroups } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { createGroup } from '../../core/group.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { openComponentTitleModal } from '../../ui/componentTitleModal.js';

registerFeature({ primary: 35 });

function addCarta(id, extra = {}) {
  const c = createDefaultComponent('carta');
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);
  return c;
}

const titleModal = () => document.body.querySelector('.modal-overlay .modal');

describe('035 — Título de componente', () => {
  beforeEach(resetState);
  afterEach(() => document.querySelectorAll('.modal-overlay').forEach((o) => o.remove()));

  it('FT-035-01 · defaults del modelo de título', () => {
    const c = createComponent({ type: 'carta' });
    expect(c.mostrarTitulo).toBe(false);
    expect(c.tituloTexto).toBe('');
    expect(c.tituloColorTexto).toBe('#000000');
    expect(c.tituloColorFondo).toBe('#ffffff');
    expect(c.tituloFondoTransparencia).toBe(0);
  });

  it('FT-035-02 · en modo juego se pinta la etiqueta sólo si mostrarTitulo y hay texto', () => {
    addCarta('t-con', { mostrarTitulo: true, tituloTexto: 'Mi carta' });
    let play = mountPlayMode();
    const label = play.querySelector('.carta .component-title-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Mi carta');

    resetState();
    addCarta('t-sin-texto', { mostrarTitulo: true, tituloTexto: '' });
    play = mountPlayMode();
    expect(play.querySelector('.carta .component-title-label')).toBeNull();

    resetState();
    addCarta('t-desactivado', { mostrarTitulo: false, tituloTexto: 'X' });
    play = mountPlayMode();
    expect(play.querySelector('.carta .component-title-label')).toBeNull();
  });

  it('FT-035-03 · la etiqueta de título nunca se pinta en modo edición', () => {
    addCarta('t-edit', { mostrarTitulo: true, tituloTexto: 'Visible sólo en juego' });
    const edit = mountEditMode();
    expect(edit.querySelector('.carta .component-title-label')).toBeNull();
  });

  it('FT-035-04 · mostrarTitulo es override de grupo', () => {
    // Grupo con mostrarTitulo:true; cartas con mostrarTitulo:false pero con texto.
    loadGroups([createGroup({ id: 'g1', mostrarTitulo: true })]);
    addCarta('g-a', { groupId: 'g1', mostrarTitulo: false, tituloTexto: 'A' });
    addCarta('g-b', { groupId: 'g1', mostrarTitulo: false, tituloTexto: 'B' });

    let play = mountPlayMode();
    expect(play.querySelectorAll('.carta .component-title-label').length).toBe(2);

    // Grupo con mostrarTitulo:false → ninguna etiqueta, pese al texto de cada carta.
    loadGroups([createGroup({ id: 'g1', mostrarTitulo: false })]);
    play = mountPlayMode();
    expect(play.querySelectorAll('.carta .component-title-label').length).toBe(0);
  });

  it('FT-035-05 · el editor de título sincroniza slider y campo, acota 0–100 y descarta NaN', () => {
    let accepted = null;
    openComponentTitleModal({
      titulo: { texto: 'x', colorTexto: '#000000', colorFondo: '#ffffff', fondoTransparencia: 20 },
      onAccept: (result) => { accepted = result; },
    });

    const modal = titleModal();
    const range = modal.querySelector('input[type=range]');
    const text = modal.querySelector('.modal__opacity-value input[type=text]');

    // Mover el slider → el campo numérico se sincroniza.
    range.value = '70';
    range.dispatchEvent(new Event('input', { bubbles: true }));
    expect(text.value).toBe('70');

    // Escribir un valor por encima de 100 → se acota a 100 (campo y slider).
    text.value = '150';
    text.dispatchEvent(new Event('change', { bubbles: true }));
    expect(text.value).toBe('100');
    expect(range.value).toBe('100');

    // Escribir algo no numérico → se descarta, vuelve al último válido (100).
    text.value = 'abc';
    text.dispatchEvent(new Event('change', { bubbles: true }));
    expect(text.value).toBe('100');

    modal.querySelector('.btn-accept').click();
    expect(accepted).toBeTruthy();
    expect(accepted.fondoTransparencia).toBe(100);
    expect(accepted.texto).toBe('x');
  });

  it('FT-035-06 · cancelar el editor de título no invoca onAccept', () => {
    let called = 0;
    openComponentTitleModal({
      titulo: { texto: 'x', colorTexto: '#000000', colorFondo: '#ffffff', fondoTransparencia: 0 },
      onAccept: () => { called += 1; },
    });

    titleModal().querySelector('.btn-cancel').click();

    expect(called).toBe(0);
    expect(document.body.querySelector('.modal-overlay')).toBeNull();
  });
});
