// Renders game components onto an infinite-table world element.
// Unlike ui/table.js (agnostic), this module knows the component model.

import { attachResizeHandle } from './resizeHandle.js';
import { getResources } from '../core/state.js';

const MIN_TEXT_BOX_WIDTH = 40;
const MIN_TEXT_BOX_HEIGHT = 24;
const MIN_BOARD_SIZE = 40;

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

// Dibuja una rejilla de hexágonos "flat-top" que ocupa el máximo espacio
// posible de un lienzo width×height con el número de filas/columnas dado,
// sin recortar ningún hexágono (puede dejar un margen mínimo inevitable en
// los bordes, ver description.md 00019 "ajuste exacto de las casillas").
function renderHexGrid(svgEl, width, height, filas, columnas, color) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  svgEl.innerHTML = '';
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);

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
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i);
        points.push(`${cx + a * Math.cos(angle)},${cy + a * Math.sin(angle)}`);
      }
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('fill', 'none');
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', '1');
      svgEl.appendChild(polygon);
    }
  }
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

export function renderComponentsOnTable(worldEl, components, { onSelect, onToggleSelect, selectedId = null, onMove, onResize, canMove = () => true } = {}) {
  worldEl.innerHTML = '';

  // El componente con `order` más alto se dibuja primero (queda por debajo); el de
  // `order = 1` se dibuja el último (appendChild posterior = por encima visualmente).
  const stackedComponents = [...components].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

  for (const component of stackedComponents) {
    if (component.type === 'texto') {
      const textBox = document.createElement('div');
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

      if (onSelect) {
        textBox.classList.add('text-box--selectable');
        textBox.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        textBox.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component);
        });
      }

      if (component.id === selectedId) {
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

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          textBox.style.left = `${currentX}px`;
          textBox.style.top = `${currentY}px`;
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        textBox.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && component.id === selectedId) {
        attachResizeHandle(textBox, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => {
            if (component.width != null && component.height != null) {
              return { width: component.width, height: component.height };
            }
            const zoom = getWorldZoom(worldEl);
            const rect = textBox.getBoundingClientRect();
            return { width: rect.width / zoom, height: rect.height / zoom };
          },
          clamp: ({ width, height }) => ({
            width: Math.max(width, MIN_TEXT_BOX_WIDTH),
            height: Math.max(height, MIN_TEXT_BOX_HEIGHT),
          }),
          onResize: ({ width, height }) => {
            textBox.style.width = `${width}px`;
            textBox.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });
      }

      worldEl.appendChild(textBox);
    } else if (component.type === 'tablero') {
      const board = document.createElement('div');
      board.className = 'board';
      board.style.position = 'absolute';
      board.style.top = `${component.y ?? 100}px`;
      board.style.left = `${component.x ?? 100}px`;
      const width = component.width ?? MIN_BOARD_SIZE;
      const height = component.height ?? MIN_BOARD_SIZE;
      board.style.width = `${width}px`;
      board.style.height = `${height}px`;

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
        const patronFilas = props.patronFilas || 8;
        const patronColumnas = props.patronColumnas || 8;

        if (props.patronForma === 'hexagonal') {
          hexGridToRender = { patronFilas, patronColumnas, patronColor };
        } else {
          const cellWidth = width / patronColumnas;
          const cellHeight = height / patronFilas;
          board.style.backgroundImage =
            `linear-gradient(to right, ${patronColor} 1px, transparent 1px), ` +
            `linear-gradient(to bottom, ${patronColor} 1px, transparent 1px)`;
          board.style.backgroundSize = `${cellWidth}px ${cellHeight}px`;
        }
      }

      if (hexGridToRender) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        board.appendChild(svg);
        renderHexGrid(svg, width - bordeGrosor * 2, height - bordeGrosor * 2, hexGridToRender.patronFilas, hexGridToRender.patronColumnas, hexGridToRender.patronColor);
      }

      if (onSelect) {
        board.classList.add('board--selectable');
        board.addEventListener('dblclick', () => onSelect(component));
      }

      if (onToggleSelect) {
        board.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleSelect(component);
        });
      }

      if (component.id === selectedId) {
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

        function handleMouseMove(e) {
          const zoom = getWorldZoom(worldEl);
          currentX = startX + (e.clientX - startMouseX) / zoom;
          currentY = startY + (e.clientY - startMouseY) / zoom;
          board.style.left = `${currentX}px`;
          board.style.top = `${currentY}px`;
        }

        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          if (currentX === startX && currentY === startY) return;
          onMove(component, currentX, currentY);
        }

        board.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startX = component.x ?? 100;
          startY = component.y ?? 100;
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }

      if (onResize && component.id === selectedId) {
        attachResizeHandle(board, {
          axis: 'both',
          getScale: () => getWorldZoom(worldEl),
          getSize: () => ({ width, height }),
          clamp: ({ width, height }) => ({
            width: Math.max(width, MIN_BOARD_SIZE),
            height: Math.max(height, MIN_BOARD_SIZE),
          }),
          onResize: ({ width, height }) => {
            board.style.width = `${width}px`;
            board.style.height = `${height}px`;
          },
          onResizeEnd: ({ width, height }) => {
            onResize(component, width, height);
          },
        });
      }

      worldEl.appendChild(board);
    }
  }
}
