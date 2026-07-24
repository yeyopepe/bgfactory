// Panel flotante y colapsable con el listado de componentes, usado en modo edición.
// Tabla de tres columnas (Id, Tipo, Acciones) con selección de fila.

import { attachResizeHandle } from './resizeHandle.js';
import { attachColumnResizing } from './tableColumnResize.js';

const MIN_PANEL_WIDTH = 290;
const COMPONENT_LIST_COLUMNS = ['orden', 'id', 'tipo', 'acciones'];

// Estado del cuadro de filtro. El panel de componentes es único en la
// página, así que basta con estado de módulo para que sobreviva a los
// re-renders provocados por cambios en la lista de componentes, y se
// resetea solo al recargar la página. Análogo a resourceList.js.
let filterText = '';

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesFilter(component, query) {
  const normalizedQuery = normalize(query);
  return (
    normalize(component.id).includes(normalizedQuery) ||
    normalize(component.type).includes(normalizedQuery)
  );
}

function renderBody(body, displayedComponents, total, { onEdit, onClone, onRemove, onSelectRow, onReorder, selectedId, columnWidths, onColumnResize } = {}) {
  body.innerHTML = '';

  if (displayedComponents.length === 0) {
    const empty = document.createElement('p');
    if (filterText.trim() === '') {
      empty.className = 'component-list__empty';
      empty.textContent = 'No hay componentes todavía.';
    } else {
      empty.className = 'component-list__empty-filter';
      empty.textContent = `No hay componentes que coincidan con «${filterText}».`;
    }
    body.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'component-list';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headLabels = { orden: 'Orden', id: 'Id', tipo: 'Tipo', acciones: 'Acciones' };
  for (const key of COMPONENT_LIST_COLUMNS) {
    const th = document.createElement('th');
    th.dataset.col = key;
    th.textContent = headLabels[key];
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const component of displayedComponents) {
    const row = document.createElement('tr');
    row.className = 'component-list__row';
    if (component.id === selectedId) {
      row.classList.add('component-list__row--selected');
    }

    const orderCell = document.createElement('td');
    orderCell.className = 'component-list__order-cell';
    const orderInput = document.createElement('input');
    orderInput.type = 'number';
    orderInput.className = 'component-list__order-input';
    orderInput.min = 1;
    orderInput.max = total;
    orderInput.value = component.order;
    orderInput.addEventListener('click', (event) => event.stopPropagation());
    orderInput.addEventListener('input', () => {
      const sanitized = orderInput.value.replace(/\D+/g, '');
      if (sanitized !== orderInput.value) {
        orderInput.value = sanitized;
      }
    });
    orderInput.addEventListener('change', () => {
      if (orderInput.value === '') {
        orderInput.value = component.order;
        return;
      }
      const parsed = Math.min(Math.max(parseInt(orderInput.value, 10), 1), total);
      orderInput.value = parsed;
      if (onReorder) onReorder(component, parsed);
    });
    orderCell.appendChild(orderInput);
    row.appendChild(orderCell);

    const idCell = document.createElement('td');
    idCell.className = 'component-list__id-cell';
    idCell.textContent = component.id;
    row.appendChild(idCell);

    const typeCell = document.createElement('td');
    typeCell.textContent = component.type;
    row.appendChild(typeCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'component-list__actions-cell';

    if (onEdit) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'component-list__action-btn';
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onEdit(component);
      });
      actionsCell.appendChild(editButton);
    }

    if (onClone) {
      const cloneButton = document.createElement('button');
      cloneButton.type = 'button';
      cloneButton.className = 'component-list__action-btn';
      cloneButton.textContent = 'Clonar';
      cloneButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onClone(component);
      });
      actionsCell.appendChild(cloneButton);
    }

    if (onRemove) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'component-list__action-btn component-list__action-btn--danger';
      removeButton.textContent = 'Eliminar';
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (confirm(`¿Eliminar el componente "${component.id}"?`)) {
          onRemove(component);
        }
      });
      actionsCell.appendChild(removeButton);
    }

    row.appendChild(actionsCell);

    if (onSelectRow) {
      row.addEventListener('click', () => onSelectRow(component));
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  body.appendChild(table);

  if (onColumnResize) {
    attachColumnResizing(table, COMPONENT_LIST_COLUMNS, columnWidths, onColumnResize);
  }
}

export function renderComponentList(
  container,
  components,
  {
    onEdit,
    onClone,
    onRemove,
    onSelectRow,
    onAdd,
    onReorder,
    selectedId = null,
    collapsed = false,
    onToggleCollapse,
    onPanelMove,
    onPanelResize,
    columnWidths = null,
    onColumnResize,
  } = {}
) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'component-panel';

  const header = document.createElement('div');
  header.className = 'component-panel__header';

  const title = document.createElement('strong');
  title.textContent = `Componentes (${components.length})`;
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
    const sortedComponents = [...components].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const rowHandlers = { onEdit, onClone, onRemove, onSelectRow, onReorder, selectedId, columnWidths, onColumnResize };

    if (components.length > 0) {
      const filterBar = document.createElement('div');
      filterBar.className = 'component-panel__filter';

      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = 'Filtrar componentes…';
      filterInput.value = filterText;
      filterInput.addEventListener('input', () => {
        filterText = filterInput.value;
        const filtered = sortedComponents.filter((c) => matchesFilter(c, filterText));
        title.textContent = `Componentes (${filtered.length})`;
        renderBody(body, filtered, components.length, rowHandlers);
      });
      filterBar.appendChild(filterInput);

      panel.appendChild(filterBar);
    } else {
      filterText = '';
    }

    const body = document.createElement('div');
    body.className = 'component-panel__body';
    const displayedComponents = sortedComponents.filter((c) => matchesFilter(c, filterText));
    title.textContent = `Componentes (${displayedComponents.length})`;
    renderBody(body, displayedComponents, components.length, rowHandlers);
    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'component-panel__footer';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = '+ Añadir componente';
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
      const maxByRightEdge = parentWidth - container.offsetLeft;
      return { width: Math.min(Math.max(width, MIN_PANEL_WIDTH), maxByRightEdge) };
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
