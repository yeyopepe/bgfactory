// Título completo: texto libre editable + versión (siempre no editable), desde CURRENT_VERSION.

import { CURRENT_VERSION } from '../data/version.js';

export const DEFAULT_APP_TITLE = 'BG Factory';

export function formatVersion() {
  return `v.${CURRENT_VERSION.slice(1)}`;
}

export function getFullAppTitle(appTitle) {
  return `${appTitle} ${formatVersion()}`;
}

// Nombre de producto + versión, SIEMPRE con el literal por defecto ("BG Factory"),
// con independencia del título editable que el usuario haya dado a su juego.
// Fuente única de ese literal versionado (lo usan ui/settingsModal.js y main.js).
export function getVersionedProductName() {
  return `${DEFAULT_APP_TITLE} ${formatVersion()}`;
}
