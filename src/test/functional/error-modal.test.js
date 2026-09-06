// Funcionalidad 033 — Modal de error común a toda la app.
// Nivel interfaz: showErrorModal(title, message, detail) siempre pinta la misma
// ventana modal (cabecera de error + icono, mensaje, detalle opcional, botón
// "Cerrar"), añadida a document.body. Contraste con ui/toast.js: los errores
// usan modal, no toast.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { initI18n } from '../../core/i18n.js';
import { showErrorModal } from '../../ui/errorModal.js';

registerFeature({ primary: 33 });

const overlay = () => document.body.querySelector('.modal-overlay');
const errHeader = () => document.body.querySelector('.modal-overlay .modal__header--error');

describe('033 — Modal de error común a toda la app', () => {
  beforeEach(() => {
    initI18n(); // showErrorModal usa t('common.close'); initI18n es idempotente
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
  });
  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
  });

  it('FT-033-01 · showErrorModal pinta la ventana modal de error con cabecera e icono', () => {
    showErrorModal('Título del error', 'Mensaje explicativo');

    expect(overlay()).toBeTruthy();
    const header = errHeader();
    expect(header).toBeTruthy();
    expect(header.querySelector('.modal__error-icon').textContent).toBe('!');
    expect(header.querySelector('.modal__header-title').textContent).toBe('Título del error');
    expect(overlay().querySelector('.modal__content p').textContent).toBe('Mensaje explicativo');
  });

  it('FT-033-02 · el bloque de detalle sólo aparece si se pasa detail', () => {
    showErrorModal('T', 'M');
    expect(overlay().querySelector('.modal__error-detail')).toBeNull();

    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());

    showErrorModal('T', 'M', 'Traza técnica: línea 42');
    const detail = overlay().querySelector('.modal__error-detail');
    expect(detail).toBeTruthy();
    expect(detail.textContent).toBe('Traza técnica: línea 42');
  });

  it('FT-033-03 · el botón "Cerrar" cierra la ventana', () => {
    showErrorModal('T', 'M');
    expect(overlay()).toBeTruthy();

    overlay().querySelector('.modal__footer .btn-cancel').click();

    expect(overlay()).toBeNull();
  });

  it('FT-033-04 · pulsar fuera de la ventana la cierra', () => {
    showErrorModal('T', 'M');
    const ov = overlay();
    expect(ov).toBeTruthy();

    // El módulo exige mousedown Y click, ambos con target === overlay.
    ov.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    ov.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay()).toBeNull();
  });

  it('FT-033-05 · un click dentro de la ventana NO la cierra', () => {
    showErrorModal('T', 'M');
    const modalBox = overlay().querySelector('.modal');

    modalBox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    modalBox.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay()).toBeTruthy();
  });

  it('FT-033-06 · los errores usan la ventana modal, no un toast', () => {
    showErrorModal('T', 'M');

    expect(document.body.querySelector('.toast')).toBeNull();
    expect(errHeader()).toBeTruthy();
  });
});
