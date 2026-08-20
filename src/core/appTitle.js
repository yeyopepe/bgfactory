// Título completo: texto libre editable + versión (siempre no editable), desde CURRENT_VERSION.

import { CURRENT_VERSION } from '../data/version.js';

export const DEFAULT_APP_TITLE = 'BG Factory';

export function formatVersion() {
  return `v.${CURRENT_VERSION.slice(1)}`;
}

export function getFullAppTitle(appTitle) {
  return `${appTitle} ${formatVersion()}`;
}
