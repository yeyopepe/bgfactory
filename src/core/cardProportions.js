// Catálogo de proporciones de carta disponibles en el editor de cartas y en
// la modal de configuración del componente "carta". Datos puros, análogos en
// espíritu a data/defaultResources.js: sin dependencias de otras capas.

export const CARD_PROPORTIONS = [
  { value: '5:7', label: 'Poker estándar vertical (5:7)', ratio: 5 / 7 },
  { value: '7:5', label: 'Poker estándar horizontal (7:5)', ratio: 7 / 5 },
  { value: 'tarot-h', label: 'Tarot estándar vertical (70 × 120 mm)', ratio: 70 / 120 },
  { value: 'tarot-v', label: 'Tarot estándar horizontal (120 × 70 mm)', ratio: 120 / 70 },
  { value: '1:1', label: 'Cuadrada (1:1)', ratio: 1 },
  { value: 'circular', label: 'Circular', ratio: 1 },
];

const DEFAULT_PROPORTION = '5:7';

export function getProporcionRatio(value) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  return found ? found.ratio : CARD_PROPORTIONS.find((p) => p.value === DEFAULT_PROPORTION).ratio;
}

// Ancho de referencia, en "unidades de diseño", en el que se guardan
// x/y/width/height/tamañoFuente de los cuadros de texto de una cara. La
// proporción de la carta es siempre fija salvo cambio explícito, así que un
// único factor de escala uniforme basta para pasar de estas unidades al
// tamaño real de la carta en cualquier punto (editor o mesa).
export const CARD_DESIGN_WIDTH = 300;

export function getDesignSize(proporcionValue) {
  return { width: CARD_DESIGN_WIDTH, height: CARD_DESIGN_WIDTH / getProporcionRatio(proporcionValue) };
}
