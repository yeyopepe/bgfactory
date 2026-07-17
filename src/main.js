// Bootstrap de la aplicación: carga el estado persistido, monta el selector
// de modo y renderiza el modo activo, refrescando ante cualquier cambio.

import { on } from './core/eventBus.js';
import { MODES, getState, loadComponents, getComponents } from './core/state.js';
import { loadFromLocalStorage, saveToLocalStorage } from './data/persistence.js';
import { CURRENT_VERSION } from './data/version.js';
import { renderEnterEditButton, renderEditToolbar } from './ui/editModeToggle.js';
import { renderPlayMode } from './modes/play/playMode.js';
import { renderEditMode } from './modes/edit/editMode.js';

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
  renderEnterEditButton(switcherEl);
  renderEditToolbar(toolbarEl);
  renderActiveMode();
}

on('mode:changed', renderAll);
on('components:changed', () => {
  renderAll();
  saveToLocalStorage(getComponents());
});

const persisted = loadFromLocalStorage();
if (persisted?.components) {
  loadComponents(persisted.components);
} else {
  renderAll();
}
