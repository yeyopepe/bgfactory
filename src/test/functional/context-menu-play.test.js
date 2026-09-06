// Funcionalidad 026 — Menú contextual de componente en modo juego.
// Nivel interfaz: monta el modo juego, dispara el evento `contextmenu` real
// sobre el nodo del componente en la mesa y comprueba el DOM del menú
// (`.context-menu` en `document.body`) y el estado resultante.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import {
  resetState, mountPlayMode, mockRandom, restoreAllMocks,
  dispatchContextMenu, getOpenContextMenu,
} from '../helpers.js';
import { getComponents, addComponent, replaceComponent, loadComponents } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { createCopy, updateComponent } from '../../core/component.js';
import { getPosibleValores } from '../../core/dice.js';
import { saveState, loadState } from '../../core/persistence.js';
import { DEFAULT_APP_TITLE } from '../../core/appTitle.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 26 });

// --- Helpers locales de fixture (específicos de esta batería) ---

// Un componente sembrado y ya en el estado. `accionClickDerecho` se fija a
// 'menuContextual' antes del `Object.assign` para que un `patch` pueda dejarlo
// en 'ninguno' (FT-026-02). Nota: `createDefaultComponent` lo deja en 'ninguno'
// y `loadComponents`/`addComponent` no lo migran (la migración solo actúa si el
// campo es `undefined`).
function seedComponent(type, patch = {}) {
  const c = createDefaultComponent(type);
  c.id = patch.id ?? `c-${type}`;
  c.x = 100;
  c.y = 100;
  c.accionClickDerecho = 'menuContextual';
  Object.assign(c, patch);
  addComponent(c);
  return getComponents().find((x) => x.id === c.id);
}

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

function nodeFor(content, type) {
  return content.querySelector('.infinite-table__world ' + SELECTOR_BY_TYPE[type]);
}

function openMenuOn(content, component, coords = { x: 50, y: 60 }) {
  dispatchContextMenu(nodeFor(content, component.type), coords);
  return getOpenContextMenu();
}

function rowLabels(menu) {
  return [...menu.querySelectorAll('.context-menu__item-label')].map((l) => l.textContent);
}

function rowByLabel(menu, label) {
  return [...menu.querySelectorAll('.context-menu__item-label')]
    .find((l) => l.textContent === label)?.closest('.context-menu__item') ?? null;
}

describe('026 — Menú contextual de componente en modo juego', () => {
  beforeEach(resetState);

  afterEach(() => {
    restoreAllMocks();
    document.body.querySelectorAll('.context-menu').forEach((n) => n.remove());
    document.body.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
    // Fuerza el cierre por click-fuera para que contextMenu.js desregistre sus
    // listeners globales (mousedown/keydown en document).
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    try { localStorage.removeItem('bgfactory:state'); } catch { /* no disponible */ }
  });

  it('FT-026-01 · click derecho con el menú activado: abre el menú y selecciona', () => {
    seedComponent('dado');
    const content = mountPlayMode();

    const menu = openMenuOn(content, { type: 'dado' });
    expect(menu).toBeTruthy();
    expect(menu.parentElement === document.body).toBe(true);
    expect(menu.style.left !== '').toBe(true);
    expect(menu.style.top !== '').toBe(true);
    expect(content.querySelector('.dice--selected')).toBeTruthy();
  });

  it('FT-026-02 · click derecho en "Ninguno" no abre menú ni selecciona', () => {
    seedComponent('dado', { accionClickDerecho: 'ninguno' });
    const content = mountPlayMode();

    dispatchContextMenu(nodeFor(content, 'dado'), { x: 50, y: 60 });
    expect(getOpenContextMenu()).toBeNull();
    expect(content.querySelector('.dice--selected')).toBeNull();
  });

  it('FT-026-03 · la primera fila es la descripción de solo lectura y no responde al click', () => {
    seedComponent('dado', { id: 'D1' });
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'dado' });

    const description = menu.querySelector('.context-menu__description');
    expect(description).toBeTruthy();
    expect(description.querySelector('.context-menu__description-main').textContent)
      .toBe(`${t('componentIdentifier.type.dado')}: D1`);
    // No es una fila pulsable ni cierra el menú.
    expect(description.querySelector('.context-menu__item')).toBeNull();
    description.click();
    expect(getOpenContextMenu()).toBeTruthy();
  });

  it('FT-026-04 · la descripción añade la propiedad extra correcta por tipo', () => {
    // dado: nº de caras
    const dado = seedComponent('dado', { id: 'die' });
    let content = mountPlayMode();
    let menu = openMenuOn(content, { type: 'dado' });
    const nCaras = getPosibleValores(dado.properties || {}).length;
    expect(menu.querySelector('.context-menu__description-extra').textContent)
      .toBe(t('contextMenu.extra.faces', { count: nCaras }));

    // tableroSimple: "AnchoxAlto"
    resetState();
    const board = seedComponent('tableroSimple', { id: 'b1' });
    content = mountPlayMode();
    menu = openMenuOn(content, { type: 'tableroSimple' });
    expect(menu.querySelector('.context-menu__description-extra').textContent)
      .toBe(`${Math.round(board.width)}x${Math.round(board.height)}`);

    // mazo: nº de cartas
    resetState();
    const mazo = seedComponent('mazo', { id: 'm1' });
    replaceComponent(mazo.id, updateComponent(getComponents().find((c) => c.id === 'm1'), {
      properties: { cartaIds: ['a', 'b'] },
    }));
    content = mountPlayMode();
    menu = openMenuOn(content, { type: 'mazo' });
    expect(menu.querySelector('.context-menu__description-extra').textContent)
      .toBe(t('contextMenu.extra.cards', { count: 2 }));

    // texto / documento / carta: sin extra
    for (const type of ['texto', 'documento', 'carta']) {
      resetState();
      seedComponent(type, { id: `x-${type}` });
      content = mountPlayMode();
      menu = openMenuOn(content, { type });
      expect(menu.querySelector('.context-menu__description-extra')).toBeNull();
    }
  });

  it('FT-026-05 · con el componente desbloqueado aparece "Bloquear"; al elegirla queda bloqueado y el menú se cierra', () => {
    const dado = seedComponent('dado', { id: 'D1' });
    expect(dado.bloqueado).toBe('ninguno');
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'dado' });

    const lockRow = rowByLabel(menu, t('contextMenu.lock'));
    expect(lockRow).toBeTruthy();
    lockRow.click();

    expect(getComponents().find((c) => c.id === 'D1').bloqueado).toBe('juego');
    expect(getOpenContextMenu()).toBeNull();
  });

  it('FT-026-06 · con el componente bloqueado aparece "Desbloquear"; al elegirla queda desbloqueado', () => {
    seedComponent('dado', { id: 'D1', bloqueado: 'juego' });
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'dado' });

    const unlockRow = rowByLabel(menu, t('contextMenu.unlock'));
    expect(unlockRow).toBeTruthy();
    unlockRow.click();

    expect(getComponents().find((c) => c.id === 'D1').bloqueado).toBe('ninguno');
  });

  it('FT-026-07 · fila lock ausente en Copia sincronizada, presente si no sincronizada', () => {
    seedComponent('dado', { id: 'O1' });
    addComponent(createCopy(getComponents().find((c) => c.id === 'O1'), getComponents()));
    const copiaId = getComponents().find((c) => c.copyOf === 'O1').id;
    replaceComponent(copiaId, updateComponent(getComponents().find((c) => c.id === copiaId), {
      accionClickDerecho: 'menuContextual',
    }));

    let content = mountPlayMode();
    // La copia nace desplazada respecto al original: es el segundo nodo .dice.
    const copiaNode = content.querySelectorAll('.infinite-table__world .dice')[1];
    dispatchContextMenu(copiaNode, { x: 50, y: 60 });
    let menu = getOpenContextMenu();
    const copia = getComponents().find((c) => c.id === copiaId);
    expect(copia.copyOf).toBeTruthy();
    expect(copia.sincronizado === false).toBe(false);
    expect(rowLabels(menu)).toHaveLength(0); // ni "Bloquear" ni "Desbloquear"

    // Desincronizada: la fila vuelve a aparecer.
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    replaceComponent(copiaId, updateComponent(getComponents().find((c) => c.id === copiaId), {
      sincronizado: false,
    }));
    content = mountPlayMode();
    dispatchContextMenu(content.querySelectorAll('.infinite-table__world .dice')[1], { x: 50, y: 60 });
    menu = getOpenContextMenu();
    expect(rowByLabel(menu, t('contextMenu.lock'))).toBeTruthy();
  });

  it('FT-026-08 · menú de mazo: "Barajar" y "Ver contenido..."; barajar reordena y cierra', () => {
    const mazo = seedComponent('mazo', { id: 'm1' });
    replaceComponent(mazo.id, updateComponent(getComponents().find((c) => c.id === 'm1'), {
      properties: { cartaIds: ['a', 'b', 'c'] },
    }));
    mockRandom([0, 0]);
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'mazo' });

    expect(rowByLabel(menu, t('contextMenu.shuffle'))).toBeTruthy();
    expect(rowByLabel(menu, t('contextMenu.viewContent'))).toBeTruthy();

    rowByLabel(menu, t('contextMenu.shuffle')).click();

    const nuevo = getComponents().find((c) => c.id === 'm1').properties.cartaIds;
    expect(JSON.stringify(nuevo) === JSON.stringify(['a', 'b', 'c'])).toBe(false);
    expect([...nuevo].sort()).toEqual(['a', 'b', 'c']);
    expect(getOpenContextMenu()).toBeNull();
  });

  it('FT-026-09 · "Ver contenido..." abre la vista de contenido del mazo y cierra el menú', () => {
    const mazo = seedComponent('mazo', { id: 'm1' });
    replaceComponent(mazo.id, updateComponent(getComponents().find((c) => c.id === 'm1'), {
      properties: { cartaIds: ['a', 'b'] },
    }));
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'mazo' });

    rowByLabel(menu, t('contextMenu.viewContent')).click();

    expect(getOpenContextMenu()).toBeNull();
    expect(document.querySelector('.modal-overlay')).toBeTruthy();
  });

  it('FT-026-10 · "Meter en mazo..." solo si hay al menos un mazo en la partida', () => {
    // Caso A: carta sola, sin mazos.
    seedComponent('carta', { id: 'C1' });
    let content = mountPlayMode();
    let menu = openMenuOn(content, { type: 'carta' });
    expect(rowByLabel(menu, t('contextMenu.insertIntoMazo'))).toBeNull();

    // Caso B: además un mazo (en posición separada).
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    seedComponent('mazo', { id: 'M1', x: 600, y: 600 });
    content = mountPlayMode();
    // La carta es el nodo .carta situado en x=100 (el mazo también usa .carta).
    const cartaNode = [...content.querySelectorAll('.infinite-table__world .carta')]
      .find((n) => n.style.left === '100px');
    dispatchContextMenu(cartaNode, { x: 50, y: 60 });
    menu = getOpenContextMenu();
    expect(rowByLabel(menu, t('contextMenu.insertIntoMazo'))).toBeTruthy();
  });

  it('FT-026-11 · sección "Interacciones" para un dado y para un componente sin interacciones', () => {
    seedComponent('dado', { id: 'D1' });
    let content = mountPlayMode();
    let menu = openMenuOn(content, { type: 'dado' });

    const info = menu.querySelector('.context-menu__info');
    expect(info).toBeTruthy();
    expect(info.querySelector('.context-menu__info-title').textContent).toBe(t('contextMenu.interactions'));
    let rows = [...info.querySelectorAll('.context-menu__info-row')].map((r) => ({
      label: r.querySelector('.context-menu__info-label').textContent,
      value: r.querySelector('.context-menu__info-value').textContent,
    }));
    expect(rows).toEqual([
      { label: t('interaction.leftClick'), value: t('interaction.value.rollDie') },
      { label: t('interaction.doubleLeftClick'), value: t('interaction.value.viewResultLarge') },
      { label: t('interaction.rightClick'), value: t('interaction.value.openThisMenu') },
    ]);

    // Texto: las dos primeras filas son "Ninguno" con la clase --none.
    resetState();
    seedComponent('texto', { id: 'T1' });
    content = mountPlayMode();
    menu = openMenuOn(content, { type: 'texto' });
    const infoRows = [...menu.querySelectorAll('.context-menu__info-row')];
    rows = infoRows.map((r) => r.querySelector('.context-menu__info-value').textContent);
    expect(rows).toEqual([
      t('interaction.value.none'),
      t('interaction.value.none'),
      t('interaction.value.openThisMenu'),
    ]);
    expect(infoRows[0].querySelector('.context-menu__info-value--none')).toBeTruthy();
    expect(infoRows[1].querySelector('.context-menu__info-value--none')).toBeTruthy();
  });

  it('FT-026-12 · "Clic izquierdo" muestra "Ninguno" si la interacción está desactivada', () => {
    seedComponent('dado', { id: 'D1', interaccionesDesactivadas: ['lanzar'] });
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'dado' });

    const firstRow = menu.querySelector('.context-menu__info-row');
    expect(firstRow.querySelector('.context-menu__info-label').textContent).toBe(t('interaction.leftClick'));
    expect(firstRow.querySelector('.context-menu__info-value').textContent).toBe(t('interaction.value.none'));
    expect(firstRow.querySelector('.context-menu__info-value--none')).toBeTruthy();
  });

  it('FT-026-13 · click derecho sobre otro componente con un menú abierto lo cambia', () => {
    seedComponent('dado', { id: 'D1' });
    seedComponent('carta', { id: 'C1', x: 600, y: 600 });
    const content = mountPlayMode();

    dispatchContextMenu(content.querySelector('.infinite-table__world .dice'), { x: 50, y: 60 });
    expect(getOpenContextMenu()).toBeTruthy();
    expect(content.querySelector('.dice--selected')).toBeTruthy();

    // Sin cerrar: click derecho sobre la carta.
    dispatchContextMenu(content.querySelector('.infinite-table__world .carta'), { x: 90, y: 90 });

    expect(document.body.querySelectorAll('.context-menu').length).toBe(1);
    expect(content.querySelector('.carta--selected')).toBeTruthy();
    expect(content.querySelector('.dice--selected')).toBeNull();
    expect(getOpenContextMenu().querySelector('.context-menu__description-main').textContent)
      .toBe(`${t('componentIdentifier.type.carta')}: C1`);
  });

  it('FT-026-14 · ESC cierra el menú y limpia la selección', () => {
    seedComponent('dado', { id: 'D1' });
    const content = mountPlayMode();
    openMenuOn(content, { type: 'dado' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(getOpenContextMenu()).toBeNull();
    expect(content.querySelector('.dice--selected')).toBeNull();
  });

  it('FT-026-15 · un click fuera del menú lo cierra y limpia la selección', () => {
    seedComponent('dado', { id: 'D1' });
    const content = mountPlayMode();
    openMenuOn(content, { type: 'dado' });

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(getOpenContextMenu()).toBeNull();
    expect(content.querySelector('.dice--selected')).toBeNull();
  });

  it('FT-026-16 · elegir una acción cierra el menú y limpia la selección', () => {
    seedComponent('dado', { id: 'D1' });
    const content = mountPlayMode();
    const menu = openMenuOn(content, { type: 'dado' });

    rowByLabel(menu, t('contextMenu.lock')).click();

    expect(getOpenContextMenu()).toBeNull();
    expect(content.querySelector('.dice--selected')).toBeNull();
  });

  it('FT-026-17 · la selección no se persiste tras guardar y recargar', () => {
    seedComponent('dado', { id: 'D1' });
    let content = mountPlayMode();
    openMenuOn(content, { type: 'dado' });
    expect(content.querySelector('.dice--selected')).toBeTruthy();

    // Guardar el estado con el menú aún abierto: el payload no debe llevar
    // ninguna marca de selección (es estado momentáneo de la sesión, no del
    // documento).
    saveState(getComponents(), {}, [], {}, false, [], {}, [], DEFAULT_APP_TITLE, '');
    const raw = localStorage.getItem('bgfactory:state');
    expect(raw.includes('selectedComponentId')).toBe(false);
    expect(raw.includes('"selected"')).toBe(false);

    // Recargar = página nueva: se cierra el menú (ESC, como haría el usuario o
    // el desmontaje) y se recarga el estado. No queda selección.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const loaded = loadState();
    loadComponents(loaded.components);

    content = mountPlayMode();
    expect(content.querySelector('.dice--selected')).toBeNull();
  });
});
