// Modo edición: mesa infinita con los componentes renderizados sobre ella (seleccionables
// para editar) + panel flotante con listado de componentes y acciones de edición/borrado.

import {
  getComponents, addComponent, replaceComponent, removeComponent, reorderComponent, getPanelState, setPanelState,
  getResources, addResource, replaceResource, removeResource, getResourcePanelState, setResourcePanelState,
} from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createResource, resourceTypeForFileName, isResourceInUse } from '../../core/resource.js';
import { createInfiniteTable } from '../../ui/table.js';
import { openComponentModal, createDefaultComponent } from '../../ui/componentModal.js';
import { openComponentTypeModal } from '../../ui/componentTypeModal.js';
import { renderComponentList } from '../../ui/componentList.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openResourceModal } from '../../ui/resourceModal.js';
import { renderResourceList } from '../../ui/resourceList.js';
import { showErrorModal } from '../../ui/errorModal.js';

// Selección de la sesión de edición en curso. `renderEditMode` se vuelve a invocar por
// completo (desde main.js) ante cualquier `components:changed`, así que este estado
// vive fuera de la función para no perderse cada vez que se mueve/redimensiona/edita
// un componente cualquiera. El colapso/posición/ancho del panel, en cambio, viven en
// `core/state.js` (`panelState`) porque sí se persisten en el autoguardado.
let selectedComponentId = null;

export function renderEditMode(container) {
  container.innerHTML = '';

  const { collapsed, position: panelPosition, width: panelWidth } = getPanelState();
  const { position: resourcePanelPosition, width: resourcePanelWidth } = getResourcePanelState();
  let resourceCollapsed = getResourcePanelState().collapsed;

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

  // Floating panel with the resource gallery, independent position/width/collapse
  const resourceListContainer = document.createElement('div');
  resourceListContainer.className = 'resource-panel-container';
  if (resourcePanelPosition) {
    resourceListContainer.style.left = `${resourcePanelPosition.left}px`;
    resourceListContainer.style.top = `${resourcePanelPosition.top}px`;
    resourceListContainer.style.right = 'auto';
  }
  if (resourcePanelWidth != null) {
    resourceListContainer.style.width = `${resourcePanelWidth}px`;
  }
  tableContainer.appendChild(resourceListContainer);

  const resourceFileInput = document.createElement('input');
  resourceFileInput.type = 'file';
  resourceFileInput.accept = '.png,.jpg,.jpeg,.gif,.svg,.webp,.ttf,.otf,.woff,.woff2';
  resourceFileInput.hidden = true;
  resourceFileInput.addEventListener('change', () => {
    const file = resourceFileInput.files[0];
    resourceFileInput.value = '';
    if (!file) return;
    const type = resourceTypeForFileName(file.name);
    if (!type) {
      showErrorModal('Error', 'Formato de fichero no soportado.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const name = file.name.replace(/\.[^.]+$/, '');
      addResource(createResource({ name, type, dataUrl: reader.result, fileName: file.name, mimeType: file.type }));
    };
    reader.readAsDataURL(file);
  });
  tableContainer.appendChild(resourceFileInput);

  function attemptDeleteResource(resource) {
    if (isResourceInUse(resource.id, getComponents())) {
      showErrorModal('Error', `El recurso "${resource.name}" está en uso y no se puede eliminar.`);
      return false;
    }
    if (!confirm(`¿Eliminar el recurso "${resource.name}"?`)) return false;
    removeResource(resource.id);
    return true;
  }

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
    openComponentTypeModal({
      onAccept: (type) => {
        const newComponent = createDefaultComponent(type);
        const n = getComponents().length;
        newComponent.x = 100 + (n % 10) * 30;
        newComponent.y = 100 + (n % 10) * 30;
        addComponent(newComponent);

        openComponentModal({
          component: newComponent,
          onAccept: (updated) => {
            replaceComponent(newComponent.id, updated);
          },
          onDelete: (deletedComponent) => {
            if (selectedComponentId === deletedComponent.id) {
              selectedComponentId = null;
            }
            removeComponent(deletedComponent.id);
          },
        });
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
      identifyMode: 'label',
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
      onReorder: (component, newOrder) => reorderComponent(component.id, newOrder),
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

  function renderResourcePanel() {
    renderResourceList(resourceListContainer, getResources(), {
      onEdit: (resource) => {
        openResourceModal({
          resource,
          onAccept: (updated) => replaceResource(resource.id, updated),
          onDelete: attemptDeleteResource,
        });
      },
      onRemove: attemptDeleteResource,
      onAdd: () => resourceFileInput.click(),
      collapsed: resourceCollapsed,
      onToggleCollapse: () => {
        resourceCollapsed = !resourceCollapsed;
        setResourcePanelState({ collapsed: resourceCollapsed });
        renderResourcePanel();
      },
      onPanelMove: (left, top) => {
        setResourcePanelState({ position: { left, top } });
      },
      onPanelResize: (width) => {
        setResourcePanelState({ width });
      },
    });
  }

  renderTable();
  renderList();
  renderResourcePanel();

  container.appendChild(layout);
}
