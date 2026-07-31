// Persistencia del estado de componentes: autoguardado en localStorage
// (un único slot por navegador/perfil) y lectura de la semilla embebida en
// el propio documento (usada cuando aún no hay nada guardado en el navegador).

import { CURRENT_VERSION } from '../data/version.js';

const STORAGE_KEY = 'errantes:state';

function parseState(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: true };
  }
  if (!parsed || parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.components)) {
    return { error: true };
  }
  const panelState = (parsed.panelState && typeof parsed.panelState === 'object') ? parsed.panelState : null;
  const resourcePanelState = (parsed.resourcePanelState && typeof parsed.resourcePanelState === 'object') ? parsed.resourcePanelState : null;
  // Compatibilidad hacia atrás (cambio 00105, "Mazo" → "Grupo"): un guardado hecho con
  // la app anterior a este cambio tiene estas dos colecciones bajo las claves antiguas
  // `decks`/`deckPanelState` — se siguen leyendo si las nuevas no están presentes.
  const groupPanelStateRaw = parsed.groupPanelState ?? parsed.deckPanelState;
  const groupPanelState = (groupPanelStateRaw && typeof groupPanelStateRaw === 'object') ? groupPanelStateRaw : null;
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  const resourcesSeeded = parsed.resourcesSeeded === true;
  const groups = Array.isArray(parsed.groups) ? parsed.groups : (Array.isArray(parsed.decks) ? parsed.decks : []);
  return { components: parsed.components, panelState, resources, resourcePanelState, resourcesSeeded, groups, groupPanelState };
}

export function saveState(components, panelState, resources, resourcePanelState, resourcesSeeded, groups, groupPanelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded, groups, groupPanelState }));
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
    return { error: true, detail: 'El fichero no contiene un listado de componentes válido.' };
  }
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  const groups = Array.isArray(parsed.groups) ? parsed.groups : (Array.isArray(parsed.decks) ? parsed.decks : []);
  return { components: parsed.components, resources, groups };
}

// JSON ligero con los componentes, todos los recursos y los grupos (a diferencia
// de "Guardar", que exporta la app completa) — pensado para sobrevivir a
// cambios de versión de la app, sin incluir la configuración del panel flotante.
export function buildComponentsExport(components, resources, groups) {
  return { version: CURRENT_VERSION, components, resources, groups };
}
