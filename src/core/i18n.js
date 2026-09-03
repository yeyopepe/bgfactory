// Sistema de traducción (i18n) de la aplicación. Toda la lógica vive aquí; los
// catálogos por idioma (data/i18n.<código>.js) son datos puros sin lógica.
// 'es' es la referencia canónica y siempre está completo.

import { emit } from './eventBus.js';
import { formatVersion } from './appTitle.js';
import { CATALOG_ES } from '../data/i18n.es.js';
import { CATALOG_EN } from '../data/i18n.en.js';

export const SUPPORTED_LANGUAGES = ['es', 'en'];
export const DEFAULT_LANGUAGE = 'es';

const CATALOGS = { es: CATALOG_ES, en: CATALOG_EN };

// Poner a true en desarrollo para que t() avise por consola de claves sin traducir.
const DEV_WARN = false;

const STORAGE_KEY = 'bgfactory:lang';

let activeLanguage = DEFAULT_LANGUAGE;

function readStoredLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function detectLanguage() {
  const nav = String(navigator.language || '').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

function applyDocumentLanguage() {
  document.documentElement.lang = activeLanguage;
  document.title = `${t('app.documentTitle')} ${formatVersion()}`;
}

// Llamada una sola vez desde main.js, antes del primer render y de los toasts.
export function initI18n() {
  const stored = readStoredLanguage();
  activeLanguage = SUPPORTED_LANGUAGES.includes(stored) ? stored : detectLanguage();
  applyDocumentLanguage();
}

export function getLanguage() {
  return activeLanguage;
}

// Locale para localeCompare (los códigos 'es'/'en' valen como BCP 47).
export function getLocale() {
  return activeLanguage;
}

export function setLanguage(code) {
  if (!SUPPORTED_LANGUAGES.includes(code) || code === activeLanguage) return;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage no disponible: el cambio se aplica igual en memoria, sin persistir.
  }
  activeLanguage = code;
  applyDocumentLanguage();
  emit('language:changed', code);
}

function lookup(key) {
  const fromActive = CATALOGS[activeLanguage]?.[key];
  if (fromActive !== undefined) return fromActive;
  const fromDefault = CATALOGS[DEFAULT_LANGUAGE]?.[key];
  if (fromDefault !== undefined) return fromDefault;
  if (DEV_WARN) console.warn(`[i18n] clave sin traducir: ${key}`);
  return key;
}

// t('clave', { count, ...params }): resuelve por cadena de respaldo
// activo -> 'es' -> la propia clave; elige forma singular/plural si la entrada
// es { one, other } y hay `count`; interpola cada {nombre} con params[nombre].
// El resultado es texto plano; asignar siempre por textContent.
export function t(key, params) {
  const entry = lookup(key);
  let str;
  if (entry && typeof entry === 'object') {
    const count = params?.count;
    str = count === 1 ? entry.one : entry.other;
    if (str === undefined) str = key;
  } else {
    str = entry;
  }
  if (params) {
    str = String(str).replace(/\{(\w+)\}/g, (match, name) => (
      name in params ? String(params[name]) : match
    ));
  }
  return str;
}
