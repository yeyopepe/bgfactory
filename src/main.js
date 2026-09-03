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

const switcherEl = document.getElementById('mode-switcher');
const toolbarEl = document.getElementById('edit-toolbar');
const contentEl = document.getElementById('content');
const titleEl = document.getElementById('app-title');
const versionEl = document.getElementById('app-version');

if (versionEl) {
  versionEl.textContent = '';

  const nameLine = document.createElement('div');
  nameLine.className = 'app-version__name';
  nameLine.textContent = `BG Factory ${CURRENT_VERSION}`;

  const repoLine = document.createElement('div');
  repoLine.className = 'app-version__repo';
  const repoLink = document.createElement('a');
  repoLink.href = 'https://github.com/yeyopepe/bgfactory';
  repoLink.target = '_blank';
  repoLink.rel = 'noopener';
  repoLink.textContent = 'Ver en Github';
  repoLine.appendChild(repoLink);

  versionEl.append(nameLine, repoLine);
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

initGlobalShortcuts({
  isEditMode: () => getState().mode === MODES.EDIT,
  onDeleteSelected: () => deleteSelectedComponent(),
  onMoveSelected: (dx, dy) => moveSelectedComponent(dx, dy),
});

function seedDefaultResources() {
  // Flag a true antes de añadir: cada addResource() dispara autoguardado síncrono.
  markResourcesSeeded();
  for (const resourceData of DEFAULT_RESOURCES) {
    addResource(createResource(resourceData));
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
  showToast('No se ha podido recuperar el estado de una versión anterior; se ha empezado con el contenido por defecto.');
} else if (saved?.error === 'corrupt') {
  bootFromSeedOrDefaults();
  showToast('No se ha podido recuperar el estado guardado.');
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
