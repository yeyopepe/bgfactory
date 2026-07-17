// Modelo genérico de "componente de juego" (carta, token, tablero, ...).
// Deliberadamente sin tipos específicos todavía: cada componente es una
// entidad con id, tipo libre, nombre, propiedades clave-valor e imagen opcional.

export function createComponent({ type = 'generico', name = '', properties = {}, image = null } = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    name,
    properties: { ...properties },
    image,
  };
}

export function updateComponent(component, changes) {
  return {
    ...component,
    ...changes,
    properties: { ...component.properties, ...(changes.properties ?? {}) },
  };
}
