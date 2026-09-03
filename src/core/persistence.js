// Persistencia del estado de componentes: autoguardado en localStorage
// (un único slot por navegador/perfil) y lectura de la semilla embebida en
// el propio documento (usada cuando aún no hay nada guardado en el navegador).

import { CURRENT_VERSION } from '../data/version.js';
import { DEFAULT_APP_TITLE } from './appTitle.js';
import { t } from './i18n.js';

const STORAGE_KEY = 'bgfactory:state';

function parseState(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'corrupt' };
  }
  // Objeto legible pero de otra versión de la app: no es un fallo, es lo
  // esperable al estrenar versión. Se distingue de "corrupto" para que el
  // arranque avise con un texto distinto (o silencie el modal por completo).
  if (parsed && parsed.version !== CURRENT_VERSION) {
    return { error: 'version-mismatch' };
  }
  if (!parsed || !Array.isArray(parsed.components)) {
    return { error: 'corrupt' };
  }
  const panelState = (parsed.panelState && typeof parsed.panelState === 'object') ? parsed.panelState : null;
  const resourcePanelState = (parsed.resourcePanelState && typeof parsed.resourcePanelState === 'object') ? parsed.resourcePanelState : null;
  // Compatibilidad hacia atrás ("Mazo" → "Grupo" → "Etiqueta"): guardados
  // antiguos tienen estas dos colecciones bajo las claves `deckPanelState`/
  // `groupPanelState` o `decks`/`groups` — se siguen leyendo si las nuevas
  // no están presentes.
  const tagPanelStateRaw = parsed.tagPanelState ?? parsed.groupPanelState ?? parsed.deckPanelState;
  const tagPanelState = (tagPanelStateRaw && typeof tagPanelStateRaw === 'object') ? tagPanelStateRaw : null;
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  const resourcesSeeded = parsed.resourcesSeeded === true;
  const tags = Array.isArray(parsed.tags) ? parsed.tags : (Array.isArray(parsed.groups) ? parsed.groups : (Array.isArray(parsed.decks) ? parsed.decks : []));
  // `componentGroups`: registro de propiedades de grupo (core/group.js), colección nueva sin alias de
  // compatibilidad — no puede llamarse `groups`, esa clave ya está reservada como alias legacy de `tags`.
  const componentGroups = Array.isArray(parsed.componentGroups) ? parsed.componentGroups : [];
  const appTitle = (typeof parsed.appTitle === 'string' && parsed.appTitle.trim() !== '') ? parsed.appTitle : DEFAULT_APP_TITLE;
  // Texto de la mesa (preferencia local): cadena vacía si falta o no es string.
  // Guardados anteriores a este campo simplemente no traen la clave; sin migración.
  const tableText = typeof parsed.tableText === 'string' ? parsed.tableText : '';
  return { components: parsed.components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle, tableText };
}

export function saveState(components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle, tableText) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle, tableText }));
  } catch {
    // Cuota excedida u otro fallo de localStorage: el autoguardado se omite
    // silenciosamente, sin interrumpir el uso normal de la aplicación.
  }
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  return parseState(raw);
}

export function readSeedState() {
  const seedEl = document.getElementById('initial-state');
  const raw = seedEl?.textContent.trim();
  if (!raw) return null;
  const result = parseState(raw);
  return result.error ? null : result;
}

// Variante de parseState() sin la condición de versión: a diferencia del
// guardado automático del navegador, importar un fichero exportado desde una
// versión distinta de la app es el caso de uso principal, no un error.
export function parseImportedComponents(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { error: true, detail: e.message };
  }
  if (!parsed || !Array.isArray(parsed.components)) {
    return { error: true, detail: t('persistence.importParseError') };
  }
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  const tags = Array.isArray(parsed.tags) ? parsed.tags : (Array.isArray(parsed.groups) ? parsed.groups : (Array.isArray(parsed.decks) ? parsed.decks : []));
  const componentGroups = Array.isArray(parsed.componentGroups) ? parsed.componentGroups : [];
  // A diferencia de parseState, aquí `null` en vez de DEFAULT_APP_TITLE: este
  // resultado no siempre se aplica al importar (solo en modo "Sobrescribir
  // todo el juego", ui/editModeToggle.js), así que un fichero sin título no
  // debe forzar el título por defecto sobre la partida actual.
  const appTitle = (typeof parsed.appTitle === 'string' && parsed.appTitle.trim() !== '') ? parsed.appTitle : null;
  return { components: parsed.components, resources, tags, componentGroups, appTitle };
}

// JSON ligero con los componentes, todos los recursos, las etiquetas y los grupos —
// pensado para sobrevivir a cambios de versión de la app, sin incluir la
// configuración del panel flotante.
export function buildComponentsExport(components, resources, tags, componentGroups, appTitle) {
  return { version: CURRENT_VERSION, components, resources, tags, componentGroups, appTitle };
}
