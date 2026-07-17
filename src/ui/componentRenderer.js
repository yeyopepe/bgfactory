// Renders game components onto an infinite-table world element.
// Unlike ui/table.js (agnostic), this module knows the component model.

import { attachResizeHandle } from './resizeHandle.js';

const MIN_TEXT_BOX_WIDTH = 40;
const MIN_TEXT_BOX_HEIGHT = 24;

function getWorldZoom(worldEl) {
  const match = getComputedStyle(worldEl).transform.match(/^matrix\(([^,]+),/);
  return match ? parseFloat(match[1]) : 1;
}

export function renderComponentsOnTable(worldEl, components, { onSelect, onToggleSelect, selectedId = null, onMove, onResize, canMove = () => true } = {}) {
  worldEl.innerHTML = '';

  for (const component of components) {
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
    }
  }
}
