// Funcionalidad 040 — Catálogo de propiedades de componentes, grupos y
// etiquetas. Valida la estructura observable de las tres ventanas de
// propiedades: modal de componente (5 pestañas + secciones/campos
// condicionados por tipo + footer), modal de grupo y modal de etiqueta; y los
// valores por defecto del modelo de cada tipo.
// No re-verifica la validación de id / número de pestañas que ya cubre
// component-modal-tabs.test.js (funcionalidad 002); aquí solo lo propio del
// catálogo (secciones y campos por tipo, modales de grupo y etiqueta).
// [gotcha] src/modes/edit/editMode.js mantiene selectedComponentIds como
// estado de módulo que resetState() no limpia — no hace falta selección aquí,
// pero se usan ids de componente distintos por caso por si acaso.
// [gotcha] El runner no carga el CSS: solo se comprueba estructura/orden de
// nodos, no apariencia.

import {
  describe, it, expect, beforeEach, afterEach, registerFeature,
} from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getComponents, addComponent, loadGroups, loadTags } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import {
  createDefaultComponent, openComponentModal,
  DEFAULT_BOARD_PROPERTIES, DEFAULT_DADO_PROPERTIES, DEFAULT_DOCUMENTO_PROPERTIES,
  DEFAULT_CARTA_PROPERTIES, DEFAULT_MAZO_PROPERTIES, DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES,
} from '../../ui/componentModal.js';
import { openGroupModal } from '../../ui/groupModal.js';
import { openTagModal } from '../../ui/tagModal.js';
import { initI18n, t } from '../../core/i18n.js';

registerFeature({ primary: 40 });

describe('040 — Catálogo de propiedades de componentes, grupos y etiquetas', () => {
  beforeEach(() => {
    resetState();
    initI18n();
  });

  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
  });

  function addComp(type, id) {
    const c = createDefaultComponent(type);
    c.id = id;
    addComponent(c);
    return c;
  }

  function openComponentModalFor(type, id) {
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
    resetState();
    initI18n();
    addComp(type, id);
    mountEditMode();
    const target = getComponents().find((x) => x.id === id);
    openComponentModal({ component: target, onAccept() {}, onDelete() {} });
    const overlays = document.querySelectorAll('.modal-overlay .modal');
    return overlays[overlays.length - 1];
  }

  function tabButtons(modal) {
    return [...modal.querySelectorAll('.modal__tabs .modal__tab')];
  }

  function tabLabels(modal) {
    return tabButtons(modal).map((b) => b.textContent);
  }

  function activateTab(modal, label) {
    const tab = tabButtons(modal).find((b) => b.textContent === label);
    tab.click();
    return [...modal.querySelectorAll('.modal__content > div')].find((d) => d.style.display !== 'none');
  }

  function modalText(modal) {
    return modal.textContent;
  }

  function footerButtons(modal) {
    return [...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent);
  }

  it('FT-040-01 · modal de componente: 5 pestañas en orden y "Generales" activa', () => {
    const modal = openComponentModalFor('dado', 'd-tabs');

    expect(tabLabels(modal)).toEqual([
      t('componentModal.tab.general'),
      t('componentModal.tab.visual'),
      t('componentModal.tab.specific'),
      t('componentModal.tab.interacciones'),
      t('componentModal.tab.copias'),
    ]);

    expect(tabButtons(modal)[0].classList.contains('active')).toBe(true);
    for (let i = 1; i < 5; i += 1) {
      expect(tabButtons(modal)[i].classList.contains('active')).toBe(false);
    }
  });

  it('FT-040-02 · modal de componente: footer (Eliminar/Cancelar/Aceptar) y estado de Aceptar', () => {
    const modal = openComponentModalFor('texto', 'tx-footer');
    expect(footerButtons(modal)).toEqual([t('common.delete'), t('common.cancel'), t('common.accept')]);

    const accept = [...modal.querySelectorAll('.modal__footer button')].find((b) => b.textContent === t('common.accept'));
    expect(accept.disabled).toBe(false);

    const idInput = modal.querySelector('.modal__field input[type=text]');
    idInput.value = '';
    idInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(accept.disabled).toBe(true);

    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
    resetState();
    initI18n();
    mountEditMode();
    openComponentModal({ component: null, onAccept() {} });
    const overlays2 = document.querySelectorAll('.modal-overlay .modal');
    const m2 = overlays2[overlays2.length - 1];
    expect([...m2.querySelectorAll('.modal__footer button')].some((b) => b.textContent === t('common.delete'))).toBe(false);
  });

  it('FT-040-03 · pestaña "Generales": secciones comunes a todos los tipos', () => {
    const modal = openComponentModalFor('carta', 'ca-gen');

    expect(modal.querySelector('.modal__field label').textContent).toBe(t('componentModal.idLabel'));
    const firstInput = modal.querySelector('.modal__content > div').querySelector('input');
    expect(firstInput.type).toBe('text');

    expect(modalText(modal)).toContain(t('common.general'));
    expect(modalText(modal)).toContain(t('componentModal.locked'));
    expect(modalText(modal)).toContain(t('componentModal.hidden'));
    expect(modalText(modal)).toContain(t('componentModal.raiseOnMove'));

    expect(modalText(modal)).toContain(t('componentModal.playerHelp'));
    expect(modalText(modal)).toContain(t('componentModal.showTitle'));
    expect(modalText(modal)).toContain(t('componentModal.editTitle'));
    expect(modalText(modal)).toContain(t('componentModal.showTooltip'));
    expect(modalText(modal)).toContain(t('componentModal.tooltipText'));

    loadTags([]);
    expect(modalText(modal)).toContain(t('componentModal.tagsLegend'));
    expect(modalText(modal)).toContain(t('componentModal.createNewTag'));
  });

  it('FT-040-04 · pestaña "Apariencia": secciones condicionadas por tipo', () => {
    function apparienceText(type) {
      const modal = openComponentModalFor(type, `apar-${type}`);
      const panel = activateTab(modal, t('componentModal.tab.visual'));
      return panel.textContent;
    }

    const dadoText = apparienceText('dado');
    const textoText = apparienceText('texto');
    const mazoText = apparienceText('mazo');
    const tableroSimpleText = apparienceText('tableroSimple');
    const tableroPersonalizadoText = apparienceText('tableroPersonalizado');

    // sizeLegend "Tamaño": presente en todos.
    expect(dadoText).toContain(t('componentModal.sizeLegend'));
    expect(textoText).toContain(t('componentModal.sizeLegend'));
    expect(mazoText).toContain(t('componentModal.sizeLegend'));

    // styleLegend "Estilo": solo dado.
    expect(dadoText).toContain(t('componentModal.styleLegend'));
    expect(textoText.includes(t('componentModal.styleLegend'))).toBe(false);
    expect(mazoText.includes(t('componentModal.styleLegend'))).toBe(false);

    // shapeLegend "Forma": solo mazo.
    expect(mazoText).toContain(t('componentModal.shapeLegend'));
    expect(dadoText.includes(t('componentModal.shapeLegend'))).toBe(false);
    expect(tableroSimpleText.includes(t('componentModal.shapeLegend'))).toBe(false);

    // Borde: en el código actual solo lo pinta tableroSimple (renderBoardSpecificFields);
    // tableroPersonalizado no tiene sección de borde propia (solo bisel/sombra + editor visual).
    expect(tableroSimpleText).toContain(t('common.border'));
    expect(tableroPersonalizadoText.includes(t('common.border'))).toBe(false);
    expect(dadoText.includes(t('common.border'))).toBe(false);
    expect(textoText.includes(t('common.border'))).toBe(false);

    // Extrusión: presente en todos (etiqueta distinta para 'texto').
    expect(dadoText).toContain(t('componentModal.extrusionLegend'));
    expect(mazoText).toContain(t('componentModal.extrusionLegend'));
    expect(textoText).toContain(t('componentModal.borderLegend.extrusion'));

    // Efecto (common.visual): solo texto, tableroSimple, tableroPersonalizado.
    expect(textoText).toContain(t('common.visual'));
    expect(tableroSimpleText).toContain(t('common.visual'));
    expect(tableroPersonalizadoText).toContain(t('common.visual'));
    expect(dadoText.includes(t('common.visual'))).toBe(false);
    expect(mazoText.includes(t('common.visual'))).toBe(false);
  });

  it('FT-040-05 · pestaña "Específicas": contenido distintivo por tipo', () => {
    function specificText(type, id) {
      const modal = openComponentModalFor(type, id);
      const panel = activateTab(modal, t('componentModal.tab.specific'));
      return panel.textContent;
    }

    const textoText = specificText('texto', 'esp-texto');
    expect(textoText).toContain(t('common.content'));

    const dadoModal = openComponentModalFor('dado', 'esp-dado');
    const dadoSpecificText = activateTab(dadoModal, t('componentModal.tab.specific')).textContent;
    expect(dadoSpecificText).toContain(t('componentModal.facesConfig'));
    expect(dadoSpecificText).toContain(t('componentModal.maxNumber'));
    expect(dadoSpecificText).toContain(t('componentModal.valueList'));
    // "Tipografía del resultado" (fontTypeLabel/chooseFont) vive en la pestaña "Apariencia"
    // (dadoStyleSection), no en "Específicas" — se comprueba ahí, no aquí.
    const dadoVisualText = activateTab(dadoModal, t('componentModal.tab.visual')).textContent;
    expect(dadoVisualText).toContain(t('componentModal.fontTypeLabel'));
    const dadoText = dadoSpecificText;

    const mazoText = specificText('mazo', 'esp-mazo');
    expect(mazoText).toContain(t('componentModal.revealedCardsLegend'));
    expect(mazoText).toContain(t('componentModal.imageLegend'));
    expect(mazoText).toContain(t('componentModal.viewMazoContent'));

    const cartaText = specificText('carta', 'esp-carta');
    expect(cartaText).toContain(t('componentModal.proportionLabel'));
    expect(cartaText).toContain(t('componentModal.editCardDesign'));
    expect(cartaText).toContain(t('componentModal.cardStyleLegend'));

    expect(textoText.includes(t('componentModal.facesConfig'))).toBe(false);
  });

  it('FT-040-06 · pestaña "Interacciones": presente para todos, sección "Interacciones programadas" con "Click derecho"', () => {
    for (const [type, id] of [['texto', 'int-texto'], ['dado', 'int-dado']]) {
      const modal = openComponentModalFor(type, id);
      expect(tabLabels(modal)).toContain(t('componentModal.tab.interacciones'));
      const panel = activateTab(modal, t('componentModal.tab.interacciones'));
      const text = panel.textContent;
      expect(text).toContain(t('componentModal.programmedInteractions'));
      expect(text).toContain(t('componentModal.rightClickLabel'));
    }
  });

  it('FT-040-07 · pestaña "Copias": mensaje sin copias', () => {
    const modal = openComponentModalFor('dado', 'd-cop');
    const panel = activateTab(modal, t('componentModal.tab.copias'));
    expect(panel.textContent).toContain(t('componentModal.noCopies'));
  });

  it('FT-040-08 · valores por defecto del modelo por tipo', () => {
    expect(createDefaultComponent('dado').properties).toEqual({ ...DEFAULT_DADO_PROPERTIES });
    expect(createDefaultComponent('tableroSimple').properties).toEqual({ ...DEFAULT_BOARD_PROPERTIES });
    expect(createDefaultComponent('tableroPersonalizado').properties).toEqual(
      JSON.parse(JSON.stringify(DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES)),
    );
    expect(createDefaultComponent('documento').properties).toEqual({ ...DEFAULT_DOCUMENTO_PROPERTIES });
    const cartaProps = createDefaultComponent('carta').properties;
    expect(cartaProps.proporcion).toBe(DEFAULT_CARTA_PROPERTIES.proporcion);
    expect(cartaProps.esquinasRedondeadas).toBe(DEFAULT_CARTA_PROPERTIES.esquinasRedondeadas);
    expect(cartaProps.caraActual).toBe(DEFAULT_CARTA_PROPERTIES.caraActual);
    expect(cartaProps.medidasReales).toBe(DEFAULT_CARTA_PROPERTIES.medidasReales);
    expect(cartaProps.caraFrontal.imagenResourceId).toBeNull();
    expect(cartaProps.caraTrasera.imagenResourceId).toBeNull();
    expect(createDefaultComponent('mazo').properties).toEqual({ ...DEFAULT_MAZO_PROPERTIES });

    expect(Object.keys(createComponent({ type: 'dado' }).properties)).toHaveLength(0);
    expect(createComponent({ type: 'dado' }).width).toBeNull();
  });

  it('FT-040-09 · modal de grupo: una pestaña "General", campos y footer', () => {
    resetState();
    initI18n();
    const a = createComponent({ type: 'texto' });
    a.id = 'ga';
    const b = createComponent({ type: 'texto' });
    b.id = 'gb';
    addComponent(a);
    addComponent(b);
    loadGroups([{ id: 'g1', etiquetaIds: [] }]);
    const group = { id: 'g1', etiquetaIds: [] };

    openGroupModal({ group, onAccept() {}, onCancel() {} });
    const modal = document.querySelector('.modal-overlay .modal');

    expect(modal.querySelector('.modal__header').textContent).toBe(t('groupModal.title'));
    expect([...modal.querySelectorAll('.modal__tab')].map((b) => b.textContent)).toEqual([t('common.general')]);
    expect(modalText(modal)).toContain(t('groupModal.idLabel'));

    expect(modalText(modal)).toContain(t('componentModal.locked'));
    expect(modalText(modal)).toContain(t('componentModal.hidden'));
    expect(modalText(modal)).toContain(t('groupModal.showTooltip'));
    expect(modalText(modal)).toContain(t('componentModal.showTitle'));
    expect(modalText(modal)).toContain(t('componentModal.raiseOnMove'));

    expect(modalText(modal)).toContain(t('componentModal.tagsLegend'));

    expect([...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)).toEqual([t('common.cancel'), t('common.save')]);
    expect(modalText(modal).includes(t('componentModal.tab.visual'))).toBe(false);
  });

  it('FT-040-10 · modal de etiqueta: crear vs editar', () => {
    openTagModal({ tag: null, onAccept() {} });
    let modal = document.querySelector('.modal-overlay .modal');

    expect(modal.querySelector('.modal__header').textContent).toBe(t('tagModal.newTitle'));
    expect(modal.querySelectorAll('.modal__tab').length).toBe(0);
    expect(modalText(modal)).toContain(t('tagModal.nameLabel'));
    expect([...modal.querySelectorAll('button')].some((b) => b.textContent === t('tagModal.remove'))).toBe(false);
    expect([...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)).toEqual([t('common.cancel'), t('common.accept')]);

    const nameInput = modal.querySelector('input[type=text]');
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    const acceptBtn = [...modal.querySelectorAll('.modal__footer button')].find((b) => b.textContent === t('common.accept'));
    expect(acceptBtn.disabled).toBe(true);

    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());

    loadTags([{ id: 'et1', name: 'Rojas', etiquetaIds: [] }]);
    const tag = { id: 'et1', name: 'Rojas' };
    openTagModal({
      tag, onAccept() {}, onDelete() {}, onRemoveFromTag() {}, onRemoveGroupFromTag() {},
    });
    modal = document.querySelector('.modal-overlay .modal');

    expect(modal.querySelector('.modal__header').textContent).toBe(t('tagModal.editTitle', { name: 'Rojas' }));
    expect(modalText(modal)).toContain(t('tagModal.elementsLabel', { count: 0 }));
    expect([...modal.querySelectorAll('.modal__footer button')].map((b) => b.textContent)).toEqual([t('common.delete'), t('common.cancel'), t('common.accept')]);
  });
});
