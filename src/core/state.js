// Estado central de la aplicación: modo activo + biblioteca de componentes.
// Cualquier cambio se notifica vía eventBus para que la UI se refresque.

import { emit } from './eventBus.js';
import { migrateFichaComponent } from './fichaMigration.js';

export const MODES = { PLAY: 'play', EDIT: 'edit' };

const state = {
  mode: MODES.PLAY,
  components: [],
  resources: [],
  decks: [],
};

let panelState = { collapsed: false, position: null, width: null, height: null };
let resourcePanelState = { collapsed: false, position: null, width: null, height: null };
let deckPanelState = { collapsed: false, position: null, width: null, height: null };
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

// Reordena `components` por su `order` actual (o por posición en el array si `order`
// falta o no es un número válido, para migrar guardados anteriores a este campo) y
// reasigna 1..n de forma contigua, mutando cada componente en el sitio.
function compactOrders(components) {
  const withIndex = components.map((component, index) => ({ component, index }));
  withIndex.sort((a, b) => {
    const orderA = Number.isInteger(a.component.order) ? a.component.order : a.index + 1;
    const orderB = Number.isInteger(b.component.order) ? b.component.order : b.index + 1;
    return orderA - orderB;
  });
  withIndex.forEach(({ component }, i) => {
    component.order = i + 1;
  });
}

export function getComponents() {
  return state.components;
}

export function addComponent(component) {
  state.components.forEach((c) => { c.order += 1; });
  component.order = 1;
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
  compactOrders(state.components);
  emit('components:changed', state.components);
}

export function reorderComponent(id, rawOrder) {
  const component = state.components.find((c) => c.id === id);
  if (!component) return;

  const n = state.components.length;
  const newOrder = Math.min(Math.max(rawOrder, 1), n);
  const oldOrder = component.order;
  if (newOrder === oldOrder) return;

  for (const other of state.components) {
    if (other === component) continue;
    if (other.order > oldOrder) other.order -= 1;
  }
  for (const other of state.components) {
    if (other === component) continue;
    if (other.order >= newOrder) other.order += 1;
  }
  component.order = newOrder;

  emit('components:changed', state.components);
}

// Migra en el sitio (sustituyendo cada entrada del array) cualquier componente
// de tipo 'ficha' (tipo eliminado en el cambio 00087) a 'carta', best-effort
// e ignorando siempre los errores de conversión — igual que la migración
// silenciosa de `order` de más arriba, nunca debe bloquear el arranque.
function migrateFichas(components) {
  for (let i = 0; i < components.length; i += 1) {
    if (components[i].type === 'ficha') {
      components[i] = migrateFichaComponent(components[i]).component;
    }
  }
}

export function loadComponents(components) {
  migrateFichas(components);
  compactOrders(components);
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

export function getDecks() {
  return state.decks;
}

export function addDeck(deck) {
  state.decks.push(deck);
  emit('decks:changed', state.decks);
}

export function replaceDeck(id, updatedDeck) {
  const index = state.decks.findIndex((d) => d.id === id);
  if (index === -1) return;
  state.decks[index] = updatedDeck;
  emit('decks:changed', state.decks);
}

export function removeDeck(id) {
  state.decks = state.decks.filter((d) => d.id !== id);
  emit('decks:changed', state.decks);
}

export function loadDecks(decks) {
  state.decks = decks;
  emit('decks:changed', state.decks);
}

export function getDeckPanelState() {
  return deckPanelState;
}

export function setDeckPanelState(partial) {
  deckPanelState = { ...deckPanelState, ...partial };
  emit('deckPanelState:changed', deckPanelState);
}

export function loadDeckPanelState(newDeckPanelState) {
  deckPanelState = newDeckPanelState;
}
