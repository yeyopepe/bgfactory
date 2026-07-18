// Bootstrap de la aplicación: crea el componente por defecto, monta el
// selector de modo y renderiza el modo activo, refrescando ante cualquier cambio.

import { on } from './core/eventBus.js';
import { MODES, getState, addComponent, loadComponents, getComponents, getPanelState, loadPanelState } from './core/state.js';
import { CURRENT_VERSION } from './data/version.js';
import { renderModeSwitcher, renderEditToolbar } from './ui/editModeToggle.js';
import { renderPlayMode } from './modes/play/playMode.js';
import { renderEditMode } from './modes/edit/editMode.js';
import { createComponent } from './core/component.js';
import { saveState, loadState, readSeedState } from './core/persistence.js';
import { showToast } from './ui/toast.js';

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

on('mode:changed', renderAll);
on('components:changed', renderAll);
on('components:changed', (components) => saveState(components, getPanelState()));
on('panelState:changed', (panelState) => saveState(getComponents(), panelState));

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

const saved = loadState();
if (saved?.error) {
  showToast('No se ha podido recuperar el estado guardado.');
  seedDefaultComponent();
} else if (saved) {
  if (saved.panelState) {
    loadPanelState(saved.panelState);
  }
  loadComponents(saved.components);
} else {
  const seed = readSeedState();
  if (seed) {
    loadComponents(seed.components);
  } else {
    seedDefaultComponent();
  }
}
