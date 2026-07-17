// Renders game components onto an infinite-table world element.
// Unlike ui/table.js (agnostic), this module knows the component model.

export function renderComponentsOnTable(worldEl, components, { onSelect } = {}) {
  for (const component of components) {
    if (component.type === 'cuadro-texto') {
      const textBox = document.createElement('div');
      textBox.className = 'text-box';
      textBox.style.position = 'absolute';
      textBox.style.top = '100px';
      textBox.style.left = '100px';
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

      worldEl.appendChild(textBox);
    }
  }
}
