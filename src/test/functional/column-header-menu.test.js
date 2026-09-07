// Funcionalidad 004 — Ordenación y filtrado desde la cabecera de columna.
// Se ejercita sobre los paneles de Componentes (func. 003) y de Recursos
// (func. 006), de ahí `secondary: [3, 6]`.
// Nivel state + ui.
//
// Aislamiento: `columnSort`/`columnFilters`/`filterText` son estado de módulo de
// ui/componentList.js y ui/resourceList.js (uno por módulo) que resetState() NO
// limpia. Se resetean solos al renderizar con la lista vacía; además, cada caso
// deja el menú de columna cerrado (Esc) y remonta con datos propios.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { addComponent, addResource } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { createResource, RESOURCE_TYPES } from '../../core/resource.js';
import { compareValues } from '../../core/textSort.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 4, secondary: [3, 6] });

// --- Helpers locales ---

function addCarta(id, extra = {}) {
  const c = createDefaultComponent('carta');
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);
  return c;
}

function addTexto(id, extra = {}) {
  const c = createDefaultComponent('texto');
  c.id = id;
  Object.assign(c, extra);
  addComponent(c);
  return c;
}

function addImage(id, name) {
  const r = createResource({
    id, name, type: RESOURCE_TYPES.IMAGE,
    dataUrl: 'data:image/webp;base64,AA==', fileName: `${name}.webp`, mimeType: 'image/webp',
  });
  addResource(r);
  return r;
}

// Abre el menú de la columna `colKey` de la tabla `listSelector` y devuelve el
// nodo `.column-header-menu` (en document.body).
function openColumnMenu(listSelector, colKey) {
  const th = document.querySelector(`${listSelector} th[data-col="${colKey}"]`);
  th.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return document.querySelector('.column-header-menu');
}

function menuItemByLabel(menu, label) {
  return [...menu.querySelectorAll('.column-header-menu__item')].find((i) => i.textContent === label) ?? null;
}

function rowIdsOf(listSelector) {
  return [...document.querySelectorAll(`${listSelector} .component-list__row`)].map((r) => r.dataset.id);
}

function resourceRowNames(listSelector) {
  return [...document.querySelectorAll(`${listSelector} tbody tr`)]
    .filter((tr) => !tr.querySelector('.resource-list__empty, .resource-list__empty-filter'))
    .map((tr) => tr.firstChild.textContent);
}

function closeMenu() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
}

describe('004 — Ordenación y filtrado desde la cabecera de columna', () => {
  beforeEach(() => {
    resetState();
    // `columnSort`/`columnFilters`/`filterText` de componentList.js y
    // resourceList.js son estado de módulo que resetState() no toca, pero cada
    // módulo los pone a cero al renderizarse con la lista vacía. Un montaje
    // "en vacío" antes de sembrar deja cada caso con estado de columna limpio.
    mountEditMode();
  });

  afterEach(() => {
    closeMenu();
    document.querySelectorAll('.column-header-menu, .modal-overlay').forEach((n) => n.remove());
  });

  // --- Nivel state ---

  it('FT-004-01 · compareValues: numérico puro, numeric-aware en texto, insensible a tildes/caso', () => {
    expect(compareValues(2, 10) < 0).toBe(true);
    expect(compareValues('carta-2', 'carta-10') < 0).toBe(true);
    expect(compareValues('Águila', 'aguila')).toBe(0);
    expect(compareValues('b', 'a') > 0).toBe(true);
  });

  // --- Nivel ui: indicador de cabecera ---

  it('FT-004-02 · toda cabecera interactiva lleva indicador y clase; "Acciones" no', () => {
    addCarta('ind-a');
    addCarta('ind-b');
    mountEditMode();

    for (const col of ['orden', 'id', 'tipo', 'copia']) {
      const th = document.querySelector(`.component-list thead th[data-col="${col}"]`);
      expect(th.querySelector('.column-header-menu__indicator')).toBeTruthy();
      expect(th.classList.contains('column-header--interactive')).toBe(true);
    }
    const acciones = document.querySelector('.component-list thead th[data-col="acciones"]');
    expect(acciones.querySelector('.column-header-menu__indicator')).toBeNull();
    expect(acciones.classList.contains('column-header--interactive')).toBe(false);
  });

  it('FT-004-03 · el indicador pasa de apagado a --active al aplicar una ordenación', () => {
    addCarta('act-a');
    addCarta('act-b');
    mountEditMode();

    const before = document.querySelector('.component-list thead th[data-col="id"] .column-header-menu__indicator');
    expect(before.classList.contains('column-header-menu__indicator--active')).toBe(false);

    const menu = openColumnMenu('.component-list', 'id');
    menuItemByLabel(menu, t('columnMenu.sortAsc')).click();

    const after = document.querySelector('.component-list thead th[data-col="id"] .column-header-menu__indicator');
    expect(after.classList.contains('column-header-menu__indicator--active')).toBe(true);
  });

  it('FT-004-04 · el menú se cuelga directamente de document.body, fuera de #content', () => {
    addCarta('body-a');
    mountEditMode();
    const menu = openColumnMenu('.component-list', 'tipo');
    expect(menu.parentElement === document.body).toBe(true);
    expect(document.getElementById('content').contains(menu)).toBe(false);
  });

  // --- Nivel ui: ordenación toggle y exclusiva por tabla ---

  it('FT-004-05 · ordenar es toggle y solo una columna ordenada a la vez por tabla', () => {
    addCarta('c');
    addCarta('a');
    addCarta('b');
    mountEditMode();

    let menu = openColumnMenu('.component-list', 'id');
    menuItemByLabel(menu, t('columnMenu.sortAsc')).click();
    expect(rowIdsOf('.component-list')).toEqual(['a', 'b', 'c']);

    // Reabrir: "Ordenar A..Z" queda marcada; pulsarla de nuevo desactiva y vuelve
    // al orden por defecto (por `order`: c añadido primero → order 3, a → 2, b → 1).
    menu = openColumnMenu('.component-list', 'id');
    expect(menuItemByLabel(menu, t('columnMenu.sortAsc')).classList.contains('column-header-menu__item--active')).toBe(true);
    menuItemByLabel(menu, t('columnMenu.sortAsc')).click();
    expect(rowIdsOf('.component-list')).toEqual(['b', 'a', 'c']);

    // Activar Z..A en `id`, luego A..Z en `tipo`: la ordenación de `id` se apaga.
    menu = openColumnMenu('.component-list', 'id');
    menuItemByLabel(menu, t('columnMenu.sortDesc')).click();
    menu = openColumnMenu('.component-list', 'tipo');
    menuItemByLabel(menu, t('columnMenu.sortAsc')).click();
    menu = openColumnMenu('.component-list', 'id');
    expect(menuItemByLabel(menu, t('columnMenu.sortAsc')).classList.contains('column-header-menu__item--active')).toBe(false);
    expect(menuItemByLabel(menu, t('columnMenu.sortDesc')).classList.contains('column-header-menu__item--active')).toBe(false);
  });

  // --- Nivel ui: filtrado por valor ---

  it('FT-004-06 · filtrar por un valor de columna deja solo las filas con ese valor y activa el indicador', () => {
    addCarta('flt-carta-1');
    addCarta('flt-carta-2');
    addTexto('flt-texto-1');
    mountEditMode();

    const menu = openColumnMenu('.component-list', 'tipo');
    const select = menu.querySelector('.column-header-menu__filter select');
    expect(select).toBeTruthy();
    // <option value=""> "Todos" + una opción por valor distinto.
    const optionValues = [...select.options].map((o) => o.value);
    expect(optionValues).toContain('');
    expect(optionValues).toContain('carta');
    expect(optionValues).toContain('texto');

    select.value = 'carta';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    const ids = rowIdsOf('.component-list');
    expect(ids).toContain('flt-carta-1');
    expect(ids).toContain('flt-carta-2');
    expect(ids).toHaveLength(2);

    const indicator = document.querySelector('.component-list thead th[data-col="tipo"] .column-header-menu__indicator');
    expect(indicator.classList.contains('column-header-menu__indicator--active')).toBe(true);
  });

  it('FT-004-07 · los filtros de columna son acumulables entre columnas distintas (AND)', () => {
    addCarta('acc-carta-a');
    addCarta('acc-carta-b');
    addTexto('acc-texto-a');
    // Una copia de carta para que el filtro `copia` discrimine.
    const orig = addCarta('acc-carta-orig');
    addComponent({ ...createDefaultComponent('carta'), id: 'acc-carta-orig-COPY-001', copyOf: 'acc-carta-orig' });
    mountEditMode();

    let menu = openColumnMenu('.component-list', 'tipo');
    let select = menu.querySelector('.column-header-menu__filter select');
    select.value = 'carta';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    menu = openColumnMenu('.component-list', 'copia');
    select = menu.querySelector('.column-header-menu__filter select');
    select.value = t('common.no');
    select.dispatchEvent(new Event('change', { bubbles: true }));

    const ids = rowIdsOf('.component-list');
    // Cartas que NO son copia: acc-carta-a, acc-carta-b, acc-carta-orig.
    expect(ids).toContain('acc-carta-a');
    expect(ids).toContain('acc-carta-b');
    expect(ids).toContain('acc-carta-orig');
    expect(ids).toHaveLength(3);
    expect(ids.includes('acc-carta-orig-COPY-001')).toBe(false);
    expect(ids.includes('acc-texto-a')).toBe(false);
  });

  it('FT-004-08 · las opciones del filtro se calculan sobre la lista completa, no sobre lo ya filtrado', () => {
    addCarta('fv-carta-a');
    const orig = addCarta('fv-carta-orig');
    addComponent({ ...createDefaultComponent('carta'), id: 'fv-carta-orig-COPY-001', copyOf: 'fv-carta-orig' });
    mountEditMode();

    // Filtrar `tipo` = carta.
    let menu = openColumnMenu('.component-list', 'tipo');
    let select = menu.querySelector('.column-header-menu__filter select');
    select.value = 'carta';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    // El menú de `copia` sigue ofreciendo "Sí" y "No" (valores sobre `items` completos).
    menu = openColumnMenu('.component-list', 'copia');
    const values = [...menu.querySelectorAll('.column-header-menu__filter select option')].map((o) => o.value);
    expect(values).toContain(t('common.yes'));
    expect(values).toContain(t('common.no'));
  });

  it('FT-004-09 · la columna "Orden" solo ofrece ordenar, sin bloque de filtro', () => {
    addCarta('ord-a');
    addCarta('ord-b');
    mountEditMode();

    const menu = openColumnMenu('.component-list', 'orden');
    expect(menu.querySelectorAll('.column-header-menu__item')).toHaveLength(2);
    expect(menu.querySelector('.column-header-menu__filter')).toBeNull();
  });

  // --- Nivel ui: "sin resultados" con cabecera visible ---

  it('FT-004-10 · un filtro sin resultados deja la cabecera y su tbody con .component-list__empty-filter', () => {
    addCarta('nr-uno');
    addCarta('nr-dos');
    mountEditMode();

    const filterInput = document.querySelector('.component-panel__filter input');
    filterInput.value = 'zzzz-no-casa-nada';
    filterInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Cabecera intacta.
    expect(document.querySelectorAll('.component-list thead th').length).toBe(5);
    const emptyRows = document.querySelectorAll('.component-list tbody .component-list__empty-filter');
    expect(emptyRows).toHaveLength(1);

    // Se puede limpiar el filtro desde el propio cuadro: vuelven las filas.
    filterInput.value = '';
    filterInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(rowIdsOf('.component-list')).toHaveLength(2);
  });

  it('FT-004-11 · el estado de columna sobrevive a un remonte del panel', () => {
    addCarta('sv-c');
    addCarta('sv-a');
    addCarta('sv-b');
    mountEditMode();

    const menu = openColumnMenu('.component-list', 'id');
    menuItemByLabel(menu, t('columnMenu.sortAsc')).click();
    expect(rowIdsOf('.component-list')).toEqual(['sv-a', 'sv-b', 'sv-c']);

    // Remontar (nueva navegación de renderEditMode): el estado vive en el módulo
    // componentList.js, así que la ordenación persiste.
    mountEditMode();
    const indicator = document.querySelector('.component-list thead th[data-col="id"] .column-header-menu__indicator');
    expect(indicator.classList.contains('column-header-menu__indicator--active')).toBe(true);
    expect(rowIdsOf('.component-list')).toEqual(['sv-a', 'sv-b', 'sv-c']);
  });

  // --- Nivel ui: mismo menú sobre el panel de Recursos (secundaria 006) ---

  it('FT-004-12 · el mismo menú de cabecera funciona sobre el panel de Recursos', () => {
    addImage('res-1', 'Cebra');
    addImage('res-2', 'Ave');
    addImage('res-3', 'Búho');
    mountEditMode();

    const menu = openColumnMenu('.resource-list', 'nombre');
    menuItemByLabel(menu, t('columnMenu.sortDesc')).click();

    expect(resourceRowNames('.resource-list')).toEqual(['Cebra', 'Búho', 'Ave']);
  });
});
