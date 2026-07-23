// Modelo genérico de "recurso de la galería" (imagen o tipografía).
// Análogo a component.js: entidad con id, tipo y los datos del fichero
// embebidos como data URI (autocontenido, igual que el resto del estado).

export const RESOURCE_TYPES = { IMAGE: 'imagen', FONT: 'tipografia' };

const EXTENSION_TYPE_MAP = {
  png: RESOURCE_TYPES.IMAGE,
  jpg: RESOURCE_TYPES.IMAGE,
  jpeg: RESOURCE_TYPES.IMAGE,
  gif: RESOURCE_TYPES.IMAGE,
  svg: RESOURCE_TYPES.IMAGE,
  webp: RESOURCE_TYPES.IMAGE,
  ttf: RESOURCE_TYPES.FONT,
  otf: RESOURCE_TYPES.FONT,
  woff: RESOURCE_TYPES.FONT,
  woff2: RESOURCE_TYPES.FONT,
};

export function resourceTypeForFileName(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return EXTENSION_TYPE_MAP[ext] ?? null;
}

export function createResource({ id, name = '', type, dataUrl, fileName = '', mimeType = '' } = {}) {
  return {
    id: id || crypto.randomUUID(),
    name,
    type,
    dataUrl,
    fileName,
    mimeType,
  };
}

export function updateResource(resource, changes) {
  return { ...resource, ...changes };
}

// Recorre objetos y arrays anidados (p.ej. las caras de una carta o sus
// cuadros de texto) acumulando los valores primitivos hoja, para poder
// detectar un id de recurso referenciado en cualquier nivel de `properties`.
function collectDeepValues(value, acc = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectDeepValues(item, acc);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectDeepValues(item, acc);
  } else {
    acc.push(value);
  }
  return acc;
}

export function isResourceInUse(resourceId, components) {
  return components.some((component) => {
    if (component.image === resourceId) return true;
    return collectDeepValues(component.properties ?? {}).includes(resourceId);
  });
}

// Ids de los componentes que referencian `resourceId`, en cualquier nivel de
// `properties` (vacío si ninguno) — usada para identificar en el mensaje de
// error qué componente(s) bloquean el borrado de un recurso.
export function getComponentsUsingResource(resourceId, components) {
  return components
    .filter((component) => component.image === resourceId || collectDeepValues(component.properties ?? {}).includes(resourceId))
    .map((component) => component.id);
}

