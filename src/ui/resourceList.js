// Panel flotante y colapsable con el listado de recursos (imágenes y
// tipografías), usado en modo edición. Análogo a componentList.js.

import { attachResizeHandle } from './resizeHandle.js';
import { RESOURCE_TYPES } from '../core/resource.js';

const MIN_PANEL_WIDTH = 290;
const MAX_PANEL_WIDTH = 600;

const TYPE_LABELS = {
  [RESOURCE_TYPES.IMAGE]: 'Imagen',
  [RESOURCE_TYPES.FONT]: 'Tipografía',
};

export function renderResourceList(
  container,
  resources,
  {
    onEdit,
    onRemove,
    onAdd,
    collapsed = false,
    onToggleCollapse,
    onPanelMove,
    onPanelResize,
  } = {}
) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'resource-panel';

  const header = document.createElement('div');
  header.className = 'resource-panel__header';

  const title = document.createElement('strong');
  title.textContent = 'Recursos';
  header.appendChild(title);

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.textContent = collapsed ? '▸' : '▾';
  toggleButton.addEventListener('click', () => {
    if (onToggleCollapse) onToggleCollapse();
  });
  header.appendChild(toggleButton);

  header.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target === toggleButton) return;
    e.preventDefault();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startLeft = container.offsetLeft;
    const startTop = container.offsetTop;
    const parent = container.offsetParent;
    let currentLeft = startLeft;
    let currentTop = startTop;

    container.style.left = `${startLeft}px`;
    container.style.top = `${startTop}px`;
    container.style.right = 'auto';
    header.classList.add('grabbing');

    function handleMouseMove(e) {
      const maxLeft = Math.max(0, parent.clientWidth - container.offsetWidth);
      const maxTop = Math.max(0, parent.clientHeight - container.offsetHeight);
      currentLeft = Math.min(Math.max(startLeft + (e.clientX - startMouseX), 0), maxLeft);
      currentTop = Math.min(Math.max(startTop + (e.clientY - startMouseY), 0), maxTop);
      container.style.left = `${currentLeft}px`;
      container.style.top = `${currentTop}px`;
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      header.classList.remove('grabbing');
      if (onPanelMove) onPanelMove(currentLeft, currentTop);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  panel.appendChild(header);

  if (!collapsed) {
    const body = document.createElement('div');
    body.className = 'resource-panel__body';

    if (resources.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'resource-list__empty';
      empty.textContent = 'No hay recursos todavía.';
      body.appendChild(empty);
    } else {
      const table = document.createElement('table');
      table.className = 'resource-list';

      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Nombre</th><th>Tipo</th><th>Acciones</th></tr>';
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      for (const resource of resources) {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = resource.name;
        row.appendChild(nameCell);

        const typeCell = document.createElement('td');
        typeCell.textContent = TYPE_LABELS[resource.type] ?? resource.type;
        row.appendChild(typeCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'resource-list__actions-cell';

        if (onEdit) {
          const editButton = document.createElement('button');
          editButton.type = 'button';
          editButton.className = 'resource-list__action-btn';
          editButton.textContent = 'Editar';
          editButton.addEventListener('click', () => onEdit(resource));
          actionsCell.appendChild(editButton);
        }

        if (onRemove) {
          const removeButton = document.createElement('button');
          removeButton.type = 'button';
          removeButton.className = 'resource-list__action-btn resource-list__action-btn--danger';
          removeButton.textContent = 'Eliminar';
          removeButton.addEventListener('click', () => onRemove(resource));
          actionsCell.appendChild(removeButton);
        }

        row.appendChild(actionsCell);
        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      body.appendChild(table);
    }

    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'resource-panel__footer';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = '+ Añadir recurso';
    addButton.addEventListener('click', () => {
      if (onAdd) onAdd();
    });
    footer.appendChild(addButton);

    panel.appendChild(footer);
  }

  attachResizeHandle(panel, {
    axis: 'x',
    getSize: () => ({ width: container.getBoundingClientRect().width, height: 0 }),
    clamp: ({ width }) => {
      const parentWidth = container.offsetParent ? container.offsetParent.clientWidth : window.innerWidth;
      const maxByViewport = Math.min(MAX_PANEL_WIDTH, window.innerWidth / 2);
      const maxByRightEdge = parentWidth - container.offsetLeft;
      return { width: Math.min(Math.max(width, MIN_PANEL_WIDTH), maxByViewport, maxByRightEdge) };
    },
    onResize: ({ width }) => {
      container.style.width = `${width}px`;
    },
    onResizeEnd: ({ width }) => {
      container.style.width = `${width}px`;
      if (onPanelResize) onPanelResize(width);
    },
  });

  container.appendChild(panel);
}
