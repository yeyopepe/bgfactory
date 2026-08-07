// Orden de apilado combinado de formas + textBoxes de una cara de carta.
// Módulo de datos puro, sin dependencias, mismo patrón que
// core/cardProportions.js/core/textBoxLayout.js.
//
// Campo opcional `orden` en cada elemento: number, menor = más adelante,
// mismo criterio que `order` de componente (core/state.js). Sin `orden`:
// fallback en memoria (no muta datos) — formas siempre detrás de textBoxes,
// dentro de cada grupo se respeta orden de inserción (último del array, más
// adelante).
//
// Imagen de fondo no participa de este orden: se pinta aparte, siempre antes.

function withEffectiveOrden(cara) {
  const formas = cara?.formas || [];
  const textBoxes = cara?.textBoxes || [];

  // Fallback: índice más alto (insertado más tarde) = orden efectivo menor
  // (más adelante). TextBoxes siempre delante de formas: su banda de
  // fallback usa valores menores.
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

// Devuelve `{ kind: 'forma' | 'texto', element }[]` ordenado fondo→frente:
// pintar en ese orden, el último queda más arriba visualmente.
export function getOrderedFaceElements(cara) {
  return withEffectiveOrden(cara)
    .sort((a, b) => b.effectiveOrden - a.effectiveOrden)
    .map(({ kind, element }) => ({ kind, element }));
}

function findOtherElements(cara, kind, id) {
  return withEffectiveOrden(cara).filter((item) => !(item.kind === kind && item.element.id === id));
}

// Muta `orden` del elemento: por debajo del mínimo actual, queda al frente.
export function bringElementToFront(cara, kind, id) {
  const collection = kind === 'forma' ? cara?.formas : cara?.textBoxes;
  const element = (collection || []).find((item) => item.id === id);
  if (!element) return;
  const others = findOtherElements(cara, kind, id);
  const minOrden = others.length > 0 ? Math.min(...others.map((item) => item.effectiveOrden)) : 0;
  element.orden = minOrden - 1;
}

// Muta `orden` del elemento: por encima del máximo actual, queda al fondo
// (siempre por delante de la imagen de fondo, que no participa del cálculo).
export function sendElementToBack(cara, kind, id) {
  const collection = kind === 'forma' ? cara?.formas : cara?.textBoxes;
  const element = (collection || []).find((item) => item.id === id);
  if (!element) return;
  const others = findOtherElements(cara, kind, id);
  const maxOrden = others.length > 0 ? Math.max(...others.map((item) => item.effectiveOrden)) : 0;
  element.orden = maxOrden + 1;
}
