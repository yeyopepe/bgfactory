// Funcionalidad 002 — Ventana de confirmación antes de crear un conjunto
// pre-definido de componentes (00275). Nivel ui: cubre el flujo completo
// desde el botón "+ Añadir componente" del panel de componentes hasta la
// creación real, pasando por el modal de tipo + la nueva ventana de
// confirmación. Numeración continúa desde FT-002-22 (french-deck-preset.test.js).
//
// Ambos modales (tipo + confirmación) añaden su .modal-overlay a document.body,
// apilados mientras la confirmación está abierta.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getComponents, getResources } from '../../core/state.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 2 });

function openAddModalViaUi() {
  const addButton = [...document.querySelectorAll('.component-panel__footer button')]
    .find((btn) => btn.textContent === t('componentList.add'));
  addButton.click();
}

function clickPreset() {
  document.body.querySelector('.component-type-modal__preset-item').click();
}

function overlays() {
  return [...document.body.querySelectorAll('.modal-overlay')];
}

function confirmModal() {
  return overlays().find((o) => o.querySelector('.preset-confirm-modal__summary'));
}

function typeModal() {
  return overlays().find((o) => o.querySelector('.component-type-modal__preset-item'));
}

function closeAllModals() {
  overlays().forEach((o) => o.remove());
}

// ui/progressModal.js#runWithProgressModal ejecuta `work` en un doble
// requestAnimationFrame anidado (para garantizar un repintado real antes de
// bloquear) — esperar 2 frames antes de comprobar el resultado de aceptar.
function waitForProgressWork() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

describe('002 — Ventana de confirmación de conjunto pre-definido', () => {
  beforeEach(() => {
    resetState();
    mountEditMode();
  });
  afterEach(() => {
    closeAllModals();
    resetState();
  });

  it('FT-002-23 · pulsar el preset abre la confirmación con el modal de tipo aún visible, y "Cancelar" cierra solo la confirmación sin crear nada', () => {
    openAddModalViaUi();
    clickPreset();

    expect(typeModal()).toBeTruthy();
    const confirm = confirmModal();
    expect(confirm).toBeTruthy();

    const deckIdInput = confirm.querySelector('#preset-confirm-deck-id');
    const cardPrefixInput = confirm.querySelector('#preset-confirm-card-prefix');
    expect(deckIdInput.value).toBe(t('componentTypeModal.preset.frenchDeck.deckName'));
    expect(cardPrefixInput.value).toBe('card-');

    confirm.querySelector('.btn-cancel').click();

    expect(confirmModal()).toBeFalsy();
    expect(typeModal()).toBeTruthy();
    expect(getComponents().length).toBe(0);
    expect(getResources().length).toBe(0);
  });

  it('FT-002-24 · "Aceptar" con los valores por defecto cierra ambos modales y crea el conjunto igual que antes', async () => {
    openAddModalViaUi();
    clickPreset();

    confirmModal().querySelector('.btn-accept').click();
    await waitForProgressWork();

    expect(confirmModal()).toBeFalsy();
    expect(typeModal()).toBeFalsy();

    const cartas = getComponents().filter((c) => c.type === 'carta');
    const mazo = getComponents().find((c) => c.type === 'mazo');
    expect(cartas.length).toBe(54);
    expect(mazo.id).toBe(t('componentTypeModal.preset.frenchDeck.deckName'));
    expect(cartas.some((c) => c.id === 'card-picas-as')).toBeTruthy();
  });

  it('FT-002-25 · "Aceptar" con un id de mazo y un prefijo de carta distintos los aplica a los componentes creados', async () => {
    openAddModalViaUi();
    clickPreset();

    const confirm = confirmModal();
    confirm.querySelector('#preset-confirm-deck-id').value = 'Mi Baraja Personalizada';
    confirm.querySelector('#preset-confirm-card-prefix').value = 'naipe-';
    confirm.querySelector('.btn-accept').click();
    await waitForProgressWork();

    const mazo = getComponents().find((c) => c.type === 'mazo');
    const cartas = getComponents().filter((c) => c.type === 'carta');
    expect(mazo.id).toBe('Mi Baraja Personalizada');
    expect(cartas.some((c) => c.id === 'naipe-picas-as')).toBeTruthy();
  });

  it('FT-002-26 · un id de mazo que ya existe se desambigua con sufijo "(n)" sin bloquear la confirmación', async () => {
    openAddModalViaUi();
    clickPreset();
    confirmModal().querySelector('.btn-accept').click();
    await waitForProgressWork();

    openAddModalViaUi();
    clickPreset();
    confirmModal().querySelector('.btn-accept').click();
    await waitForProgressWork();

    const mazos = getComponents().filter((c) => c.type === 'mazo');
    expect(mazos).toHaveLength(2);
    expect(mazos.map((m) => m.id)).toContain(t('componentTypeModal.preset.frenchDeck.deckName'));
    expect(mazos.map((m) => m.id)).toContain(`${t('componentTypeModal.preset.frenchDeck.deckName')}(1)`);
  });
});
