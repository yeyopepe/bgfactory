// Funcionalidad 003 — Panel flotante de componentes, con selección, resaltado,
// arrastre y redimensionado.
// Nivel state + ui.
//
// Aislamiento (mismo gotcha que edit-context-menu.test.js / component-transform.test.js):
// `selectedComponentIds` y `panelStackOrder` de modes/edit/editMode.js, y
// `filterText`/`columnSort`/`columnFilters` de ui/componentList.js son estado de
// módulo que resetState() NO limpia. Mitigación por caso: ids distintos por caso,
// y cerrar overlays/menús en afterEach. El arrastre real del panel por su
// cabecera y del tirador de redimensionado (gestos mousemove píxel a píxel) queda
// fuera: sin CSS en el runner las cajas son 0×0. Se valida en su lugar el
// contrato de callbacks de persistencia y la relectura de un panelState sembrado.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import {
  getComponents, addComponent, getPanelState, setPanelState, loadPanelState,
} from '../../core/state.js';
import { cloneComponent, nextCloneId, createCopy, nextCopyId } from '../../core/component.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 3 });

// --- Helpers locales de fixture ---

function addCarta(id, extra = {}) {
  const c = createDefaultComponent('carta');
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);
  return c;
}

function clickOn(el, opts = {}) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, ...opts }));
}

// Fila del panel por su data-id, releída del DOM vivo (el panel se re-renderiza
// entero en cada interacción).
function rowById(id) {
  return document.querySelector(`.component-list__row[data-id="${id}"]`);
}

function isSelected(row) {
  return !!row && row.classList.contains('component-list__row--selected');
}

// Botones de acción de una fila, indexados por su texto traducido.
function actionButtons(row) {
  return [...row.querySelectorAll('.component-list__action-btn')];
}

function buttonByLabel(row, label) {
  return actionButtons(row).find((b) => b.textContent === label) ?? null;
}

describe('003 — Panel flotante de componentes', () => {
  beforeEach(resetState);

  afterEach(() => {
    document.querySelectorAll('.modal-overlay, .column-header-menu, .context-menu').forEach((n) => n.remove());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });

  // --- Nivel state: identificador de clon / copia ---

  it('FT-003-01 · nextCloneId añade sufijo (n) y reutiliza el primer entero libre', () => {
    expect(nextCloneId('abc', [{ id: 'abc' }])).toBe('abc(1)');
    expect(nextCloneId('abc', [{ id: 'abc' }, { id: 'abc(1)' }])).toBe('abc(2)');
    // Clon de un clon comparte familia: la raíz es 'abc', no 'abc(1)'.
    expect(nextCloneId('abc(1)', [{ id: 'abc' }, { id: 'abc(1)' }])).toBe('abc(2)');
    // Hueco libre: sin abc(1), ese número se reutiliza.
    expect(nextCloneId('abc', [{ id: 'abc' }, { id: 'abc(2)' }])).toBe('abc(1)');
  });

  it('FT-003-02 · cloneComponent copia con offset +30/+30, order/groupId a null y properties nueva', () => {
    const original = { id: 'abc', x: 10, y: 20, order: 5, groupId: 'grupo-9', properties: { a: 1 } };
    const clon = cloneComponent(original, [{ id: 'abc' }]);
    expect(clon.id).toBe('abc(1)');
    expect(clon.x).toBe(40);
    expect(clon.y).toBe(50);
    expect(clon.order).toBeNull();
    expect(clon.groupId).toBeNull();
    // properties es una copia nueva, no la misma referencia.
    expect(clon.properties === original.properties).toBe(false);
    expect(clon.properties).toEqual({ a: 1 });
  });

  it('FT-003-03 · nextCopyId numera -COPY-XXX filtrando por copyOf y reutiliza hueco', () => {
    expect(nextCopyId('orig', [])).toBe('orig-COPY-001');
    expect(nextCopyId('orig', [{ id: 'orig-COPY-001', copyOf: 'orig' }])).toBe('orig-COPY-002');
    // Hueco: sin -COPY-001, ese número vuelve a estar libre.
    expect(nextCopyId('orig', [{ id: 'orig-COPY-002', copyOf: 'orig' }])).toBe('orig-COPY-001');
    // Copias de OTRO original no cuentan.
    expect(nextCopyId('orig', [{ id: 'x-COPY-001', copyOf: 'otro' }])).toBe('orig-COPY-001');
  });

  it('FT-003-04 · createCopy marca copyOf/sincronizado y nace desplazada, sin order ni grupo', () => {
    const original = { id: 'orig', x: 0, y: 0, order: 3, groupId: 'grupo-1', properties: {} };
    const copia = createCopy(original, []);
    expect(copia.copyOf).toBe('orig');
    expect(copia.sincronizado).toBe(true);
    expect(copia.order).toBeNull();
    expect(copia.groupId).toBeNull();
    expect(copia.x).toBe(30);
    expect(copia.y).toBe(30);
  });

  it('FT-003-05 · el clon añadido al estado acaba en order = 1 y desplaza al resto', () => {
    addCarta('base-a'); // order 1
    addCarta('base-b'); // base-a pasa a 2, base-b a 1
    const clon = cloneComponent(getComponents().find((c) => c.id === 'base-b'), getComponents());
    addComponent(clon);
    const nuevo = getComponents().find((c) => c.id === clon.id);
    expect(nuevo.order).toBe(1);
    // Los dos previos quedan desplazados: nadie más en order 1.
    expect(getComponents().filter((c) => c.order === 1)).toHaveLength(1);
  });

  // --- Nivel ui: selección y resaltado ---

  it('FT-003-06 · click en una fila la resalta y deja de resaltar cualquier otra', () => {
    addCarta('sel-a');
    addCarta('sel-b');
    mountEditMode();
    clickOn(rowById('sel-a'));
    expect(isSelected(rowById('sel-a'))).toBe(true);
    expect(isSelected(rowById('sel-b'))).toBe(false);
  });

  it('FT-003-07 · Ctrl+click añade y quita filas de la selección sin tocar el resto', () => {
    addCarta('mul-a');
    addCarta('mul-b');
    mountEditMode();
    clickOn(rowById('mul-a'));
    clickOn(rowById('mul-b'), { ctrlKey: true });
    expect(isSelected(rowById('mul-a'))).toBe(true);
    expect(isSelected(rowById('mul-b'))).toBe(true);
    // Ctrl+click de nuevo sobre mul-b: sale de la selección, mul-a sigue.
    clickOn(rowById('mul-b'), { ctrlKey: true });
    expect(isSelected(rowById('mul-b'))).toBe(false);
    expect(isSelected(rowById('mul-a'))).toBe(true);
  });

  it('FT-003-08 · click plano sobre la única fila seleccionada la deselecciona', () => {
    addCarta('tog-a');
    mountEditMode();
    clickOn(rowById('tog-a'));
    expect(isSelected(rowById('tog-a'))).toBe(true);
    clickOn(rowById('tog-a'));
    expect(isSelected(rowById('tog-a'))).toBe(false);
  });

  // --- Nivel ui: botones de acción por fila ---

  it('FT-003-09 · en una fila de Copia no aparecen "Clonar" ni "Copiar", solo "Editar" y "Eliminar"', () => {
    addCarta('cp-orig');
    addComponent(createCopy(getComponents().find((c) => c.id === 'cp-orig'), getComponents()));
    mountEditMode();

    const copia = getComponents().find((c) => c.copyOf === 'cp-orig');
    const copyRow = rowById(copia.id);
    expect(buttonByLabel(copyRow, t('contextMenu.clone'))).toBeNull();
    expect(buttonByLabel(copyRow, t('contextMenu.copy'))).toBeNull();
    expect(buttonByLabel(copyRow, t('common.edit'))).toBeTruthy();
    expect(buttonByLabel(copyRow, t('common.delete'))).toBeTruthy();

    // En la fila del original sí están los cuatro.
    const origRow = rowById('cp-orig');
    expect(buttonByLabel(origRow, t('contextMenu.clone'))).toBeTruthy();
    expect(buttonByLabel(origRow, t('contextMenu.copy'))).toBeTruthy();
    expect(buttonByLabel(origRow, t('common.edit'))).toBeTruthy();
    expect(buttonByLabel(origRow, t('common.delete'))).toBeTruthy();
  });

  it('FT-003-10 · en un componente agrupado "Clonar"/"Copiar" salen deshabilitados; "Editar"/"Eliminar" no', () => {
    addCarta('grp-a', { groupId: 'grupo-x' });
    addCarta('grp-b', { groupId: 'grupo-x' });
    // El grupo nace plegado: hay que desplegarlo para que se pinten las filas de
    // sus miembros (donde viven los botones "Clonar"/"Copiar").
    setPanelState({ expandedGroupIds: ['grupo-x'] });
    mountEditMode();

    // La fila del miembro es .component-list__row--member, con su propio data-id.
    const memberRow = document.querySelector('.component-list__row--member[data-id="grp-a"]');
    expect(memberRow).toBeTruthy();
    expect(buttonByLabel(memberRow, t('contextMenu.clone')).disabled).toBe(true);
    expect(buttonByLabel(memberRow, t('contextMenu.copy')).disabled).toBe(true);
    expect(buttonByLabel(memberRow, t('common.edit')).disabled).toBe(false);
    expect(buttonByLabel(memberRow, t('common.delete')).disabled).toBe(false);
  });

  // --- Nivel ui: borrado ---

  it('FT-003-11 · "Eliminar" con selección múltiple abre bulkDeleteConfirmModal enumerando, sin confirm()', () => {
    addCarta('del-a');
    addCarta('del-b');
    addCarta('del-c');
    mountEditMode();

    const originalConfirm = window.confirm;
    window.confirm = () => { throw new Error('confirm() no debería llamarse en borrado múltiple'); };
    try {
      clickOn(rowById('del-a'));
      clickOn(rowById('del-b'), { ctrlKey: true }); // selección = 2

      buttonByLabel(rowById('del-a'), t('common.delete')).click();

      const overlay = document.querySelector('.modal-overlay');
      expect(overlay).toBeTruthy();
      const items = [...overlay.querySelectorAll('.bulk-delete-confirm-modal__list li')];
      expect(items).toHaveLength(2);
      const texto = items.map((li) => li.textContent).join(' | ');
      expect(texto).toContain('del-a');
      expect(texto).toContain('del-b');
      // No se ha confirmado: los tres componentes siguen.
      expect(getComponents()).toHaveLength(3);
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('FT-003-12 · "Eliminar" con un solo elemento usa confirm() simple y borra al aceptar', () => {
    addCarta('one-a');
    mountEditMode();

    const originalConfirm = window.confirm;
    let calls = 0;
    window.confirm = () => { calls += 1; return true; };
    try {
      buttonByLabel(rowById('one-a'), t('common.delete')).click();
      expect(calls).toBe(1);
      expect(getComponents().some((c) => c.id === 'one-a')).toBe(false);
      expect(document.querySelector('.bulk-delete-confirm-modal__list')).toBeNull();
    } finally {
      window.confirm = originalConfirm;
    }
  });

  // --- Nivel ui: filas de grupo plegables ---

  it('FT-003-13 · los grupos aparecen plegados por defecto y se despliegan vía panelState', () => {
    addCarta('gr-a', { groupId: 'grupo-1' });
    addCarta('gr-b', { groupId: 'grupo-1' });
    mountEditMode();

    const groupRow = document.querySelector('.component-list__row--group[data-id="grupo-1"]');
    expect(groupRow).toBeTruthy();
    expect(groupRow.querySelector('.component-list__group-toggle').textContent).toBe('▸');
    expect(document.querySelectorAll('.component-list__row--member').length).toBe(0);

    setPanelState({ expandedGroupIds: ['grupo-1'] });
    mountEditMode();

    const groupRow2 = document.querySelector('.component-list__row--group[data-id="grupo-1"]');
    expect(groupRow2.querySelector('.component-list__group-toggle').textContent).toBe('▾');
    expect(document.querySelectorAll('.component-list__row--member').length).toBe(2);
  });

  // --- Nivel ui: persistencia del panel ---

  it('FT-003-14 · un panelState sembrado se relee al montar (posición, ancho, colapsado)', () => {
    loadPanelState({ collapsed: true, width: 420, position: { left: 50, top: 60 }, columnWidths: { id: 120 } });
    mountEditMode();

    const container = document.querySelector('.component-panel-container');
    expect(container.style.width).toBe('420px');
    expect(container.style.left).toBe('50px');
    expect(container.style.top).toBe('60px');
    // Colapsado: renderComponentList no pinta el cuerpo del panel.
    expect(container.querySelector('.component-panel__body')).toBeNull();
  });

  it('FT-003-15 · la selección de fila NO se persiste: es estado de sesión', () => {
    addCarta('nps-a');
    mountEditMode();
    clickOn(rowById('nps-a'));
    expect(isSelected(rowById('nps-a'))).toBe(true);

    // El panelState persistido no tiene ninguna clave de selección.
    expect('selectedComponentIds' in getPanelState()).toBe(false);
    expect('selectedIds' in getPanelState()).toBe(false);

    // Tras resetState() + re-montar (con un id nuevo, porque selectedComponentIds
    // es estado de módulo de editMode.js que resetState() no limpia), nada ha
    // restaurado ninguna selección: la fila del componente nuevo no está resaltada.
    resetState();
    addCarta('nps-b');
    mountEditMode();
    expect(isSelected(rowById('nps-b'))).toBe(false);
  });

  it('FT-003-16 · el botón de colapsar dispara onToggleCollapse → setPanelState', () => {
    addCarta('col-a');
    mountEditMode();

    const toggleBtn = document.querySelector('.component-panel__header button');
    expect(getPanelState().collapsed).toBeFalsy();
    toggleBtn.click();
    expect(getPanelState().collapsed).toBe(true);
    // El header sigue teniendo su botón tras el re-render; pulsar de nuevo.
    document.querySelector('.component-panel__header button').click();
    expect(getPanelState().collapsed).toBe(false);
  });

  it('FT-003-17 · interactuar con un panel lo trae al frente (zIndex) sobre los demás', () => {
    mountEditMode();
    const componentContainer = document.querySelector('.component-panel-container');
    const resourceContainer = document.querySelector('.resource-panel-container');

    // panelStackOrder = ['component','resource','tag'] → zIndex 15 + index.
    const zComp0 = Number(componentContainer.style.zIndex);
    const zRes0 = Number(resourceContainer.style.zIndex);
    expect(zRes0).toBeGreaterThan(zComp0);

    // mousedown (captura) sobre el panel de recursos → recurso pasa al frente.
    resourceContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(Number(resourceContainer.style.zIndex)).toBeGreaterThan(Number(componentContainer.style.zIndex));

    // Y al revés: interactuar con Componentes lo devuelve arriba (deja el orden
    // de módulo restaurado para el resto del fichero).
    componentContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(Number(componentContainer.style.zIndex)).toBeGreaterThan(Number(resourceContainer.style.zIndex));
  });
});
