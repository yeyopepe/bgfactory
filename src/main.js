// Bootstrap de la aplicación: crea el componente por defecto, monta el
// selector de modo y renderiza el modo activo, refrescando ante cualquier cambio.

import { on } from './core/eventBus.js';
import {
  MODES, getState, addComponent, loadComponents, getComponents, getPanelState, loadPanelState,
  addResource, loadResources, getResources, getResourcePanelState, loadResourcePanelState,
  getResourcesSeeded, markResourcesSeeded, loadResourcesSeeded, getDecks, loadDecks,
  getDeckPanelState, loadDeckPanelState,
} from './core/state.js';
import { CURRENT_VERSION } from './data/version.js';
import { DEFAULT_RESOURCES } from './data/defaultResources.js';
import { renderModeSwitcher, renderEditToolbar } from './ui/editModeToggle.js';
import { initGlobalShortcuts } from './ui/globalShortcuts.js';
import { renderPlayMode } from './modes/play/playMode.js';
import { renderEditMode, deleteSelectedComponent } from './modes/edit/editMode.js';
import { createComponent } from './core/component.js';
import { createResource } from './core/resource.js';
import { saveState, loadState, readSeedState } from './core/persistence.js';
import { showErrorModal } from './ui/errorModal.js';
import { syncFontFaces } from './ui/fontFaceRegistry.js';

const switcherEl = document.getElementById('mode-switcher');
const toolbarEl = document.getElementById('edit-toolbar');
const contentEl = document.getElementById('content');
const versionEl = document.getElementById('app-version');

if (versionEl) {
  versionEl.textContent = CURRENT_VERSION;
}

function renderActiveMode() {
  if (getState().mode === MODES.EDIT) {
    renderEditMode(contentEl);
  } else {
    renderPlayMode(contentEl);
  }
}

function renderAll() {
  renderModeSwitcher(switcherEl);
  renderEditToolbar(toolbarEl);
  renderActiveMode();
}

function persistState() {
  saveState(getComponents(), getPanelState(), getResources(), getResourcePanelState(), getResourcesSeeded(), getDecks(), getDeckPanelState());
}

on('mode:changed', renderAll);
on('components:changed', renderAll);
on('components:changed', persistState);
on('panelState:changed', persistState);
on('resources:changed', renderAll);
on('resources:changed', persistState);
on('resources:changed', (resources) => syncFontFaces(resources));
on('resourcePanelState:changed', persistState);
on('decks:changed', renderAll);
on('decks:changed', persistState);
on('deckPanelState:changed', persistState);

initGlobalShortcuts({
  isEditMode: () => getState().mode === MODES.EDIT,
  onDeleteSelected: () => deleteSelectedComponent(),
});

function seedDefaultComponent() {
  const defaultComponent = createComponent({
    type: 'texto',
    properties: {
      contenido: 'Hola, esta es una mesa de juego infinita.',
      tamañoFuente: 18,
      colorTexto: '#000000',
      colorFondo: '',
    },
  });
  addComponent(defaultComponent);
}

function seedDefaultResources() {
  // Marcar el flag antes de añadir: cada addResource() dispara un autoguardado
  // síncrono, así que debe quedar ya a `true` desde el primer recurso sembrado.
  markResourcesSeeded();
  for (const resourceData of DEFAULT_RESOURCES) {
    addResource(createResource(resourceData));
  }
}

// Un guardado/semilla anterior a la galería de recursos no tiene `resourcesSeeded`
// (o lo tiene a false): se rellena una única vez con los recursos por defecto, y a
// partir de ahí son recursos normales — si el usuario los borra, no vuelven a aparecer.
// Importante: hay que hidratar el flag ANTES de loadComponents()/loadResources(),
// porque esas dos ya emiten components:changed/resources:changed y disparan un
// autoguardado síncrono — si el flag no está hidratado todavía, ese autoguardado
// persistiría su valor por defecto (false) y "olvidaría" que ya se había sembrado.

const saved = loadState();
if (saved?.error) {
  showErrorModal('Error', 'No se ha podido recuperar el estado guardado.');
  seedDefaultComponent();
  seedDefaultResources();
} else if (saved) {
  if (saved.panelState) {
    loadPanelState(saved.panelState);
  }
  if (saved.resourcePanelState) {
    loadResourcePanelState(saved.resourcePanelState);
  }
  if (saved.deckPanelState) {
    loadDeckPanelState(saved.deckPanelState);
  }
  loadResourcesSeeded(saved.resourcesSeeded === true);
  loadComponents(saved.components);
  loadResources(saved.resources);
  loadDecks(saved.decks ?? []);
  if (!getResourcesSeeded()) {
    seedDefaultResources();
  }
} else {
  const seed = readSeedState();
  if (seed) {
    loadResourcesSeeded(seed.resourcesSeeded === true);
    loadComponents(seed.components);
    loadResources(seed.resources);
    loadDecks(seed.decks ?? []);
    if (!getResourcesSeeded()) {
      seedDefaultResources();
    }
  } else {
    seedDefaultComponent();
    seedDefaultResources();
  }
}

syncFontFaces(getResources());
