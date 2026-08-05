// Catálogo de proporciones de carta disponibles en el editor de cartas y en
// la modal de configuración del componente "carta". Datos puros, análogos en
// espíritu a data/defaultResources.js: sin dependencias de otras capas.

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

// Polígonos de recorte exacto (silueta de aristas rectas, sin bisel) para las
// proporciones hexagonales. Expresados en porcentajes: como el contenedor ya
// tiene el ratio ancho:alto correcto de un hexágono regular (ver `ratio` de
// arriba), el polígono no necesita conocer el tamaño real en píxeles.
const HEX_CLIP_PATHS = {
  'hex-vertical': 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  'hex-horizontal': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
};

// Recortes de silueta exacta para las dos proporciones triangulares (cambio
// 00134): triángulo inscrito en la caja cuadrada (vértice + base opuestos,
// no un triángulo estrictamente equilátero — ver plan.md de ese cambio),
// mismo criterio que HEX_CLIP_PATHS de que el polígono no necesita conocer
// el tamaño real en píxeles al estar la caja siempre en su ratio correcto.
const TRIANGLE_CLIP_PATHS = {
  triangulo: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  'triangulo-invertido': 'polygon(0% 0%, 100% 0%, 50% 100%)',
};

// Incentro (en % de la caja) e inradio (en fracción del lado) de cada
// silueta triangular de arriba, usados por getTriangleInnerClipPath para
// simular un borde de grosor uniforme escalando desde el incentro real (a
// diferencia del hexágono regular, cuyo incentro coincide con el centro de
// la caja, aquí no) — valores exactos derivados de las fórmulas estándar de
// incentro/inradio de un triángulo a partir de sus vértices.
const TRIANGLE_GEOMETRY = {
  triangulo: { centerXPercent: 50, centerYPercent: 69.09830056250526, inradiusFraction: 0.30901699437494745 },
  'triangulo-invertido': { centerXPercent: 50, centerYPercent: 30.90169943749474, inradiusFraction: 0.30901699437494745 },
};

export function getProporcionRatio(value) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  return found ? found.ratio : CARD_PROPORTIONS.find((p) => p.value === DEFAULT_PROPORTION).ratio;
}

// `true` si la proporción indicada es una de las cinco rectangulares/cuadrada
// (a diferencia de "Circular"/Hexagonal, con silueta fija) — usado por
// ui/visualEditorModal.js (cambio 00117) para decidir cuándo mostrar el
// checkbox "Esquinas redondeadas", sin duplicar esta búsqueda.
export function isRectShape(value) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  const shape = found ? found.shape : 'rect';
  return shape === 'rect';
}

// Devuelve el `border-radius`/`clip-path` a aplicar según la proporción: las
// cinco proporciones rectangulares/cuadrada usan el radio de "contenedores
// destacados" (STYLE_BIBLE.md sección 5) si `esquinasRedondeadas` es `true`
// (por defecto, cambio 00117; `false` las deja a 90°), "Circular" recorta en
// redondo, y las dos hexagonales recortan por polígono exacto (border-radius
// no puede producir una silueta de aristas rectas) — estas dos últimas no se
// ven afectadas por `esquinasRedondeadas`.
export function getCartaShapeCss(value, esquinasRedondeadas = true) {
  const found = CARD_PROPORTIONS.find((p) => p.value === value);
  const shape = found ? found.shape : 'rect';
  if (shape === 'circular') return { borderRadius: '50%', clipPath: 'none' };
  if (HEX_CLIP_PATHS[shape]) return { borderRadius: '0', clipPath: HEX_CLIP_PATHS[shape] };
  if (TRIANGLE_CLIP_PATHS[shape]) return { borderRadius: '0', clipPath: TRIANGLE_CLIP_PATHS[shape] };
  return { borderRadius: esquinasRedondeadas ? '8px' : '0', clipPath: 'none' };
}

// Recorte interior (concéntrico, más pequeño) para simular un borde de
// grosor uniforme en las proporciones hexagonales, donde `border` CSS no
// sirve (ver fix 00096): al ser siempre un hexágono regular (su `ratio`
// fuerza esa proporción), desplazar las seis aristas hacia dentro `bordePx`
// equivale a escalar los vértices del polígono desde el centro por un
// factor `s` calculado a partir de la apotema (mitad del lado que queda
// perpendicular a los vértices agudos: `width/2` en 'hex-vertical',
// `height/2` en 'hex-horizontal'). Devuelve `null` si la proporción no es
// hexagonal o si no hay borde que simular.
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

// Recorte interior (concéntrico, más pequeño) para simular un borde de
// grosor uniforme en las proporciones triangulares (cambio 00134), hermana
// de getHexInnerClipPath: a diferencia del hexágono regular, el incentro de
// este triángulo no coincide con el centro de la caja (50%, 50%), así que
// el escalado se hace desde el incentro real (TRIANGLE_GEOMETRY) en vez de
// desde el centro. La caja es siempre cuadrada (ratio 1), así que el lado
// real en píxeles es indistintamente `width` o `height`.
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

// Ancho de referencia, en "unidades de diseño", en el que se guardan
// x/y/width/height/tamañoFuente de los cuadros de texto de una cara. La
// proporción de la carta es siempre fija salvo cambio explícito, así que un
// único factor de escala uniforme basta para pasar de estas unidades al
// tamaño real de la carta en cualquier punto (editor o mesa).
export const CARD_DESIGN_WIDTH = 300;

export function getDesignSize(proporcionValue) {
  return { width: CARD_DESIGN_WIDTH, height: CARD_DESIGN_WIDTH / getProporcionRatio(proporcionValue) };
}
