// Funcionalidad 008 — Etiquetas, organización de elementos por nombre.
// Nivel state + ui.
//
// Aislamiento: `selectedComponentIds`/`primarySelectedIds` de
// modes/edit/editMode.js son estado de módulo que resetState() NO limpia —
// ids de componente distintos por caso (mismo criterio que dado.test.js /
// component-panel.test.js).

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import {
  getComponents, addComponent, replaceComponent, getTags, addTag, getGroups, addGroup, setPanelState,
} from '../../core/state.js';
import { createTag, isTagNameTaken, getComponentsUsingTag } from '../../core/tag.js';
import { createGroup } from '../../core/group.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 8 });

// --- Helpers locales de fixture ---

function addCarta(id, extra = {}) {
  const c = createDefaultComponent('carta');
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);
  return c;
}

function tagRowByName(name) {
  return [...document.querySelectorAll('.tag-list__row')].find((row) => row.firstChild.textContent === name);
}

function tagButtonByLabel(row, label) {
  return [...row.querySelectorAll('.tag-list__action-btn')].find((b) => b.textContent === label) ?? null;
}

function isRowSelected(id) {
  const row = document.querySelector(`.component-list__row[data-id="${id}"]`);
  return !!row && row.classList.contains('component-list__row--selected');
}

describe('008 — Etiquetas', () => {
  beforeEach(resetState);

  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
  });

  // --- Nivel state: modelo y unicidad de nombre ---

  it('FT-008-01 · createTag/updateTag y unicidad de nombre normalizada (recortada, sin mayúsculas/tildes)', () => {
    const tag = createTag({ name: 'Rareza' });
    expect(tag.name).toBe('Rareza');
    expect(typeof tag.id).toBe('string');

    expect(isTagNameTaken('rareza', [tag])).toBe(true);
    expect(isTagNameTaken('  RAREZA  ', [tag])).toBe(true);
    expect(isTagNameTaken('Ráreza', [tag])).toBe(false); // tilde distinta: nombre distinto
    expect(isTagNameTaken('Rareza', [tag], tag.id)).toBe(false); // editar la propia etiqueta no cuenta
    expect(isTagNameTaken('Coste', [tag])).toBe(false);
  });

  it('FT-008-02 · getComponentsUsingTag filtra por etiquetaIds de primer nivel', () => {
    const compA = { id: 'a', etiquetaIds: ['t1', 't2'] };
    const compB = { id: 'b', etiquetaIds: ['t2'] };
    const compC = { id: 'c', etiquetaIds: [] };
    const comps = [compA, compB, compC];

    expect(getComponentsUsingTag('t1', comps)).toEqual(['a']);
    expect(getComponentsUsingTag('t2', comps)).toEqual(['a', 'b']);
    expect(getComponentsUsingTag('inexistente', comps)).toEqual([]);
  });

  // --- Nivel ui: alta de etiqueta desde el panel dedicado ---

  it('FT-008-03 · "+ Añadir etiqueta" crea una etiqueta nueva desde el panel', () => {
    mountEditMode();

    document.querySelector('.tag-panel__footer button').click();
    const modal = document.querySelector('.modal-overlay .modal');
    expect(modal).toBeTruthy();

    const nameInput = modal.querySelector('input[type=text]');
    nameInput.value = 'Rareza';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    modal.querySelector('.btn-accept').click();

    expect(getTags().some((tg) => tg.name === 'Rareza')).toBe(true);
    expect(document.querySelector('.modal-overlay')).toBeNull();
  });

  it('FT-008-04 · el botón "Aceptar" del alta rechaza nombre vacío o ya en uso', () => {
    addTag(createTag({ name: 'Existente' }));
    mountEditMode();

    document.querySelector('.tag-panel__footer button').click();
    const modal = document.querySelector('.modal-overlay .modal');
    const nameInput = modal.querySelector('input[type=text]');
    const acceptBtn = modal.querySelector('.btn-accept');

    // Vacío (valor inicial): deshabilitado.
    expect(acceptBtn.disabled).toBe(true);

    nameInput.value = '  existente  ';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(acceptBtn.disabled).toBe(true);
    expect(modal.querySelector('.modal__error').style.display).toBe('block');

    nameInput.value = 'Nueva';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(acceptBtn.disabled).toBe(false);
  });

  // --- Nivel ui: asignación de etiquetas a un componente ---

  it('FT-008-05 · un componente puede tener varias etiquetas a la vez (etiquetaIds)', () => {
    const t1 = createTag({ name: 'Uno' });
    const t2 = createTag({ name: 'Dos' });
    addTag(t1);
    addTag(t2);
    const carta = addCarta('carta-tags');

    replaceComponent(carta.id, { ...carta, etiquetaIds: [t1.id, t2.id] });

    const updated = getComponents().find((c) => c.id === carta.id);
    expect(updated.etiquetaIds).toEqual([t1.id, t2.id]);
  });

  // --- Nivel ui: selección de todos los miembros al hacer click en una fila ---

  it('FT-008-06 · click en una fila de etiqueta selecciona todos sus miembros, reemplazando la selección previa', () => {
    const tag = createTag({ name: 'Grupo A' });
    addTag(tag);
    const miembro1 = addCarta('miembro-1', { etiquetaIds: [tag.id] });
    const miembro2 = addCarta('miembro-2', { etiquetaIds: [tag.id] });
    const suelto = addCarta('suelto', { etiquetaIds: [] });

    mountEditMode();

    // Selección previa distinta: se reemplaza por completo.
    document.querySelector(`.component-list__row[data-id="${suelto.id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(isRowSelected(suelto.id)).toBe(true);

    tagRowByName('Grupo A').click();

    expect(isRowSelected(miembro1.id)).toBe(true);
    expect(isRowSelected(miembro2.id)).toBe(true);
    expect(isRowSelected(suelto.id)).toBe(false);
  });

  it('FT-008-07 · click en una etiqueta sin elementos deja la selección vacía', () => {
    const tag = createTag({ name: 'Vacía' });
    addTag(tag);
    const suelto = addCarta('suelto-2', { etiquetaIds: [] });
    mountEditMode();

    document.querySelector(`.component-list__row[data-id="${suelto.id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(isRowSelected(suelto.id)).toBe(true);

    tagRowByName('Vacía').click();

    expect(isRowSelected(suelto.id)).toBe(false);
  });

  it('FT-008-08 · un grupo con la etiqueta propia selecciona a todos sus miembros', () => {
    const tag = createTag({ name: 'GrupoEtiquetado' });
    addTag(tag);
    addGroup(createGroup({ id: 'grupo-x', etiquetaIds: [tag.id] }));
    const m1 = addCarta('gm-1', { groupId: 'grupo-x', etiquetaIds: [] });
    const m2 = addCarta('gm-2', { groupId: 'grupo-x', etiquetaIds: [] });
    setPanelState({ expandedGroupIds: ['grupo-x'] });
    mountEditMode();

    tagRowByName('GrupoEtiquetado').click();

    expect(isRowSelected(m1.id)).toBe(true);
    expect(isRowSelected(m2.id)).toBe(true);
  });

  // --- Nivel ui: contador "Elementos" ---

  it('FT-008-09 · el contador "Elementos" cuenta componentes y grupos con esa etiqueta', () => {
    const tag = createTag({ name: 'Contada' });
    addTag(tag);
    addCarta('cnt-1', { etiquetaIds: [tag.id] });
    addCarta('cnt-2', { etiquetaIds: [tag.id] });
    addGroup(createGroup({ id: 'grupo-cnt', etiquetaIds: [tag.id] }));
    mountEditMode();

    const row = tagRowByName('Contada');
    const countCell = row.querySelectorAll('td')[1];
    expect(countCell.textContent).toBe('3');
  });

  it('FT-008-10 · una etiqueta sin elementos muestra el contador a 0', () => {
    addTag(createTag({ name: 'Sola' }));
    mountEditMode();

    const row = tagRowByName('Sola');
    expect(row.querySelectorAll('td')[1].textContent).toBe('0');
  });

  // --- Nivel ui: borrado sin uso / con uso ---

  it('FT-008-11 · borrar una etiqueta sin uso pide confirmación simple y borra al aceptar', () => {
    const tag = createTag({ name: 'SinUso' });
    addTag(tag);
    mountEditMode();

    const originalConfirm = window.confirm;
    let calls = 0;
    window.confirm = () => { calls += 1; return true; };
    try {
      tagButtonByLabel(tagRowByName('SinUso'), t('common.delete')).click();
      expect(calls).toBe(1);
      expect(getTags().some((tg) => tg.name === 'SinUso')).toBe(false);
      expect(document.querySelector('.modal-overlay')).toBeNull();
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('FT-008-12 · borrar una etiqueta en uso muestra la lista de afectados; al aceptar pierden solo esa etiqueta', () => {
    const tagUso = createTag({ name: 'EnUso' });
    const tagOtra = createTag({ name: 'Otra' });
    addTag(tagUso);
    addTag(tagOtra);
    const carta = addCarta('afectada', { etiquetaIds: [tagUso.id, tagOtra.id] });
    mountEditMode();

    const originalConfirm = window.confirm;
    window.confirm = () => { throw new Error('confirm() no debería llamarse cuando la etiqueta está en uso'); };
    try {
      tagButtonByLabel(tagRowByName('EnUso'), t('common.delete')).click();

      const overlay = document.querySelector('.modal-overlay');
      expect(overlay).toBeTruthy();
      expect(overlay.textContent).toContain('afectada');

      const confirmBtn = [...overlay.querySelectorAll('button')].find((b) => b.textContent === t('common.accept') || b.textContent === t('common.delete'));
      confirmBtn.click();

      expect(getTags().some((tg) => tg.name === 'EnUso')).toBe(false);
      const updated = getComponents().find((c) => c.id === carta.id);
      expect(updated.etiquetaIds).toEqual([tagOtra.id]);
    } finally {
      window.confirm = originalConfirm;
    }
  });

  // --- Nivel ui: salida individual desde la ventana de edición ---

  it('FT-008-13 · "Sacar" en la ventana de edición desvincula un elemento sin borrarlo ni pedir confirmación', () => {
    const tag = createTag({ name: 'ConMiembros' });
    addTag(tag);
    const carta = addCarta('sacar-1', { etiquetaIds: [tag.id] });
    mountEditMode();

    const originalConfirm = window.confirm;
    window.confirm = () => { throw new Error('"Sacar" no debería pedir confirmación'); };
    try {
      tagButtonByLabel(tagRowByName('ConMiembros'), t('common.edit')).click();
      const modal = document.querySelector('.modal-overlay .modal');
      expect(modal.textContent).toContain('sacar-1');

      modal.querySelector('.btn-sacar').click();

      const updated = getComponents().find((c) => c.id === carta.id);
      expect(updated.etiquetaIds).toEqual([]);
      // El elemento sigue existiendo.
      expect(getComponents().some((c) => c.id === carta.id)).toBe(true);
      // La etiqueta sigue existiendo, ahora sin miembros.
      expect(getTags().some((tg) => tg.id === tag.id)).toBe(true);
      expect(modal.textContent).toContain(t('tagModal.empty'));
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('FT-008-14 · sacar el último elemento no borra la etiqueta: sigue existiendo con 0 elementos', () => {
    const tag = createTag({ name: 'UltimoMiembro' });
    addTag(tag);
    addCarta('sacar-ultimo', { etiquetaIds: [tag.id] });
    mountEditMode();

    tagButtonByLabel(tagRowByName('UltimoMiembro'), t('common.edit')).click();
    const modal = document.querySelector('.modal-overlay .modal');
    modal.querySelector('.btn-sacar').click();
    modal.querySelector('.btn-cancel').click();

    expect(getTags().some((tg) => tg.id === tag.id)).toBe(true);
    expect(getComponentsUsingTag(tag.id, getComponents())).toHaveLength(0);

    // El panel de fondo solo se re-renderiza en acciones explícitas del propio
    // panel (no hay listener de eventBus): al volver a montar, el contador ya
    // refleja el estado real (0 elementos).
    mountEditMode();
    const row = tagRowByName('UltimoMiembro');
    expect(row.querySelectorAll('td')[1].textContent).toBe('0');
  });
});
