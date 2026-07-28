// Modelo genérico de "componente de juego" (carta, token, tablero, ...).
// Deliberadamente sin tipos específicos todavía: cada componente es una
// entidad con id, tipo libre, nombre, propiedades clave-valor e imagen opcional.
// El campo `order` gobierna el apilado visual en la mesa (ver core/state.js,
// que es quien lo asigna/recalcula: aquí solo se declara con valor por defecto).

export function createComponent({ type = 'generico', name = '', properties = {}, image = null, x = 0, y = 0, width = null, height = null, bloqueado = true, mostrarTooltip = false, subirAlMoverInteractuar = false, order = null, copyOf = null } = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    name,
    properties: { ...properties },
    image,
    x,
    y,
    width,
    height,
    bloqueado,
    mostrarTooltip,
    subirAlMoverInteractuar,
    order,
    copyOf,
  };
}

export function updateComponent(component, changes) {
  return {
    ...component,
    ...changes,
    properties: { ...component.properties, ...(changes.properties ?? {}) },
  };
}

// Calcula el siguiente id de clon disponible para `baseComponentId`, ignorando cualquier
// sufijo `(n)` final ya existente (así los clones de un clon comparten familia/id raíz).
export function nextCloneId(baseComponentId, components) {
  const rootId = baseComponentId.replace(/\(\d+\)$/, '');
  const usedNumbers = new Set();
  for (const component of components) {
    const match = component.id.match(/^(.*)\((\d+)\)$/);
    if (match && match[1] === rootId) {
      usedNumbers.add(parseInt(match[2], 10));
    }
  }
  let n = 1;
  while (usedNumbers.has(n)) n += 1;
  return `${rootId}(${n})`;
}

export function cloneComponent(component, components) {
  return {
    ...component,
    id: nextCloneId(component.id, components),
    properties: { ...component.properties },
    x: component.x + 30,
    y: component.y + 30,
    order: null,
  };
}

// Claves de `properties`, por tipo, que son "estado de interacción de juego"
// (resultado de un dado, cara mostrada de una carta) y por tanto nunca se
// sincronizan de un original a sus copias vinculadas — el resto de `properties`
// de cada tipo es configuración/diseño y sí se sincroniza (ver syncCopyWithOriginal).
const NON_SYNCED_PROPERTY_KEYS = {
  dado: ['resultadoActual'],
  carta: ['caraActual'],
};

function splitSyncedProperties(type, properties) {
  const nonSyncedKeys = NON_SYNCED_PROPERTY_KEYS[type] || [];
  const synced = { ...properties };
  const nonSynced = {};
  for (const key of nonSyncedKeys) {
    nonSynced[key] = synced[key];
    delete synced[key];
  }
  return { synced, nonSynced };
}

// Calcula el siguiente id de copia disponible para `originalId`: `${originalId}-COPY-XXX`
// con XXX el primer entero (a 3 dígitos) libre entre las copias ya vinculadas a ese
// original (`copyOf === originalId`), reutilizando el hueco de una copia borrada si lo hay.
export function nextCopyId(originalId, components) {
  const usedNumbers = new Set();
  for (const component of components) {
    if (component.copyOf !== originalId) continue;
    const match = component.id.match(/-COPY-(\d{3})$/);
    if (match) usedNumbers.add(parseInt(match[1], 10));
  }
  let n = 1;
  while (usedNumbers.has(n)) n += 1;
  return `${originalId}-COPY-${String(n).padStart(3, '0')}`;
}

// Crea una copia vinculada de `component`, análoga a cloneComponent pero con
// id/vínculo propios del mecanismo de Copia (ver core/state.js para la
// sincronización en vivo y el borrado en cascada).
export function createCopy(component, components) {
  return {
    ...component,
    id: nextCopyId(component.id, components),
    copyOf: component.id,
    properties: { ...component.properties },
    x: component.x + 30,
    y: component.y + 30,
    order: null,
  };
}

// Renombra el id de una copia al cambiar el id de su original: conserva el
// sufijo `-COPY-XXX` tal cual, sustituyendo solo el prefijo.
export function renameCopyId(copyId, oldOriginalId, newOriginalId) {
  return newOriginalId + copyId.slice(oldOriginalId.length);
}

// Aplica sobre `copy` los campos sincronizables de `original`: tipo visual, nombre,
// imagen, ancho/alto, y las propiedades específicas de configuración/diseño del tipo
// (todo lo editable desde `ui/componentModal.js`, salvo `bloqueado`, que queda siempre
// independiente por copia). Las propiedades de estado de interacción de juego de la
// propia copia (ver NON_SYNCED_PROPERTY_KEYS) se conservan tal cual. `x`, `y`, `order`
// y `bloqueado` de la copia tampoco se tocan.
export function syncCopyWithOriginal(copy, original) {
  const { synced: syncedProperties } = splitSyncedProperties(original.type, original.properties);
  const { nonSynced: ownNonSyncedProperties } = splitSyncedProperties(copy.type, copy.properties);
  return {
    ...copy,
    type: original.type,
    name: original.name,
    image: original.image,
    width: original.width,
    height: original.height,
    mostrarTooltip: original.mostrarTooltip,
    subirAlMoverInteractuar: original.subirAlMoverInteractuar,
    properties: { ...syncedProperties, ...ownNonSyncedProperties },
  };
}
