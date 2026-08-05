// Renders game components onto an infinite-table world element.
// Unlike ui/table.js (agnostic), this module knows the component model.

import { attachResizeHandle } from './resizeHandle.js';
import { getComponents, getResources } from '../core/state.js';
import { fontFamilyFor } from './fontFaceRegistry.js';
import { getPosibleValores, tirarDado } from '../core/dice.js';
import { markdownToHtml } from '../core/markdown.js';
import { sanitizeHtml } from '../core/sanitizeHtml.js';
import { applyImageAdjustStyle } from './imageAdjustModal.js';
import { getProporcionRatio, getCartaShapeCss, getHexInnerClipPath, getTriangleInnerClipPath, CARD_DESIGN_WIDTH } from '../core/cardProportions.js';
import { getOrderedFaceElements } from '../core/cardFaceElements.js';
import { getTextBoxLayoutStyle } from '../core/textBoxLayout.js';
import { getMazoRevealZoneRect } from '../core/deck.js';
import { hexToRgba } from '../core/colorUtils.js';
import { isInteractionActive } from '../core/interactions.js';

const MIN_TEXT_BOX_WIDTH = 40;
const MIN_TEXT_BOX_HEIGHT = 24;
const MIN_BOARD_SIZE = 40;
const MIN_DADO_SIZE = 40;
const MIN_DOCUMENTO_WIDTH = 80;
const MIN_DOCUMENTO_HEIGHT = 80;
const MIN_CARTA_WIDTH = 5;
const MIN_CARTA_HEIGHT = 5;
const MIN_MAZO_WIDTH = 60;
const MIN_MAZO_HEIGHT = 60;
const DOCUMENTO_IFRAME_LOAD_TIMEOUT_MS = 3000;
const DICE_ROLL_DURATION_MS = 1000;
const DICE_ROLL_INTERVAL_MS = 70;

function getWorldZoom(worldEl) {
  const match = getComputedStyle(worldEl).transform.match(/^matrix\(([^,]+),/);
  return match ? parseFloat(match[1]) : 1;
}

// Aclara (percent > 0) u oscurece (percent < 0) un color hex mezclándolo con
// blanco/negro — usado solo para el bisel del borde del tablero (excepción de
// estilo acotada a este tipo de componente, ver STYLE_BIBLE.md sección 13).
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const mix = percent > 0 ? 255 : 0;
  const amount = Math.abs(percent);
  r = Math.round(r + (mix - r) * amount);
  g = Math.round(g + (mix - g) * amount);
  b = Math.round(b + (mix - b) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

// Dibuja una rejilla de hexágonos que ocupa el máximo espacio posible de un
// lienzo width×height con el número de filas/columnas dado, sin recortar
// ningún hexágono (puede dejar un margen mínimo inevitable en los bordes,
// ver description.md 00019 "ajuste exacto de las casillas"). `orientation`
// distingue las dos orientaciones (cambio 00089): 'flat' dibuja hexágonos
// "flat-top" (vértices izquierda/derecha, desfase de rejilla por columna);
// 'pointy' dibuja hexágonos "pointy-top" (vértices arriba/abajo, desfase de
// rejilla por fila) — misma geometría que 'flat' con filas/columnas y
// ancho/alto intercambiados.
function renderHexGrid(svgEl, width, height, filas, columnas, color, grosor, orientation = 'flat') {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  svgEl.innerHTML = '';
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);

  const points = [];
  if (orientation === 'pointy') {
    const aByWidth = width / (Math.sqrt(3) * columnas + (filas > 1 ? Math.sqrt(3) / 2 : 0));
    const aByHeight = height / (2 + 1.5 * (filas - 1));
    const a = Math.max(0, Math.min(aByWidth, aByHeight));
    if (a === 0) return;

    const hexWidth = Math.sqrt(3) * a;
    const gridWidth = hexWidth * columnas + (filas > 1 ? hexWidth / 2 : 0);
    const gridHeight = 2 * a + 1.5 * a * (filas - 1);
    const offsetX = (width - gridWidth) / 2 + hexWidth / 2;
    const offsetY = (height - gridHeight) / 2 + a;

    for (let row = 0; row < filas; row++) {
      const cy = offsetY + row * 1.5 * a;
      const rowOffsetX = row % 2 === 1 ? hexWidth / 2 : 0;
      for (let col = 0; col < columnas; col++) {
        const cx = offsetX + col * hexWidth + rowOffsetX;
        drawHexagon(cx, cy, a, 30);
      }
    }
  } else {
    const aByWidth = width / (2 + 1.5 * (columnas - 1));
    const aByHeight = height / (Math.sqrt(3) * filas + (columnas > 1 ? Math.sqrt(3) / 2 : 0));
    const a = Math.max(0, Math.min(aByWidth, aByHeight));
    if (a === 0) return;

    const hexHeight = Math.sqrt(3) * a;
    const gridWidth = 2 * a + 1.5 * a * (columnas - 1);
    const gridHeight = hexHeight * filas + (columnas > 1 ? hexHeight / 2 : 0);
    const offsetX = (width - gridWidth) / 2 + a;
    const offsetY = (height - gridHeight) / 2 + hexHeight / 2;

    for (let col = 0; col < columnas; col++) {
      const cx = offsetX + col * 1.5 * a;
      const colOffsetY = col % 2 === 1 ? hexHeight / 2 : 0;
      for (let row = 0; row < filas; row++) {
        const cy = offsetY + row * hexHeight + colOffsetY;
        drawHexagon(cx, cy, a, 0);
      }
    }
  }

  function drawHexagon(cx, cy, a, startAngleDeg) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (startAngleDeg + 60 * i);
      pts.push(`${cx + a * Math.cos(angle)},${cy + a * Math.sin(angle)}`);
    }
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', pts.join(' '));
    polygon.setAttribute('fill', 'none');
    polygon.setAttribute('stroke', color);
    polygon.setAttribute('stroke-width', String(grosor));
    svgEl.appendChild(polygon);
  }
}

// Dibuja la silueta 2D plana de un dado según su número de resultados
// posibles, con un efecto de profundidad leve (copia oscura desplazada
// detrás) y un contorno fino oscuro — misma familia de recurso que el bisel
// del tablero (excepción de estilo acotada a ambos tipos, ver STYLE_BIBLE.md
// sección 13). `count` es el número de resultados posibles configurados.
function renderDiceSilhouette(svgEl, size, count, colorCuerpo) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  svgEl.innerHTML = '';
  svgEl.setAttribute('width', size);
  svgEl.setAttribute('height', size);
  svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);

  const pad = size * 0.08;
  const cx = size / 2;
  const cy = size / 2;
  const outlineColor = shadeColor(colorCuerpo, -0.5);
  const lineColor = shadeColor(colorCuerpo, -0.35);
  const depthColor = shadeColor(colorCuerpo, -0.25);
  const depthOffset = size * 0.05;

  function polygonPoints(sides, radius, rotationDeg = -90) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI / 180) * (rotationDeg + (360 / sides) * i);
      points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    return points;
  }

  function addPolygon(points, fill, offset = { x: 0, y: 0 }) {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', points.map(([x, y]) => `${x + offset.x},${y + offset.y}`).join(' '));
    polygon.setAttribute('fill', fill);
    svgEl.appendChild(polygon);
  }

  function addLine(x1, y1, x2, y2) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', lineColor);
    line.setAttribute('stroke-width', Math.max(1, size * 0.015));
    svgEl.appendChild(line);
  }

  const radius = cx - pad;

  if (count === 4) {
    const points = polygonPoints(3, radius);
    addPolygon(points, depthColor, { x: depthOffset, y: depthOffset });
    addPolygon(points, colorCuerpo);
    addLine(cx, cy - radius, cx, cy + radius * 0.5);
  } else if (count === 6) {
    const half = radius * 0.85;
    const points = [
      [cx - half, cy - half],
      [cx + half, cy - half],
      [cx + half, cy + half],
      [cx - half, cy + half],
    ];
    addPolygon(points, depthColor, { x: depthOffset, y: depthOffset });
    addPolygon(points, colorCuerpo);
  } else if (count === 8) {
    const points = polygonPoints(4, radius);
    addPolygon(points, depthColor, { x: depthOffset, y: depthOffset });
    addPolygon(points, colorCuerpo);
    addLine(points[3][0], points[3][1], points[1][0], points[1][1]);
  } else {
    const sides = 10;
    const outer = polygonPoints(sides, radius);
    addPolygon(outer, depthColor, { x: depthOffset, y: depthOffset });
    const facetColorA = colorCuerpo;
    const facetColorB = shadeColor(colorCuerpo, 0.15);
    for (let i = 0; i < sides; i++) {
      const p1 = outer[i];
      const p2 = outer[(i + 1) % sides];
      addPolygon([[cx, cy], p1, p2], i % 2 === 0 ? facetColorA : facetColorB);
    }
    for (const [x, y] of outer) {
      addLine(cx, cy, x, y);
    }
  }

  const outline = document.createElementNS(SVG_NS, 'polygon');
  const outlinePoints = count === 6
    ? [
      [cx - radius * 0.85, cy - radius * 0.85],
      [cx + radius * 0.85, cy - radius * 0.85],
      [cx + radius * 0.85, cy + radius * 0.85],
      [cx - radius * 0.85, cy + radius * 0.85],
    ]
    : polygonPoints(count === 4 ? 3 : count === 8 ? 4 : 10, radius);
  outline.setAttribute('points', outlinePoints.map(([x, y]) => `${x},${y}`).join(' '));
  outline.setAttribute('fill', 'none');
  outline.setAttribute('stroke', outlineColor);
  outline.setAttribute('stroke-width', Math.max(1, size * 0.02));
  svgEl.appendChild(outline);
}

const COMPONENT_TYPE_LABELS = {
  texto: 'Texto',
  tablero: 'Tablero',
  dado: 'Dado',
  documento: 'Documento',
  carta: 'Carta/Ficha',
  mazo: 'Mazo',
};

export function formatComponentIdentifier(component) {
  const typeLabel = COMPONENT_TYPE_LABELS[component.type] || component.type;
  return `${typeLabel}: ${component.id}`;
}

function createIdentifierLabel(component) {
  const label = document.createElement('span');
  label.className = 'component-id-label';
  label.textContent = formatComponentIdentifier(component);
  return label;
}

// Indicador de bloqueo (cambio 00088, cambio 00138): insignia superpuesta en una
// esquina del componente, solo pintada en modo edición (`showLockIndicator`) cuando
// `component.bloqueado` es distinto de `'ninguno'` (`'juego'` o `'todos'`) — en modo
// juego el bloqueo solo se percibe a través del menú contextual, nunca con este indicador.
function createLockBadge() {
  const badge = document.createElement('span');
  badge.className = 'component-lock-badge';
  badge.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<rect x="5" y="11" width="14" height="9" rx="1.5"/>' +
    '<path d="M8 11V7a4 4 0 0 1 8 0v4" stroke-linecap="round"/>' +
    '</svg>';
  return badge;
}

// Indicador de "Oculto" (cambio 00100): insignia superpuesta, solo pintada en modo
// edición (`showHiddenIndicator`) cuando `component.oculto` es `true` — en modo juego
// el componente oculto directamente no se renderiza, no hace falta indicador ahí.
// Anclada en la esquina inferior derecha (a diferencia de la de candado, en la
// superior derecha) para que ambas puedan convivir sin superponerse cuando un
// componente está bloqueado y oculto a la vez.
function createHiddenBadge() {
  const badge = document.createElement('span');
  badge.className = 'component-hidden-badge';
  badge.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="12" cy="12" r="3"/>' +
    '<line x1="3" y1="21" x2="21" y2="3" stroke-linecap="round"/>' +
    '</svg>';
  return badge;
}

// Pinta la imagen de fondo (si tiene) y los textBoxes de una cara de carta
// (`cara`: caraFrontal/caraTrasera de una carta, mismo shape en los dos) sobre
// `contentParent`, escalando x/y/width/height/tamañoFuente ("unidades de
// diseño", ver core/cardProportions.js) por `renderScale`. Extraída de la
// rama 'carta' de renderComponentsOnTable para reutilizarla tal cual desde la
// rama 'mazo' (pinta el dorso de la carta de arriba) y desde
// ui/mazoContentModal.js (miniaturas de la cara frontal de cada carta).
export function paintCartaFace(contentParent, cara, renderScale) {
  const resource = cara?.imagenResourceId ? getResources().find((r) => r.id === cara.imagenResourceId) : null;
  if (resource) {
    const img = document.createElement('img');
    img.src = resource.dataUrl;
    img.draggable = false;
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.pointerEvents = 'none';
    img.style.opacity = String(1 - (cara.transparenciaImagen ?? 0) / 100);
    applyImageAdjustStyle(img, cara.ajusteImagen);
    contentParent.appendChild(img);
  }

  for (const { kind, element } of getOrderedFaceElements(cara)) {
    if (kind === 'forma') {
      paintShape(contentParent, element, renderScale);
    } else {
      paintTextBox(contentParent, element, renderScale);
    }
  }
}

const SHAPE_BORDER_RADIUS = { circular: '50%', redondeada: '8px' };

function paintShape(contentParent, shape, renderScale) {
  const shapeEl = document.createElement('div');
  shapeEl.style.position = 'absolute';
  shapeEl.style.left = `${shape.x * renderScale}px`;
  shapeEl.style.top = `${shape.y * renderScale}px`;
  shapeEl.style.width = `${shape.width * renderScale}px`;
  shapeEl.style.height = `${shape.height * renderScale}px`;
  shapeEl.style.borderRadius = SHAPE_BORDER_RADIUS[shape.tipo] || '0';
  shapeEl.style.border = shape.bordeActivo !== false ? `${shape.bordeGrosor}px solid ${shape.bordeColor || '#000000'}` : 'none';
  shapeEl.style.boxSizing = 'border-box';
  shapeEl.style.pointerEvents = 'none';

  const resource = shape.fondoTipo === 'imagen' && shape.imagenResourceId
    ? getResources().find((r) => r.id === shape.imagenResourceId)
    : null;
  if (resource) {
    const imgWrapper = document.createElement('div');
    imgWrapper.style.position = 'absolute';
    imgWrapper.style.inset = '0';
    imgWrapper.style.overflow = 'hidden';
    imgWrapper.style.borderRadius = SHAPE_BORDER_RADIUS[shape.tipo] || '0';
    const img = document.createElement('img');
    img.src = resource.dataUrl;
    img.draggable = false;
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    applyImageAdjustStyle(img, shape.ajusteImagen);
    imgWrapper.appendChild(img);
    shapeEl.appendChild(imgWrapper);
  } else {
    shapeEl.style.backgroundColor = hexToRgba(shape.colorFondo, shape.colorFondoTransparencia ?? 0);
  }

  contentParent.appendChild(shapeEl);
}

function paintTextBox(contentParent, textBox, renderScale) {
  const textEl = document.createElement('div');
  textEl.style.position = 'absolute';
  textEl.style.left = `${textBox.x * renderScale}px`;
  textEl.style.top = `${textBox.y * renderScale}px`;
  textEl.style.width = `${textBox.width * renderScale}px`;
  textEl.style.height = `${textBox.height * renderScale}px`;
  textEl.style.fontSize = `${(textBox.tamañoFuente || 16) * renderScale}px`;
  textEl.style.color = textBox.color || '#000000';
  textEl.style.fontWeight = textBox.negrita ? 'bold' : 'normal';
  textEl.style.fontStyle = textBox.cursiva ? 'italic' : 'normal';
  textEl.style.textDecoration = textBox.subrayado ? 'underline' : 'none';
  textEl.style.border = textBox.bordeActivo
    ? `${textBox.bordeGrosor ?? 2}px ${textBox.bordeTipo === 'punteada' ? 'dashed' : 'solid'} ${textBox.bordeColor || '#000000'}`
    : 'none';
  textEl.style.backgroundColor = hexToRgba(textBox.colorFondo, textBox.colorFondoTransparencia ?? 0);
  textEl.style.overflow = 'hidden';
  textEl.style.wordBreak = 'break-word';
  textEl.style.whiteSpace = 'pre-wrap';
  textEl.style.pointerEvents = 'none';
  textEl.style.display = 'flex';
  textEl.style.flexDirection = 'column';
  textEl.style.boxSizing = 'border-box';
  Object.assign(textEl.style, getTextBoxLayoutStyle(textBox, renderScale));
  const fontResource = textBox.fuenteResourceId ? getResources().find((r) => r.id === textBox.fuenteResourceId) : null;
  if (fontResource) {
    textEl.style.fontFamily = fontFamilyFor(fontResource.id);
  }
  textEl.textContent = textBox.contenido || '';
  contentParent.appendChild(textEl);
}

// Placeholder neutro para un mazo sin cartas (cambio 00106): icono simple
// dibujado en JS, mismo criterio que renderDiceSilhouette de 'dado' — sin
// depender de ningún recurso de la galería.
function renderMazoEmptyPlaceholder(container, width, height) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '1.5');
  icon.style.position = 'absolute';
  icon.style.top = '50%';
  icon.style.left = '50%';
  icon.style.width = `${Math.min(width, height) * 0.4}px`;
  icon.style.height = `${Math.min(width, height) * 0.4}px`;
  icon.style.transform = 'translate(-50%, -50%)';
  icon.style.color = 'var(--text-muted)';
  icon.innerHTML =
    '<rect x="4" y="3" width="16" height="18" rx="2"/>' +
    '<line x1="8" y1="8" x2="16" y2="8"/>' +
    '<line x1="8" y1="12" x2="16" y2="12"/>';
  container.appendChild(icon);
}

// Zona de revelado del mazo (cambio 00106): recuadro decorativo, no
// seleccionable ni interactuable, que marca dónde aparecerán las cartas al
// sacarlas — siempre pegado al lado derecho del mazo, misma altura/anchura.
function renderMazoRevealZone(worldEl, mazo) {
  const rect = getMazoRevealZoneRect(mazo);
  const zone = document.createElement('div');
  zone.className = 'mazo-reveal-zone';
  zone.style.position = 'absolute';
  zone.style.left = `${rect.x}px`;
  zone.style.top = `${rect.y}px`;
  zone.style.width = `${rect.width}px`;
  zone.style.height = `${rect.height}px`;
  zone.style.borderRadius = mazo.properties?.forma === 'circular' ? '50%' : '';
  zone.textContent = 'Carta revelada';
  worldEl.appendChild(zone);
  return zone;
}

export function getComponentsBounds(components) {
  if (!components.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const component of components) {
    const x = component.x ?? 100;
    const y = component.y ?? 100;
    const width = component.width ?? MIN_TEXT_BOX_WIDTH;
    const height = component.height ?? MIN_TEXT_BOX_HEIGHT;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return { minX, minY, maxX, maxY };
}

// Efecto "levantar" al arrastrar (cambio 00062, solo cuando `liftOnDrag` es true): trae el
// nodo al final de `worldEl` (visualmente al frente, sin tocar `order`) y añade el estado
// transitorio `lifted`. El reordenamiento real y persistido (cambio 00061) sigue disparándose
// aparte, al soltar, donde ya lo hacía.
function beginDragLift(el, worldEl) {
  worldEl.appendChild(el);
  el.classList.add('lifted');
}

function endDragLift(el) {
  el.classList.remove('lifted');
}

// Feedback visual al voltear una carta (cambio 00075): detectado por diferencia de datos
// (última `caraActual` vista por id), no por el evento de click que lo origina — así el
// efecto no depende de (ni comparte nada con) el gesto de arrastre/`.lifted` de arriba, y
// se dispara ante cualquier cambio futuro de cara, no solo el click actual. Necesario
// porque `onCartaFlip` dispara un re-render síncrono que destruye el nodo sobre el que se
// hizo click antes de que se pudiera ver ninguna clase añadida ahí.
const lastCaraById = new Map();
const flipFeedbackTimeouts = new Map();

function applyFlipFeedbackIfChanged(carta, componentId, caraActual) {
  const previousCara = lastCaraById.get(componentId);
  lastCaraById.set(componentId, caraActual);
  if (previousCara === undefined || previousCara === caraActual) return;

  clearTimeout(flipFeedbackTimeouts.get(componentId));
  carta.classList.add('carta--flip-feedback');
  flipFeedbackTimeouts.set(componentId, setTimeout(() => {
    carta.classList.remove('carta--flip-feedback');
    flipFeedbackTimeouts.delete(componentId);
  }, 250));
}

export function renderComponentsOnTable(worldEl, components, { onSelect, onToggleSelect, selectedIds = new Set(), onMove, onResize, canMove = () => true, onDiceResult, onDiceOpenResult, onCartaFlip, onMazoDraw, onContextMenu, identifyMode, liftOnDrag = false, showLockIndicator = false, showHiddenIndicator = false } = {}) {
  worldEl.innerHTML = '';

  // El componente con `order` más alto se dibuja primero (queda por debajo); el de
  // `order = 1` se dibuja el último (appendChild posterior = por encima visualmente).
  const stackedComponents = [...components].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

  // Selección múltiple (cambio 00108): registro de elemento DOM por id, para poder
  // mover en vivo (durante el propio arrastre, no solo al soltar) al resto de
  // componentes seleccionados cuando se arrastra uno de ellos.
  const elementsById = new Map();

  function getBlockDragTargets(component) {
    if (!(selectedIds.size > 1 && selectedIds.has(component.id))) return [];
    const targets = [];
    for (const id of selectedIds) {
      if (id === component.id) continue;
      const el = elementsById.get(id);
      const other = components.find((c) => c.id === id);
      if (!el || !other) continue;
      targets.push({ el, startX: other.x ?? 100, startY: other.y ?? 100 });
    }
    return targets;
  }

  for (const component of stackedComponents) {
    if (component.type === 'texto') {
      const textBox = document.createElement('div');
      elementsById.set(component.id, textBox);
      textBox.className = 'text-box';
      textBox.style.position = 'absolute';
      textBox.style.top = `${component.y ?? 100}px`;
      textBox.style.left = `${component.x ?? 100}px`;
      textBox.style.padding = '0.5rem';
      textBox.style.fontSize = `${component.properties.tamañoFuente || 16}px`;
      textBox.style.color = component.properties.colorTexto || '#000000';
      textBox.style.whiteSpace = 'pre-wrap';
      textBox.style.wordBreak = 'break-word';
      textBox.style.overflow = 'hidden';
      if (component.width != null) textBox.style.width = `${component.width}px`;
      if (component.height != null) textBox.style.height = `${component.height}px`;

      if (component.properties.colorFondo) {
        textBox.style.backgroundColor = component.properties.colorFondo;
      }

      textBox.textContent = component.properties.contenido || '';

      if (identifyMode === 'tooltip' && component.mostrarTooltip) textBox.title = formatComponentIdentifier(component);
      if (identifyMode === 'label') textBox.appendChild(createIdentifierLabel(component));
      if (showLockIndicator && component.bloqueado !== 'ninguno') textBox.appendChild(createLockBadge());
      if (showHiddenIndicator && component.oculto) textBox.appendChild(createHiddenBadge());

      if (onSelect) {
        textBox.classList.add('text-box--selectable');
        textBox.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        textBox.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component, e);
        });
      }

      if (onContextMenu) {
        textBox.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(component, e);
        });
      }

      if (selectedIds.has(component.id)) {
        textBox.classList.add('text-box--selected');
      }

      if (onMove && canMove(component)) {
        textBox.classList.add('text-box--movable');

        let startMouseX = 0;
        let startMouseY = 0;
        let startX = component.x ?? 100;
        let startY = component.y ?? 100;
        let currentX = startX;
        let currentY = startY;
        let blockDragTargets = [];

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          textBox.style.left = `${currentX}px`;
          textBox.style.top = `${currentY}px`;
          const dx = currentX - startX;
          const dy = currentY - startY;
          for (const target of blockDragTargets) {
            target.el.style.left = `${target.startX + dx}px`;
            target.el.style.top = `${target.startY + dy}px`;
          }
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (liftOnDrag) endDragLift(textBox);
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        textBox.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          if (liftOnDrag) beginDragLift(textBox, worldEl);
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          blockDragTargets = getBlockDragTargets(component);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && selectedIds.size === 1 && selectedIds.has(component.id)) {
        const getResizeSize = () => {
          if (component.width != null && component.height != null) {
            return { width: component.width, height: component.height };
          }
          const zoom = getWorldZoom(worldEl);
          const rect = textBox.getBoundingClientRect();
          return { width: rect.width / zoom, height: rect.height / zoom };
        };
        const clampResizeSize = ({ width, height }) => ({
          width: Math.max(width, MIN_TEXT_BOX_WIDTH),
          height: Math.max(height, MIN_TEXT_BOX_HEIGHT),
        });

        attachResizeHandle(textBox, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: getResizeSize,
          clamp: clampResizeSize,
          onResize: ({ width, height }) => {
            textBox.style.width = `${width}px`;
            textBox.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });

        attachResizeHandle(textBox, {
          axis: 'both',
          corner: 'tl',
          getScale: () => getWorldZoom(worldEl),
          getSize: getResizeSize,
          clamp: clampResizeSize,
          onResize: ({ width, height, dx, dy }) => {
            textBox.style.left = `${(component.x ?? 100) + dx}px`;
            textBox.style.top = `${(component.y ?? 100) + dy}px`;
            textBox.style.width = `${width}px`;
            textBox.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height, dx, dy }) => {
            onResize(component, width, height, (component.x ?? 100) + dx, (component.y ?? 100) + dy);
          },
        });
      }

      worldEl.appendChild(textBox);
    } else if (component.type === 'tablero') {
      const board = document.createElement('div');
      elementsById.set(component.id, board);
      board.className = 'board';
      board.style.position = 'absolute';
      board.style.top = `${component.y ?? 100}px`;
      board.style.left = `${component.x ?? 100}px`;
      const width = component.width ?? MIN_BOARD_SIZE;
      const height = component.height ?? MIN_BOARD_SIZE;
      board.style.width = `${width}px`;
      board.style.height = `${height}px`;

      if (identifyMode === 'tooltip' && component.mostrarTooltip) board.title = formatComponentIdentifier(component);
      if (identifyMode === 'label') board.appendChild(createIdentifierLabel(component));
      if (showLockIndicator && component.bloqueado !== 'ninguno') board.appendChild(createLockBadge());
      if (showHiddenIndicator && component.oculto) board.appendChild(createHiddenBadge());

      const props = component.properties || {};
      const bordeColor = props.bordeColor || '#000000';
      const bordeGrosor = props.bordeGrosor ?? 2;
      board.style.borderStyle = 'solid';
      board.style.borderWidth = `${bordeGrosor}px`;
      board.style.borderTopColor = shadeColor(bordeColor, 0.35);
      board.style.borderLeftColor = shadeColor(bordeColor, 0.35);
      board.style.borderBottomColor = shadeColor(bordeColor, -0.35);
      board.style.borderRightColor = shadeColor(bordeColor, -0.35);

      const fondoTipo = props.fondoTipo || 'colorPatron';
      let hexGridToRender = null;

      if (fondoTipo === 'imagen') {
        const resource = getResources().find((r) => r.id === props.imagenResourceId);
        if (resource) {
          board.style.backgroundImage = `url("${resource.dataUrl}")`;
          board.style.backgroundSize = 'cover';
          board.style.backgroundPosition = 'center';
        } else {
          board.style.backgroundColor = '#ffffff';
        }
      } else {
        board.style.backgroundColor = '#ffffff';
        const patronColor = props.patronColor || '#000000';
        const patronGrosor = props.patronGrosor || 1;
        const patronFilas = props.patronFilas || 8;
        const patronColumnas = props.patronColumnas || 8;

        // 'hexagonal' es el valor guardado antes del cambio 00089 (una sola
        // orientación) — se interpreta como alias de 'hex-horizontal', la
        // orientación que ya dibujaba antes de dividirse en dos.
        const patronForma = props.patronForma === 'hexagonal' ? 'hex-horizontal' : props.patronForma;

        if (patronForma === 'hex-vertical' || patronForma === 'hex-horizontal') {
          hexGridToRender = {
            patronFilas,
            patronColumnas,
            patronColor,
            patronGrosor,
            orientation: patronForma === 'hex-vertical' ? 'pointy' : 'flat',
          };
        } else {
          const cellWidth = width / patronColumnas;
          const cellHeight = height / patronFilas;
          board.style.backgroundImage =
            `linear-gradient(to right, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px), ` +
            `linear-gradient(to bottom, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px), ` +
            `linear-gradient(to left, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px), ` +
            `linear-gradient(to top, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px)`;
          board.style.backgroundSize = `${cellWidth}px ${cellHeight}px, ${cellWidth}px ${cellHeight}px, 100% 100%, 100% 100%`;
          board.style.backgroundRepeat = 'repeat, repeat, no-repeat, no-repeat';
        }
      }

      if (hexGridToRender) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        board.appendChild(svg);
        renderHexGrid(svg, width - bordeGrosor * 2, height - bordeGrosor * 2, hexGridToRender.patronFilas, hexGridToRender.patronColumnas, hexGridToRender.patronColor, hexGridToRender.patronGrosor, hexGridToRender.orientation);
      }

      if (onSelect) {
        board.classList.add('board--selectable');
        board.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        board.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component, e);
        });
      }

      if (onContextMenu) {
        board.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(component, e);
        });
      }

      if (selectedIds.has(component.id)) {
        board.classList.add('board--selected');
      }

      if (onMove && canMove(component)) {
        board.classList.add('board--movable');

        let startMouseX = 0;
        let startMouseY = 0;
        let startX = component.x ?? 100;
        let startY = component.y ?? 100;
        let currentX = startX;
        let currentY = startY;
        let blockDragTargets = [];

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          board.style.left = `${currentX}px`;
          board.style.top = `${currentY}px`;
          const dx = currentX - startX;
          const dy = currentY - startY;
          for (const target of blockDragTargets) {
            target.el.style.left = `${target.startX + dx}px`;
            target.el.style.top = `${target.startY + dy}px`;
          }
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (liftOnDrag) endDragLift(board);
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        board.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          if (liftOnDrag) beginDragLift(board, worldEl);
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          blockDragTargets = getBlockDragTargets(component);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && selectedIds.size === 1 && selectedIds.has(component.id)) {
        const clampBoardSize = ({ width, height }) => ({
          width: Math.max(width, MIN_BOARD_SIZE),
          height: Math.max(height, MIN_BOARD_SIZE),
        });

        attachResizeHandle(board, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampBoardSize,
          onResize: ({ width, height }) => {
            board.style.width = `${width}px`;
            board.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });

        attachResizeHandle(board, {
          axis: 'both',
          corner: 'tl',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampBoardSize,
          onResize: ({ width, height, dx, dy }) => {
            board.style.left = `${(component.x ?? 100) + dx}px`;
            board.style.top = `${(component.y ?? 100) + dy}px`;
            board.style.width = `${width}px`;
            board.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height, dx, dy }) => {
            onResize(component, width, height, (component.x ?? 100) + dx, (component.y ?? 100) + dy);
          },
        });
      }

      worldEl.appendChild(board);
    } else if (component.type === 'dado') {
      const dice = document.createElement('div');
      elementsById.set(component.id, dice);
      dice.className = 'dice';
      dice.style.position = 'absolute';
      dice.style.top = `${component.y ?? 100}px`;
      dice.style.left = `${component.x ?? 100}px`;
      const size = component.width ?? component.height ?? 100;
      dice.style.width = `${size}px`;
      dice.style.height = `${size}px`;

      if (identifyMode === 'tooltip' && component.mostrarTooltip) dice.title = formatComponentIdentifier(component);
      if (identifyMode === 'label') dice.appendChild(createIdentifierLabel(component));
      if (showLockIndicator && component.bloqueado !== 'ninguno') dice.appendChild(createLockBadge());
      if (showHiddenIndicator && component.oculto) dice.appendChild(createHiddenBadge());

      const props = component.properties || {};
      const colorCuerpo = props.colorCuerpo || '#888888';
      const colorNumeros = props.colorNumeros || '#000000';
      const posibles = getPosibleValores(props);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.pointerEvents = 'none';
      renderDiceSilhouette(svg, size, posibles.length, colorCuerpo);
      dice.appendChild(svg);

      const resultEl = document.createElement('div');
      resultEl.className = 'dice__result';
      resultEl.style.position = 'absolute';
      resultEl.style.top = '0';
      resultEl.style.left = '0';
      resultEl.style.width = '100%';
      resultEl.style.height = '100%';
      resultEl.style.display = 'flex';
      resultEl.style.alignItems = 'center';
      resultEl.style.justifyContent = 'center';
      resultEl.style.color = colorNumeros;
      resultEl.style.fontSize = `${size * 0.45}px`;
      resultEl.style.pointerEvents = 'none';
      const fontResource = props.fuenteResourceId ? getResources().find((r) => r.id === props.fuenteResourceId) : null;
      if (fontResource) {
        resultEl.style.fontFamily = fontFamilyFor(fontResource.id);
      }
      resultEl.textContent = props.resultadoActual ?? '';
      dice.appendChild(resultEl);

      if (onSelect) {
        dice.classList.add('dice--selectable');
        dice.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        dice.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component, e);
        });
      }

      if (onContextMenu) {
        dice.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(component, e);
        });
      }

      if (selectedIds.has(component.id)) {
        dice.classList.add('dice--selected');
      }

      if (onMove && canMove(component)) {
        dice.classList.add('dice--movable');

        let startMouseX = 0;
        let startMouseY = 0;
        let startX = component.x ?? 100;
        let startY = component.y ?? 100;
        let currentX = startX;
        let currentY = startY;
        let blockDragTargets = [];

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          dice.style.left = `${currentX}px`;
          dice.style.top = `${currentY}px`;
          const dx = currentX - startX;
          const dy = currentY - startY;
          for (const target of blockDragTargets) {
            target.el.style.left = `${target.startX + dx}px`;
            target.el.style.top = `${target.startY + dy}px`;
          }
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (liftOnDrag) endDragLift(dice);
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        dice.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          if (liftOnDrag) beginDragLift(dice, worldEl);
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          blockDragTargets = getBlockDragTargets(component);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      } else if (onDiceResult && isInteractionActive(component, 'lanzar')) {
        dice.classList.add('dice--clickable');
      }

      if (onResize && selectedIds.size === 1 && selectedIds.has(component.id)) {
        const clampDiceSize = ({ width, height }) => {
          const s = Math.max(width, height, MIN_DADO_SIZE);
          return { width: s, height: s };
        };

        attachResizeHandle(dice, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width: size, height: size }),
          clamp: clampDiceSize,
          onResize: ({ width, height }) => {
            dice.style.width = `${width}px`;
            dice.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });

        attachResizeHandle(dice, {
          axis: 'both',
          corner: 'tl',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width: size, height: size }),
          clamp: clampDiceSize,
          onResize: ({ width, height, dx, dy }) => {
            dice.style.left = `${(component.x ?? 100) + dx}px`;
            dice.style.top = `${(component.y ?? 100) + dy}px`;
            dice.style.width = `${width}px`;
            dice.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height, dx, dy }) => {
            onResize(component, width, height, (component.x ?? 100) + dx, (component.y ?? 100) + dy);
          },
        });
      }

      // Lanzamiento y modal de resultado (solo modo juego, ver modes/play/playMode.js):
      // desambigua click (lanzar) de doble click (ver resultado grande) con un timeout
      // corto, ya que el navegador dispara `click` antes que `dblclick`. La animación de
      // parpadeo y temblor vive en una variable de cierre local (`rolling`), válida
      // mientras el worldEl no se vuelva a pintar (no se emite `components:changed` en
      // cada frame). El temblor es un `transform: translate()` recalculado en cada tick
      // (mismo mecanismo que el pan/zoom de la mesa), no una animación/transición CSS.
      // La comprobación de `isInteractionActive` (cambio 00115) es independiente del
      // `dblclick` de abajo (`onDiceOpenResult`), que sigue disponible siempre.
      if (onDiceResult && isInteractionActive(component, 'lanzar')) {
        let rolling = false;
        let rollTimeout = null;

        function startRoll() {
          if (rolling) return;
          rolling = true;
          const shakeAmplitude = size * 0.04;
          const interval = setInterval(() => {
            const posiblesActuales = getPosibleValores(props);
            resultEl.textContent = posiblesActuales[Math.floor(Math.random() * posiblesActuales.length)];
            const dx = (Math.random() * 2 - 1) * shakeAmplitude;
            const dy = (Math.random() * 2 - 1) * shakeAmplitude;
            dice.style.transform = `translate(${dx}px, ${dy}px)`;
          }, DICE_ROLL_INTERVAL_MS);

          setTimeout(() => {
            clearInterval(interval);
            const resultadoFinal = tirarDado(props);
            resultEl.textContent = resultadoFinal;
            dice.style.transform = '';
            rolling = false;
            onDiceResult(component, resultadoFinal);
          }, DICE_ROLL_DURATION_MS);
        }

        dice.addEventListener('click', (e) => {
          e.stopPropagation();
          if (rolling || rollTimeout) return;
          rollTimeout = setTimeout(() => {
            rollTimeout = null;
            startRoll();
          }, 250);
        });

        dice.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          if (rollTimeout) {
            clearTimeout(rollTimeout);
            rollTimeout = null;
          }
          if (onDiceOpenResult) onDiceOpenResult(component);
        });
      }

      worldEl.appendChild(dice);
    } else if (component.type === 'documento') {
      const documentViewer = document.createElement('div');
      elementsById.set(component.id, documentViewer);
      documentViewer.className = 'document-viewer';
      documentViewer.style.position = 'absolute';
      documentViewer.style.top = `${component.y ?? 100}px`;
      documentViewer.style.left = `${component.x ?? 100}px`;
      const width = component.width ?? MIN_DOCUMENTO_WIDTH;
      const height = component.height ?? MIN_DOCUMENTO_HEIGHT;
      documentViewer.style.width = `${width}px`;
      documentViewer.style.height = `${height}px`;

      if (identifyMode === 'tooltip' && component.mostrarTooltip) documentViewer.title = formatComponentIdentifier(component);
      if (identifyMode === 'label') documentViewer.appendChild(createIdentifierLabel(component));
      if (showLockIndicator && component.bloqueado !== 'ninguno') documentViewer.appendChild(createLockBadge());
      if (showHiddenIndicator && component.oculto) documentViewer.appendChild(createHiddenBadge());

      const content = document.createElement('div');
      content.className = 'document-viewer__content';
      documentViewer.appendChild(content);

      const props = component.properties || {};
      if (props.tipoContenido === 'url') {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
        content.appendChild(iframe);

        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'document-viewer__error';
        errorOverlay.textContent = 'No se pudo cargar el contenido';
        errorOverlay.style.display = 'none';
        documentViewer.appendChild(errorOverlay);

        let loaded = false;
        iframe.addEventListener('load', () => {
          loaded = true;
        });
        iframe.addEventListener('error', () => {
          errorOverlay.style.display = 'flex';
        });
        iframe.src = props.url || '';
        setTimeout(() => {
          if (!loaded) errorOverlay.style.display = 'flex';
        }, DOCUMENTO_IFRAME_LOAD_TIMEOUT_MS);
      } else {
        content.innerHTML = sanitizeHtml(
          props.formato === 'html' ? (props.contenido || '') : markdownToHtml(props.contenido || '')
        );
      }

      if (onSelect) {
        documentViewer.classList.add('document-viewer--selectable');
        documentViewer.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        documentViewer.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component, e);
        });
      }

      if (onContextMenu) {
        documentViewer.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(component, e);
        });
      }

      if (selectedIds.has(component.id)) {
        documentViewer.classList.add('document-viewer--selected');
      }

      if (onMove && canMove(component)) {
        documentViewer.classList.add('document-viewer--movable');

        let startMouseX = 0;
        let startMouseY = 0;
        let startX = component.x ?? 100;
        let startY = component.y ?? 100;
        let currentX = startX;
        let currentY = startY;
        let blockDragTargets = [];

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          documentViewer.style.left = `${currentX}px`;
          documentViewer.style.top = `${currentY}px`;
          const dx = currentX - startX;
          const dy = currentY - startY;
          for (const target of blockDragTargets) {
            target.el.style.left = `${target.startX + dx}px`;
            target.el.style.top = `${target.startY + dy}px`;
          }
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (liftOnDrag) endDragLift(documentViewer);
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        documentViewer.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          if (liftOnDrag) beginDragLift(documentViewer, worldEl);
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          blockDragTargets = getBlockDragTargets(component);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && selectedIds.size === 1 && selectedIds.has(component.id)) {
        const clampDocumentoSize = ({ width, height }) => ({
          width: Math.max(width, MIN_DOCUMENTO_WIDTH),
          height: Math.max(height, MIN_DOCUMENTO_HEIGHT),
        });

        attachResizeHandle(documentViewer, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampDocumentoSize,
          onResize: ({ width, height }) => {
            documentViewer.style.width = `${width}px`;
            documentViewer.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });

        attachResizeHandle(documentViewer, {
          axis: 'both',
          corner: 'tl',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampDocumentoSize,
          onResize: ({ width, height, dx, dy }) => {
            documentViewer.style.left = `${(component.x ?? 100) + dx}px`;
            documentViewer.style.top = `${(component.y ?? 100) + dy}px`;
            documentViewer.style.width = `${width}px`;
            documentViewer.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height, dx, dy }) => {
            onResize(component, width, height, (component.x ?? 100) + dx, (component.y ?? 100) + dy);
          },
        });
      }

      worldEl.appendChild(documentViewer);
    } else if (component.type === 'carta') {
      const props = component.properties || {};
      const { borderRadius: cartaBorderRadius, clipPath: cartaClipPath } = getCartaShapeCss(props.proporcion, props.esquinasRedondeadas !== false);
      const isHexCarta = props.proporcion === 'hex-vertical' || props.proporcion === 'hex-horizontal';
      const isTriangleCarta = props.proporcion === 'triangulo' || props.proporcion === 'triangulo-invertido';

      const carta = document.createElement('div');
      elementsById.set(component.id, carta);
      carta.className = 'carta';
      carta.classList.toggle('carta--hex', isHexCarta);
      carta.classList.toggle('carta--triangle', isTriangleCarta);
      carta.style.position = 'absolute';
      carta.style.top = `${component.y ?? 100}px`;
      carta.style.left = `${component.x ?? 100}px`;
      carta.style.boxSizing = 'border-box';
      carta.style.borderRadius = cartaBorderRadius;
      const width = component.width ?? MIN_CARTA_WIDTH;
      const height = component.height ?? MIN_CARTA_HEIGHT;
      carta.style.width = `${width}px`;
      carta.style.height = `${height}px`;

      const caraActual = props.caraActual === 'frontal' ? 'frontal' : 'trasera';
      const cara = caraActual === 'frontal' ? props.caraFrontal : props.caraTrasera;
      const renderScale = width / CARD_DESIGN_WIDTH;

      const cartaContent = document.createElement('div');
      cartaContent.style.position = 'absolute';
      cartaContent.style.inset = '0';
      cartaContent.style.boxSizing = 'border-box';
      cartaContent.style.overflow = 'hidden';
      cartaContent.style.borderRadius = cartaBorderRadius;
      cartaContent.style.clipPath = cartaClipPath;
      carta.appendChild(cartaContent);

      // Las proporciones hexagonales y triangulares no pueden usar `border`
      // CSS (dibuja siempre paralelo a la caja rectangular, no a las aristas
      // de la silueta recortada con clip-path) — en su lugar, dos capas de
      // clip-path anidadas: esta capa exterior rellena del color de borde,
      // y `cartaInner` (más abajo) recorta el contenido con una silueta
      // concéntrica más pequeña, dejando visible el anillo entre ambas
      // como borde de grosor uniforme (fix 00096, extendido a triángulo en
      // el cambio 00134).
      const isNonRectClippedCarta = isHexCarta || isTriangleCarta;
      const innerClipPath = isHexCarta
        ? getHexInnerClipPath(props.proporcion, width, height, cara?.bordeGrosor ?? 0)
        : isTriangleCarta
          ? getTriangleInnerClipPath(props.proporcion, width, height, cara?.bordeGrosor ?? 0)
          : null;
      let contentParent = cartaContent;
      if (isNonRectClippedCarta) {
        cartaContent.style.backgroundColor = innerClipPath ? (cara.bordeColor || '#000000') : '#ffffff';
        cartaContent.style.border = 'none';
        if (innerClipPath) {
          const cartaInner = document.createElement('div');
          cartaInner.style.position = 'absolute';
          cartaInner.style.inset = '0';
          cartaInner.style.boxSizing = 'border-box';
          cartaInner.style.overflow = 'hidden';
          cartaInner.style.clipPath = innerClipPath;
          cartaInner.style.backgroundColor = '#ffffff';
          cartaContent.appendChild(cartaInner);
          contentParent = cartaInner;
        }
      } else {
        cartaContent.style.backgroundColor = '#ffffff';
        cartaContent.style.border = (cara?.bordeGrosor ?? 0) > 0 ? `${cara.bordeGrosor}px solid ${cara.bordeColor || '#000000'}` : 'none';
      }

      if (identifyMode === 'tooltip' && component.mostrarTooltip) carta.title = formatComponentIdentifier(component);
      if (identifyMode === 'label') carta.appendChild(createIdentifierLabel(component));
      if (showLockIndicator && component.bloqueado !== 'ninguno') carta.appendChild(createLockBadge());
      if (showHiddenIndicator && component.oculto) carta.appendChild(createHiddenBadge());

      applyFlipFeedbackIfChanged(carta, component.id, caraActual);

      paintCartaFace(contentParent, cara, renderScale);

      if (onSelect) {
        carta.classList.add('carta--selectable');
        carta.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        carta.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component, e);
        });
      }

      if (onContextMenu) {
        carta.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(component, e);
        });
      }

      if (selectedIds.has(component.id)) {
        carta.classList.add('carta--selected');
      }

      if (onMove && canMove(component)) {
        carta.classList.add('carta--movable');

        let startMouseX = 0;
        let startMouseY = 0;
        let startX = component.x ?? 100;
        let startY = component.y ?? 100;
        let currentX = startX;
        let currentY = startY;
        let lifted = false;
        let broughtToFront = false;
        let blockDragTargets = [];

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          carta.style.left = `${currentX}px`;
          carta.style.top = `${currentY}px`;
          const dx = currentX - startX;
          const dy = currentY - startY;
          for (const target of blockDragTargets) {
            target.el.style.left = `${target.startX + dx}px`;
            target.el.style.top = `${target.startY + dy}px`;
          }
          // Traer al frente del DOM solo al confirmarse un arrastre real (primer
          // `mousemove`, no en `mousedown`, mismo patrón que `liftOnDrag` más abajo)
          // — reordenar el DOM ya en `mousedown` impide que el navegador sintetice
          // el `click` posterior (rompía Ctrl+click de la selección múltiple, fix 00113).
          // Independiente de `liftOnDrag` (exclusivo de modo juego): en modo edición
          // no hay efecto de "levantar" (sombra), pero la carta debe verse por encima
          // de cualquier otro elemento, incluido un mazo, mientras dura el arrastre.
          if (!broughtToFront) {
            broughtToFront = true;
            for (const target of blockDragTargets) worldEl.appendChild(target.el);
            worldEl.appendChild(carta);
          }
          if (liftOnDrag && !lifted) {
            lifted = true;
            beginDragLift(carta, worldEl);
          }
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (lifted) endDragLift(carta);
          lifted = false;
          broughtToFront = false;
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        carta.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          blockDragTargets = getBlockDragTargets(component);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && selectedIds.size === 1 && selectedIds.has(component.id)) {
        const clampCartaSize = ({ width, height }) => {
          if (props.proporcion === 'circular' || props.proporcion === 'libre') {
            return {
              width: Math.max(width, MIN_CARTA_WIDTH),
              height: Math.max(height, MIN_CARTA_HEIGHT),
            };
          }
          const ratio = getProporcionRatio(props.proporcion);
          let w = Math.max(width, height * ratio, MIN_CARTA_WIDTH);
          let h = w / ratio;
          if (h < MIN_CARTA_HEIGHT) {
            h = MIN_CARTA_HEIGHT;
            w = h * ratio;
          }
          return { width: w, height: h };
        };

        attachResizeHandle(carta, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampCartaSize,
          onResize: ({ width, height }) => {
            carta.style.width = `${width}px`;
            carta.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });

        attachResizeHandle(carta, {
          axis: 'both',
          corner: 'tl',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampCartaSize,
          onResize: ({ width, height, dx, dy }) => {
            carta.style.left = `${(component.x ?? 100) + dx}px`;
            carta.style.top = `${(component.y ?? 100) + dy}px`;
            carta.style.width = `${width}px`;
            carta.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height, dx, dy }) => {
            onResize(component, width, height, (component.x ?? 100) + dx, (component.y ?? 100) + dy);
          },
        });
      }

      // Volteo: siempre disponible con un click, independiente de si la carta es
      // arrastrable — mismo patrón exacto que 'dado' con onDiceResult, para que
      // "Bloqueado" nunca afecte al volteo (solo al arrastre).
      if (onCartaFlip && isInteractionActive(component, 'voltear')) {
        carta.classList.add('carta--clickable');
        carta.addEventListener('click', (e) => {
          e.stopPropagation();
          onCartaFlip(component, caraActual === 'trasera' ? 'frontal' : 'trasera');
        });
      }

      worldEl.appendChild(carta);
    } else if (component.type === 'mazo') {
      const props = component.properties || {};
      const cartaIds = props.cartaIds || [];
      const mazoBorderRadius = props.forma === 'circular' ? '50%' : 'var(--radius-lg)';

      const mazo = document.createElement('div');
      elementsById.set(component.id, mazo);
      mazo.className = 'carta';
      mazo.style.position = 'absolute';
      mazo.style.top = `${component.y ?? 100}px`;
      mazo.style.left = `${component.x ?? 100}px`;
      mazo.style.boxSizing = 'border-box';
      mazo.style.borderRadius = mazoBorderRadius;
      const width = component.width ?? MIN_MAZO_WIDTH;
      const height = component.height ?? MIN_MAZO_HEIGHT;
      mazo.style.width = `${width}px`;
      mazo.style.height = `${height}px`;

      const mazoContent = document.createElement('div');
      mazoContent.style.position = 'absolute';
      mazoContent.style.inset = '0';
      mazoContent.style.boxSizing = 'border-box';
      mazoContent.style.overflow = 'hidden';
      mazoContent.style.borderRadius = mazoBorderRadius;
      mazoContent.style.backgroundColor = '#ffffff';
      mazo.appendChild(mazoContent);

      const cartaArriba = cartaIds.length > 0 ? getComponents().find((c) => c.id === cartaIds[0]) : null;
      if (cartaArriba) {
        const renderScale = width / CARD_DESIGN_WIDTH;
        paintCartaFace(mazoContent, cartaArriba.properties?.caraTrasera, renderScale);
      } else {
        renderMazoEmptyPlaceholder(mazoContent, width, height);
      }

      if (identifyMode === 'tooltip') mazo.title = 'Pulsa para sacar la primera carta.';
      if (identifyMode === 'label') mazo.appendChild(createIdentifierLabel(component));
      if (showLockIndicator && component.bloqueado !== 'ninguno') mazo.appendChild(createLockBadge());
      if (showHiddenIndicator && component.oculto) mazo.appendChild(createHiddenBadge());

      const countLabel = document.createElement('span');
      countLabel.className = 'mazo-count-label';
      countLabel.textContent = `${component.id} — ${cartaIds.length} cartas`;
      mazo.appendChild(countLabel);

      const revealZone = renderMazoRevealZone(worldEl, component);

      if (onSelect) {
        mazo.classList.add('carta--selectable');
        mazo.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        mazo.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component, e);
        });
      }

      if (onContextMenu) {
        mazo.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(component, e);
        });
      }

      if (selectedIds.has(component.id)) {
        mazo.classList.add('carta--selected');
      }

      if (onMove && canMove(component)) {
        mazo.classList.add('carta--movable');

        let startMouseX = 0;
        let startMouseY = 0;
        let startX = component.x ?? 100;
        let startY = component.y ?? 100;
        let currentX = startX;
        let currentY = startY;
        let lifted = false;
        let blockDragTargets = [];

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          mazo.style.left = `${currentX}px`;
          mazo.style.top = `${currentY}px`;
          const dx = currentX - startX;
          const dy = currentY - startY;
          for (const target of blockDragTargets) {
            target.el.style.left = `${target.startX + dx}px`;
            target.el.style.top = `${target.startY + dy}px`;
          }
          // La zona de revelado debe seguir al mazo en vivo durante el arrastre,
          // no solo al soltar (fix 00114) — mismo cálculo que el render inicial.
          const revealRect = getMazoRevealZoneRect({ x: currentX, y: currentY, width, height });
          revealZone.style.left = `${revealRect.x}px`;
          revealZone.style.top = `${revealRect.y}px`;
          if (liftOnDrag && !lifted) {
            lifted = true;
            beginDragLift(mazo, worldEl);
          }
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (lifted) endDragLift(mazo);
          lifted = false;
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        mazo.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          blockDragTargets = getBlockDragTargets(component);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && selectedIds.size === 1 && selectedIds.has(component.id)) {
        const clampMazoSize = ({ width, height }) => ({
          width: Math.max(width, MIN_MAZO_WIDTH),
          height: Math.max(height, MIN_MAZO_HEIGHT),
        });

        attachResizeHandle(mazo, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampMazoSize,
          onResize: ({ width, height }) => {
            mazo.style.width = `${width}px`;
            mazo.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });

        attachResizeHandle(mazo, {
          axis: 'both',
          corner: 'tl',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: clampMazoSize,
          onResize: ({ width, height, dx, dy }) => {
            mazo.style.left = `${(component.x ?? 100) + dx}px`;
            mazo.style.top = `${(component.y ?? 100) + dy}px`;
            mazo.style.width = `${width}px`;
            mazo.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height, dx, dy }) => {
            onResize(component, width, height, (component.x ?? 100) + dx, (component.y ?? 100) + dy);
          },
        });
      }

      // Sacar la carta de arriba: siempre disponible con un click, mismo
      // criterio que el volteo de 'carta' o el lanzamiento de 'dado' (no
      // depende de "Bloqueado", que solo condiciona el arrastre).
      if (onMazoDraw && isInteractionActive(component, 'sacarCarta')) {
        mazo.classList.add('mazo--clickable');
        mazo.addEventListener('click', (e) => {
          e.stopPropagation();
          onMazoDraw(component);
        });
      }

      worldEl.appendChild(mazo);
    }
  }
}
