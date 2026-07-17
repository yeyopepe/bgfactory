// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel flotante con listado de componentes y acciones de edición/borrado.

import { getComponents, addComponent, replaceComponent, removeComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
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
  tableContainer.style.position = 'relative';
  const table = createInfiniteTable(tableContainer);
  layout.appendChild(tableContainer);

  // Floating panel with component list, anchored top-right over the table
  const listContainer = document.createElement('div');
  listContainer.className = 'component-panel-container';
  tableContainer.appendChild(listContainer);

  let selectedComponentId = null;
  let collapsed = false;

  function openEditModalFor(component) {
    openComponentModal({
      component,
      onAccept: (updated, isNew) => {
        replaceComponent(component.id, updated);
      },
    });
  }

  function openAddModal() {
    openComponentModal({
      component: null,
      onAccept: (newComponent, isNew) => {
        const n = getComponents().length;
        newComponent.x = 100 + (n % 10) * 30;
        newComponent.y = 100 + (n % 10) * 30;
        addComponent(newComponent);
      },
    });
  }

  function renderTable() {
    renderComponentsOnTable(table.worldEl, getComponents(), {
      onSelect: openEditModalFor,
      selectedId: selectedComponentId,
      onMove: (component, x, y) => {
        replaceComponent(component.id, updateComponent(component, { x, y }));
      },
    });
  }

  function renderList() {
    renderComponentList(listContainer, getComponents(), {
      onEdit: openEditModalFor,
      onRemove: (component) => {
        removeComponent(component.id);
      },
      onAdd: openAddModal,
      selectedId: selectedComponentId,
      collapsed,
      onSelectRow: (component) => {
        selectedComponentId = selectedComponentId === component.id ? null : component.id;
        renderList();
        renderTable();
      },
      onToggleCollapse: () => {
        collapsed = !collapsed;
        renderList();
      },
    });
  }

  renderTable();
  renderList();

  container.appendChild(layout);
}
