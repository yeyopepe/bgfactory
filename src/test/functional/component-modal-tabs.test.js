// Funcionalidad 002 — Alta/edición/borrado de componentes con la ventana de pestañas.
// Amplía component-crud.test.js (que cubre la parte de estado, FT-002-01..12) con
// los casos de la propia ventana modal (openComponentModal): pestañas, botón
// "Eliminar", validación de id sobre el botón "Aceptar" y confirmación de borrado.
// Numeración continúa desde FT-002-13.
//
// openComponentModal añade .modal-overlay a document.body (no a #content).

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState } from '../helpers.js';
import { getComponents, addComponent } from '../../core/state.js';
import { openComponentModal, createDefaultComponent } from '../../ui/componentModal.js';

registerFeature({ primary: 2 });

const modal = () => document.body.querySelector('.modal-overlay .modal.component-editor-modal');
const tabs = () => [...modal().querySelectorAll('.modal__tab')];
const panels = () => [...modal().querySelector('.modal__content').children];

function closeAnyModal() {
  document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
}

// Réplica de la lógica privada validateId de ui/componentModal.js (misma técnica
// que isIdValid en component-crud.test.js): id no vacío tras trim y no duplicado
// de OTRO componente. `editingId` = id del componente que se edita ('' al crear).
function isIdValid(rawId, editingId = '') {
  const newId = String(rawId).trim();
  if (!newId) return false;
  return !getComponents().some((c) => c.id === newId && c.id !== editingId);
}

describe('002 — Ventana de alta/edición de componentes', () => {
  beforeEach(resetState);
  afterEach(() => {
    closeAnyModal();
    resetState();
  });

  it('FT-002-13 · la modal abre siempre en la pestaña "Generales" y tiene 5 pestañas', () => {
    openComponentModal({ component: createDefaultComponent('carta'), onAccept() {}, onDelete() {} });

    expect(tabs()).toHaveLength(5);
    // La primera pestaña es la activa y su panel el visible.
    expect(tabs()[0].classList.contains('active')).toBe(true);
    expect(panels()[0].style.display).toBe('block');
    for (let i = 1; i < 5; i += 1) {
      expect(tabs()[i].classList.contains('active')).toBe(false);
      expect(panels()[i].style.display).toBe('none');
    }
  });

  it('FT-002-14 · pulsar cada pestaña muestra su panel y oculta los demás', () => {
    openComponentModal({ component: createDefaultComponent('carta'), onAccept() {}, onDelete() {} });

    for (let i = 1; i < 5; i += 1) {
      tabs()[i].click();
      expect(tabs()[i].classList.contains('active')).toBe(true);
      expect(panels()[i].style.display).toBe('block');
      for (let j = 0; j < 5; j += 1) {
        if (j === i) continue;
        expect(tabs()[j].classList.contains('active')).toBe(false);
        expect(panels()[j].style.display).toBe('none');
      }
    }
  });

  it('FT-002-15 · el botón "Eliminar" aparece al editar, no al crear', () => {
    openComponentModal({ component: createDefaultComponent('carta'), onAccept() {}, onDelete() {} });
    expect(modal().querySelector('.btn-eliminar')).toBeTruthy();
    closeAnyModal();

    openComponentModal({ component: null, onAccept() {}, onDelete() {} });
    expect(modal().querySelector('.btn-eliminar')).toBeNull();
  });

  it('FT-002-16 · "Aceptar" está deshabilitado mientras el id no es válido', () => {
    openComponentModal({ component: createDefaultComponent('carta'), onAccept() {}, onDelete() {} });
    const idInput = modal().querySelector('.modal__field input[type=text]');
    const acceptBtn = modal().querySelector('.btn-accept');

    expect(acceptBtn.disabled).toBe(false);

    idInput.value = '';
    idInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(acceptBtn.disabled).toBe(true);

    idInput.value = 'carta-valida';
    idInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(acceptBtn.disabled).toBe(false);
  });

  it('FT-002-17 · el borrado desde la modal pide confirmación', () => {
    const original = window.confirm;
    let calls = 0;
    window.confirm = () => { calls += 1; return false; };
    let deleted = 0;

    try {
      openComponentModal({
        component: createDefaultComponent('carta'),
        onAccept() {},
        onDelete() { deleted += 1; },
      });
      modal().querySelector('.btn-eliminar').click();

      expect(calls).toBe(1);
      expect(deleted).toBe(0); // confirm devolvió false: no se borra
      expect(modal()).toBeTruthy(); // la modal sigue abierta
    } finally {
      window.confirm = original;
    }
  });

  it('FT-002-18 · validación de id: vacío, sólo espacios y duplicado de otro', () => {
    const a = createDefaultComponent('carta');
    a.id = 'alpha';
    const b = createDefaultComponent('dado');
    b.id = 'beta';
    addComponent(a);
    addComponent(b);

    expect(isIdValid('')).toBe(false);
    expect(isIdValid('   ')).toBe(false);
    expect(isIdValid('beta', 'alpha')).toBe(false); // id de otro componente
    expect(isIdValid('beta', 'beta')).toBe(true); // conservar el propio id
    expect(isIdValid('gamma', 'alpha')).toBe(true); // id libre
  });
});
