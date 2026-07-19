// Modelo genérico de "componente de juego" (carta, token, tablero, ...).
// Deliberadamente sin tipos específicos todavía: cada componente es una
// entidad con id, tipo libre, nombre, propiedades clave-valor e imagen opcional.
// El campo `order` gobierna el apilado visual en la mesa (ver core/state.js,
// que es quien lo asigna/recalcula: aquí solo se declara con valor por defecto).

export function createComponent({ type = 'generico', name = '', properties = {}, image = null, x = 0, y = 0, width = null, height = null, bloqueado = true, order = null } = {}) {
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
    order,
  };
}

export function updateComponent(component, changes) {
  return {
    ...component,
    ...changes,
    properties: { ...component.properties, ...(changes.properties ?? {}) },
  };
}
