// Estado central de la aplicación: modo activo + biblioteca de componentes.
// Cualquier cambio se notifica vía eventBus para que la UI se refresque.

import { emit } from './eventBus.js';

export const MODES = { PLAY: 'play', EDIT: 'edit' };

const state = {
  mode: MODES.PLAY,
  components: [],
  resources: [],
};

let panelState = { collapsed: false, position: null, width: null };
let resourcePanelState = { collapsed: false, position: null, width: null };
// Recuerda si los recursos por defecto (data/defaultResources.js) ya se han
// sembrado alguna vez en este guardado, para no reponerlos cada vez que el
// usuario los borra a propósito — ver seedDefaultResources() en main.js.
let resourcesSeeded = false;

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

export function getResources() {
  return state.resources;
}

export function addResource(resource) {
  state.resources.push(resource);
  emit('resources:changed', state.resources);
}

export function replaceResource(id, updatedResource) {
  const index = state.resources.findIndex((r) => r.id === id);
  if (index === -1) return;
  state.resources[index] = updatedResource;
  emit('resources:changed', state.resources);
}

export function removeResource(id) {
  state.resources = state.resources.filter((r) => r.id !== id);
  emit('resources:changed', state.resources);
}

export function loadResources(resources) {
  state.resources = resources;
  emit('resources:changed', state.resources);
}

export function getResourcePanelState() {
  return resourcePanelState;
}

export function setResourcePanelState(partial) {
  resourcePanelState = { ...resourcePanelState, ...partial };
  emit('resourcePanelState:changed', resourcePanelState);
}

export function loadResourcePanelState(newResourcePanelState) {
  resourcePanelState = newResourcePanelState;
}

export function getResourcesSeeded() {
  return resourcesSeeded;
}

export function markResourcesSeeded() {
  resourcesSeeded = true;
}

export function loadResourcesSeeded(value) {
  resourcesSeeded = value;
}
