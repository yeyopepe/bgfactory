// UI para entrar/salir del modo edición: botón de entrada en modo juego,
// barra de herramientas propia (con botón de salida) en modo edición.

import { MODES, getState, setMode, getComponents, getResources, getPanelState, getResourcePanelState, getResourcesSeeded, loadComponents, loadResources, loadTags, getTags, getTagPanelState, getAppTitle, setAppTitle, getGroups, loadGroups } from '../core/state.js';
import { getFullAppTitle } from '../core/appTitle.js';
import { buildExportHtml, downloadHtml, downloadJson } from '../core/fileExport.js';
import { buildComponentsExport, parseImportedComponents } from '../core/persistence.js';
import { mergeImportedGame } from '../core/importMerge.js';
import { deriveMissingGroups } from '../core/group.js';
import { getComponentsBounds } from './componentRenderer.js';
import { fitToBounds } from './table.js';
import { showToast } from './toast.js';
import { showErrorModal } from './errorModal.js';
import { openExportSelectionModal } from './exportSelectionModal.js';
import { openImportSelectionModal } from './importSelectionModal.js';
import { openImportConfirmModal } from './importConfirmModal.js';
import { openImportReportModal } from './importReportModal.js';
import { openImportConversionErrorModal } from './importConversionErrorModal.js';
import { migrateFichaComponent } from '../core/fichaMigration.js';
import { runWithProgressModal } from './progressModal.js';

function saveAs(filename) {
  const html = buildExportHtml(getComponents(), getResources(), getPanelState(), getResourcePanelState(), getResourcesSeeded(), getTags(), getTagPanelState(), getGroups(), getAppTitle());
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
    tags: getTags(),
    defaultFilename: `${getFullAppTitle(getAppTitle())}.json`,
    onAccept: ({ filename, componentIds, resourceIds, tagIds }) => {
      const exportedComponents = byIds(getComponents(), componentIds);
      const exportedGroupIds = new Set(exportedComponents.filter((c) => c.groupId != null).map((c) => c.groupId));
      const exportedGroups = getGroups().filter((g) => exportedGroupIds.has(g.id));
      const data = buildComponentsExport(exportedComponents, byIds(getResources(), resourceIds), byIds(getTags(), tagIds), exportedGroups, getAppTitle());
      downloadJson(filename.endsWith('.json') ? filename : `${filename}.json`, data);
    },
  });
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
      tags: result.tags,
      onAccept: ({ componentIds, resourceIds, tagIds }) => {
        openImportConfirmModal({
          onAccept: ({ mode, conflictMode }) => {
            const selectedComponents = byIds(result.components, componentIds);

            const migratedSelectedComponents = [];
            const conversionErrors = [];
            for (const component of selectedComponents) {
              if (component.type !== 'ficha') {
                migratedSelectedComponents.push(component);
                continue;
              }
              const { component: migrated, errors } = migrateFichaComponent(component);
              migratedSelectedComponents.push(migrated);
              if (errors.length > 0) conversionErrors.push({ componentId: component.id, errors });
            }

            const proceedWithImport = (components) => {
              runWithProgressModal('Importando…', () => {
                const { components: mergedComponents, resources, tags, report } = mergeImportedGame({
                  mode,
                  conflictMode,
                  existingComponents: getComponents(),
                  existingResources: getResources(),
                  existingTags: getTags(),
                  selectedComponents: components,
                  selectedResources: byIds(result.resources, resourceIds),
                  selectedTags: byIds(result.tags, tagIds),
                  allImportedResources: result.resources,
                  allImportedTags: result.tags,
                });

                loadComponents(mergedComponents);
                loadResources(resources);
                loadTags(tags);
                // Registro de grupo: se fusiona por id igual que recursos/etiquetas, sin
                // deduplicación adicional. "Sobrescribir" parte solo de los grupos del
                // fichero importado; "Añadir" conserva los actuales y suma los importados
                // que no colisionen por id. deriveMissingGroups cubre además ficheros
                // exportados antes de este cambio (sin `componentGroups`).
                const importedGroups = result.componentGroups ?? [];
                const mergedGroups = mode === 'overwrite'
                  ? importedGroups
                  : [...getGroups(), ...importedGroups.filter((g) => !getGroups().some((existing) => existing.id === g.id))];
                loadGroups(deriveMissingGroups(mergedComponents, mergedGroups));
                if (mode === 'overwrite' && result.appTitle) setAppTitle(result.appTitle);

                if (report.length > 0) openImportReportModal(report);
              });
            };

            if (conversionErrors.length === 0) {
              proceedWithImport(migratedSelectedComponents);
              return;
            }

            openImportConversionErrorModal({
              errors: conversionErrors,
              onContinue: () => {
                const errorIds = new Set(conversionErrors.map((e) => e.componentId));
                proceedWithImport(migratedSelectedComponents.filter((c) => !errorIds.has(c.id)));
              },
              onAbort: () => {},
            });
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
    const name = prompt('Guardar', `${getFullAppTitle(getAppTitle())}.html`);
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
