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

export function createResource({ name = '', type, dataUrl, fileName = '', mimeType = '' } = {}) {
  return {
    id: crypto.randomUUID(),
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

// Ningún componente puede todavía "usar" un recurso (fuera de alcance de este
// cambio, ver description.md 00017): esta comprobación es genérica y no asume
// qué campo usará un cambio futuro para referenciar un recurso, así que hoy
// siempre da `false`, pero queda lista para detectarlo en cuanto exista esa
// referencia (en `image` o en cualquier propiedad de `properties`).
export function isResourceInUse(resourceId, components) {
  return components.some((component) => {
    if (component.image === resourceId) return true;
    return Object.values(component.properties ?? {}).includes(resourceId);
  });
}
