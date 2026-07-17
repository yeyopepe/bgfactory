// UI para entrar/salir del modo edición: botón de entrada en modo juego,
// barra de herramientas propia (con botón de salida) en modo edición.

import { MODES, getState, setMode, getComponents } from '../core/state.js';
import { buildExportHtml, downloadHtml } from '../core/fileExport.js';
import { showToast } from './toast.js';

function currentFileName() {
  const fromPath = decodeURIComponent(location.pathname.split('/').pop() || '');
  return fromPath && fromPath.endsWith('.html') ? fromPath : 'errantes.html';
}

function saveAs(filename) {
  const html = buildExportHtml(getComponents());
  downloadHtml(filename, html);
  showToast(`Guardado como "${filename}"`);
}

export function renderEnterEditButton(container) {
  container.innerHTML = '';

  if (getState().mode !== MODES.PLAY) return;

  const button = document.createElement('button');
  button.textContent = 'Entrar en modo edición';
  button.addEventListener('click', () => setMode(MODES.EDIT));
  container.appendChild(button);
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

  container.appendChild(toolbar);
}
