// UI para entrar/salir del modo edición: botón de entrada en modo juego,
// barra de herramientas propia (con botón de salida) en modo edición.

import { MODES, getState, setMode, getComponents, getResources, getPanelState, getResourcePanelState, getResourcesSeeded } from '../core/state.js';
import { buildExportHtml, downloadHtml } from '../core/fileExport.js';
import { getComponentsBounds } from './componentRenderer.js';
import { fitToBounds } from './table.js';
import { showToast } from './toast.js';

function currentFileName() {
  const fromPath = decodeURIComponent(location.pathname.split('/').pop() || '');
  return fromPath && fromPath.endsWith('.html') ? fromPath : 'errantes.html';
}

function saveAs(filename) {
  const html = buildExportHtml(getComponents(), getResources(), getPanelState(), getResourcePanelState(), getResourcesSeeded());
  downloadHtml(filename, html);
  showToast(`Guardado como "${filename}"`);
}

function createFitButton(className) {
  const button = document.createElement('button');
  if (className) button.className = className;
  button.title = 'Ajustar zoom para ver todos los elementos';
  button.setAttribute('aria-label', 'Ajustar zoom');
  button.innerHTML = `
    <svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 9V5a1 1 0 0 1 1-1h4" stroke-linecap="round"/>
      <path d="M20 9V5a1 1 0 0 0-1-1h-4" stroke-linecap="round"/>
      <path d="M4 15v4a1 1 0 0 0 1 1h4" stroke-linecap="round"/>
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" stroke-linecap="round"/>
    </svg>
  `;
  button.addEventListener('click', () => fitToBounds(getComponentsBounds(getComponents())));
  return button;
}

export function renderModeSwitcher(container) {
  container.innerHTML = '';

  if (getState().mode !== MODES.PLAY) return;

  const button = document.createElement('button');
  button.textContent = 'Entrar en modo edición';
  button.addEventListener('click', () => setMode(MODES.EDIT));
  container.appendChild(button);

  container.appendChild(createFitButton('mode-switcher__fit-btn'));
}

export function renderEditToolbar(container) {
  container.innerHTML = '';

  if (getState().mode !== MODES.EDIT) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';

  const button = document.createElement('button');
  button.textContent = 'Salir del modo edición';
  button.addEventListener('click', () => setMode(MODES.PLAY));
  toolbar.appendChild(button);

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Guardar';
  saveButton.addEventListener('click', () => {
    const name = prompt('Guardar', currentFileName());
    if (!name) return;
    saveAs(name.endsWith('.html') ? name : `${name}.html`);
  });
  toolbar.appendChild(saveButton);

  toolbar.appendChild(createFitButton());

  container.appendChild(toolbar);
}
