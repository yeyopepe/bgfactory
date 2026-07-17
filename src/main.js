// Bootstrap de la aplicación: crea el componente por defecto, monta el
// selector de modo y renderiza el modo activo, refrescando ante cualquier cambio.

import { on } from './core/eventBus.js';
import { MODES, getState, addComponent } from './core/state.js';
import { CURRENT_VERSION } from './data/version.js';
import { renderEnterEditButton, renderEditToolbar } from './ui/editModeToggle.js';
import { renderPlayMode } from './modes/play/playMode.js';
import { renderEditMode } from './modes/edit/editMode.js';
import { createComponent } from './core/component.js';

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
on('components:changed', renderAll);

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
