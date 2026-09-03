// Estado central de la aplicación: modo activo + biblioteca de componentes.
// Cualquier cambio se notifica vía eventBus para que la UI se refresque.

import { emit } from './eventBus.js';
import { migrateFichaComponent } from './fichaMigration.js';
import { syncCopyWithOriginal, renameCopyId, updateComponent, normalizeComponentEtiquetaIds } from './component.js';
import { computeSacarCartaDeMazo } from './deck.js';
import { DEFAULT_APP_TITLE } from './appTitle.js';
import { CARD_DESIGN_WIDTH } from './cardProportions.js';

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

// Migra en el sitio (sustituyendo cada entrada del array) cualquier
// componente de tipo 'ficha' (tipo eliminado) a 'carta', best-effort e
// ignorando siempre los errores de conversión — igual que la migración
// silenciosa de `order` de más arriba, nunca debe bloquear el arranque.
function migrateFichas(components) {
  for (let i = 0; i < components.length; i += 1) {
    if (components[i].type === 'ficha') {
      components[i] = migrateFichaComponent(components[i]).component;
    }
  }
}

// Migra en el sitio cualquier componente que todavía tenga el formato
// antiguo (escalar `grupoId`, o array `grupoIds`) al campo `etiquetaIds`
// (array, "N etiquetas"), best-effort, mismo criterio que migrateFichas:
// nunca debe bloquear el arranque. Debe ejecutarse antes que
// migrateDeckIdToEtiqueta, que ya asume `etiquetaIds` como array.
function migrateGrupoIdToEtiquetaIds(components) {
  for (let i = 0; i < components.length; i += 1) {
    components[i] = normalizeComponentEtiquetaIds(components[i]);
  }
}

// Migra en el sitio cualquier componente con `properties.deckId` (campo
// específico de carta del antiguo "Mazo", ahora "Etiqueta") añadiendo ese id
// a su `etiquetaIds`, best-effort, mismo criterio que migrateFichas: nunca
// debe bloquear el arranque.
function migrateDeckIdToEtiqueta(components) {
  for (const component of components) {
    if (component.properties && 'deckId' in component.properties) {
      const { deckId, ...restProperties } = component.properties;
      if (!Array.isArray(component.etiquetaIds)) component.etiquetaIds = [];
      if (deckId != null && !component.etiquetaIds.includes(deckId)) component.etiquetaIds.push(deckId);
      component.properties = restProperties;
    }
  }
}

// Migra en el sitio el campo `bloqueado` de booleano al campo de 3 valores
// ('ninguno' | 'juego' | 'todos'): `true` conservaba exactamente el
// comportamiento de 'juego' (solo restringía Modo Juego, nunca edición),
// `false` pasa a 'ninguno'. Best-effort, mismo criterio que migrateFichas.
function migrateBloqueado(components) {
  for (const component of components) {
    if (typeof component.bloqueado === 'boolean') {
      component.bloqueado = component.bloqueado ? 'juego' : 'ninguno';
    }
  }
}

// Migra en el sitio los componentes guardados sin el campo
// `accionClickDerecho` a `'menuContextual'`, para conservar su comportamiento
// previo: antes de este campo, el click derecho abría siempre el menú
// contextual sin ser configurable. Componentes nuevos nacen en `'ninguno'`
// (ver `core/component.js`, `createComponent`). Best-effort, mismo criterio
// que migrateFichas.
function migrateAccionClickDerecho(components) {
  for (const component of components) {
    if (component.accionClickDerecho === undefined) {
      component.accionClickDerecho = 'menuContextual';
    }
  }
}

// Migra en el sitio cualquier componente de tipo 'tablero' (nombre antiguo
// de 'tableroSimple') a 'tableroSimple', best-effort, mismo criterio que
// migrateFichas: nunca debe bloquear el arranque.
function migrateTableroSimple(components) {
  for (const component of components) {
    if (component.type === 'tablero') {
      component.type = 'tableroSimple';
    }
  }
}

// Migra en el sitio el contenido de cualquier 'carta' guardada en el formato
// antiguo (formas/textBoxes en "unidades de diseño" sobre un lienzo
// abstracto de CARD_DESIGN_WIDTH px, reescaladas al pintarse) al sistema de
// píxeles reales (mismo criterio que 'tableroPersonalizado'): multiplica sus
// coordenadas por el factor de escala que tenían, para que el diseño se vea
// exactamente igual que antes de migrar. Reproduce a propósito el mismo
// factor único (basado solo en el ancho) que usaba antes
// `ui/componentRenderer.js` — no separa X/Y porque el render anterior
// tampoco lo hacía. Best-effort, mismo criterio que migrateFichas: nunca
// debe bloquear el arranque. Cartas recién convertidas desde 'ficha'
// (`migrateFichas`, más arriba) ya nacen con `medidasReales: true` y se
// saltan sin tocar.
function migrateCartaMedidasReales(components) {
  for (const component of components) {
    if (component.type !== 'carta') continue;
    const props = component.properties;
    if (!props || props.medidasReales) continue;

    const factor = component.width > 0 ? component.width / CARD_DESIGN_WIDTH : 1;
    for (const caraKey of ['caraFrontal', 'caraTrasera']) {
      const cara = props[caraKey];
      if (!cara) continue;
      for (const forma of cara.formas || []) {
        forma.x *= factor;
        forma.y *= factor;
        forma.width *= factor;
        forma.height *= factor;
      }
      for (const textBox of cara.textBoxes || []) {
        textBox.x *= factor;
        textBox.y *= factor;
        textBox.width *= factor;
        textBox.height *= factor;
        if (Number.isFinite(textBox.tamañoFuente)) textBox.tamañoFuente *= factor;
      }
    }
    props.medidasReales = true;
  }
}

export function loadComponents(components) {
  migrateFichas(components);
  migrateCartaMedidasReales(components);
  migrateGrupoIdToEtiquetaIds(components);
  migrateDeckIdToEtiqueta(components);
  migrateBloqueado(components);
  migrateAccionClickDerecho(components);
  migrateTableroSimple(components);
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
