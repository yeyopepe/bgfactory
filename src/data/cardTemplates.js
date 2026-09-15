// Plantillas y catálogo de la baraja francesa estándar (54 cartas): datos
// puros, sin lógica de estado ni imports de core/state.js o ui/* — mismo
// criterio que core/cardProportions.js/data/defaultResources.js.

export const SUITS = [
  { id: 'picas', symbol: '♠', color: 'negro' },
  { id: 'corazones', symbol: '♥', color: 'rojo' },
  { id: 'diamantes', symbol: '♦', color: 'rojo' },
  { id: 'treboles', symbol: '♣', color: 'negro' },
];

export const RANKS = [
  { id: 'as', label: 'A', designKind: 'as' },
  { id: '2', label: '2', designKind: 'normal' },
  { id: '3', label: '3', designKind: 'normal' },
  { id: '4', label: '4', designKind: 'normal' },
  { id: '5', label: '5', designKind: 'normal' },
  { id: '6', label: '6', designKind: 'normal' },
  { id: '7', label: '7', designKind: 'normal' },
  { id: '8', label: '8', designKind: 'normal' },
  { id: '9', label: '9', designKind: 'normal' },
  { id: '10', label: '10', designKind: 'normal' },
  { id: 'j', label: 'J', designKind: 'figura' },
  { id: 'q', label: 'Q', designKind: 'figura' },
  { id: 'k', label: 'K', designKind: 'figura' },
];

// Patrón de nombrado de recurso: baraja-francesa-{suitId}-{rank}.svg (o
// baraja-francesa-joker.svg para el joker, sin palo/valor).
export function resourceName({ suitId, rank }) {
  if (rank === 'joker') return 'baraja-francesa-joker.svg';
  return `baraja-francesa-${suitId}-${rank}.svg`;
}

// Id descriptivo del componente carta: mismo patrón que resourceName, con
// prefijo "card-" en vez de "baraja-francesa-" y sin extensión. Los 2 jokers
// son idénticos pero necesitan id único: jokerIndex (1-based) desambigua,
// omitiendo el sufijo en el primero para no romper el patrón "card-joker" ya
// usado en otros sitios de la app como ejemplo de id de carta.
export function cardId({ suitId, rank, jokerIndex }) {
  if (rank === 'joker') return jokerIndex > 1 ? `card-joker-${jokerIndex}` : 'card-joker';
  return `card-${suitId}-${rank}`;
}

// Fuente única de verdad del orden y nombrado de las 54 cartas: picas,
// corazones, diamantes, tréboles (A→K cada uno), luego 2 jokers — mismo
// orden de fila/columna que la cuadrícula en mesa (ver description.md).
// Consumida tanto para generar los SVGs como para posicionar/construir los
// componentes, evitando mantener el orden en dos sitios.
export function buildFrenchDeckCatalog() {
  const catalog = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      catalog.push({
        suitId: suit.id,
        symbol: suit.symbol,
        color: suit.color,
        rank: rank.id,
        label: rank.label,
        designKind: rank.designKind,
        resourceName: resourceName({ suitId: suit.id, rank: rank.id }),
        cardId: cardId({ suitId: suit.id, rank: rank.id }),
      });
    }
  }
  for (let i = 0; i < 2; i++) {
    catalog.push({
      suitId: null,
      symbol: null,
      color: null,
      rank: 'joker',
      label: null,
      designKind: 'joker',
      resourceName: resourceName({ rank: 'joker' }),
      cardId: cardId({ rank: 'joker', jokerIndex: i + 1 }),
    });
  }
  return catalog;
}
