// Panel flotante y colapsable con el listado de recursos (imágenes y
// tipografías), usado en modo edición. Análogo a componentList.js.

import { attachResizeHandle } from './resizeHandle.js';
import { attachColumnResizing } from './tableColumnResize.js';
import { RESOURCE_TYPES, getComponentsUsingResource } from '../core/resource.js';
import { sortByName } from '../core/textSort.js';

const MIN_PANEL_WIDTH = 290;
const MIN_PANEL_BODY_HEIGHT = 96;
const RESOURCE_LIST_COLUMNS = ['nombre', 'usos', 'tipo', 'acciones'];

const TYPE_LABELS = {
  [RESOURCE_TYPES.IMAGE]: 'Imagen',
  [RESOURCE_TYPES.FONT]: 'Tipografía',
};

// Estado del cuadro de filtro. El panel de recursos es único en la página,
// así que basta con estado de módulo para que sobreviva a los re-renders
// provocados por cambios en la lista de recursos, y se resetea solo al
// recargar la página.
let filterText = '';

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesFilter(resource, query) {
  const normalizedQuery = normalize(query);
  const typeLabel = TYPE_LABELS[resource.type] ?? resource.type;
  return (
    normalize(resource.name).includes(normalizedQuery) ||
    normalize(typeLabel).includes(normalizedQuery) ||
    normalize(resource.id).includes(normalizedQuery)
  );
}

function renderBody(body, resources, { onEdit, onRemove, columnWidths, onColumnResize, components = [] } = {}) {
  body.innerHTML = '';
  resources = sortByName(resources);

  if (resources.length === 0) {
    const empty = document.createElement('p');
    if (filterText.trim() === '') {
      empty.className = 'resource-list__empty';
      empty.textContent = 'No hay recursos todavía.';
    } else {
      empty.className = 'resource-list__empty-filter';
      empty.textContent = `No hay recursos que coincidan con «${filterText}».`;
    }
    body.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'resource-list';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headLabels = { nombre: 'Nombre', usos: 'Usos', tipo: 'Tipo', acciones: 'Acciones' };
  for (const key of RESOURCE_LIST_COLUMNS) {
    const th = document.createElement('th');
    th.dataset.col = key;
    th.textContent = headLabels[key];
    if (key === 'usos') th.className = 'resource-list__usos-cell';
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const resource of resources) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = resource.name;
    row.appendChild(nameCell);

    const usosCell = document.createElement('td');
    usosCell.className = 'resource-list__usos-cell';
    usosCell.textContent = String(getComponentsUsingResource(resource.id, components).length);
    row.appendChild(usosCell);

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

  if (onColumnResize) {
    attachColumnResizing(table, RESOURCE_LIST_COLUMNS, columnWidths, onColumnResize);
  }
}

function createAddMenu({ onAddFile, onAddMultiple, onAddFolder }) {
  const wrap = document.createElement('div');
  wrap.className = 'resource-add';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'resource-add__button';
  button.textContent = '+ Añadir recurso ▾';
  wrap.appendChild(button);

  const menu = document.createElement('div');
  menu.className = 'resource-add__menu';
  menu.hidden = true;

  function addItem(label, hint, onClick) {
    const item = document.createElement('div');
    item.className = 'resource-add__item';

    const itemLabel = document.createElement('div');
    itemLabel.className = 'resource-add__item-label';
    itemLabel.textContent = label;
    item.appendChild(itemLabel);

    if (hint) {
      const hintEl = document.createElement('div');
      hintEl.className = 'resource-add__hint';
      hintEl.textContent = hint;
      item.appendChild(hintEl);
    }

    item.addEventListener('click', () => {
      closeMenu();
      if (onClick) onClick();
    });
    menu.appendChild(item);
  }

  addItem('Subir fichero', null, onAddFile);
  addItem('Subir varios ficheros', null, onAddMultiple);
  addItem('Subir carpeta', 'Solo se tiene en cuenta el primer nivel de la carpeta', onAddFolder);

  wrap.appendChild(menu);

  function closeMenu() {
    menu.hidden = true;
    document.removeEventListener('mousedown', handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (!wrap.contains(e.target)) closeMenu();
  }

  button.addEventListener('click', () => {
    if (menu.hidden) {
      menu.hidden = false;
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      closeMenu();
    }
  });

  return wrap;
}

export function renderResourceList(
  container,
  resources,
  {
    onEdit,
    onRemove,
    onAddFile,
    onAddMultiple,
    onAddFolder,
    collapsed = false,
    onToggleCollapse,
    onPanelMove,
    onPanelResize,
    columnWidths = null,
    onColumnResize,
    bodyHeight = null,
    components = [],
  } = {}
) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'resource-panel';
  let body;

  const header = document.createElement('div');
  header.className = 'resource-panel__header';

  const title = document.createElement('strong');
  title.textContent = `Recursos (${resources.length})`;
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
    if (resources.length > 0) {
      const filterBar = document.createElement('div');
      filterBar.className = 'resource-panel__filter';

      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = 'Filtrar recursos…';
      filterInput.value = filterText;
      filterInput.addEventListener('input', () => {
        filterText = filterInput.value;
        const filtered = resources.filter((r) => matchesFilter(r, filterText));
        title.textContent = `Recursos (${filtered.length})`;
        renderBody(body, filtered, { onEdit, onRemove, columnWidths, onColumnResize, components });
      });
      filterBar.appendChild(filterInput);

      panel.appendChild(filterBar);
    } else {
      filterText = '';
    }

    body = document.createElement('div');
    body.className = 'resource-panel__body';
    if (bodyHeight != null) {
      body.style.height = `${bodyHeight}px`;
    }
    const displayedResources = resources.filter((r) => matchesFilter(r, filterText));
    title.textContent = `Recursos (${displayedResources.length})`;
    renderBody(body, displayedResources, { onEdit, onRemove, columnWidths, onColumnResize, components });
    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'resource-panel__footer';
    footer.appendChild(createAddMenu({ onAddFile, onAddMultiple, onAddFolder }));

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
