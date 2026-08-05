// Composición del título completo de la app (texto libre editable + versión,
// esta última siempre no editable) a partir del estado y de CURRENT_VERSION.

import { CURRENT_VERSION } from '../data/version.js';

export const DEFAULT_APP_TITLE = 'Errantes, un juego de mesa de SJ Martínez';

export function formatVersion() {
  return `v.${CURRENT_VERSION.slice(1)}`;
}

export function getFullAppTitle(appTitle) {
  return `${appTitle} ${formatVersion()}`;
}
