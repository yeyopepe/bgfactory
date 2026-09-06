// Funcionalidad 027 — Menú contextual de elemento en modo edición.
// Nivel interfaz: monta el modo edición, dispara `contextmenu` real sobre el
// nodo del componente en la mesa y comprueba el DOM del menú (`.context-menu`
// en `document.body`) y el estado resultante.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import {
  resetState, mountEditMode, mockRandom, restoreAllMocks,
  dispatchContextMenu, getOpenContextMenu,
} from '../helpers.js';
import {
  getComponents, addComponent, replaceComponent, loadTags, getTags, getGroups, addGroup,
} from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { createCopy, updateComponent, cloneComponent, nextGroupId } from '../../core/component.js';
import { createGroup } from '../../core/group.js';
import { createTag } from '../../core/tag.js';
import { sortByName } from '../../core/textSort.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 27, secondary: [34] });

// --- Helpers locales de fixture (específicos de esta batería) ---

// Selector del nodo exterior de cada tipo dentro del `worldEl`. Un 'mazo' se
// dibuja con `className = 'carta'` (ui/componentRenderer.js), de ahí que
// comparta selector con 'carta'.
const SELECTOR_BY_TYPE = {
  texto: '.text-box',
  tableroSimple: '.board',
  tableroPersonalizado: '.tablero-personalizado',
  dado: '.dice',
  documento: '.document-viewer',
  carta: '.carta',
  mazo: '.carta',
};

// Un componente sembrado y ya en el estado. En modo edición el menú contextual
// no se gatea por `accionClickDerecho` ni por `bloqueado`, así que no hace
// falta fijarlos.
function seedComponent(type, patch = {}) {
  const c = createDefaultComponent(type);
  c.id = patch.id ?? `c-${type}`;
  c.x = 100;
  c.y = 100;
  Object.assign(c, patch);
  addComponent(c);
  return getComponents().find((x) => x.id === c.id);
}

function nodeFor(content, type, index = 0) {
  return content.querySelectorAll('.infinite-table__world ' + SELECTOR_BY_TYPE[type])[index] ?? null;
}

function openMenuOn(content, type, { x = 50, y = 60, index = 0 } = {}) {
  dispatchContextMenu(nodeFor(content, type, index), { x, y });
  return getOpenContextMenu();
}

function actionRows(menu) {
  return [...menu.querySelectorAll('.context-menu__item')];
}

function rowByLabel(menu, label) {
  return [...menu.querySelectorAll('.context-menu__item-label')]
    .find((l) => l.textContent === label)?.closest('.context-menu__item') ?? null;
}

function isDisabled(row) {
  return row?.classList.contains('context-menu__item--disabled') ?? true;
}

function tagSelect(menu) {
  return menu.querySelector('.context-menu__select-row select');
}

// Construye una selección múltiple real ANTES del click derecho: un `click`
// normal sobre el primer nodo y `Ctrl+click` sobre el resto. El listener de
// `click` de `renderComponentsOnTable` llama a `onToggleSelect` (= `toggleSelect`
// de editMode.js) con `event.ctrlKey`.
function seedMultiSelection(nodes) {
  nodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 1; i < nodes.length; i += 1) {
    nodes[i].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
  }
}

describe('027 — Menú contextual de elemento en modo edición', () => {
  beforeEach(resetState);

  afterEach(() => {
    restoreAllMocks();
    document.body.querySelectorAll('.context-menu').forEach((n) => n.remove());
    document.body.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
    // Fuerza el cierre por click-fuera para que contextMenu.js desregistre sus
    // listeners globales (mousedown/keydown en document); sin esto contaminan
    // el siguiente caso del mismo fichero.
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    try { localStorage.removeItem('bgfactory:state'); } catch { /* no disponible */ }
  });

  it('FT-027-01 · click derecho sobre un elemento no seleccionado: lo selecciona en solitario y abre el menú', () => {
    seedComponent('dado', { id: 'D1' });
    seedComponent('carta', { id: 'C1', x: 600, y: 600 });
    const content = mountEditMode();

    const menu = openMenuOn(content, 'dado');
    expect(menu).toBeTruthy();
    expect(menu.parentElement === document.body).toBe(true);
    expect(menu.style.left !== '').toBe(true);
    expect(menu.style.top !== '').toBe(true);
    expect(content.querySelector('.dice--selected')).toBeTruthy();
    // Reemplazó cualquier selección previa (aquí no había ninguna en la carta).
    expect(content.querySelector('.carta--selected')).toBeNull();
  });

  it('FT-027-02 · click derecho sobre un elemento ya en una selección múltiple: la selección se mantiene intacta', () => {
    seedComponent('dado', { id: 'A', x: 100 });
    seedComponent('dado', { id: 'B', x: 300 });
    seedComponent('dado', { id: 'C', x: 500 });
    const content = mountEditMode();

    seedMultiSelection([nodeFor(content, 'dado', 0), nodeFor(content, 'dado', 1), nodeFor(content, 'dado', 2)]);
    expect(content.querySelectorAll('.dice--selected').length).toBe(3);

    // Click derecho sobre B, que ya está en la selección.
    dispatchContextMenu(nodeFor(content, 'dado', 1), { x: 50, y: 60 });

    expect(content.querySelectorAll('.dice--selected').length).toBe(3);
    const menu = getOpenContextMenu();
    expect(menu).toBeTruthy();
    // No todos son cartas: "Voltear carta" no aparece.
    expect(rowByLabel(menu, t('menu.flipCard'))).toBeNull();
    // 3 unidades sueltas, ningún grupo: "Agrupar" habilitada.
    expect(isDisabled(rowByLabel(menu, t('contextMenu.group')))).toBe(false);
  });

  it('FT-027-03 · click derecho sobre un miembro de un grupo: selecciona el grupo entero', () => {
    seedComponent('dado', { id: 'G1', x: 100, groupId: 'grupo-1' });
    seedComponent('dado', { id: 'G2', x: 300, groupId: 'grupo-1' });
    addGroup(createGroup({ id: 'grupo-1' }));
    const content = mountEditMode();

    dispatchContextMenu(nodeFor(content, 'dado', 0), { x: 50, y: 60 });

    expect(content.querySelectorAll('.dice--selected').length).toBe(2);
    const menu = getOpenContextMenu();
    expect(menu).toBeTruthy();
    // 1 unidad y es un grupo: "Desagrupar" habilitada, "Agrupar" no.
    expect(isDisabled(rowByLabel(menu, t('contextMenu.ungroup')))).toBe(false);
    expect(isDisabled(rowByLabel(menu, t('contextMenu.group')))).toBe(true);
  });

  it('FT-027-04 · "Clonar" sobre varios elementos: se clonan todos', () => {
    seedComponent('dado', { id: 'A', x: 100 });
    seedComponent('dado', { id: 'B', x: 300 });
    const content = mountEditMode();

    seedMultiSelection([nodeFor(content, 'dado', 0), nodeFor(content, 'dado', 1)]);
    const menu = openMenuOn(content, 'dado', { index: 0 });
    const before = getComponents().length;

    rowByLabel(menu, t('contextMenu.clone')).click();

    expect(getComponents().length).toBe(before + 2);
    const nuevos = getComponents().filter((c) => c.id !== 'A' && c.id !== 'B');
    expect(nuevos.length).toBe(2);
    expect(nuevos.every((c) => c.type === 'dado')).toBe(true);
    expect(nuevos.every((c) => c.copyOf == null)).toBe(true);
    expect(getOpenContextMenu()).toBeNull();
  });

  it('FT-027-05 · "Copiar" sobre varios elementos: se crean copias vinculadas de todos', () => {
    seedComponent('dado', { id: 'A', x: 100 });
    seedComponent('dado', { id: 'B', x: 300 });
    const content = mountEditMode();

    seedMultiSelection([nodeFor(content, 'dado', 0), nodeFor(content, 'dado', 1)]);
    const menu = openMenuOn(content, 'dado', { index: 0 });
    const before = getComponents().length;

    rowByLabel(menu, t('contextMenu.copy')).click();

    expect(getComponents().length).toBe(before + 2);
    const nuevos = getComponents().filter((c) => c.id !== 'A' && c.id !== 'B');
    expect(nuevos.length).toBe(2);
    expect([...nuevos.map((c) => c.copyOf)].sort()).toEqual(['A', 'B']);
    expect(nuevos.every((c) => c.sincronizado === true)).toBe(true);
    expect(getOpenContextMenu()).toBeNull();
  });

  it('FT-027-06 · "Clonar"/"Copiar" con una Copia vinculada dentro de la selección: la omite y actúa sobre el resto', () => {
    seedComponent('dado', { id: 'O1', x: 100 });
    addComponent(createCopy(getComponents().find((c) => c.id === 'O1'), getComponents()));
    const content = mountEditMode();

    // Distinguir original (style.left '100px') de copia (nace en +30 → '130px').
    const diceNodes = [...content.querySelectorAll('.infinite-table__world .dice')];
    const origNode = diceNodes.find((n) => n.style.left === '100px');
    const copyNode = diceNodes.find((n) => n.style.left === '130px');
    seedMultiSelection([origNode, copyNode]);

    const menu = openMenuOn(content, 'dado', { index: 0 });
    const before = getComponents().length;
    const cloneRow = rowByLabel(menu, t('contextMenu.clone'));
    expect(isDisabled(cloneRow)).toBe(false); // hay cloneables (el original)

    cloneRow.click();

    // Solo se clonó el original; la copia se omitió (cloneables filtra copyOf).
    expect(getComponents().length).toBe(before + 1);
    const nuevo = getComponents().find((c) => c.id !== 'O1' && c.copyOf == null && c.id.includes('('));
    expect(nuevo).toBeTruthy();
  });

  it('FT-027-07 · "Clonar"/"Copiar" cuando todos los elementos afectados son Copias: ambas filas aparecen deshabilitadas', () => {
    // id propio (no compartido con FT-027-06): `selectedComponentIds` es estado
    // de módulo de editMode.js y resetState() no lo limpia; con un id nuevo el
    // click derecho siempre entra por la rama de "reemplazar selección".
    seedComponent('dado', { id: 'Q1', x: 100 });
    addComponent(createCopy(getComponents().find((c) => c.id === 'Q1'), getComponents()));
    const content = mountEditMode();

    const diceNodes = [...content.querySelectorAll('.infinite-table__world .dice')];
    const copyNode = diceNodes.find((n) => n.style.left === '130px');

    // Abrir el menú SOLO sobre la copia: como no estaba seleccionada, el click
    // derecho la selecciona en solitario → affectedComponents = [copia].
    dispatchContextMenu(copyNode, { x: 50, y: 60 });
    const menu = getOpenContextMenu();

    expect(isDisabled(rowByLabel(menu, t('contextMenu.clone')))).toBe(true);
    expect(isDisabled(rowByLabel(menu, t('contextMenu.copy')))).toBe(true);

    // Deshabilitadas: no registran listener de click → pulsarlas no hace nada.
    const before = getComponents().length;
    rowByLabel(menu, t('contextMenu.clone')).click();
    expect(getComponents().length).toBe(before);
    expect(getOpenContextMenu()).toBeTruthy();
  });

  it('FT-027-08 · "Eliminar" sobre dos o más elementos: abre la confirmación en bloque', () => {
    seedComponent('dado', { id: 'A', x: 100 });
    seedComponent('dado', { id: 'B', x: 300 });
    const content = mountEditMode();

    seedMultiSelection([nodeFor(content, 'dado', 0), nodeFor(content, 'dado', 1)]);
    const menu = openMenuOn(content, 'dado', { index: 0 });

    rowByLabel(menu, t('contextMenu.delete')).click();

    // Modal de borrado en bloque (ui/bulkDeleteConfirmModal.js): overlay + lista.
    const overlay = document.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('.bulk-delete-confirm-modal__list')).toBeTruthy();
    // El menú se cerró; los componentes siguen (no se ha confirmado el borrado).
    expect(getOpenContextMenu()).toBeNull();
    expect(getComponents().length).toBe(2);

    document.querySelector('.modal-overlay')?.remove();
  });

  it('FT-027-09 · "Agrupar" habilitada solo con 2+ unidades sin ningún grupo; deshabilitada con una sola unidad', () => {
    // Caso A: dos dados sueltos.
    seedComponent('dado', { id: 'A', x: 100 });
    seedComponent('dado', { id: 'B', x: 300 });
    let content = mountEditMode();
    seedMultiSelection([nodeFor(content, 'dado', 0), nodeFor(content, 'dado', 1)]);
    let menu = openMenuOn(content, 'dado', { index: 0 });
    expect(isDisabled(rowByLabel(menu, t('contextMenu.group')))).toBe(false);
    expect(isDisabled(rowByLabel(menu, t('contextMenu.ungroup')))).toBe(true);

    // Caso B: un solo dado.
    resetState();
    seedComponent('dado', { id: 'S', x: 100 });
    content = mountEditMode();
    menu = openMenuOn(content, 'dado');
    expect(isDisabled(rowByLabel(menu, t('contextMenu.group')))).toBe(true);
    expect(isDisabled(rowByLabel(menu, t('contextMenu.ungroup')))).toBe(true);
  });

  it('FT-027-10 · "Desagrupar" habilitada solo con un único grupo completo como selección', () => {
    // Caso A: un grupo de dos dados.
    seedComponent('dado', { id: 'G1', x: 100, groupId: 'grupo-1' });
    seedComponent('dado', { id: 'G2', x: 300, groupId: 'grupo-1' });
    addGroup(createGroup({ id: 'grupo-1' }));
    let content = mountEditMode();
    dispatchContextMenu(nodeFor(content, 'dado', 0), { x: 50, y: 60 });
    let menu = getOpenContextMenu();
    expect(isDisabled(rowByLabel(menu, t('contextMenu.ungroup')))).toBe(false);
    expect(isDisabled(rowByLabel(menu, t('contextMenu.group')))).toBe(true);

    // Caso B: un dado suelto.
    resetState();
    seedComponent('dado', { id: 'S', x: 100 });
    content = mountEditMode();
    menu = openMenuOn(content, 'dado');
    expect(isDisabled(rowByLabel(menu, t('contextMenu.ungroup')))).toBe(true);
  });

  it('FT-027-11 · selección que mezcla un grupo con otro elemento: no se muestra ningún menú', () => {
    seedComponent('dado', { id: 'G1', x: 100, groupId: 'grupo-1' });
    seedComponent('dado', { id: 'G2', x: 300, groupId: 'grupo-1' });
    addGroup(createGroup({ id: 'grupo-1' }));
    seedComponent('dado', { id: 'L1', x: 500 });
    const content = mountEditMode();

    // Selección mixta: click sobre un miembro del grupo (selecciona el grupo),
    // Ctrl+click sobre el dado suelto (añade la unidad suelta).
    const g1Node = [...content.querySelectorAll('.infinite-table__world .dice')].find((n) => n.style.left === '100px');
    const l1Node = [...content.querySelectorAll('.infinite-table__world .dice')].find((n) => n.style.left === '500px');
    seedMultiSelection([g1Node, l1Node]);
    expect(content.querySelectorAll('.dice--selected').length).toBe(3);

    dispatchContextMenu(l1Node, { x: 50, y: 60 });

    // unitCount >= 2 && hasGroup → return sin abrir menú.
    expect(getOpenContextMenu()).toBeNull();
    expect(document.body.querySelectorAll('.context-menu').length).toBe(0);
  });

  it('FT-027-12 · "Añadir a etiqueta": añade la etiqueta a todos los afectados que no la tuvieran, sin quitarles ninguna otra', () => {
    loadTags([createTag({ id: 'tag-a', name: 'Alfa' }), createTag({ id: 'tag-b', name: 'Beta' })]);
    seedComponent('dado', { id: 'A', x: 100, etiquetaIds: ['tag-b'] });
    seedComponent('dado', { id: 'B', x: 300, etiquetaIds: [] });
    const content = mountEditMode();

    seedMultiSelection([nodeFor(content, 'dado', 0), nodeFor(content, 'dado', 1)]);
    const menu = openMenuOn(content, 'dado', { index: 0 });

    const select = tagSelect(menu);
    expect(select.disabled).toBe(false);
    expect([...select.options].filter((o) => o.value).map((o) => o.value))
      .toEqual(sortByName(getTags()).map((tag) => tag.id));

    select.value = 'tag-a';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(getComponents().find((c) => c.id === 'A').etiquetaIds).toEqual(['tag-b', 'tag-a']);
    expect(getComponents().find((c) => c.id === 'B').etiquetaIds).toEqual(['tag-a']);
    expect(getOpenContextMenu()).toBeNull();
  });

  it('FT-027-13 · "Añadir a etiqueta" sin ninguna etiqueta creada: la fila aparece deshabilitada', () => {
    seedComponent('dado', { id: 'D1', x: 100 });
    const content = mountEditMode();

    const menu = openMenuOn(content, 'dado');
    const select = tagSelect(menu);
    expect(select).toBeTruthy();
    expect(select.disabled).toBe(true); // options.length === 0
    expect(select.querySelector('option').textContent).toBe(t('contextMenu.tagSelect.empty'));
  });

  it('FT-027-14 · "Voltear carta" aparece solo si todos los afectados son cartas y voltea cada una a su cara opuesta de forma independiente', () => {
    // Caso A: dos cartas en caras distintas.
    seedComponent('carta', { id: 'K1', x: 100 }); // caraActual por defecto 'trasera'
    const k2 = seedComponent('carta', { id: 'K2', x: 400 });
    replaceComponent('K2', updateComponent(getComponents().find((c) => c.id === 'K2'), {
      properties: { caraActual: 'frontal' },
    }));
    let content = mountEditMode();
    seedMultiSelection([nodeFor(content, 'carta', 0), nodeFor(content, 'carta', 1)]);
    let menu = openMenuOn(content, 'carta', { index: 0 });

    const flipRow = rowByLabel(menu, t('menu.flipCard'));
    expect(flipRow).toBeTruthy();
    flipRow.click();

    expect(getComponents().find((c) => c.id === 'K1').properties.caraActual).toBe('frontal');
    expect(getComponents().find((c) => c.id === 'K2').properties.caraActual).toBe('trasera');
    expect(getOpenContextMenu()).toBeNull();

    // Caso B: una carta y un dado → "Voltear carta" no aparece.
    resetState();
    seedComponent('carta', { id: 'K3', x: 100 });
    seedComponent('dado', { id: 'D3', x: 400 });
    content = mountEditMode();
    seedMultiSelection([nodeFor(content, 'carta', 0), nodeFor(content, 'dado', 0)]);
    menu = openMenuOn(content, 'carta', { index: 0 });
    expect(rowByLabel(menu, t('menu.flipCard'))).toBeNull();
  });

  it('FT-027-15 · el menú se cierra al elegir una acción, al pulsar ESC y al hacer click fuera', () => {
    // 1. Elegir acción.
    seedComponent('dado', { id: 'D1', x: 100 });
    let content = mountEditMode();
    let menu = openMenuOn(content, 'dado');
    rowByLabel(menu, t('contextMenu.clone')).click();
    expect(getOpenContextMenu()).toBeNull();

    // 2. ESC.
    resetState();
    seedComponent('dado', { id: 'D2', x: 100 });
    content = mountEditMode();
    openMenuOn(content, 'dado');
    expect(getOpenContextMenu()).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(getOpenContextMenu()).toBeNull();

    // 3. Click fuera.
    resetState();
    seedComponent('dado', { id: 'D3', x: 100 });
    content = mountEditMode();
    openMenuOn(content, 'dado');
    expect(getOpenContextMenu()).toBeTruthy();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(getOpenContextMenu()).toBeNull();
  });
});
