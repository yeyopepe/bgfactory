// Funcionalidad 014 — Interacciones programadas de un componente (secundaria:
// 005, sincronización en componentes tipo Copia).
//
// Valida el registro por tipo de interacción de click izquierdo
// (core/interactions.js), `isInteractionActive`, los valores por defecto del
// modelo (interaccionesDesactivadas: [], accionClickDerecho: 'ninguno'), la
// migración de guardados antiguos (accionClickDerecho ausente -> 'menuContextual'),
// la pestaña "Interacciones" de la modal (combos + fila de click derecho), el
// efecto de desactivar cada interacción en Modo Juego, el efecto de
// accionClickDerecho: 'ninguno' sobre el botón derecho, el reflejo en la
// sección informativa del menú contextual, y la sincronización de
// interaccionesDesactivadas/accionClickDerecho en un componente tipo Copia.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import {
  resetState, mountEditMode, mountPlayMode, dispatchContextMenu, getOpenContextMenu, mockRandom, restoreAllMocks,
} from '../helpers.js';
import { getComponents, addComponent, replaceComponent, loadComponents } from '../../core/state.js';
import { createComponent, syncCopyWithOriginal, createCopy } from '../../core/component.js';
import { getInteractionsForType, isInteractionActive } from '../../core/interactions.js';
import { createDefaultComponent, openComponentModal } from '../../ui/componentModal.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 14, secondary: [5] });

describe('014 — Interacciones programadas de un componente', () => {
  beforeEach(resetState);

  afterEach(() => {
    restoreAllMocks();
    document.querySelectorAll('.modal-overlay, .context-menu').forEach((o) => o.remove());
  });

  function addComp(type, id, compExtra = {}) {
    const c = createDefaultComponent(type);
    c.id = id;
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  it('FT-014-01 · interacciones por tipo (state)', () => {
    expect(getInteractionsForType('dado').map((i) => i.key)).toEqual(['lanzar']);
    expect(getInteractionsForType('carta').map((i) => i.key)).toEqual(['voltear']);
    expect(getInteractionsForType('mazo').map((i) => i.key)).toEqual(['sacarCarta']);
    expect(getInteractionsForType('texto')).toEqual([]);
    expect(getInteractionsForType('tableroSimple')).toEqual([]);
    expect(getInteractionsForType('documento')).toEqual([]);
    expect(getInteractionsForType('tableroPersonalizado')).toEqual([]);
    expect(getInteractionsForType('inexistente')).toEqual([]);
  });

  it('FT-014-02 · isInteractionActive respeta interaccionesDesactivadas (state)', () => {
    expect(isInteractionActive({ interaccionesDesactivadas: [] }, 'lanzar')).toBe(true);
    expect(isInteractionActive({ interaccionesDesactivadas: ['lanzar'] }, 'lanzar')).toBe(false);
    expect(isInteractionActive({}, 'lanzar')).toBe(true);
  });

  it('FT-014-03 · defaults del modelo (state)', () => {
    expect(createDefaultComponent('dado').interaccionesDesactivadas).toEqual([]);
    expect(createDefaultComponent('dado').accionClickDerecho).toBe('ninguno');
    expect(createComponent({ type: 'carta' }).interaccionesDesactivadas).toEqual([]);
    expect(createComponent({ type: 'carta' }).accionClickDerecho).toBe('ninguno');
    expect(isInteractionActive(createDefaultComponent('mazo'), 'sacarCarta')).toBe(true);
  });

  it('FT-014-04 · migración de accionClickDerecho en guardado antiguo (state)', () => {
    const c = createComponent({ type: 'dado' });
    delete c.accionClickDerecho;
    c.id = 'd-old';
    const nuevo = createComponent({ type: 'dado' });
    nuevo.id = 'd-new';
    loadComponents([c, nuevo]);

    expect(getComponents().find((x) => x.id === 'd-old').accionClickDerecho).toBe('menuContextual');
    expect(getComponents().find((x) => x.id === 'd-new').accionClickDerecho).toBe('ninguno');
  });

  it('FT-014-05 · pestaña "Interacciones" de la modal: combos y fila de click derecho (ui)', () => {
    mountEditMode();
    const dado = addComp('dado', 'dado-1');

    openComponentModal({ component: dado, onAccept() {} });
    let modal = document.querySelector('.modal-overlay .modal');
    let tabs = [...modal.querySelectorAll('.modal__tab')];
    const interaccionesTab = tabs.find((tb) => tb.textContent === t('componentModal.tab.interacciones'));
    expect(interaccionesTab).toBeTruthy();
    interaccionesTab.click();

    let fieldset = [...modal.querySelectorAll('fieldset.modal__section')].find(
      (fs) => fs.querySelector('legend.modal__section-title')?.textContent === t('componentModal.programmedInteractions'),
    );
    expect(fieldset).toBeTruthy();

    const selects = [...fieldset.querySelectorAll('select')];
    expect(selects).toHaveLength(2);

    const leftSelect = selects[0];
    expect([...leftSelect.options].map((o) => o.value)).toEqual(['activa', 'ninguna']);
    expect(leftSelect.value).toBe('activa');

    const rightSelect = selects[1];
    expect([...rightSelect.options].map((o) => o.value)).toEqual(['ninguno', 'menuContextual']);
    expect(rightSelect.value).toBe('ninguno');

    let captured = null;
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
    openComponentModal({ component: dado, onAccept: (result) => { captured = result; } });
    modal = document.querySelector('.modal-overlay .modal');
    tabs = [...modal.querySelectorAll('.modal__tab')];
    tabs.find((tb) => tb.textContent === t('componentModal.tab.interacciones')).click();
    fieldset = [...modal.querySelectorAll('fieldset.modal__section')].find(
      (fs) => fs.querySelector('legend.modal__section-title')?.textContent === t('componentModal.programmedInteractions'),
    );
    const selects2 = [...fieldset.querySelectorAll('select')];
    selects2[0].value = 'ninguna';
    selects2[0].dispatchEvent(new Event('change', { bubbles: true }));
    selects2[1].value = 'menuContextual';
    selects2[1].dispatchEvent(new Event('change', { bubbles: true }));

    modal.querySelector('.btn-accept').click();

    expect(captured.interaccionesDesactivadas).toContain('lanzar');
    expect(captured.accionClickDerecho).toBe('menuContextual');

    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
    const texto = addComp('texto', 'texto-1');
    openComponentModal({ component: texto, onAccept() {} });
    modal = document.querySelector('.modal-overlay .modal');
    tabs = [...modal.querySelectorAll('.modal__tab')];
    tabs.find((tb) => tb.textContent === t('componentModal.tab.interacciones')).click();
    fieldset = [...modal.querySelectorAll('fieldset.modal__section')].find(
      (fs) => fs.querySelector('legend.modal__section-title')?.textContent === t('componentModal.programmedInteractions'),
    );
    expect(fieldset).toBeTruthy();
    expect([...fieldset.querySelectorAll('select')]).toHaveLength(1);
  });

  it('FT-014-06 · Modo Juego: desactivar "lanzar" impide la tirada', async () => {
    mockRandom(new Array(64).fill(0.999));
    addComp('dado', 'd1', { interaccionesDesactivadas: ['lanzar'], properties: { resultadoActual: '1' } });

    const content = mountPlayMode();
    const dice = content.querySelector('.dice');
    expect(dice.classList.contains('dice--clickable')).toBe(false);

    dice.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250 + 1000 + 400));

    expect(content.querySelector('.dice__result').textContent).toBe('1');
    expect(getComponents().find((c) => c.id === 'd1').properties.resultadoActual).toBe('1');

    // Nota de implementación: en componentRenderer.js el listener 'dblclick' que abre
    // la modal de resultado grande vive DENTRO del mismo `if (onDiceResult &&
    // isInteractionActive(component, 'lanzar'))` que el 'click' de lanzar — no es un
    // listener independiente como afirmaba el plan original. Con "lanzar" desactivado
    // ningún listener de click se adjunta, así que el doble-click tampoco abre nada
    // aquí. Se verifica el comportamiento real en vez del que describía el plan.
    dice.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(document.body.querySelector('.dice-result-modal, .modal-overlay')).toBeNull();
  });

  it('FT-014-07 · Modo Juego: desactivar "voltear" impide el flip', () => {
    addComp('carta', 'c1', { interaccionesDesactivadas: ['voltear'], properties: { caraActual: 'trasera' } });

    const content = mountPlayMode();
    const carta = content.querySelector('.carta');
    expect(carta.classList.contains('carta--clickable')).toBe(false);

    carta.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(getComponents().find((c) => c.id === 'c1').properties.caraActual).toBe('trasera');
  });

  it('FT-014-08 · Modo Juego: desactivar "sacarCarta" impide sacar del mazo', () => {
    const carta = addComp('carta', 'carta-x');
    addComp('mazo', 'm1', { interaccionesDesactivadas: ['sacarCarta'], properties: { cartaIds: [carta.id] } });

    const content = mountPlayMode();
    const candidateMazo = content.querySelector('.infinite-table__world .carta');
    candidateMazo.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(getComponents().find((c) => c.id === 'm1').properties.cartaIds).toEqual([carta.id]);
  });

  it('FT-014-09 · Modo Juego: accionClickDerecho "ninguno" -> el botón derecho no hace nada', () => {
    addComp('dado', 'd1', { accionClickDerecho: 'ninguno' });
    addComp('dado', 'd2', { accionClickDerecho: 'menuContextual' });

    const content = mountPlayMode();
    const dices = content.querySelectorAll('.dice');

    dispatchContextMenu(dices[0]);
    expect(getOpenContextMenu()).toBeNull();
    expect(dices[0].classList.contains('dice--selected')).toBe(false);

    dispatchContextMenu(dices[1]);
    expect(getOpenContextMenu()).toBeTruthy();
  });

  it('FT-014-10 · sección informativa "Interacciones" del menú contextual refleja el ajuste', () => {
    addComp('dado', 'd1', { accionClickDerecho: 'menuContextual', interaccionesDesactivadas: ['lanzar'] });
    addComp('dado', 'd2', { accionClickDerecho: 'menuContextual', interaccionesDesactivadas: [] });

    const content = mountPlayMode();
    const dices = content.querySelectorAll('.dice');

    dispatchContextMenu(dices[0]);
    let menu = getOpenContextMenu();
    let rows = [...menu.querySelectorAll('.context-menu__info-row')];
    let leftRow = rows.find((r) => r.querySelector('.context-menu__info-label')?.textContent === t('interaction.leftClick'));
    expect(leftRow.querySelector('.context-menu__info-value').classList.contains('context-menu__info-value--none')).toBe(true);
    expect(leftRow.querySelector('.context-menu__info-value').textContent).toBe(t('interaction.value.none'));
    document.querySelectorAll('.context-menu').forEach((o) => o.remove());

    dispatchContextMenu(dices[1]);
    menu = getOpenContextMenu();
    rows = [...menu.querySelectorAll('.context-menu__info-row')];
    leftRow = rows.find((r) => r.querySelector('.context-menu__info-label')?.textContent === t('interaction.leftClick'));
    expect(leftRow.querySelector('.context-menu__info-value').classList.contains('context-menu__info-value--none')).toBe(false);
  });

  it('FT-014-11 · sincronización en componente tipo Copia (state, secundaria 5)', () => {
    const original = addComp('dado', 'orig-1', { interaccionesDesactivadas: ['lanzar'], accionClickDerecho: 'menuContextual' });
    let copy = createCopy(original, getComponents());
    copy = syncCopyWithOriginal(copy, original);

    expect(copy.interaccionesDesactivadas).toEqual(['lanzar']);
    expect(copy.accionClickDerecho).toBe('menuContextual');

    const updatedOriginal = { ...original, interaccionesDesactivadas: [] };
    copy = syncCopyWithOriginal(copy, updatedOriginal);
    expect(copy.interaccionesDesactivadas).toEqual([]);
  });
});
