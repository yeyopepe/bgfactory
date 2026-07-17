// Modelo genérico de "componente de juego" (carta, token, tablero, ...).
// Deliberadamente sin tipos específicos todavía: cada componente es una
// entidad con id, tipo libre, nombre, propiedades clave-valor e imagen opcional.

export function createComponent({ type = 'generico', name = '', properties = {}, image = null, x = 0, y = 0, width = null, height = null, moverEnModoJuego = false } = {}) {
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
    moverEnModoJuego,
  };
}

export function updateComponent(component, changes) {
  return {
    ...component,
    ...changes,
    properties: { ...component.properties, ...(changes.properties ?? {}) },
  };
}
