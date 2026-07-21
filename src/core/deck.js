// Modelo mínimo de "mazo" (agrupación de cartas). Análogo a core/resource.js,
// pero sin isResourceInUse: este change no incluye borrado de mazos.

export function createDeck({ id, name = '' } = {}) {
  return { id: id || crypto.randomUUID(), name };
}

export function updateDeck(deck, changes) {
  return { ...deck, ...changes };
}

// Ids de los componentes cuyo deckId referencia un mazo ausente de `deckIds`
// (p.ej. tras reemplazar por completo los mazos al importar un fichero JSON).
export function getComponentsWithMissingDeck(components, deckIds) {
  const idSet = new Set(deckIds);
  return components
    .filter((component) => component.properties?.deckId && !idSet.has(component.properties.deckId))
    .map((component) => component.id);
}
