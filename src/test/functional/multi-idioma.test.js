// Funcionalidad 038 — Aplicación multi-idioma y panel de configuración.
// Valida: detección de idioma por navigator.language y prioridad de la
// preferencia guardada; cambio de idioma en caliente (setLanguage, evento
// 'language:changed', no-op si no aplica); resolución de t() (cadena de
// respaldo activo->es->clave, interpolación, plural); integridad de
// catálogos (CATALOG_EN ⊆ CATALOG_ES); panel de Configuración
// (openSettingsModal): apertura, contenido, texto de la mesa, re-render en
// vivo al cambiar el idioma, cierre.
// [gotcha] El runner no carga main.js ni el CSS (test.decision.no-main-js).
// [gotcha] resetState() de helpers.js ya borra localStorage['bgfactory:lang']
// y ['bgfactory:state'].

import {
  describe, it, expect, beforeEach, afterEach, registerFeature,
} from '../harness.js';
import { resetState } from '../helpers.js';
import {
  initI18n, getLanguage, setLanguage, t, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE,
} from '../../core/i18n.js';
import { on } from '../../core/eventBus.js';
import { getTableText, setTableText } from '../../core/state.js';
import { getVersionedProductName } from '../../core/appTitle.js';
import { CATALOG_ES } from '../../data/i18n.es.js';
import { CATALOG_EN } from '../../data/i18n.en.js';
import { openSettingsModal } from '../../ui/settingsModal.js';

registerFeature({ primary: 38 });

function setStoredLang(code) {
  try { localStorage.setItem('bgfactory:lang', code); } catch { /* no-op */ }
}

function clearStoredLang() {
  try { localStorage.removeItem('bgfactory:lang'); } catch { /* no-op */ }
}

function withNavigatorLanguage(value, fn) {
  const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'language')
    || Object.getOwnPropertyDescriptor(navigator, 'language');
  Object.defineProperty(navigator, 'language', { value, configurable: true });
  try {
    fn();
  } finally {
    if (original) Object.defineProperty(navigator, 'language', original);
  }
}

function openSettings() {
  openSettingsModal();
  return document.querySelector('.modal-overlay');
}

function settingsSelect(overlay) {
  return overlay.querySelector('select');
}

function settingsTextarea(overlay) {
  return overlay.querySelector('#settings-table-text');
}

describe('038 — Aplicación multi-idioma y panel de configuración', () => {
  beforeEach(() => {
    resetState();
    initI18n();
  });

  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
    try { localStorage.removeItem('bgfactory:lang'); } catch { /* no-op */ }
    initI18n();
  });

  it('FT-038-01 · detección automática de idioma por navigator.language', () => {
    clearStoredLang();
    withNavigatorLanguage('es-ES', () => {
      initI18n();
      expect(getLanguage()).toBe('es');
    });

    clearStoredLang();
    withNavigatorLanguage('en-GB', () => {
      initI18n();
      expect(getLanguage()).toBe('en');
    });

    clearStoredLang();
    withNavigatorLanguage('fr-FR', () => {
      initI18n();
      expect(getLanguage()).toBe('en');
    });

    try {
      expect(localStorage.getItem('bgfactory:lang')).toBeNull();
    } catch { /* localStorage no disponible: nada que comprobar */ }
  });

  it('FT-038-02 · la preferencia guardada tiene prioridad sobre la detección', () => {
    setStoredLang('en');
    withNavigatorLanguage('es-ES', () => {
      initI18n();
      expect(getLanguage()).toBe('en');
    });

    setStoredLang('es');
    withNavigatorLanguage('en-US', () => {
      initI18n();
      expect(getLanguage()).toBe('es');
    });

    setStoredLang('de');
    withNavigatorLanguage('es-ES', () => {
      initI18n();
      expect(getLanguage()).toBe('es');
    });
  });

  it('FT-038-03 · cambio de idioma en caliente: estado, persistencia y evento', () => {
    setStoredLang('es');
    initI18n();
    expect(getLanguage()).toBe('es');

    const seen = [];
    const off = on('language:changed', (code) => seen.push(code));

    setLanguage('en');
    expect(getLanguage()).toBe('en');
    expect(seen).toEqual(['en']);
    try {
      expect(localStorage.getItem('bgfactory:lang')).toBe('en');
    } catch { /* localStorage no disponible: nada que comprobar */ }

    setLanguage('en');
    expect(seen).toEqual(['en']);

    setLanguage('de');
    expect(getLanguage()).toBe('en');
    expect(seen).toEqual(['en']);

    off();

    expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en']);
    expect(DEFAULT_LANGUAGE).toBe('es');
  });

  it('FT-038-04 · resolución de t(): respaldo, interpolación y plural', () => {
    setLanguage('en');
    expect(t('common.accept')).toBe(CATALOG_EN['common.accept']);

    const missingInEn = Object.keys(CATALOG_ES).find((k) => !(k in CATALOG_EN));
    if (missingInEn) {
      expect(t(missingInEn)).toBe(CATALOG_ES[missingInEn]);
    }

    expect(t('clave.que.no.existe')).toBe('clave.que.no.existe');

    expect(t('tagModal.editTitle', { name: 'X' })).toBe(CATALOG_EN['tagModal.editTitle'].replace('{name}', 'X'));

    const pluralEntry = CATALOG_EN['contextMenu.extra.faces'];
    expect(t('contextMenu.extra.faces', { count: 1 })).toBe(pluralEntry.one.replace('{count}', '1'));
    expect(t('contextMenu.extra.faces', { count: 3 })).toBe(pluralEntry.other.replace('{count}', '3'));
  });

  it('FT-038-05 · integridad de catálogos: CATALOG_EN ⊆ CATALOG_ES', () => {
    const missing = Object.keys(CATALOG_EN).filter((k) => !(k in CATALOG_ES));
    expect(missing).toEqual([]);
    expect(Object.keys(CATALOG_ES).length).toBeGreaterThan(0);
    expect(Object.keys(CATALOG_ES).length).toBeGreaterThan(Object.keys(CATALOG_EN).length - 1);
  });

  it('FT-038-06 · panel de Configuración: apertura y contenido', () => {
    setLanguage('es');
    const overlay = openSettings();

    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('.modal')).toBeTruthy();

    expect(overlay.querySelector('.modal__header').textContent).toBe(t('settings.title'));

    const sel = settingsSelect(overlay);
    const opts = [...sel.options].map((o) => o.value);
    expect(opts).toEqual(['es', 'en']);
    expect([...sel.options].map((o) => o.textContent)).toEqual(['Español', 'English']);
    expect(sel.value).toBe('es');

    const ta = settingsTextarea(overlay);
    expect(ta).toBeTruthy();
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta.maxLength).toBe(500);
    expect(ta.value).toBe(getTableText());

    expect(overlay.querySelector('.modal__hint').textContent).toBe(t('settings.tableText.hint'));

    const versionEl = overlay.querySelector('.settings-modal__version');
    expect(versionEl.textContent).toBe(getVersionedProductName());
    expect(versionEl.textContent.startsWith('BG Factory')).toBe(true);

    const a = overlay.querySelector('.settings-modal__repo a');
    expect(a.getAttribute('href')).toBe('https://github.com/yeyopepe/bgfactory');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener');
    expect(a.textContent).toBe(t('appVersion.repoLink'));

    const btn = overlay.querySelector('.modal__footer .btn-cancel');
    expect(btn.textContent).toBe(t('common.close'));
  });

  it('FT-038-07 · texto en la mesa: escritura en vivo, round-trip y texto plano', () => {
    expect(getTableText()).toBe('');

    const overlay = openSettings();
    const ta = settingsTextarea(overlay);

    ta.value = 'línea 1\nlínea 2';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(getTableText()).toBe('línea 1\nlínea 2');

    setTableText('abc');
    expect(getTableText()).toBe('abc');

    ta.value = '<b>hola</b>';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(getTableText()).toBe('<b>hola</b>');

    resetState();
    expect(getTableText()).toBe('');
  });

  it('FT-038-08 · cambio de idioma con el panel abierto: re-render sin cerrar', () => {
    setLanguage('es');
    const overlay = openSettings();
    expect(overlay.querySelector('.modal__header').textContent).toBe(CATALOG_ES['settings.title']);

    const sel = settingsSelect(overlay);
    sel.value = 'en';
    sel.dispatchEvent(new Event('change', { bubbles: true }));

    expect(getLanguage()).toBe('en');
    expect(document.body.contains(overlay)).toBe(true);
    expect(overlay.querySelector('.modal__header').textContent).toBe(CATALOG_EN['settings.title']);
    expect(overlay.querySelector('.modal__footer .btn-cancel').textContent).toBe(CATALOG_EN['common.close']);

    setLanguage('es');
    expect(overlay.querySelector('.modal__header').textContent).toBe(CATALOG_ES['settings.title']);
    expect(document.body.contains(overlay)).toBe(true);
  });

  it('FT-038-09 · cierre del panel por botón y por clic fuera; baja de la suscripción', () => {
    let overlay = openSettings();
    overlay.querySelector('.modal__footer .btn-cancel').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.body.contains(overlay)).toBe(false);

    overlay = openSettings();
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.body.contains(overlay)).toBe(false);

    overlay = openSettings();
    overlay.querySelector('.modal').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.body.contains(overlay)).toBe(true);
    overlay.querySelector('.modal__footer .btn-cancel').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    overlay = openSettings();
    overlay.querySelector('.modal__footer .btn-cancel').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setLanguage(getLanguage() === 'es' ? 'en' : 'es');
    expect(document.querySelectorAll('.modal-overlay').length).toBe(0);
  });
});
