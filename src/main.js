// Bootstrap de la aplicación: monta el selector de modo y renderiza el modo
// activo, refrescando ante cualquier cambio.

import { on } from './core/eventBus.js';
import {
  MODES, getState, loadComponents, getComponents, getPanelState, loadPanelState,
  addResource, loadResources, getResources, getResourcePanelState, loadResourcePanelState,
  getResourcesSeeded, markResourcesSeeded, loadResourcesSeeded, getTags, loadTags,
  getTagPanelState, loadTagPanelState, getAppTitle, loadAppTitle, getGroups, loadGroups,
} from './core/state.js';
import { CURRENT_VERSION } from './data/version.js';
import { DEFAULT_RESOURCES } from './data/defaultResources.js';
import { renderModeSwitcher, renderEditToolbar } from './ui/editModeToggle.js';
import { renderAppTitle } from './ui/appTitle.js';
import { initGlobalShortcuts } from './ui/globalShortcuts.js';
import { renderPlayMode } from './modes/play/playMode.js';
import { renderEditMode, deleteSelectedComponent, moveSelectedComponent } from './modes/edit/editMode.js';
import { createResource } from './core/resource.js';
import { deriveMissingGroups } from './core/group.js';
import { saveState, loadState, readSeedState } from './core/persistence.js';
import { showToast } from './ui/toast.js';
import { syncFontFaces } from './ui/fontFaceRegistry.js';
import { initI18n, t } from './core/i18n.js';

// i18n lo primero: resuelve el idioma activo, fija <html lang> y document.title
// antes de construir nada de UI ni disparar los toasts de arranque.
initI18n();

const switcherEl = document.getElementById('mode-switcher');
const toolbarEl = document.getElementById('edit-toolbar');
const contentEl = document.getElementById('content');
const titleEl = document.getElementById('app-title');
const versionEl = document.getElementById('app-version');

function renderAppVersion(el) {
  if (!el) return;
  el.textContent = '';

  const nameLine = document.createElement('div');
  nameLine.className = 'app-version__name';
  nameLine.textContent = `BG Factory ${CURRENT_VERSION}`;

  const repoLine = document.createElement('div');
  repoLine.className = 'app-version__repo';
  const repoLink = document.createElement('a');
  repoLink.href = 'https://github.com/yeyopepe/bgfactory';
  repoLink.target = '_blank';
  repoLink.rel = 'noopener';
  repoLink.textContent = t('appVersion.repoLink');
  repoLine.appendChild(repoLink);

  el.append(nameLine, repoLine);
}

function renderActiveMode() {
  if (getState().mode === MODES.EDIT) {
    renderEditMode(contentEl);
  } else {
    renderPlayMode(contentEl);
  }
}

function renderAll() {
  if (titleEl) renderAppTitle(titleEl);
  renderAppVersion(versionEl);
  renderModeSwitcher(switcherEl);
  renderEditToolbar(toolbarEl);
  renderActiveMode();
}

function persistState() {
  saveState(getComponents(), getPanelState(), getResources(), getResourcePanelState(), getResourcesSeeded(), getTags(), getTagPanelState(), getGroups(), getAppTitle());
}

on('mode:changed', renderAll);
on('components:changed', renderAll);
on('components:changed', persistState);
on('panelState:changed', persistState);
on('resources:changed', renderAll);
on('resources:changed', persistState);
on('resources:changed', (resources) => syncFontFaces(resources));
on('resourcePanelState:changed', persistState);
on('tags:changed', renderAll);
on('tags:changed', persistState);
on('tagPanelState:changed', persistState);
on('groups:changed', renderAll);
on('groups:changed', persistState);
on('appTitle:changed', renderAll);
on('appTitle:changed', persistState);
on('language:changed', renderAll);

initGlobalShortcuts({
  isEditMode: () => getState().mode === MODES.EDIT,
  onDeleteSelected: () => deleteSelectedComponent(),
  onMoveSelected: (dx, dy) => moveSelectedComponent(dx, dy),
});

// El nombre de cada recurso semilla se traduce en el momento de sembrarlo
// (id fijo -> clave de i18n). Tras la siembra son datos de usuario, no se re-traducen.
const DEFAULT_RESOURCE_NAME_KEY = {
  'example-image': 'defaultResource.exampleImage',
  'example-font': 'defaultResource.exampleFont',
};

function seedDefaultResources() {
  // Flag a true antes de añadir: cada addResource() dispara autoguardado síncrono.
  markResourcesSeeded();
  for (const resourceData of DEFAULT_RESOURCES) {
    const nameKey = DEFAULT_RESOURCE_NAME_KEY[resourceData.id];
    const name = nameKey ? t(nameKey) : resourceData.name;
    addResource(createResource({ ...resourceData, name }));
  }
}

// Arranque de reserva: semilla embebida si la hay, si no recursos por defecto.
// Mismo camino para "no hay nada guardado", "estado de otra versión" y
// "estado corrupto".
function bootFromSeedOrDefaults() {
  const seed = readSeedState();
  if (seed) {
    loadAppTitle(seed.appTitle);
    loadResourcesSeeded(seed.resourcesSeeded === true);
    loadComponents(seed.components);
    loadResources(seed.resources);
    loadTags(seed.tags ?? []);
    loadGroups(deriveMissingGroups(getComponents(), seed.componentGroups ?? []));
    if (!getResourcesSeeded()) {
      seedDefaultResources();
    }
  } else {
    seedDefaultResources();
  }
}

// Guardado/semilla sin `resourcesSeeded` (o en false): se rellena una vez con
// los recursos por defecto; a partir de ahí son normales (si se borran, no vuelven).
// Hidratar el flag ANTES de loadComponents()/loadResources(): esas dos emiten
// components:changed/resources:changed y disparan autoguardado síncrono, que
// persistiría `false` si el flag no está hidratado ya.

const saved = loadState();
if (saved?.error === 'version-mismatch') {
  bootFromSeedOrDefaults();
  showToast(t('toast.stateRecoverFailedVersion'));
} else if (saved?.error === 'corrupt') {
  bootFromSeedOrDefaults();
  showToast(t('toast.stateRecoverFailedCorrupt'));
} else if (saved) {
  if (saved.panelState) {
    loadPanelState(saved.panelState);
  }
  if (saved.resourcePanelState) {
    loadResourcePanelState(saved.resourcePanelState);
  }
  if (saved.tagPanelState) {
    loadTagPanelState(saved.tagPanelState);
  }
  loadAppTitle(saved.appTitle);
  loadResourcesSeeded(saved.resourcesSeeded === true);
  loadComponents(saved.components);
  loadResources(saved.resources);
  loadTags(saved.tags ?? []);
  // Backfill: guardados anteriores a la introducción del registro de grupo
  // (`componentGroups` ausente) derivan una entrada por defecto por cada
  // `groupId` ya presente en los componentes.
  loadGroups(deriveMissingGroups(getComponents(), saved.componentGroups ?? []));
  if (!getResourcesSeeded()) {
    seedDefaultResources();
  }
} else {
  bootFromSeedOrDefaults();
}

syncFontFaces(getResources());
