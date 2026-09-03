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
import { t } from '../core/i18n.js';
import { openSettingsModal } from './settingsModal.js';

// SVG (24x24) para cada botón icono-solo de la barra. Solo markup estático.
const ICON_FIT = '<svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V5a1 1 0 0 1 1-1h4" stroke-linecap="round"/><path d="M20 9V5a1 1 0 0 0-1-1h-4" stroke-linecap="round"/><path d="M4 15v4a1 1 0 0 0 1 1h4" stroke-linecap="round"/><path d="M20 15v4a1 1 0 0 1-1 1h-4" stroke-linecap="round"/></svg>';
const ICON_SETTINGS = '<svg class="icon-frame" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.32 2.5a1 1 0 0 0-.98.8l-.33 1.66a7.5 7.5 0 0 0-1.6.93l-1.6-.55a1 1 0 0 0-1.19.45l-1.68 2.9a1 1 0 0 0 .2 1.25l1.28 1.1a7.6 7.6 0 0 0 0 1.86l-1.27 1.1a1 1 0 0 0-.21 1.25l1.68 2.9a1 1 0 0 0 1.19.45l1.6-.55c.5.38 1.03.7 1.6.93l.33 1.66a1 1 0 0 0 .98.8h3.36a1 1 0 0 0 .98-.8l.33-1.66c.57-.24 1.1-.55 1.6-.93l1.6.55a1 1 0 0 0 1.19-.45l1.68-2.9a1 1 0 0 0-.21-1.25l-1.27-1.1c.06-.62.06-1.24 0-1.86l1.28-1.1a1 1 0 0 0 .2-1.25l-1.68-2.9a1 1 0 0 0-1.19-.45l-1.6.55a7.5 7.5 0 0 0-1.6-.93l-.33-1.66a1 1 0 0 0-.98-.8h-3.36ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/></svg>';
const ICON_IMPORT = '<svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10l5-5 5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_EXPORT = '<svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_EXPORT_CHEVRON = '<svg class="icon-frame export-menu__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_MODE_PLAY = '<svg class="icon-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17l5-5-5-5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Botón con un SVG + un texto (separados: el SVG en innerHTML, el texto en un span).
function iconTextButton(svg, text) {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = svg;
  const span = document.createElement('span');
  span.textContent = text;
  button.appendChild(span);
  return button;
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
      showErrorModal(t('import.error.title'), t('import.error.body'), result.detail);
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
              runWithProgressModal(t('import.progress'), () => {
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

  const button = iconTextButton(ICON_EXPORT, t('toolbar.export'));
  button.insertAdjacentHTML('beforeend', ICON_EXPORT_CHEVRON);
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
      tag.textContent = t('common.comingSoon');
      item.appendChild(tag);
    } else {
      item.addEventListener('click', () => {
        closeMenu();
        openExportFlow();
      });
    }

    menu.appendChild(item);
  }

  addItem({ label: t('export.menu.gameJson') });

  const separator = document.createElement('div');
  separator.className = 'export-menu__separator';
  menu.appendChild(separator);

  addItem({ label: t('export.menu.resourcesZip'), soon: true });
  addItem({ label: t('export.menu.productionCsv'), soon: true });

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

// Controles de "Importar" (input de fichero oculto + botón). Mismo aspecto en
// ambos modos (blanco sobre fondo oscuro): la clase .toolbar-btn--ghost la aplica
// tanto la barra .edit-toolbar como la fila de controles de la cabecera.
function createImportControls() {
  const fragment = document.createDocumentFragment();

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
  fragment.appendChild(importInput);

  const importButton = iconTextButton(ICON_IMPORT, t('toolbar.import'));
  importButton.addEventListener('click', () => importInput.click());
  fragment.appendChild(importButton);

  return fragment;
}

function createFitButton(className) {
  const button = document.createElement('button');
  if (className) button.className = className;
  button.title = t('toolbar.fitZoom');
  button.setAttribute('aria-label', t('toolbar.fitZoom.aria'));
  button.innerHTML = ICON_FIT;
  button.addEventListener('click', () => fitToBounds(getComponentsBounds(getComponents())));
  return button;
}

// Botón de configuración: icono-solo 36x36, estilo blanco/negro (sin fondo azul),
// abre el panel de configuración.
function createSettingsButton(className) {
  const button = document.createElement('button');
  if (className) button.className = className;
  button.title = t('toolbar.settings');
  button.setAttribute('aria-label', t('toolbar.settings'));
  button.innerHTML = ICON_SETTINGS;
  button.addEventListener('click', () => openSettingsModal());
  return button;
}

// Botón de cambio de modo ("Modo Edición" / "Modo Juego"), acción primaria (azul),
// siempre en la fila de controles de la cabecera en ambos modos.
function createModeButton() {
  const isPlay = getState().mode === MODES.PLAY;
  const button = isPlay
    ? (() => { const b = document.createElement('button'); b.textContent = t('toolbar.modeEdit'); return b; })()
    : iconTextButton(ICON_MODE_PLAY, t('toolbar.modePlay'));
  button.className = 'mode-switcher__mode-btn';
  button.addEventListener('click', () => setMode(isPlay ? MODES.EDIT : MODES.PLAY));
  return button;
}

// Fila de controles de la esquina superior derecha, común a ambos modos:
// [Importar] [Exportar] | (separador, solo en modo juego) [Modo] [Ajustar zoom] [Configuración].
// Montada dentro de #mode-switcher (position: fixed).
export function renderModeSwitcher(container) {
  container.innerHTML = '';

  const isPlay = getState().mode === MODES.PLAY;

  // En modo juego el bloque de fichero (Importar/Exportar) vive aquí; en modo
  // edición vive en la franja .edit-toolbar, así que aquí no aparece ni el separador.
  if (isPlay) {
    container.appendChild(createImportControls());
    container.appendChild(createExportMenu());
    const divider = document.createElement('div');
    divider.className = 'toolbar-divider';
    container.appendChild(divider);
  }

  container.appendChild(createModeButton());
  container.appendChild(createFitButton('mode-switcher__fit-btn'));
  container.appendChild(createSettingsButton('mode-switcher__settings-btn'));
}

export function renderEditToolbar(container) {
  container.innerHTML = '';

  if (getState().mode !== MODES.EDIT) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';

  const persistenceGroup = document.createElement('div');
  persistenceGroup.className = 'toolbar-group';
  persistenceGroup.appendChild(createImportControls());
  toolbar.appendChild(persistenceGroup);

  toolbar.appendChild(document.createElement('div')).className = 'toolbar-divider';

  const exportGroup = document.createElement('div');
  exportGroup.className = 'toolbar-group';
  exportGroup.appendChild(createExportMenu());
  toolbar.appendChild(exportGroup);

  container.appendChild(toolbar);
}
