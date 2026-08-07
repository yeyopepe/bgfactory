// Clona el documento vivo (CSS/JS ya embebidos por el build) en vez de
// reconstruir el HTML desde cero, con el estado embebido en la copia.

import { CURRENT_VERSION } from '../data/version.js';

export function buildExportHtml(components, resources, panelState, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle) {
  const clone = document.documentElement.cloneNode(true);
  const seedEl = clone.querySelector('#initial-state');
  seedEl.textContent = JSON.stringify({ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle });
  return `<!doctype html>\n${clone.outerHTML}`;
}

export function downloadHtml(filename, htmlContent) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
