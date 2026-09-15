// Generación de los 55 SVGs de la baraja francesa estándar como texto plano.
// Módulo puro (misma familia que core/cardProportions.js), sin dependencias
// de DOM ni de core/resource.js: no requiere document/canvas.
//
// Sin interpolar ningún dato de usuario (solo los valores fijos de
// data/cardTemplates.js): descarta cualquier superficie de inyección en el
// SVG generado.

const COLOR_HEX = { negro: '#1a1a1a', rojo: '#c0392b' };

// Reverso: patrón geométrico de rombos, blanco y azul (--accent-blue),
// compartido por las 54 cartas.
export function renderCardBackSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">
<defs>
<pattern id="diamonds" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
<polygon points="7,0 14,7 7,14 0,7" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
</pattern>
</defs>
<rect width="100" height="140" fill="#2c7dd8"/>
<rect x="6" y="6" width="88" height="128" fill="url(#diamonds)"/>
</svg>`;
}

function renderCorner(label, colorHex, fontSize, x = 7, y = 19) {
  return `<g fill="${colorHex}" font-family="Georgia, serif">
<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="bold">${label}</text>
</g>`;
}

function renderNormalFace({ symbol, colorHex, label }) {
  return `${renderCorner(label, colorHex, 23)}
<text x="50" y="82" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="42" fill="${colorHex}">${symbol}</text>
<g transform="rotate(180, 50, 70)">${renderCorner(label, colorHex, 23)}</g>`;
}

function renderAceFace({ symbol, colorHex, label }) {
  return `${renderCorner(label, colorHex, 23, 4, 24)}
<text x="50" y="84" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="74" fill="${colorHex}">${symbol}</text>
<g transform="rotate(180, 50, 70)">${renderCorner(label, colorHex, 23, 4, 24)}</g>`;
}

function renderFigureFace({ symbol, colorHex, label }) {
  return `${renderCorner(label, colorHex, 26, 4, 24)}
<text x="50" y="75" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="96" fill="${colorHex}">${symbol}</text>
<g transform="rotate(180, 50, 70)">${renderCorner(label, colorHex, 26, 4, 24)}</g>`;
}

function renderJokerFace() {
  return `<line x1="50" y1="48" x2="28" y2="68" stroke="#e74c3c" stroke-width="5" stroke-linecap="round"/>
<line x1="50" y1="48" x2="50" y2="72" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
<line x1="50" y1="48" x2="72" y2="68" stroke="#f39c12" stroke-width="5" stroke-linecap="round"/>
<circle cx="50" cy="48" r="9" fill="#9b59b6"/>
<circle cx="28" cy="68" r="7" fill="#e74c3c"/>
<circle cx="50" cy="72" r="7" fill="#3498db"/>
<circle cx="72" cy="68" r="7" fill="#f39c12"/>
<text x="50" y="104" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#555555" letter-spacing="2.5" font-weight="600">JOKER</text>`;
}

// Cara de una carta según su designKind ('normal' | 'as' | 'figura' | 'joker').
// Fondo blanco en los 3 primeros casos; el joker no lleva valor en esquinas.
export function renderCardFaceSvg({ suitId, symbol, color, rank, label, designKind }) {
  const colorHex = color ? COLOR_HEX[color] : '#1a1a1a';
  let inner;
  switch (designKind) {
    case 'as':
      inner = renderAceFace({ symbol, colorHex, label });
      break;
    case 'figura':
      inner = renderFigureFace({ symbol, colorHex, label });
      break;
    case 'joker':
      inner = renderJokerFace();
      break;
    case 'normal':
    default:
      inner = renderNormalFace({ symbol, colorHex, label });
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">
<rect width="100" height="140" rx="7" fill="#ffffff"/>
${inner}
</svg>`;
}
