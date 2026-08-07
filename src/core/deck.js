// Lógica pura del componente "Mazo": sin dependencias de otras capas, mismo
// patrón que core/dice.js / core/group.js.

// Copia barajada de `cartaIds` (Fisher-Yates + Math.random(), mismo generador
// que core/dice.js), sin mutar el array recibido.
export function shuffleCartaIds(cartaIds) {
  const result = [...cartaIds];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Ids de carta referenciados por properties.cartaIds de cualquier componente
// 'mazo' de la lista — mientras una carta esté en este conjunto, no debe
// dibujarse como componente independiente en la mesa (ver ui/componentRenderer.js
// y modes/play/playMode.js / modes/edit/editMode.js).
export function getCartaIdsEnAlgunMazo(components) {
  const ids = new Set();
  for (const component of components) {
    if (component.type !== 'mazo') continue;
    for (const cartaId of component.properties?.cartaIds || []) ids.add(cartaId);
  }
  return ids;
}

// Separación en píxeles entre el mazo y su "zona de revelado" (recuadro
// decorativo donde aparecen las cartas al sacarlas).
export const MAZO_REVEAL_GAP = 20;

// Rectángulo `{ x, y, width, height }` de la zona de revelado de un mazo:
// siempre pegada a su lado derecho, con su misma altura y anchura. Único
// punto de cálculo, reutilizado tanto para pintar el recuadro decorativo
// como para calcular dónde debe aparecer una carta al sacarla.
export function getMazoRevealZoneRect(mazo) {
  const width = mazo.width ?? 100;
  const height = mazo.height ?? 100;
  return {
    x: (mazo.x ?? 100) + width + MAZO_REVEAL_GAP,
    y: mazo.y ?? 100,
    width,
    height,
  };
}

// Solape de dos rectángulos `{ x, y, width, height }`.
export function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Calcula los cambios necesarios para sacar `carta` de `mazo` (esté donde esté
// en su pila, no solo arriba del todo) y revelarla en la mesa. Devuelve `null`
// si el mazo no referencia esa carta. Función pura: quien la invoca aplica los
// cambios devueltos con replaceComponent/reorderComponent (core/state.js).
export function computeSacarCartaDeMazo(mazo, carta) {
  const cartaIds = mazo.properties?.cartaIds || [];
  if (!cartaIds.includes(carta.id)) return null;
  const { x, y } = getMazoRevealZoneRect(mazo);
  return {
    mazoProperties: { cartaIds: cartaIds.filter((id) => id !== carta.id) },
    cartaChanges: { x, y, properties: { caraActual: 'frontal' } },
  };
}
