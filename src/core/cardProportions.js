// Catálogo de proporciones de carta (editor de cartas, modal de
// configuración de 'carta'). Datos puros, sin dependencias, análogo a
// data/defaultResources.js.

export const CARD_PROPORTIONS = [
  { value: '5:7', label: 'Poker estándar vertical (5:7)', ratio: 5 / 7, shape: 'rect' },
  { value: '7:5', label: 'Poker estándar horizontal (7:5)', ratio: 7 / 5, shape: 'rect' },
  { value: 'tarot-h', label: 'Tarot estándar vertical (70 × 120 mm)', ratio: 70 / 120, shape: 'rect' },
  { value: 'tarot-v', label: 'Tarot estándar horizontal (120 × 70 mm)', ratio: 120 / 70, shape: 'rect' },
  { value: '1:1', label: 'Cuadrada (1:1)', ratio: 1, shape: 'rect' },
  { value: 'circular', label: 'Circular', ratio: 1, shape: 'circular' },
  { value: 'hex-vertical', label: 'Hexagonal (vértices arriba/abajo)', ratio: Math.sqrt(3) / 2, shape: 'hex-vertical' },
  { value: 'hex-horizontal', label: 'Hexagonal (vértices izquierda/derecha)', ratio: 2 / Math.sqrt(3), shape: 'hex-horizontal' },
  { value: 'triangulo', label: 'Triángulo', ratio: 1, shape: 'triangulo' },
  { value: 'triangulo-invertido', label: 'Triángulo invertido', ratio: 1, shape: 'triangulo-invertido' },
  { value: 'libre', label: 'Libre (redimensionamiento libre)', ratio: 5 / 7, shape: 'rect' },
];

const DEFAULT_PROPORTION = '5:7';

// Recorte exacto (aristas rectas, sin bisel) de las proporciones hexagonales.
// En %: el contenedor ya tiene el ratio correcto de hexágono regular (ver
// `ratio` arriba), no hace falta conocer el tamaño real en píxeles.
const HEX_CLIP_PATHS = {
  'hex-vertical': 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  'hex-horizontal': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
};

// Recorte de silueta exacta para las dos proporciones triangulares: triángulo
// inscrito en la caja cuadrada (vértice + base opuestos, no estrictamente
// equilátero), mismo criterio que HEX_CLIP_PATHS de no necesitar tamaño real
// en píxeles.
const TRIANGLE_CLIP_PATHS = {
  triangulo: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  'triangulo-invertido': 'polygon(0% 0%, 100% 0%, 50% 100%)',
};

// Incentro (% de la caja) e inradio (fracción del lado) de cada silueta
// triangular, usados por getTriangleInnerClipPath para escalar el borde
// desde el incentro real — a diferencia del hexágono regular, aquí el
// incentro no coincide con el centro de la caja. Valores derivados de las
// fórmulas estándar de incentro/inradio a partir de los vértices.
const TRIANGLE_GEOMETRY = {
  triangulo: { centerXPercent: 50, centerYPercent: 69.09830056250526, inradiusFraction: 0.30901699437494745 },
  'triangulo-invertido': { centerXPercent: 50, centerYPercent: 30.90169943749474, inradiusFraction: 0.30901699437494745 },
};

export function getProporcionRatio(value) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  return found ? found.ratio : CARD_PROPORTIONS.find((p) => p.value === DEFAULT_PROPORTION).ratio;
}

// `true` si la proporción es una de las cinco rectangulares/cuadrada (no
// Circular/Hexagonal, silueta fija). Usado por ui/visualEditorModal.js para
// decidir si mostrar el checkbox "Esquinas redondeadas".
export function isRectShape(value) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  const shape = found ? found.shape : 'rect';
  return shape === 'rect';
}

// `border-radius`/`clip-path` según proporción: las cinco rectangulares/
// cuadrada usan el radio de "contenedores destacados"
// (design/docs/style/01-tokens-visual.md) si `esquinasRedondeadas` es `true`
// (por defecto; `false` = 90°); "Circular" recorta en redondo; las dos
// hexagonales recortan por polígono exacto (border-radius no da aristas
// rectas) y no dependen de `esquinasRedondeadas`.
export function getCartaShapeCss(value, esquinasRedondeadas = true) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  const shape = found ? found.shape : 'rect';
  if (shape === 'circular') return { borderRadius: '50%', clipPath: 'none' };
  if (HEX_CLIP_PATHS[shape]) return { borderRadius: '0', clipPath: HEX_CLIP_PATHS[shape] };
  if (TRIANGLE_CLIP_PATHS[shape]) return { borderRadius: '0', clipPath: TRIANGLE_CLIP_PATHS[shape] };
  return { borderRadius: esquinasRedondeadas ? '8px' : '0', clipPath: 'none' };
}

// Recorte interior concéntrico para simular borde de grosor uniforme en
// hexágonos (`border` CSS no sirve aquí): al ser siempre hexágono regular
// (su `ratio` lo fuerza), desplazar las seis aristas hacia dentro `bordePx`
// equivale a escalar los vértices desde el centro por un factor calculado
// con la apotema (`width/2` en 'hex-vertical', `height/2` en
// 'hex-horizontal'). `null` si la proporción no es hexagonal o no hay borde.
export function getHexInnerClipPath(proporcionValue, width, height, bordePx) {
  const found = CARD_PROPORTIONS.find((p) => p.value === proporcionValue);
  const shape = found ? found.shape : null;
  const path = shape ? HEX_CLIP_PATHS[shape] : null;
  if (!path || !(bordePx > 0)) return null;

  const apothem = shape === 'hex-vertical' ? width / 2 : height / 2;
  const scale = Math.max(0, 1 - bordePx / apothem);

  const points = path
    .slice(path.indexOf('(') + 1, -1)
    .split(',')
    .map((pair) => {
      const [x, y] = pair.trim().split(' ').map((n) => parseFloat(n));
      const sx = 50 + scale * (x - 50);
      const sy = 50 + scale * (y - 50);
      return `${sx}% ${sy}%`;
    });

  return `polygon(${points.join(', ')})`;
}

// Recorte interior concéntrico para borde de grosor uniforme en triángulos,
// hermana de getHexInnerClipPath: a diferencia del hexágono, el incentro no
// coincide con el centro de la caja (50%, 50%), el escalado se hace desde el
// incentro real (TRIANGLE_GEOMETRY). Caja siempre cuadrada (ratio 1): `width`
// y `height` son indistintos.
export function getTriangleInnerClipPath(proporcionValue, width, height, bordePx) {
  const found = CARD_PROPORTIONS.find((p) => p.value === proporcionValue);
  const shape = found ? found.shape : null;
  const path = shape ? TRIANGLE_CLIP_PATHS[shape] : null;
  const geometry = shape ? TRIANGLE_GEOMETRY[shape] : null;
  if (!path || !geometry || !(bordePx > 0)) return null;

  const ladoPx = width;
  const inradiusPx = geometry.inradiusFraction * ladoPx;
  const scale = Math.max(0, 1 - bordePx / inradiusPx);
  const { centerXPercent, centerYPercent } = geometry;

  const points = path
    .slice(path.indexOf('(') + 1, -1)
    .split(',')
    .map((pair) => {
      const [x, y] = pair.trim().split(' ').map((n) => parseFloat(n));
      const sx = centerXPercent + scale * (x - centerXPercent);
      const sy = centerYPercent + scale * (y - centerYPercent);
      return `${sx}% ${sy}%`;
    });

  return `polygon(${points.join(', ')})`;
}

// Ancho de referencia del lienzo de diseño del formato antiguo de carta
// ("unidades de diseño" reescaladas por un factor uniforme). El contenido de
// 'carta' ahora se guarda en píxeles reales; esta constante ya no interviene
// en editor ni render, solo la usa `core/state.js` (migración
// `migrateCartaMedidasReales`) para el factor de conversión de cartas
// guardadas con el formato antiguo.
export const CARD_DESIGN_WIDTH = 300;
