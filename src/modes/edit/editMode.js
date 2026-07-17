// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel lateral con listado de componentes y acciones de edición/borrado.

import { getComponents, addComponent, replaceComponent, removeComponent } from '../../core/state.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal } from '../../ui/componentModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';

export function renderEditMode(container) {
  container.innerHTML = '';

  const layout = document.createElement('div');
  layout.style.display = 'flex';
  layout.style.height = `100%`;
  layout.style.gap = '0';

  // Infinite table with components rendered directly on it
  const tableContainer = document.createElement('div');
  tableContainer.style.flex = '1';
  const table = createInfiniteTable(tableContainer);
  layout.appendChild(tableContainer);

  function openEditModalFor(component) {
    openComponentModal({
      component,
      onAccept: (updated, isNew) => {
        replaceComponent(component.id, updated);
      },
    });
  }

  renderComponentsOnTable(table.worldEl, getComponents(), { onSelect: openEditModalFor });

  // Side panel with component list
  const panel = document.createElement('div');
  panel.className = 'edit-mode-panel';

  const panelTitle = document.createElement('h2');
  panelTitle.textContent = 'Componentes';
  panelTitle.style.margin = '0 0 1rem 0';
  panel.appendChild(panelTitle);

  // List with edit/remove actions
  const listContainer = document.createElement('div');
  panel.appendChild(listContainer);

  renderComponentList(listContainer, getComponents(), {
    onEdit: openEditModalFor,
    onRemove: (component) => {
      removeComponent(component.id);
    },
  });

  // Add button
  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Añadir componente';
  addBtn.style.marginTop = '1rem';
  addBtn.addEventListener('click', () => {
    openComponentModal({
      component: null,
      onAccept: (newComponent, isNew) => {
        addComponent(newComponent);
      },
    });
  });
  panel.appendChild(addBtn);

  layout.appendChild(panel);
  container.appendChild(layout);
}
