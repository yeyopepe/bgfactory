// UI para entrar/salir del modo edición: botón de entrada en modo juego,
// barra de herramientas propia (con botón de salida) en modo edición.

import { MODES, getState, setMode, getComponents, getResources, getPanelState, getResourcePanelState, getResourcesSeeded, loadComponents, loadResources, loadDecks, getDecks } from '../core/state.js';
import { buildExportHtml, downloadHtml, downloadJson } from '../core/fileExport.js';
import { buildComponentsExport, parseImportedComponents } from '../core/persistence.js';
import { getComponentsWithMissingResources } from '../core/resource.js';
import { getComponentsWithMissingDeck } from '../core/deck.js';
import { getComponentsBounds } from './componentRenderer.js';
import { fitToBounds } from './table.js';
import { showToast } from './toast.js';
import { showErrorModal } from './errorModal.js';

function currentFileName() {
  const fromPath = decodeURIComponent(location.pathname.split('/').pop() || '');
  return fromPath && fromPath.endsWith('.html') ? fromPath : 'errantes.html';
}

function saveAs(filename) {
  const html = buildExportHtml(getComponents(), getResources(), getPanelState(), getResourcePanelState(), getResourcesSeeded(), getDecks());
  downloadHtml(filename, html);
  showToast(`Guardado como "${filename}"`);
}

function exportComponentsAs(filename) {
  const data = buildComponentsExport(getComponents(), getResources(), getDecks());
  downloadJson(filename, data);
}

function importComponentsFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const result = parseImportedComponents(reader.result);
    if (result.error) {
      showErrorModal('No se ha podido importar el fichero', 'El fichero seleccionado no contiene un listado de componentes válido.', result.detail);
      return;
    }
    if (!confirm('Se reemplazarán todos los componentes, recursos y mazos actuales por los del fichero importado. ¿Continuar?')) return;

    loadComponents(result.components);
    loadResources(result.resources);
    loadDecks(result.decks);

    const missingResourceIds = getComponentsWithMissingResources(result.components, result.resources.map((r) => r.id));
    const missingDeckIds = getComponentsWithMissingDeck(result.components, result.decks.map((d) => d.id));
    if (missingResourceIds.length > 0 || missingDeckIds.length > 0) {
      const parts = [];
      if (missingResourceIds.length > 0) parts.push(`recursos no incluidos en el fichero (componentes: ${missingResourceIds.join(', ')})`);
      if (missingDeckIds.length > 0) parts.push(`mazos no incluidos en el fichero (componentes: ${missingDeckIds.join(', ')})`);
      showErrorModal('Importación con referencias incompletas', `La importación se ha completado, pero algunos componentes referencian ${parts.join(' y ')}.`, null);
    }
  };
  reader.readAsText(file);
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

  const exportButton = document.createElement('button');
  exportButton.textContent = 'Exportar';
  exportButton.addEventListener('click', () => {
    const name = prompt('Exportar', 'errantes-componentes.json');
    if (!name) return;
    exportComponentsAs(name.endsWith('.json') ? name : `${name}.json`);
  });
  toolbar.appendChild(exportButton);

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.hidden = true;
  importInput.addEventListener('change', () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;
    importComponentsFromFile(file);
  });
  toolbar.appendChild(importInput);

  const importButton = document.createElement('button');
  importButton.textContent = 'Importar';
  importButton.addEventListener('click', () => importInput.click());
  toolbar.appendChild(importButton);

  toolbar.appendChild(createFitButton());

  container.appendChild(toolbar);
}
