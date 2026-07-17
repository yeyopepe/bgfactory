// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel flotante con listado de componentes y acciones de edición/borrado.

import { getComponents, addComponent, replaceComponent, removeComponent, getPanelState, setPanelState } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal } from '../../ui/componentModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';

// Selección de la sesión de edición en curso. `renderEditMode` se vuelve a invocar por
// completo (desde main.js) ante cualquier `components:changed`, así que este estado
// vive fuera de la función para no perderse cada vez que se mueve/redimensiona/edita
// un componente cualquiera. El colapso/posición/ancho del panel, en cambio, viven en
// `core/state.js` (`panelState`) porque sí se persisten en el autoguardado.
let selectedComponentId = null;

export function renderEditMode(container) {
  container.innerHTML = '';

  const { collapsed, position: panelPosition, width: panelWidth } = getPanelState();

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
      onDelete: (deletedComponent) => {
        if (selectedComponentId === deletedComponent.id) {
          selectedComponentId = null;
        }
        removeComponent(deletedComponent.id);
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
        setPanelState({ collapsed: !collapsed });
        renderList();
      },
      onPanelMove: (left, top) => {
        setPanelState({ position: { left, top } });
      },
      onPanelResize: (width) => {
        setPanelState({ width });
      },
    });
  }

  renderTable();
  renderList();

  container.appendChild(layout);
}
