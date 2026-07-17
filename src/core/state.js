// Estado central de la aplicación: modo activo + biblioteca de componentes.
// Cualquier cambio se notifica vía eventBus para que la UI se refresque.

import { emit } from './eventBus.js';

export const MODES = { PLAY: 'play', EDIT: 'edit' };

const state = {
  mode: MODES.PLAY,
  components: [],
};

let panelState = { collapsed: false, position: null, width: null };

export function getState() {
  return state;
}

export function setMode(mode) {
  state.mode = mode;
  emit('mode:changed', state.mode);
}

export function getComponents() {
  return state.components;
}

export function addComponent(component) {
  state.components.push(component);
  emit('components:changed', state.components);
}

export function replaceComponent(id, updatedComponent) {
  const index = state.components.findIndex((c) => c.id === id);
  if (index === -1) return;
  state.components[index] = updatedComponent;
  emit('components:changed', state.components);
}

export function removeComponent(id) {
  state.components = state.components.filter((c) => c.id !== id);
  emit('components:changed', state.components);
}

export function loadComponents(components) {
  state.components = components;
  emit('components:changed', state.components);
}

export function getPanelState() {
  return panelState;
}

export function setPanelState(partial) {
  panelState = { ...panelState, ...partial };
  emit('panelState:changed', panelState);
}

export function loadPanelState(newPanelState) {
  panelState = newPanelState;
}
