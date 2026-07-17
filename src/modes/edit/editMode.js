// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel flotante con listado de componentes y acciones de edición/borrado.

import { getComponents, addComponent, replaceComponent, removeComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal } from '../../ui/componentModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';

// Estado de la sesión de edición en curso. `renderEditMode` se vuelve a invocar por
// completo (desde main.js) ante cualquier `components:changed`, así que este estado
// vive fuera de la función para no perderse (selección/colapso/posición y ancho del
// panel) cada vez que se mueve/redimensiona/edita un componente cualquiera.
let selectedComponentId = null;
let collapsed = false;
let panelPosition = null; // { left, top } en px; null = anclaje por defecto (arriba-derecha)
let panelWidth = null; // px; null = ancho por defecto (300px, de main.css)

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
  if (panelPosition) {
    listContainer.style.left = `${panelPosition.left}px`;
    listContainer.style.top = `${panelPosition.top}px`;
    listContainer.style.right = 'auto';
  }
  if (panelWidth != null) {
    listContainer.style.width = `${panelWidth}px`;
  }
  tableContainer.appendChild(listContainer);

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

  function toggleSelect(component) {
    selectedComponentId = selectedComponentId === component.id ? null : component.id;
    renderList();
    renderTable();
  }

  function renderTable() {
    renderComponentsOnTable(table.worldEl, getComponents(), {
      onSelect: openEditModalFor,
      onToggleSelect: toggleSelect,
      selectedId: selectedComponentId,
      onMove: (component, x, y) => {
        replaceComponent(component.id, updateComponent(component, { x, y }));
      },
      onResize: (component, width, height) => {
        replaceComponent(component.id, updateComponent(component, { width, height }));
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
      onSelectRow: toggleSelect,
      onToggleCollapse: () => {
        collapsed = !collapsed;
        renderList();
      },
      onPanelMove: (left, top) => {
        panelPosition = { left, top };
      },
      onPanelResize: (width) => {
        panelWidth = width;
      },
    });
  }

  renderTable();
  renderList();

  container.appendChild(layout);
}
