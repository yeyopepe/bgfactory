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
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  const resourcesSeeded = parsed.resourcesSeeded === true;
  return { components: parsed.components, panelState, resources, resourcePanelState, resourcesSeeded };
}

export function saveState(components, panelState, resources, resourcePanelState, resourcesSeeded) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded }));
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
