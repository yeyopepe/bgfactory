// Funcionalidad 039 — Barra de controles superior: modos, importar y exportar.
// FT-039-01 nivel estado; FT-039-02 nivel interfaz.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode, mountAppTitle, loadRealStylesheet } from '../helpers.js';
import { MODES, getState, setMode } from '../../core/state.js';
import { on } from '../../core/eventBus.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 39 });

describe('039 — Barra de controles superior', () => {
  let offSpy = null;

  beforeEach(resetState);
  afterEach(() => { if (offSpy) { offSpy(); offSpy = null; } });

  it('FT-039-01 · alternar de modo cambia el modo activo y emite mode:changed', () => {
    const seen = [];
    offSpy = on('mode:changed', (m) => seen.push(m));

    setMode(MODES.EDIT);
    expect(getState().mode).toBe('edit');

    setMode(MODES.PLAY);
    expect(getState().mode).toBe('play');

    expect(seen).toEqual(['edit', 'play']);
  });

  it('FT-039-02 · la barra pinta Importar/Exportar/Modo según el modo activo', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');
    const switcherEdit = document.getElementById('mode-switcher');
    expect(h1.textContent).toContain(t('toolbar.import'));
    expect(h1.textContent).toContain(t('toolbar.export'));
    // En edición el botón de modo dice "Modo Juego".
    expect(switcherEdit.textContent).toContain(t('toolbar.modePlay'));

    mountPlayMode();
    mountAppTitle();
    const h1After = document.getElementById('app-title');
    const switcherPlay = document.getElementById('mode-switcher');
    // En juego Importar/Exportar ya no viven en el título: el bloque de fichero está en #mode-switcher.
    expect(h1After.textContent.includes(t('toolbar.import'))).toBe(false);
    expect(switcherPlay.textContent).toContain(t('toolbar.import'));
    expect(switcherPlay.textContent).toContain(t('toolbar.modeEdit'));
  });

  it('FT-039-03 · en modo juego #mode-switcher lleva Importar/Exportar, separador y acciones', () => {
    mountPlayMode();
    const switcher = document.getElementById('mode-switcher');
    expect(switcher.textContent).toContain(t('toolbar.import'));
    expect(switcher.textContent).toContain(t('toolbar.export'));
    expect(switcher.textContent).toContain(t('toolbar.modeEdit'));
    expect(switcher.querySelector('.toolbar-divider')).toBeTruthy();
    // Botones de ajustar zoom y configuración, por su title.
    const titles = [...switcher.querySelectorAll('button')].map((b) => b.title);
    expect(titles).toContain(t('toolbar.fitZoom'));
    expect(titles).toContain(t('toolbar.settings'));
  });

  it('FT-039-04 · en modo edición #mode-switcher no lleva el bloque de fichero ni el separador', () => {
    mountEditMode();
    mountAppTitle();
    const switcher = document.getElementById('mode-switcher');
    // El harness no tiene matcher negado: se comprueba el booleano directamente.
    expect(switcher.textContent.includes(t('toolbar.import'))).toBe(false);
    expect(switcher.querySelector('.toolbar-divider')).toBeNull();
    expect(switcher.textContent).toContain(t('toolbar.modePlay'));

    const h1 = document.getElementById('app-title');
    expect(h1.textContent).toContain(t('toolbar.import'));
    expect(h1.textContent).toContain(t('toolbar.export'));
  });

  it('FT-039-05 · el botón de modo cambia de texto pero está siempre en #mode-switcher', () => {
    mountPlayMode();
    let switcher = document.getElementById('mode-switcher');
    let modeBtn = switcher.querySelector('.mode-switcher__mode-btn');
    expect(modeBtn).toBeTruthy();
    expect(modeBtn.textContent).toContain(t('toolbar.modeEdit'));
    expect(document.getElementById('content').contains(modeBtn)).toBe(false);

    mountEditMode();
    switcher = document.getElementById('mode-switcher');
    modeBtn = switcher.querySelector('.mode-switcher__mode-btn');
    expect(modeBtn).toBeTruthy();
    expect(modeBtn.textContent).toContain(t('toolbar.modePlay'));
  });

  it('FT-039-06 · el botón "Ajustar zoom" existe en ambos modos con su title', () => {
    for (const mount of [mountPlayMode, mountEditMode]) {
      mount();
      const fitBtn = [...document.getElementById('mode-switcher').querySelectorAll('button')]
        .find((b) => b.title === t('toolbar.fitZoom'));
      expect(fitBtn).toBeTruthy();
      expect(fitBtn.getAttribute('aria-label')).toBe(t('toolbar.fitZoom.aria'));
    }
  });

  it('FT-039-07 · el botón "Configuración" existe en ambos modos con su title', () => {
    for (const mount of [mountPlayMode, mountEditMode]) {
      mount();
      const settingsBtn = [...document.getElementById('mode-switcher').querySelectorAll('button')]
        .find((b) => b.title === t('toolbar.settings'));
      expect(settingsBtn).toBeTruthy();
    }
  });

  it('FT-039-08 · en modo edición Importar/Exportar viven dentro de la cabecera del título, con su misma trama de fondo (00290)', async () => {
    await loadRealStylesheet();
    mountEditMode();
    mountAppTitle();

    const h1 = document.getElementById('app-title');
    expect(h1.textContent).toContain(t('toolbar.import'));
    expect(h1.textContent).toContain(t('toolbar.export'));
    expect(getComputedStyle(h1).backgroundImage === 'none').toBe(false);
  });
});
