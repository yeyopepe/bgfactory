// UI para entrar/salir del modo edición: botón de entrada en modo juego,
// barra de herramientas propia (con botón de salida) en modo edición.

import { MODES, getState, setMode, getComponents, getResources, getPanelState, getResourcePanelState, getResourcesSeeded, loadComponents, loadResources, loadDecks, getDecks, getDeckPanelState } from '../core/state.js';
import { buildExportHtml, downloadHtml, downloadJson } from '../core/fileExport.js';
import { buildComponentsExport, parseImportedComponents } from '../core/persistence.js';
import { mergeImportedGame } from '../core/importMerge.js';
import { convertFichaToCarta } from '../core/fichaMigration.js';
import { getComponentsBounds } from './componentRenderer.js';
import { fitToBounds } from './table.js';
import { showToast } from './toast.js';
import { showErrorModal } from './errorModal.js';
import { openExportSelectionModal } from './exportSelectionModal.js';
import { openImportSelectionModal } from './importSelectionModal.js';
import { openImportConfirmModal } from './importConfirmModal.js';
import { openImportReportModal } from './importReportModal.js';
import { openFichaConversionErrorModal } from './fichaConversionErrorModal.js';

function currentFileName() {
  const fromPath = decodeURIComponent(location.pathname.split('/').pop() || '');
  return fromPath && fromPath.endsWith('.html') ? fromPath : 'errantes.html';
}

function saveAs(filename) {
  const html = buildExportHtml(getComponents(), getResources(), getPanelState(), getResourcePanelState(), getResourcesSeeded(), getDecks(), getDeckPanelState());
  downloadHtml(filename, html);
  showToast(`Guardado como "${filename}"`);
}

function byIds(items, ids) {
  const idSet = new Set(ids);
  return items.filter((item) => idSet.has(item.id));
}

function openExportFlow() {
  openExportSelectionModal({
    components: getComponents(),
    resources: getResources(),
    decks: getDecks(),
    defaultFilename: 'errantes-componentes.json',
    onAccept: ({ filename, componentIds, resourceIds, deckIds }) => {
      const data = buildComponentsExport(byIds(getComponents(), componentIds), byIds(getResources(), resourceIds), byIds(getDecks(), deckIds));
      downloadJson(filename.endsWith('.json') ? filename : `${filename}.json`, data);
    },
  });
}

function convertSelectedFichas(components) {
  const converted = [];
  const errors = [];
  for (const component of components) {
    if (component.type === 'ficha') {
      const { component: convertedComponent, error } = convertFichaToCarta(component);
      if (error) {
        errors.push({ id: component.id, motivo: error });
      } else {
        converted.push(convertedComponent);
      }
    } else {
      converted.push(component);
    }
  }
  return { components: converted, errors };
}

function importComponentsFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const result = parseImportedComponents(reader.result);
    if (result.error) {
      showErrorModal('No se ha podido importar el fichero', 'El fichero seleccionado no contiene un listado de componentes válido.', result.detail);
      return;
    }

    openImportSelectionModal({
      components: result.components,
      resources: result.resources,
      decks: result.decks,
      onAccept: ({ componentIds, resourceIds, deckIds }) => {
        openImportConfirmModal({
          onAccept: ({ mode, conflictMode }) => {
            const selectedComponents = byIds(result.components, componentIds);
            const { components: convertedComponents, errors: fichaErrors } = convertSelectedFichas(selectedComponents);

            function applyImportedSelection(componentsToImport) {
              const { components, resources, decks, report } = mergeImportedGame({
                mode,
                conflictMode,
                existingComponents: getComponents(),
                existingResources: getResources(),
                existingDecks: getDecks(),
                selectedComponents: componentsToImport,
                selectedResources: byIds(result.resources, resourceIds),
                selectedDecks: byIds(result.decks, deckIds),
                allImportedResources: result.resources,
                allImportedDecks: result.decks,
              });

              loadComponents(components);
              loadResources(resources);
              loadDecks(decks);

              if (report.length > 0) openImportReportModal(report);
            }

            if (fichaErrors.length > 0) {
              openFichaConversionErrorModal({
                errors: fichaErrors,
                onAbort: () => {
                  // No hacer nada — la partida actual queda intacta
                },
                onContinue: () => {
                  applyImportedSelection(convertedComponents);
                },
              });
            } else {
              applyImportedSelection(convertedComponents);
            }
          },
        });
      },
    });
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
  exportButton.addEventListener('click', () => openExportFlow());
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
