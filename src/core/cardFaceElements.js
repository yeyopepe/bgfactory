// Orden de apilado combinado de los elementos (formas + textBoxes) de una
// cara de carta (cambio 00124). Módulo de datos puro, sin dependencias de
// otras capas, mismo patrón que core/cardProportions.js/core/textBoxLayout.js.
//
// Cada elemento puede tener un campo `orden` (number, menor = más adelante,
// mismo criterio que `order` de componente en core/state.js). Los elementos
// guardados antes de este cambio no lo tienen: se les calcula un valor de
// fallback en memoria (sin mutar ni migrar los datos) que reproduce el
// criterio visual previo — todas las formas por detrás de todos los
// textBoxes, y dentro de cada grupo se respeta el orden de inserción original
// (el último del array, más adelante).
//
// La imagen de fondo de la cara no participa de este orden: se sigue
// pintando aparte, siempre antes que cualquier elemento de esta lista.

function withEffectiveOrden(cara) {
  const formas = cara?.formas || [];
  const textBoxes = cara?.textBoxes || [];

  // Fallback: dentro de cada grupo, el índice más alto (insertado más tarde)
  // debe quedar más adelante (orden efectivo menor). Los textBoxes van
  // siempre por delante de las formas, así que su banda de fallback usa
  // valores menores que la de las formas.
  const items = [];
  formas.forEach((element, index) => {
    const fallback = textBoxes.length + (formas.length - 1 - index);
    items.push({ kind: 'forma', element, effectiveOrden: element.orden ?? fallback });
  });
  textBoxes.forEach((element, index) => {
    const fallback = textBoxes.length - 1 - index;
    items.push({ kind: 'texto', element, effectiveOrden: element.orden ?? fallback });
  });
  return items;
}

// Array de `{ kind: 'forma' | 'texto', element }` ordenado de fondo a
// frente: el último del array es el que hay que pintar el último (queda más
// arriba visualmente).
export function getOrderedFaceElements(cara) {
  return withEffectiveOrden(cara)
    .sort((a, b) => b.effectiveOrden - a.effectiveOrden)
    .map(({ kind, element }) => ({ kind, element }));
}

function findOtherElements(cara, kind, id) {
  return withEffectiveOrden(cara).filter((item) => !(item.kind === kind && item.element.id === id));
}

// Coloca el elemento indicado por encima de todos los demás de la cara
// (texto o figura), mutando su campo `orden`.
export function bringElementToFront(cara, kind, id) {
  const collection = kind === 'forma' ? cara?.formas : cara?.textBoxes;
  const element = (collection || []).find((item) => item.id === id);
  if (!element) return;
  const others = findOtherElements(cara, kind, id);
  const minOrden = others.length > 0 ? Math.min(...others.map((item) => item.effectiveOrden)) : 0;
  element.orden = minOrden - 1;
}

// Coloca el elemento indicado por debajo de todos los demás de la cara
// (texto o figura, pero siempre por delante de la imagen de fondo, que no
// participa de este cálculo), mutando su campo `orden`.
export function sendElementToBack(cara, kind, id) {
  const collection = kind === 'forma' ? cara?.formas : cara?.textBoxes;
  const element = (collection || []).find((item) => item.id === id);
  if (!element) return;
  const others = findOtherElements(cara, kind, id);
  const maxOrden = others.length > 0 ? Math.max(...others.map((item) => item.effectiveOrden)) : 0;
  element.orden = maxOrden + 1;
}
