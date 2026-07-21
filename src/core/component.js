// Modelo genérico de "componente de juego" (carta, token, tablero, ...).
// Deliberadamente sin tipos específicos todavía: cada componente es una
// entidad con id, tipo libre, nombre, propiedades clave-valor e imagen opcional.
// El campo `order` gobierna el apilado visual en la mesa (ver core/state.js,
// que es quien lo asigna/recalcula: aquí solo se declara con valor por defecto).

export function createComponent({ type = 'generico', name = '', properties = {}, image = null, x = 0, y = 0, width = null, height = null, bloqueado = true, mostrarTooltip = false, order = null } = {}) {
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
