// Funcionalidad 011 — Búsqueda de imagen en el modal "Elegir imagen".
// Nivel ui: `ui/boardImageModal.js#openBoardImageModal` directamente sobre
// document.body, sin necesidad de mountEditMode().

import { describe, it, expect, afterEach, registerFeature } from '../harness.js';
import { createResource, RESOURCE_TYPES } from '../../core/resource.js';
import { openBoardImageModal } from '../../ui/boardImageModal.js';

registerFeature({ primary: 11 });

function addImage(id, name) {
  return createResource({
    id, name, type: RESOURCE_TYPES.IMAGE,
    dataUrl: 'data:image/webp;base64,AA==', fileName: `${name}.webp`, mimeType: 'image/webp',
  });
}

function searchInput() {
  return document.querySelector('.board-image-modal__search input');
}

function galleryNames() {
  return [...document.querySelectorAll('.board-image-modal__item .board-image-modal__name')].map((el) => el.textContent);
}

describe('011 — Búsqueda de imagen en "Elegir imagen"', () => {
  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
  });

  it('FT-011-01 · sin ninguna imagen, no se muestra el cuadro de búsqueda', () => {
    openBoardImageModal({ properties: {}, resources: [] });
    expect(document.querySelector('.board-image-modal__search')).toBeNull();
    expect(document.querySelector('.board-image-modal__empty')).toBeTruthy();
  });

  it('FT-011-02 · con al menos una imagen, se muestra el cuadro de búsqueda', () => {
    openBoardImageModal({ properties: {}, resources: [addImage('i1', 'Mapa')] });
    expect(searchInput()).toBeTruthy();
  });

  it('FT-011-03 · el filtrado ocurre en tiempo real, insensible a mayúsculas y tildes', () => {
    openBoardImageModal({
      properties: {},
      resources: [addImage('i1', 'Águila'), addImage('i2', 'Bosque')],
    });

    searchInput().value = 'aguila';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));
    expect(galleryNames()).toEqual(['Águila']);

    searchInput().value = 'AGUILA';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));
    expect(galleryNames()).toEqual(['Águila']);
  });

  it('FT-011-04 · sin coincidencias se muestra un mensaje en vez de la galería', () => {
    openBoardImageModal({ properties: {}, resources: [addImage('i1', 'Mapa')] });

    searchInput().value = 'zzz';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('.board-image-modal__empty-filter')).toBeTruthy();
    expect(document.querySelectorAll('.board-image-modal__item')).toHaveLength(0);
  });

  it('FT-011-05 · una selección oculta por el filtro se mantiene y se aplica al Aceptar si no se cambia', () => {
    const img = addImage('i1', 'Mapa');
    let accepted = null;
    openBoardImageModal({
      properties: { imagenResourceId: img.id },
      resources: [img, addImage('i2', 'Otra')],
      onAccept: (id) => { accepted = id; },
    });

    searchInput().value = 'otra';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));
    expect(galleryNames()).toEqual(['Otra']);

    document.querySelector('.btn-accept').click();
    expect(accepted).toBe(img.id);
  });

  it('FT-011-06 · el cuadro de búsqueda se reinicia vacío en cada apertura', () => {
    openBoardImageModal({ properties: {}, resources: [addImage('i1', 'Mapa'), addImage('i2', 'Otra')] });
    searchInput().value = 'mapa';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));
    expect(galleryNames()).toEqual(['Mapa']);
    document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());

    openBoardImageModal({ properties: {}, resources: [addImage('i3', 'Mapa2'), addImage('i4', 'Otra2')] });
    expect(searchInput().value).toBe('');
    expect(galleryNames().sort()).toEqual(['Mapa2', 'Otra2']);
  });
});
