// Modelo mínimo de "mazo" (agrupación de cartas). Análogo a core/resource.js,
// pero sin isResourceInUse: este change no incluye borrado de mazos.

export function createDeck({ id, name = '' } = {}) {
  return { id: id || crypto.randomUUID(), name };
}

export function updateDeck(deck, changes) {
  return { ...deck, ...changes };
}
