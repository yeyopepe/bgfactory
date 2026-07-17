// Renders game components onto an infinite-table world element.
// Unlike ui/table.js (agnostic), this module knows the component model.

function getWorldZoom(worldEl) {
  const match = getComputedStyle(worldEl).transform.match(/^matrix\(([^,]+),/);
  return match ? parseFloat(match[1]) : 1;
}

export function renderComponentsOnTable(worldEl, components, { onSelect, selectedId = null, onMove } = {}) {
  worldEl.innerHTML = '';

  for (const component of components) {
    if (component.type === 'cuadro-texto') {
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

      if (component.properties.colorFondo) {
        textBox.style.backgroundColor = component.properties.colorFondo;
      }

      textBox.textContent = component.properties.contenido || '';

      if (onSelect) {
        textBox.classList.add('text-box--selectable');
        textBox.addEventListener('dblclick', () => onSelect(component));
      }

      if (component.id === selectedId) {
        textBox.classList.add('text-box--selected');
      }

      if (onMove) {
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

      worldEl.appendChild(textBox);
    }
  }
}
