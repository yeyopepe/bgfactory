// Panel flotante con el listado de grupos, usado en modo edición. Análogo a
// ui/resourceList.js pero simplificado: sin filtro de texto, sin columna
// "Tipo" (los grupos no tienen tipo) y sin clonar.

import { attachResizeHandle } from './resizeHandle.js';
import { getComponentsUsingGroup } from '../core/group.js';

const MIN_PANEL_WIDTH = 290;
const MIN_PANEL_BODY_HEIGHT = 96;

function renderBody(body, groups, components, { onEdit, onRemove } = {}) {
  body.innerHTML = '';

  if (groups.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'group-list__empty';
    empty.textContent = 'No hay grupos todavía.';
    body.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'group-list';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['Nombre', 'Elementos', 'Acciones']) {
    const th = document.createElement('th');
    th.textContent = label;
    if (label === 'Elementos') th.className = 'group-list__count-cell';
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const group of groups) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = group.name;
    row.appendChild(nameCell);

    const countCell = document.createElement('td');
    countCell.className = 'group-list__count-cell';
    countCell.textContent = String(getComponentsUsingGroup(group.id, components).length);
    row.appendChild(countCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'group-list__actions-cell';

    if (onEdit) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'group-list__action-btn';
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', () => onEdit(group));
      actionsCell.appendChild(editButton);
    }

    if (onRemove) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'group-list__action-btn group-list__action-btn--danger';
      removeButton.textContent = 'Eliminar';
      removeButton.addEventListener('click', () => onRemove(group));
      actionsCell.appendChild(removeButton);
    }

    row.appendChild(actionsCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  body.appendChild(table);
}

export function renderGroupList(
  container,
  groups,
  components,
  { onEdit, onRemove, onAdd, collapsed = false, onToggleCollapse, onPanelMove, onPanelResize, bodyHeight = null } = {}
) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'group-panel';
  let body;

  const header = document.createElement('div');
  header.className = 'group-panel__header';

  const title = document.createElement('strong');
  title.textContent = `Grupos (${groups.length})`;
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
    body = document.createElement('div');
    body.className = 'group-panel__body';
    if (bodyHeight != null) {
      body.style.height = `${bodyHeight}px`;
    }
    renderBody(body, groups, components, { onEdit, onRemove });
    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'group-panel__footer';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = '+ Añadir grupo';
    addButton.addEventListener('click', () => {
      if (onAdd) onAdd();
    });
    footer.appendChild(addButton);

    panel.appendChild(footer);
  }

  attachResizeHandle(panel, {
    axis: collapsed ? 'x' : 'both',
    getSize: () => ({
      width: container.getBoundingClientRect().width,
      height: body ? body.getBoundingClientRect().height : 0,
    }),
    clamp: ({ width, height }) => {
      const parentWidth = container.offsetParent ? container.offsetParent.clientWidth : window.innerWidth;
      const maxByRightEdge = parentWidth - container.offsetLeft;
      const clampedWidth = Math.min(Math.max(width, MIN_PANEL_WIDTH), maxByRightEdge);
      if (!body) return { width: clampedWidth, height };
      const parentHeight = container.offsetParent ? container.offsetParent.clientHeight : window.innerHeight;
      const maxByBottomEdge = parentHeight - container.offsetTop;
      const clampedHeight = Math.min(Math.max(height, MIN_PANEL_BODY_HEIGHT), maxByBottomEdge);
      return { width: clampedWidth, height: clampedHeight };
    },
    onResize: ({ width, height }) => {
      container.style.width = `${width}px`;
      if (body) body.style.height = `${height}px`;
    },
    onResizeEnd: ({ width, height }) => {
      container.style.width = `${width}px`;
      if (body) body.style.height = `${height}px`;
      if (onPanelResize) onPanelResize(width, height);
    },
  });

  // Tirador en la esquina superior izquierda (cambio 00128): ancla la esquina
  // inferior derecha del panel, así que además de tamaño hay que desplazar
  // left/top. tlStart captura posición/tamaño de partida en getSize (llamada
  // una única vez por arrastre, misma garantía que usa ui/resizeHandle.js).
  const tlStart = { left: 0, top: 0, width: 0, height: 0 };
  attachResizeHandle(panel, {
    axis: collapsed ? 'x' : 'both',
    corner: 'tl',
    getSize: () => {
      tlStart.left = container.offsetLeft;
      tlStart.top = container.offsetTop;
      tlStart.width = container.getBoundingClientRect().width;
      tlStart.height = body ? body.getBoundingClientRect().height : 0;
      return { width: tlStart.width, height: tlStart.height };
    },
    clamp: ({ width, height }) => {
      const maxWidth = tlStart.width + tlStart.left;
      const clampedWidth = Math.min(Math.max(width, MIN_PANEL_WIDTH), maxWidth);
      if (!body) return { width: clampedWidth, height };
      const maxHeight = tlStart.height + tlStart.top;
      const clampedHeight = Math.min(Math.max(height, MIN_PANEL_BODY_HEIGHT), maxHeight);
      return { width: clampedWidth, height: clampedHeight };
    },
    onResize: ({ width, height, dx, dy }) => {
      container.style.right = 'auto';
      container.style.left = `${tlStart.left + dx}px`;
      container.style.width = `${width}px`;
      if (body) {
        container.style.top = `${tlStart.top + dy}px`;
        body.style.height = `${height}px`;
      }
    },
    onResizeEnd: ({ width, height, dx, dy }) => {
      const newLeft = tlStart.left + dx;
      container.style.right = 'auto';
      container.style.left = `${newLeft}px`;
      container.style.width = `${width}px`;
      let newTop = tlStart.top;
      if (body) {
        newTop = tlStart.top + dy;
        container.style.top = `${newTop}px`;
        body.style.height = `${height}px`;
      }
      if (onPanelResize) onPanelResize(width, height, newLeft, newTop);
    },
  });

  container.appendChild(panel);
}
