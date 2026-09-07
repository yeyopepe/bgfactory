// Funcionalidad 006 — Panel flotante de recursos, con filtro de texto.
// Nivel state + ui.
//
// Aislamiento: `filterText`/`columnSort`/`columnFilters` son estado de módulo de
// ui/resourceList.js que resetState() NO limpia; el módulo los pone a cero al
// renderizarse con la lista de recursos vacía. `beforeEach` monta en vacío antes
// de sembrar para dejar cada caso con filtro/orden de columna limpio.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import {
  addResource, addComponent, getResources,
  loadResourcePanelState, getResourcePanelState, setResourcePanelState, getPanelState,
} from '../../core/state.js';
import { createResource, RESOURCE_TYPES, getComponentsUsingResource } from '../../core/resource.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { sortByName } from '../../core/textSort.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 6 });

// --- Helpers locales ---

function addImage(id, name, extra = {}) {
  const r = createResource({
    id, name, type: RESOURCE_TYPES.IMAGE,
    dataUrl: 'data:image/webp;base64,AA==', fileName: `${name}.webp`, mimeType: 'image/webp',
  });
  Object.assign(r, extra);
  addResource(r);
  return r;
}

function addFont(id, name) {
  const r = createResource({
    id, name, type: RESOURCE_TYPES.FONT,
    dataUrl: 'data:font/ttf;base64,AA==', fileName: `${name}.ttf`, mimeType: 'font/ttf',
  });
  addResource(r);
  return r;
}

// Carta que referencia un recurso imagen en su cara frontal.
function addCartaUsing(id, resourceId) {
  const c = createDefaultComponent('carta');
  c.id = id;
  c.properties = { ...c.properties, caraFrontal: { imagenResourceId: resourceId } };
  addComponent(c);
  return c;
}

function resourceRows() {
  return [...document.querySelectorAll('.resource-list tbody tr')]
    .filter((tr) => !tr.querySelector('.resource-list__empty, .resource-list__empty-filter'));
}

function resourceNames() {
  return resourceRows().map((tr) => tr.firstChild.textContent);
}

function typeFilter(value) {
  const input = document.querySelector('.resource-panel__filter input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('006 — Panel flotante de recursos', () => {
  beforeEach(() => {
    resetState();
    mountEditMode(); // montaje en vacío: resetea filterText/columnSort/columnFilters del módulo.
  });

  afterEach(() => {
    document.querySelectorAll('.modal-overlay, .column-header-menu').forEach((n) => n.remove());
  });

  // --- Nivel state ---

  it('FT-006-01 · getComponentsUsingResource cuenta cada componente una vez, a cualquier profundidad', () => {
    const compA = { id: 'a', image: 'img-1', properties: {} };
    const compB = { id: 'b', properties: { caraFrontal: { imagenResourceId: 'img-1' } } };
    // Referencia el mismo recurso en dos caras: cuenta una sola vez.
    const compC = { id: 'c', properties: { caraFrontal: { r: 'img-1' }, caraTrasera: { r: 'img-1' } } };
    const compD = { id: 'd', properties: { caraFrontal: { r: 'otro' } } };
    const comps = [compA, compB, compC, compD];

    const usados = getComponentsUsingResource('img-1', comps);
    expect(usados).toContain('a');
    expect(usados).toContain('b');
    expect(usados).toContain('c');
    expect(usados).toHaveLength(3);
    expect(getComponentsUsingResource('no-referenciado', comps)).toEqual([]);
  });

  it('FT-006-02 · sortByName ordena insensible a mayúsculas y tildes', () => {
    const ordenados = sortByName([{ name: 'Cebra' }, { name: 'Águila' }, { name: 'ave' }]).map((r) => r.name);
    // "Águila" y "ave" quedan juntos al principio; "Cebra" al final.
    expect(ordenados[2]).toBe('Cebra');
    expect(ordenados.slice(0, 2).sort()).toEqual(['ave', 'Águila'].sort());
  });

  // --- Nivel ui: tabla y columnas ---

  it('FT-006-03 · la tabla tiene columnas nombre/usos/tipo/acciones y una fila por recurso', () => {
    addImage('t-1', 'Alfa');
    addImage('t-2', 'Beta');
    mountEditMode();

    const cols = [...document.querySelectorAll('.resource-list thead th')].map((th) => th.dataset.col);
    expect(cols).toEqual(['nombre', 'usos', 'tipo', 'acciones']);

    const rows = resourceRows();
    expect(rows).toHaveLength(2);
    // Primera celda = nombre; celda .resource-list__usos-cell = número; 3ª = etiqueta de tipo.
    const alfa = rows.find((tr) => tr.firstChild.textContent === 'Alfa');
    expect(alfa.querySelector('.resource-list__usos-cell').textContent).toBe('0');
    expect(alfa.children[2].textContent).toBe(t('resourceKind.image'));
  });

  it('FT-006-04 · la columna "Usos" cuenta componentes distintos y no es editable', () => {
    addImage('u-1', 'Usada');
    addImage('u-2', 'Libre');
    addCartaUsing('carta-a', 'u-1');
    addCartaUsing('carta-b', 'u-1');
    mountEditMode();

    const usada = resourceRows().find((tr) => tr.firstChild.textContent === 'Usada');
    const libre = resourceRows().find((tr) => tr.firstChild.textContent === 'Libre');
    expect(usada.querySelector('.resource-list__usos-cell').textContent).toBe('2');
    expect(libre.querySelector('.resource-list__usos-cell').textContent).toBe('0');
    expect(usada.querySelector('.resource-list__usos-cell input')).toBeNull();
  });

  it('FT-006-05 · las filas se pintan en el orden de sortByName(getResources())', () => {
    addImage('o-1', 'Cebra');
    addImage('o-2', 'ave');
    addImage('o-3', 'Búho');
    mountEditMode();

    expect(resourceNames()).toEqual(sortByName(getResources()).map((r) => r.name));
  });

  // --- Nivel ui: filtro de texto ---

  it('FT-006-06 · el filtro de texto por nombre actualiza la tabla en vivo', () => {
    addImage('f-1', 'Mapa');
    addImage('f-2', 'Ficha');
    addImage('f-3', 'Dado');
    mountEditMode();

    // "map" solo casa "Mapa" por nombre; "ma" casaría también contra la etiqueta
    // de tipo "Imagen" ("i-ma-gen"), común a las tres.
    typeFilter('map');
    expect(resourceNames()).toEqual(['Mapa']);
    typeFilter('');
    expect(resourceNames()).toHaveLength(3);
  });

  it('FT-006-07 · el filtro casa también contra el tipo mostrado', () => {
    addImage('ft-1', 'Retrato');
    addFont('ft-2', 'Titular');
    mountEditMode();

    typeFilter('tipograf');
    expect(resourceNames()).toEqual(['Titular']);
  });

  it('FT-006-08 · el filtro casa también contra el identificador interno', () => {
    addImage('abc-123', 'Fondo');
    addImage('xyz-999', 'Marco');
    mountEditMode();

    typeFilter('abc-123');
    expect(resourceNames()).toEqual(['Fondo']);
  });

  it('FT-006-09 · el filtro es insensible a mayúsculas y tildes', () => {
    addImage('acc-1', 'Águila');
    mountEditMode();

    typeFilter('aguila');
    expect(resourceNames()).toEqual(['Águila']);
    typeFilter('AGUILA');
    expect(resourceNames()).toEqual(['Águila']);
  });

  it('FT-006-10 · sin coincidencias, el tbody muestra .resource-list__empty-filter y la cabecera sigue', () => {
    addImage('nc-1', 'Uno');
    addImage('nc-2', 'Dos');
    mountEditMode();

    typeFilter('zzz');
    expect(document.querySelectorAll('.resource-list thead th').length).toBe(4);
    expect(document.querySelectorAll('.resource-list tbody .resource-list__empty-filter')).toHaveLength(1);
  });

  it('FT-006-11 · la columna "Usos" no participa en el filtro de texto', () => {
    const r = addImage('nu-1', 'Fondo');
    for (let i = 0; i < 5; i += 1) addCartaUsing(`nu-carta-${i}`, 'nu-1');
    mountEditMode();

    // El recurso tiene 5 usos; filtrar "5" no lo encuentra.
    typeFilter('5');
    expect(resourceNames()).toHaveLength(0);
    // Filtrar por su nombre sí.
    typeFilter('fondo');
    expect(resourceNames()).toEqual(['Fondo']);
  });

  it('FT-006-12 · el texto de filtro es transitorio: no sobrevive a un resetState()', () => {
    addImage('tr-1', 'Mapa');
    addImage('tr-2', 'Ficha');
    mountEditMode();
    typeFilter('map');
    expect(resourceNames()).toEqual(['Mapa']);

    // resetState() hace loadResources([]); al remontar en vacío el módulo pone
    // filterText = ''. Al sembrar de nuevo, todas las filas visibles.
    resetState();
    mountEditMode();
    addImage('tr-3', 'Mapa');
    addImage('tr-4', 'Ficha');
    mountEditMode();
    expect(resourceNames().sort()).toEqual(['Ficha', 'Mapa']);
  });

  // --- Nivel ui: persistencia independiente ---

  it('FT-006-13 · resourcePanelState es independiente del panelState de Componentes', () => {
    loadResourcePanelState({ collapsed: true, width: 400 });
    mountEditMode();

    const container = document.querySelector('.resource-panel-container');
    expect(container.style.width).toBe('400px');
    // Colapsado: renderResourceList no pinta el cuerpo.
    expect(container.querySelector('.resource-panel__body')).toBeNull();

    // Pulsar colapsar togglea getResourcePanelState().collapsed…
    const toggleBtn = document.querySelector('.resource-panel__header button');
    toggleBtn.click();
    expect(getResourcePanelState().collapsed).toBe(false);
    // …sin tocar el panelState del panel de Componentes.
    expect(getPanelState().collapsed).toBeFalsy();
  });
});
