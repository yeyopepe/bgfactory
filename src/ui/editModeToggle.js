// UI para entrar/salir del modo edición: botón de entrada en modo juego,
// barra de herramientas propia (con botón de salida) en modo edición.

import { MODES, getState, setMode, getComponents, getResources, getPanelState, getResourcePanelState, getResourcesSeeded, loadComponents, loadResources, loadTags, getTags, getTagPanelState, getAppTitle, setAppTitle, getGroups, loadGroups } from '../core/state.js';
import { getFullAppTitle } from '../core/appTitle.js';
import { downloadJson } from '../core/fileExport.js';
import { buildComponentsExport, parseImportedComponents } from '../core/persistence.js';
import { mergeImportedGame } from '../core/importMerge.js';
import { deriveMissingGroups } from '../core/group.js';
import { getComponentsBounds } from './componentRenderer.js';
import { fitToBounds } from './table.js';
import { showErrorModal } from './errorModal.js';
import { openExportSelectionModal } from './exportSelectionModal.js';
import { openImportSelectionModal } from './importSelectionModal.js';
import { openImportConfirmModal } from './importConfirmModal.js';
import { openImportReportModal } from './importReportModal.js';
import { openImportConversionErrorModal } from './importConversionErrorModal.js';
import { migrateFichaComponent } from '../core/fichaMigration.js';
import { runWithProgressModal } from './progressModal.js';

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

function createExportMenu() {
  const wrap = document.createElement('div');
  wrap.className = 'export-menu-wrap';

  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `
    <svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Exportar
    <svg class="icon-frame export-menu__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  wrap.appendChild(button);

  const menu = document.createElement('div');
  menu.className = 'export-menu';
  menu.hidden = true;

  function addItem({ label, soon }) {
    const item = document.createElement('div');
    item.className = 'export-menu__item';
    if (soon) item.classList.add('export-menu__item--soon');

    const text = document.createElement('span');
    text.className = 'export-menu__item-label';
    text.textContent = label;
    item.appendChild(text);

    if (soon) {
      const tag = document.createElement('span');
      tag.className = 'export-menu__soon-tag';
      tag.textContent = 'Próximamente';
      item.appendChild(tag);
    } else {
      item.addEventListener('click', () => {
        closeMenu();
        openExportFlow();
      });
    }

    menu.appendChild(item);
  }

  addItem({ label: 'Exportar juego (.json)' });

  const separator = document.createElement('div');
  separator.className = 'export-menu__separator';
  menu.appendChild(separator);

  addItem({ label: 'Exportar recursos (.zip)', soon: true });
  addItem({ label: 'Exportar hoja de producción (.csv)', soon: true });

  wrap.appendChild(menu);

  function closeMenu() {
    menu.hidden = true;
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleKeydown);
  }

  function handleOutsideClick(e) {
    if (!wrap.contains(e.target)) closeMenu();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') closeMenu();
  }

  button.addEventListener('click', () => {
    if (menu.hidden) {
      menu.hidden = false;
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeydown);
    } else {
      closeMenu();
    }
  });

  return wrap;
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

  const persistenceGroup = document.createElement('div');
  persistenceGroup.className = 'toolbar-group';

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
  persistenceGroup.appendChild(importInput);

  const importButton = document.createElement('button');
  importButton.innerHTML = `
    <svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7 10l5-5 5 5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Importar
  `;
  importButton.addEventListener('click', () => importInput.click());
  persistenceGroup.appendChild(importButton);
  toolbar.appendChild(persistenceGroup);

  toolbar.appendChild(document.createElement('div')).className = 'toolbar-divider';

  const exportGroup = document.createElement('div');
  exportGroup.className = 'toolbar-group';
  exportGroup.appendChild(createExportMenu());
  toolbar.appendChild(exportGroup);

  toolbar.appendChild(document.createElement('div')).className = 'toolbar-divider';

  const sessionGroup = document.createElement('div');
  sessionGroup.className = 'toolbar-group';

  const exitButton = document.createElement('button');
  exitButton.className = 'edit-toolbar__exit-btn';
  exitButton.innerHTML = `
    <svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 17l5-5-5-5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Salir del modo edición
  `;
  exitButton.addEventListener('click', () => setMode(MODES.PLAY));
  sessionGroup.appendChild(exitButton);
  toolbar.appendChild(sessionGroup);

  container.appendChild(toolbar);

  // Botón "Ajustar zoom" fijo en la esquina superior derecha, igual que en modo
  // juego (misma clase); fuera de .edit-toolbar para no heredar su estilo de barra.
  container.appendChild(createFitButton('mode-switcher__fit-btn'));
}
