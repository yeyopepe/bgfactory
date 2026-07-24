// Modelo mínimo de "mazo" (agrupación de cartas). Análogo a core/resource.js.

export function createDeck({ id, name = '' } = {}) {
  return { id: id || crypto.randomUUID(), name };
}

export function updateDeck(deck, changes) {
  return { ...deck, ...changes };
}

export function isDeckNameTaken(name, decks, excludeId = null) {
  const normalizedName = name.trim().toLowerCase();
  return decks.some(
    (d) => d.name.trim().toLowerCase() === normalizedName && d.id !== excludeId
  );
}

// Ids de los componentes tipo 'carta' que referencian `deckId` (vacío si
// ninguno) — deckId es siempre una propiedad plana de primer nivel en
// `properties`, a diferencia de las referencias a recursos (sin necesidad de
// un recorrido profundo tipo collectDeepValues de core/resource.js).
export function getComponentsUsingDeck(deckId, components) {
  return components.filter((component) => component.type === 'carta' && component.properties?.deckId === deckId).map((component) => component.id);
}
