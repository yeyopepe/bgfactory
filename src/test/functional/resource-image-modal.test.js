// Funcionalidad 007 — Edición de un recurso Imagen, con vista previa ampliada de
// zoom y pan.
// Nivel ui: abre ui/resourceModal.js sobre un recurso imagen simulado y lee la
// transformación aplicada a la vista previa (`transform: translate(x, y) scale(z)`).
//
// La conversión real a WebP al pulsar "Cambiar imagen…" queda fuera (competencia
// de la func. 010, necesita un File real): el reinicio de vista al cambiar imagen
// usa el mismo resetView() que el botón de reset, cubierto aquí por FT-007-08.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState } from '../helpers.js';
import { openResourceModal } from '../../ui/resourceModal.js';
import { RESOURCE_TYPES } from '../../core/resource.js';
import { initI18n, t } from '../../core/i18n.js';

registerFeature({ primary: 7 });

// --- Helpers locales ---

function openImageModal(overrides = {}) {
  const resource = {
    id: 'r1', name: 'Foto', type: RESOURCE_TYPES.IMAGE,
    dataUrl: 'data:image/webp;base64,AA==', fileName: 'foto.webp', mimeType: 'image/webp',
    ...overrides,
  };
  openResourceModal({ resource, onAccept: () => {}, onDelete: () => false });
  return document.querySelector('.modal-overlay .modal');
}

// "translate(Xpx, Ypx) scale(Z)" → { x, y, zoom } | null
function parseTransform(img) {
  const m = img.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/);
  return m ? { x: +m[1], y: +m[2], zoom: +m[3] } : null;
}

function previewImg(modal) {
  return modal.querySelector('.resource-modal__image-preview__img');
}

function zoomButtons(modal) {
  return [...modal.querySelectorAll('.resource-modal__zoom-btn')];
}

function zoomLevelText(modal) {
  return modal.querySelector('.resource-modal__zoom-level').textContent;
}

describe('007 — Edición de un recurso Imagen (zoom y pan)', () => {
  beforeEach(() => {
    resetState();
    initI18n(); // el modal usa t(); idempotente.
  });

  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); // cierra cualquier drag abierto.
  });

  it('FT-007-01 · el modal de imagen es más ancho (clase resource-modal--image)', () => {
    const modal = openImageModal();
    expect(modal.classList.contains('resource-modal--image')).toBe(true);
  });

  it('FT-007-02 · estructura: campo Nombre, vista previa, indicador y 3 botones de zoom, botón "Cambiar imagen"', () => {
    const modal = openImageModal();

    const nameInput = modal.querySelector('input[type="text"]');
    expect(nameInput).toBeTruthy();
    expect(nameInput.value).toBe('Foto');

    const preview = modal.querySelector('.resource-modal__image-preview');
    expect(preview).toBeTruthy();
    expect(previewImg(modal).src).toContain('data:image/webp;base64,AA==');
    expect(modal.querySelector('.resource-modal__zoom-level')).toBeTruthy();
    expect(modal.querySelectorAll('.resource-modal__zoom-controls .resource-modal__zoom-btn')).toHaveLength(3);

    const changeBtn = [...modal.querySelectorAll('button')].find((b) => b.textContent === t('resourceModal.changeImage'));
    expect(changeBtn).toBeTruthy();
  });

  it('FT-007-03 · zoom inicial 100 %, transform neutra', () => {
    const modal = openImageModal();
    expect(zoomLevelText(modal)).toBe('100%');
    expect(parseTransform(previewImg(modal))).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('FT-007-04 · el botón "+" acerca de forma centrada (zoom 1.2, sin desplazamiento)', () => {
    const modal = openImageModal();
    zoomButtons(modal)[0].click(); // zoom in → zoomAt(0,0,1.2)
    const tr = parseTransform(previewImg(modal));
    expect(tr.zoom).toBe(1.2);
    expect(tr.x).toBe(0);
    expect(tr.y).toBe(0);
    expect(zoomLevelText(modal)).toBe('120%');
  });

  it('FT-007-05 · el botón "-" desde 100 % queda con clamp inferior en 100 %', () => {
    const modal = openImageModal();
    zoomButtons(modal)[1].click(); // zoom out desde 1 → clamp a ZOOM_MIN = 1
    const tr = parseTransform(previewImg(modal));
    expect(tr.zoom).toBe(1);
    expect(tr.x).toBe(0);
    expect(tr.y).toBe(0);
    expect(zoomLevelText(modal)).toBe('100%');
  });

  it('FT-007-06 · clamp superior en 500 %', () => {
    const modal = openImageModal();
    for (let i = 0; i < 12; i += 1) zoomButtons(modal)[0].click();
    expect(parseTransform(previewImg(modal)).zoom).toBe(5);
    expect(zoomLevelText(modal)).toBe('500%');
  });

  it('FT-007-07 · la rueda del ratón hace zoom y llama a preventDefault()', () => {
    const modal = openImageModal();
    const box = modal.querySelector('.resource-modal__image-preview');

    const evUp = new WheelEvent('wheel', { deltaY: -1, clientX: 10, clientY: 10, bubbles: true, cancelable: true });
    box.dispatchEvent(evUp);
    expect(evUp.defaultPrevented).toBe(true);
    const zoomInWheel = parseTransform(previewImg(modal)).zoom;
    expect(zoomInWheel > 1).toBe(true);

    // deltaY positivo desde un zoom > 1 → el zoom baja.
    const evDown = new WheelEvent('wheel', { deltaY: 1, clientX: 10, clientY: 10, bubbles: true, cancelable: true });
    box.dispatchEvent(evDown);
    expect(parseTransform(previewImg(modal)).zoom < zoomInWheel).toBe(true);
  });

  it('FT-007-08 · el botón de reset vuelve a 100 % centrada', () => {
    const modal = openImageModal();
    zoomButtons(modal)[0].click();
    zoomButtons(modal)[0].click();
    zoomButtons(modal)[0].click();
    zoomButtons(modal)[2].click(); // reset
    expect(parseTransform(previewImg(modal))).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(zoomLevelText(modal)).toBe('100%');
  });

  it('FT-007-09 · el indicador de nivel de zoom está siempre presente y con formato N%', () => {
    const modal = openImageModal();
    const check = () => expect(/^\d+%$/.test(zoomLevelText(modal))).toBe(true);
    check();
    zoomButtons(modal)[0].click(); check();
    zoomButtons(modal)[1].click(); check();
    zoomButtons(modal)[2].click(); check();
  });

  it('FT-007-10 · el pan solo funciona con zoom > 100 %', () => {
    const modal = openImageModal();
    const img = previewImg(modal);

    // A 100 %: mousedown + mousemove no desplaza.
    img.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30, bubbles: true }));
    expect(parseTransform(img).x).toBe(0);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Con zoom > 1: el mismo gesto desplaza.
    zoomButtons(modal)[0].click(); // zoom 1.2, offset sigue 0,0 (zoomAt(0,0,·))
    img.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30, bubbles: true }));
    const tr = parseTransform(img);
    expect(tr.x).toBe(50);
    expect(tr.y).toBe(30);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('FT-007-11 · el modal de Tipografía no ofrece controles de zoom/pan', () => {
    const modal = openImageModal({ type: RESOURCE_TYPES.FONT, fileName: 'f.ttf', mimeType: 'font/ttf' });
    expect(modal.classList.contains('resource-modal--image')).toBe(false);
    expect(modal.querySelector('.resource-modal__image-preview')).toBeNull();
    expect(modal.querySelector('.resource-modal__zoom-controls')).toBeNull();
    expect(modal.querySelector('.resource-modal__zoom-level')).toBeNull();
    expect(modal.querySelector('.resource-modal__font-preview')).toBeTruthy();
  });
});
