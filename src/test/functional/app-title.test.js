// Funcionalidad 030 — Título de cabecera editable.
// FT-030-01/02 nivel estado; FT-030-03..09 nivel interfaz (pintan el #app-title
// real vía mountAppTitle() y simulan click, escritura, Enter y pérdida de foco).
//
// Notas de aislamiento:
//   - `document.title` es global de la página headless y `renderAppTitle` lo
//     reescribe en cada render; con la recarga de página por fichero de
//     Playwright + `resetState()` en `beforeEach` (deja `appTitle` en el valor
//     por defecto) basta. No se añade un `afterEach` que restaure
//     `document.title` salvo que se observe contaminación.
//   - El flag `editing` de `ui/appTitle.js` nace en `false` con la recarga por
//     fichero. Cada caso de interfaz que entre en edición deja el título
//     confirmado (Enter o `blur`) antes de terminar, para no arrastrar
//     `editing = true` al caso siguiente.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode, mountPlayMode, mountAppTitle } from '../helpers.js';
import { getAppTitle, setAppTitle } from '../../core/state.js';
import { on } from '../../core/eventBus.js';
import { getFullAppTitle, formatVersion } from '../../core/appTitle.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 30 });

describe('030 — Título de cabecera editable', () => {
  let offSpy = null;

  beforeEach(resetState);
  afterEach(() => { if (offSpy) { offSpy(); offSpy = null; } });

  it('FT-030-01 · al arrancar sin nada guardado el título es "BG Factory"', () => {
    expect(getAppTitle()).toBe('BG Factory');
  });

  it('FT-030-02 · fijar un título nuevo cambia el valor y emite appTitle:changed', () => {
    const seen = [];
    offSpy = on('appTitle:changed', (v) => seen.push(v));

    setAppTitle('Mi partida');

    expect(getAppTitle()).toBe('Mi partida');
    expect(seen).toEqual(['Mi partida']);
  });

  it('FT-030-03 · en modo edición el título muestra lápiz y un click lo convierte en campo', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    expect(h1.querySelector('.app-title__pencil')).toBeTruthy();
    expect(h1.querySelector('.app-title__input')).toBeNull();

    h1.click();

    const input = h1.querySelector('.app-title__input');
    expect(input).toBeTruthy();
    expect(input.value).toBe(getAppTitle());

    input.dispatchEvent(new Event('blur'));
  });

  it('FT-030-04 · escribir y pulsar Enter fija el título nuevo y vuelve al aspecto normal', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    h1.click();
    const input = h1.querySelector('.app-title__input');
    input.value = 'Título nuevo';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    mountAppTitle();

    expect(getAppTitle()).toBe('Título nuevo');
    expect(h1.querySelector('.app-title__pencil')).toBeTruthy();
    expect(h1.querySelector('.app-title__input')).toBeNull();
  });

  it('FT-030-05 · sacar el foco del campo confirma igual que Enter', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    h1.click();
    const input = h1.querySelector('.app-title__input');
    input.value = 'Confirmado al salir';
    input.dispatchEvent(new Event('blur'));
    mountAppTitle();

    expect(getAppTitle()).toBe('Confirmado al salir');
    expect(h1.querySelector('.app-title__pencil')).toBeTruthy();
    expect(h1.querySelector('.app-title__input')).toBeNull();
  });

  it('FT-030-06 · confirmar el campo vacío recupera el texto previo y no emite aviso', () => {
    mountEditMode();
    setAppTitle('Antes');
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    const seen = [];
    offSpy = on('appTitle:changed', (v) => seen.push(v));

    h1.click();
    const input = h1.querySelector('.app-title__input');
    input.value = '   ';
    input.dispatchEvent(new Event('blur'));

    expect(getAppTitle()).toBe('Antes');
    expect(seen).toHaveLength(0);

    mountAppTitle();
    expect(h1.querySelector('.app-title__pencil')).toBeTruthy();
    expect(h1.querySelector('.app-title__input')).toBeNull();
  });

  it('FT-030-07 · tras confirmar un título nuevo el título de la pestaña se actualiza', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    h1.click();
    const input = h1.querySelector('.app-title__input');
    input.value = 'Partida X';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    mountAppTitle();

    expect(document.title).toBe(getFullAppTitle('Partida X'));
  });

  it('FT-030-08 · en modo juego la cabecera es texto plano y un click no abre la edición', () => {
    mountPlayMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    expect(h1.querySelector('.app-title__pencil')).toBeNull();
    expect(h1.querySelector('.app-title__input')).toBeNull();
    expect(h1.textContent).toBe(getFullAppTitle(getAppTitle()));

    h1.click();

    expect(h1.querySelector('.app-title__input')).toBeNull();
    expect(h1.textContent).toBe(getFullAppTitle(getAppTitle()));
  });

  it('FT-030-09 · la marca de versión aparece siempre y queda fuera del campo editable', () => {
    mountPlayMode();
    mountAppTitle();
    let h1 = document.getElementById('app-title');
    expect(h1.textContent).toContain(formatVersion());

    mountEditMode();
    mountAppTitle();
    h1 = document.getElementById('app-title');
    expect(h1.textContent).toContain(formatVersion());

    h1.click();
    const versionEl = h1.querySelector('.app-title__version');
    expect(versionEl).toBeTruthy();
    expect(versionEl.textContent).toBe(formatVersion());
    expect(h1.querySelector('.app-title__input').value).toBe(getAppTitle());

    h1.querySelector('.app-title__input').dispatchEvent(new Event('blur'));
  });

  it('FT-030-10 · en modo edición (aspecto lápiz) aparece el indicador de modo con el texto de "Modo Edición"', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    const indicator = h1.querySelector('.app-title__mode-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe(t('toolbar.modeEdit'));
  });

  it('FT-030-11 · el indicador de modo sigue presente al entrar en edición del título', () => {
    mountEditMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    h1.click();

    const indicator = h1.querySelector('.app-title__mode-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe(t('toolbar.modeEdit'));

    h1.querySelector('.app-title__input').dispatchEvent(new Event('blur'));
  });

  it('FT-030-12 · en modo juego no aparece el indicador de modo', () => {
    mountPlayMode();
    mountAppTitle();
    const h1 = document.getElementById('app-title');

    expect(h1.querySelector('.app-title__mode-indicator')).toBeNull();
  });

  it('FT-030-13 · al volver a modo juego el indicador y los controles de fichero desaparecen por completo, sin dejar rastro', () => {
    mountEditMode();
    mountAppTitle();
    let h1 = document.getElementById('app-title');
    expect(h1.querySelector('.app-title__mode-indicator')).toBeTruthy();
    expect(h1.textContent).toContain(t('toolbar.import'));

    mountPlayMode();
    mountAppTitle();
    h1 = document.getElementById('app-title');
    expect(h1.querySelector('.app-title__mode-indicator')).toBeNull();
    expect(h1.classList.contains('app-title-bar--edit')).toBe(false);
    expect(h1.querySelector('.app-title__controls')).toBeNull();
    expect(h1.textContent.includes(t('toolbar.import'))).toBe(false);
  });
});
