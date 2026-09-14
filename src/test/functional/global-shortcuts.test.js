// Funcionalidad 028 — Atajos de teclado en modo edición.
// Nivel ui: ui/globalShortcuts.js#initGlobalShortcuts directamente sobre
// document, combinado con modales reales (ui/tagModal.js/ui/errorModal.js) para
// los casos de ESC/INTRO/SUPR.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { initGlobalShortcuts } from '../../ui/globalShortcuts.js';
import { showErrorModal } from '../../ui/errorModal.js';
import { openTagModal } from '../../ui/tagModal.js';
import { createTag } from '../../core/tag.js';
import { addTag } from '../../core/state.js';
import { resetState } from '../helpers.js';

registerFeature({ primary: 28 });

function pressKey(key, opts = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));
}

describe('028 — Atajos de teclado en modo edición', () => {
  let isEditMode;
  let deleteCalls;
  let moveCalls;

  beforeEach(() => {
    resetState();
    isEditMode = true;
    deleteCalls = 0;
    moveCalls = [];
    initGlobalShortcuts({
      isEditMode: () => isEditMode,
      onDeleteSelected: () => { deleteCalls += 1; },
      onMoveSelected: (dx, dy) => { moveCalls.push([dx, dy]); },
    });
  });

  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
  });

  // --- ESC ---

  it('FT-028-01 · ESC equivale a "Cancelar" de la modal superior; solo afecta a la última si hay varias', () => {
    const tag = createTag({ name: 'ParaModal' });
    addTag(tag);
    openTagModal({ tag, onAccept() {} }); // modal 1 (tiene btn-cancel)
    showErrorModal('Título', 'Mensaje'); // modal 2, la superior

    pressKey('Escape');

    expect(document.querySelectorAll('.modal-overlay')).toHaveLength(1);
    expect(document.querySelector('.modal-overlay .modal__header--error, .modal-overlay .modal')).toBeTruthy();
  });

  it('FT-028-02 · ESC sin ninguna modal abierta no hace nada', () => {
    pressKey('Escape');
    expect(document.querySelectorAll('.modal-overlay')).toHaveLength(0);
    expect(deleteCalls).toBe(0);
  });

  // --- INTRO ---

  it('FT-028-03 · INTRO dispara "Aceptar" si existe y no está deshabilitado', () => {
    const tag = createTag({ name: 'Existe' });
    addTag(tag);
    let accepted = null;
    openTagModal({ tag, onAccept: (updated) => { accepted = updated; } });

    const nameInput = document.querySelector('.modal-overlay input[type=text]');
    nameInput.value = 'Renombrada';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    pressKey('Enter');

    expect(accepted).toBeTruthy();
    expect(accepted.name).toBe('Renombrada');
  });

  it('FT-028-04 · INTRO no dispara nada si el botón "Aceptar" está deshabilitado', () => {
    let accepted = false;
    openTagModal({ onAccept: () => { accepted = true; } }); // sin nombre: btn-accept disabled

    pressKey('Enter');

    expect(accepted).toBe(false);
    expect(document.querySelectorAll('.modal-overlay')).toHaveLength(1);
  });

  it('FT-028-05 · INTRO con el foco en un textarea no dispara "Aceptar": deja pasar el salto de línea', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    let accepted = false;
    openTagModal({ onAccept: () => { accepted = true; } });

    pressKey('Enter');

    expect(accepted).toBe(false);
    textarea.remove();
  });

  // --- SUPR ---

  it('FT-028-06 · SUPR con una modal abierta dispara "Suprimir"/"Eliminar" de esa modal', () => {
    const tag = createTag({ name: 'ABorrar' });
    addTag(tag);
    let deletedViaModal = false;
    openTagModal({ tag, onAccept() {}, onDelete: () => { deletedViaModal = true; } });

    pressKey('Delete');

    expect(deletedViaModal).toBe(true);
    expect(deleteCalls).toBe(0); // no confundir con el borrado de selección de la mesa
  });

  it('FT-028-07 · SUPR sin ninguna modal abierta borra la selección de componente (misma confirmación de siempre)', () => {
    pressKey('Delete');
    expect(deleteCalls).toBe(1);
  });

  it('FT-028-08 · SUPR con foco en un campo de texto no interfiere con borrar caracteres', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();

    pressKey('Delete');

    expect(deleteCalls).toBe(0);
    input.remove();
  });

  // --- Flechas ---

  it('FT-028-09 · las flechas desplazan la selección 1px, o 10px con Mayúsculas', () => {
    pressKey('ArrowRight');
    expect(moveCalls).toEqual([[1, 0]]);

    pressKey('ArrowDown', { shiftKey: true });
    expect(moveCalls).toEqual([[1, 0], [0, 10]]);
  });

  it('FT-028-10 · las flechas no hacen nada con una modal abierta', () => {
    showErrorModal('Título', 'Mensaje');
    pressKey('ArrowUp');
    expect(moveCalls).toHaveLength(0);
  });

  it('FT-028-11 · las flechas no hacen nada con el foco en un campo de texto', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();

    pressKey('ArrowLeft');

    expect(moveCalls).toHaveLength(0);
    input.remove();
  });

  it('FT-028-12 · las flechas no hacen nada fuera de modo edición', () => {
    isEditMode = false;
    pressKey('ArrowUp');
    expect(moveCalls).toHaveLength(0);
  });
});
