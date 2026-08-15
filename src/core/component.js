// Modelo genérico de componente de juego (carta, token, tablero...). Sin
// tipos específicos: entidad con id, tipo libre, nombre, properties
// clave-valor, imagen opcional. `order` gobierna apilado visual — lo
// asigna/recalcula core/state.js, aquí solo valor por defecto.

export function createComponent({ type = 'generico', name = '', properties = {}, image = null, x = 0, y = 0, width = null, height = null, bloqueado = 'ninguno', mostrarTooltip = false, tooltipTexto = '', subirAlMoverInteractuar = false, oculto = false, etiquetaIds = [], order = null, copyOf = null, sincronizado = true, groupId = null, interaccionesDesactivadas = [], accionClickDerecho = 'ninguno' } = {}) {
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
    tooltipTexto,
    subirAlMoverInteractuar,
    oculto,
    etiquetaIds,
    order,
    copyOf,
    sincronizado,
    groupId,
    interaccionesDesactivadas,
    accionClickDerecho,
  };
}

// Normaliza pertenencia a etiqueta(s) al formato actual (`etiquetaIds: string[]`),
// aceptando también el formato intermedio `grupoIds` (array) o el escalar
// antiguo `grupoId`, o su ausencia total. Pura: no muta `component`.
// Reutilizada por la migración silenciosa al cargar (core/state.js) y por el
// flujo de importación (ui/editModeToggle.js), que maneja componentes ajenos
// al estado ya cargado y no necesariamente migrados.
export function normalizeComponentEtiquetaIds(component) {
  if (Array.isArray(component.etiquetaIds)) return component;
  if (Array.isArray(component.grupoIds)) {
    const { grupoIds, ...rest } = component;
    return { ...rest, etiquetaIds: grupoIds };
  }
  const { grupoId, ...rest } = component;
  return { ...rest, etiquetaIds: grupoId != null ? [grupoId] : [] };
}

export function updateComponent(component, changes) {
  return {
    ...component,
    ...changes,
    properties: { ...component.properties, ...(changes.properties ?? {}) },
  };
}

// Siguiente id de clon para `baseComponentId`, ignorando sufijo `(n)` ya
// existente: clones de un clon comparten familia/id raíz.
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
    groupId: null,
  };
}

// Claves de `properties`, por tipo, que son estado de interacción de juego
// (resultado de dado, cara mostrada de carta): nunca se sincronizan de un
// original a sus copias vinculadas. Resto de `properties` es
// configuración/diseño y sí se sincroniza (ver syncCopyWithOriginal).
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

// Siguiente id de copia para `originalId`: `${originalId}-COPY-XXX`, XXX
// primer entero libre (3 dígitos) entre copias vinculadas
// (`copyOf === originalId`), reutilizando hueco de copia borrada.
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

// Siguiente id de grupo libre, formato `grupo-N`: escanea `groupId` de todos
// los componentes, devuelve el primer entero libre (mismo patrón que
// nextCloneId/nextCopyId). Solo se llama al "Agrupar" una selección sin
// ningún grupo entre sus miembros.
export function nextGroupId(components) {
  const usedNumbers = new Set();
  for (const component of components) {
    const match = typeof component.groupId === 'string' && component.groupId.match(/^grupo-(\d+)$/);
    if (match) usedNumbers.add(parseInt(match[1], 10));
  }
  let n = 1;
  while (usedNumbers.has(n)) n += 1;
  return `grupo-${n}`;
}

// Copia vinculada de `component`, análoga a cloneComponent pero con
// id/vínculo propios del mecanismo de Copia (ver core/state.js:
// sincronización en vivo, borrado en cascada).
export function createCopy(component, components) {
  return {
    ...component,
    id: nextCopyId(component.id, components),
    copyOf: component.id,
    sincronizado: true,
    properties: { ...component.properties },
    x: component.x + 30,
    y: component.y + 30,
    order: null,
    groupId: null,
  };
}

// Renombra id de copia al cambiar id del original: conserva sufijo
// `-COPY-XXX`, sustituye solo el prefijo.
export function renameCopyId(copyId, oldOriginalId, newOriginalId) {
  return newOriginalId + copyId.slice(oldOriginalId.length);
}

// Aplica sobre `copy` los campos sincronizables de `original`: tipo visual,
// nombre, imagen, ancho/alto, grupos, qué interacciones programadas están
// desactivadas, qué hace el click derecho, y las propiedades de
// configuración/diseño del tipo (editable desde ui/componentModal.js).
// Propiedades de estado de interacción de la propia copia (ver
// NON_SYNCED_PROPERTY_KEYS) se conservan. `x`, `y`, `order` de la copia
// nunca se tocan. `bloqueado`/`oculto` solo se sincronizan mientras
// `copy.sincronizado` sea `true` (por defecto); si es `false`, quedan como
// valores propios de la copia.
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
    tooltipTexto: original.tooltipTexto,
    subirAlMoverInteractuar: original.subirAlMoverInteractuar,
    etiquetaIds: [...original.etiquetaIds],
    interaccionesDesactivadas: original.interaccionesDesactivadas,
    accionClickDerecho: original.accionClickDerecho,
    ...(copy.sincronizado !== false ? { bloqueado: original.bloqueado, oculto: original.oculto } : {}),
    properties: { ...syncedProperties, ...ownNonSyncedProperties },
  };
}
