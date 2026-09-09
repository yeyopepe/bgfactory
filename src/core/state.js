// Estado central de la aplicación: modo activo + biblioteca de componentes.
// Cualquier cambio se notifica vía eventBus para que la UI se refresque.

import { emit } from './eventBus.js';
import { syncCopyWithOriginal, renameCopyId, updateComponent } from './component.js';
import { computeSacarCartaDeMazo } from './deck.js';
import { DEFAULT_APP_TITLE } from './appTitle.js';

export const MODES = { PLAY: 'play', EDIT: 'edit' };

const state = {
  mode: MODES.PLAY,
  components: [],
  resources: [],
  tags: [],
  groups: [],
};

let panelState = { collapsed: false, position: null, width: null, height: null, expandedGroupIds: [] };
let resourcePanelState = { collapsed: false, position: null, width: null, height: null };
let tagPanelState = { collapsed: false, position: null, width: null, height: null };
let appTitle = DEFAULT_APP_TITLE;
// Texto libre que el usuario escribe en el panel de Configuración para mostrarlo
// en la esquina inferior derecha de la mesa, encima de la versión. Preferencia
// global del navegador (como el idioma): se persiste en localStorage pero NO
// forma parte del juego que se exporta/importa. Por defecto vacío.
let tableText = '';
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

// Reordena `components` por su `order` actual y reasigna 1..n de forma
// contigua, mutando cada componente en el sitio. Asume que todo componente
// trae un `order` entero (lo garantizan `createComponent` y el merge de
// importación); se sigue usando para recompactar tras un borrado
// (`removeComponent`) o un merge de importación.
function compactOrders(components) {
  components
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((component, i) => { component.order = i + 1; });
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

  // Si lo que se acaba de actualizar es un original (no una copia), propaga los
  // campos sincronizables a todas sus copias vinculadas, renombrando también su
  // id/copyOf si el id del original ha cambiado (ver core/component.js).
  if (!updatedComponent.copyOf) {
    const idChanged = updatedComponent.id !== id;
    state.components.forEach((c, i) => {
      if (c.copyOf !== id) return;
      let updatedCopy = syncCopyWithOriginal(c, updatedComponent);
      if (idChanged) {
        updatedCopy = { ...updatedCopy, copyOf: updatedComponent.id, id: renameCopyId(c.id, id, updatedComponent.id) };
      }
      state.components[i] = updatedCopy;
    });
  }

  emit('components:changed', state.components);
}

export function removeComponent(id) {
  const idsToRemove = new Set([id]);
  for (const c of state.components) {
    if (c.copyOf === id) idsToRemove.add(c.id);
  }

  const affectedGroupIds = new Set();
  for (const c of state.components) {
    if (idsToRemove.has(c.id) && c.groupId != null) affectedGroupIds.add(c.groupId);
  }

  state.components = state.components.filter((c) => !idsToRemove.has(c.id));
  compactOrders(state.components);

  // Un grupo que se queda con ≤1 miembro tras un borrado se disuelve
  // automáticamente: no tiene sentido como unidad de agrupación. Su registro
  // de propiedades (colección `groups`) se destruye con él, sin dejar rastro.
  let dissolvedAnyGroup = false;
  for (const groupId of affectedGroupIds) {
    const remaining = state.components.filter((c) => c.groupId === groupId);
    if (remaining.length <= 1) {
      for (const c of remaining) c.groupId = null;
      state.groups = state.groups.filter((g) => g.id !== groupId);
      dissolvedAnyGroup = true;
    }
  }
  if (dissolvedAnyGroup) emit('groups:changed', state.groups);

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

// Generalización de reorderComponent para mover un bloque de N ids contiguos a la vez
// (miembros de un grupo) en vez de uno solo, dentro del mismo espacio compartido `order`
// 1..total. Sin atajo de salida anticipada por "newStart === oldStart": se recalcula
// siempre, aunque la posición de arranque no cambie — "Agrupar" (editMode.js) llama a esta
// función con `rawTargetOrder` = la posición mínima YA actual de los miembros (por tanto
// newStart === oldStart casi siempre), pero sus `order` pueden no ser consecutivos entre sí
// todavía (dispersos); un atajo de "si no cambia la posición no hago nada" dejaría el
// bloque disperso sin consecutivizar.
export function reorderGroupBlock(memberIds, rawTargetOrder) {
  const memberIdSet = new Set(memberIds);
  const block = state.components
    .filter((c) => memberIdSet.has(c.id))
    .sort((a, b) => a.order - b.order);
  if (block.length === 0) return;

  const k = block.length;
  const n = state.components.length;
  const maxStart = Math.max(1, n - k + 1);
  const newStart = Math.min(Math.max(rawTargetOrder, 1), maxStart);

  const others = state.components
    .filter((c) => !memberIdSet.has(c.id))
    .sort((a, b) => a.order - b.order);
  others.forEach((c, i) => { c.order = i + 1; });
  for (const c of others) {
    if (c.order >= newStart) c.order += k;
  }
  block.forEach((c, i) => { c.order = newStart + i; });

  emit('components:changed', state.components);
}

// Saca `cartaId` de la lista de `mazoId` (esté donde esté en la pila, no solo
// arriba del todo) y la revela en la mesa boca arriba, dentro de la zona de
// revelado del mazo (core/deck.js). Reutilizada tanto desde el modo juego
// (click sobre el mazo, y "Ver contenido..." de su menú contextual) como
// desde el modo edición (botón "Ver contenido del mazo" en las propiedades
// del mazo) — vive aquí, no en `modes/play/playMode.js`, porque `ui/*` no
// puede importar de `modes/*` (ver design/docs/architecture/INDEX.md, capas).
export function sacarCartaDeMazo(mazoId, cartaId) {
  const mazo = state.components.find((c) => c.id === mazoId);
  const carta = state.components.find((c) => c.id === cartaId);
  if (!mazo || !carta) return;
  const changes = computeSacarCartaDeMazo(mazo, carta);
  if (!changes) return;
  replaceComponent(mazo.id, updateComponent(mazo, { properties: changes.mazoProperties }));
  replaceComponent(carta.id, updateComponent(carta, changes.cartaChanges));
  reorderComponent(carta.id, 1);
}

export function loadComponents(components) {
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
  panelState = { expandedGroupIds: [], ...newPanelState };
  if (!Array.isArray(panelState.expandedGroupIds)) panelState.expandedGroupIds = [];
}

export function getAppTitle() {
  return appTitle;
}

export function setAppTitle(newTitle) {
  appTitle = newTitle;
  emit('appTitle:changed', appTitle);
}

export function loadAppTitle(newTitle) {
  appTitle = newTitle;
}

export function getTableText() {
  return tableText;
}

export function setTableText(newText) {
  tableText = typeof newText === 'string' ? newText : '';
  emit('tableText:changed', tableText);
}

export function loadTableText(newText) {
  tableText = typeof newText === 'string' ? newText : '';
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

export function getTags() {
  return state.tags;
}

export function addTag(tag) {
  state.tags.push(tag);
  emit('tags:changed', state.tags);
}

export function replaceTag(id, updatedTag) {
  const index = state.tags.findIndex((t) => t.id === id);
  if (index === -1) return;
  state.tags[index] = updatedTag;
  emit('tags:changed', state.tags);
}

export function removeTag(id) {
  state.tags = state.tags.filter((t) => t.id !== id);
  emit('tags:changed', state.tags);
}

export function loadTags(tags) {
  state.tags = tags;
  emit('tags:changed', state.tags);
}

export function getTagPanelState() {
  return tagPanelState;
}

export function setTagPanelState(partial) {
  tagPanelState = { ...tagPanelState, ...partial };
  emit('tagPanelState:changed', tagPanelState);
}

export function loadTagPanelState(newTagPanelState) {
  tagPanelState = newTagPanelState;
}

export function getGroups() {
  return state.groups;
}

export function addGroup(group) {
  state.groups.push(group);
  emit('groups:changed', state.groups);
}

export function replaceGroup(id, updatedGroup) {
  const index = state.groups.findIndex((g) => g.id === id);
  if (index === -1) return;
  state.groups[index] = updatedGroup;
  emit('groups:changed', state.groups);
}

export function removeGroup(id) {
  state.groups = state.groups.filter((g) => g.id !== id);
  emit('groups:changed', state.groups);
}

export function loadGroups(groups) {
  state.groups = groups;
  emit('groups:changed', state.groups);
}
