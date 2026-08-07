// Panel flotante con listado de grupos, modo edición. Análogo a
// ui/resourceList.js pero sin columna "Tipo" (grupos no tienen tipo) y sin
// clonar. Mismo filtro de texto libre y redimensionado de columna que
// Componentes y Recursos.

import { attachResizeHandle } from './resizeHandle.js';
import { attachColumnResizing } from './tableColumnResize.js';
import { attachColumnMenu } from './tableColumnMenu.js';
import { getComponentsUsingGroup } from '../core/group.js';
import { sortByName, compareValues } from '../core/textSort.js';

const MIN_PANEL_WIDTH = 290;
const MIN_PANEL_BODY_HEIGHT = 96;
const GROUP_LIST_COLUMNS = ['nombre', 'elementos', 'acciones'];

// Columnas interactivas del menú de cabecera: todas menos "Acciones".
function buildGroupListColumnDefs(components) {
  return [
    { key: 'nombre', filterable: true, getValue: (g) => g.name },
    { key: 'elementos', filterable: true, getValue: (g) => getComponentsUsingGroup(g.id, components).length },
  ];
}

// Estado transitorio del filtro/orden/filtro de columna, mismo criterio que
// ui/componentList.js y ui/resourceList.js.
let filterText = '';
let columnSort = null; // { column: string, direction: 'asc' | 'desc' } | null
let columnFilters = {}; // { [column]: string }

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesFilter(group, query) {
  const normalizedQuery = normalize(query);
  return normalize(group.name).includes(normalizedQuery) || normalize(group.id).includes(normalizedQuery);
}

function matchesColumnFilters(group, columnDefsByKey) {
  return Object.entries(columnFilters).every(([key, value]) => {
    const def = columnDefsByKey[key];
    return String(def.getValue(group)) === value;
  });
}

function renderBody(body, groups, components, { onEdit, onRemove, onSelectGroup, columnWidths, onColumnResize, allGroups = [], onColumnSortChange, onColumnFilterChange } = {}) {
  body.innerHTML = '';

  const hasActiveFilter = filterText.trim() !== '' || Object.keys(columnFilters).length > 0;

  const table = document.createElement('table');
  table.className = 'group-list';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headLabels = { nombre: 'Nombre', elementos: 'Elementos', acciones: 'Acciones' };
  for (const key of GROUP_LIST_COLUMNS) {
    const th = document.createElement('th');
    th.dataset.col = key;
    th.textContent = headLabels[key];
    if (key === 'elementos') th.className = 'group-list__count-cell';
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // Cabecera siempre visible aunque no haya filas, ver ui/componentList.js.
  if (groups.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = GROUP_LIST_COLUMNS.length;
    if (!hasActiveFilter) {
      emptyCell.className = 'group-list__empty';
      emptyCell.textContent = 'No hay grupos todavía.';
    } else {
      emptyCell.className = 'group-list__empty-filter';
      emptyCell.textContent = `No hay grupos que coincidan con «${filterText}».`;
    }
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  }

  for (const group of groups) {
    const row = document.createElement('tr');
    row.className = 'group-list__row';
    row.tabIndex = 0;
    if (onSelectGroup) {
      row.addEventListener('click', () => onSelectGroup(group));
    }

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
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onEdit(group);
      });
      actionsCell.appendChild(editButton);
    }

    if (onRemove) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'group-list__action-btn group-list__action-btn--danger';
      removeButton.textContent = 'Eliminar';
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onRemove(group);
      });
      actionsCell.appendChild(removeButton);
    }

    row.appendChild(actionsCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  body.appendChild(table);

  if (onColumnResize) {
    attachColumnResizing(table, GROUP_LIST_COLUMNS, columnWidths, onColumnResize);
  }

  if (onColumnSortChange && onColumnFilterChange) {
    attachColumnMenu(table, buildGroupListColumnDefs(components), allGroups, {
      sortState: columnSort,
      filterState: columnFilters,
      onToggleSort: onColumnSortChange,
      onSelectFilter: onColumnFilterChange,
    });
  }
}

export function renderGroupList(
  container,
  groups,
  components,
  {
    onEdit,
    onRemove,
    onAdd,
    onSelectGroup,
    collapsed = false,
    onToggleCollapse,
    onPanelMove,
    onPanelResize,
    columnWidths = null,
    onColumnResize,
    bodyHeight = null,
  } = {}
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
    const columnDefsByKey = Object.fromEntries(buildGroupListColumnDefs(components).map((d) => [d.key, d]));

    function computeDisplayedGroups() {
      let list = groups.filter((g) => matchesFilter(g, filterText) && matchesColumnFilters(g, columnDefsByKey));
      if (columnSort) {
        const def = columnDefsByKey[columnSort.column];
        const sign = columnSort.direction === 'asc' ? 1 : -1;
        list = [...list].sort((a, b) => sign * compareValues(def.getValue(a), def.getValue(b)));
      } else {
        list = sortByName(list);
      }
      return list;
    }

    const bodyOptions = {
      onEdit, onRemove, onSelectGroup, columnWidths, onColumnResize, allGroups: groups,
      onColumnSortChange: (column, direction) => {
        columnSort = columnSort?.column === column && columnSort.direction === direction ? null : { column, direction };
        rerenderBody();
      },
      onColumnFilterChange: (column, value) => {
        columnFilters = { ...columnFilters };
        if (value == null) delete columnFilters[column];
        else columnFilters[column] = value;
        rerenderBody();
      },
    };

    function rerenderBody() {
      const displayed = computeDisplayedGroups();
      title.textContent = `Grupos (${displayed.length})`;
      renderBody(body, displayed, components, bodyOptions);
    }

    if (groups.length > 0) {
      const filterBar = document.createElement('div');
      filterBar.className = 'group-panel__filter';

      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = 'Filtrar grupos…';
      filterInput.value = filterText;
      filterInput.addEventListener('input', () => {
        filterText = filterInput.value;
        rerenderBody();
        updateClearBtnState();
      });
      filterBar.appendChild(filterInput);

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'group-panel__filter-clear';
      clearBtn.title = 'Limpiar búsqueda';
      clearBtn.setAttribute('aria-label', 'Limpiar búsqueda');
      clearBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 6l12 12" stroke-linecap="round"/>
          <path d="M18 6L6 18" stroke-linecap="round"/>
        </svg>
      `;
      const updateClearBtnState = () => {
        clearBtn.classList.toggle('is-empty', filterInput.value === '');
      };
      clearBtn.addEventListener('click', () => {
        if (filterText === '') return;
        filterText = '';
        filterInput.value = '';
        rerenderBody();
        updateClearBtnState();
      });
      filterBar.appendChild(clearBtn);
      updateClearBtnState();

      panel.appendChild(filterBar);
    } else {
      filterText = '';
      columnSort = null;
      columnFilters = {};
    }

    body = document.createElement('div');
    body.className = 'group-panel__body';
    if (bodyHeight != null) {
      body.style.height = `${bodyHeight}px`;
    }
    rerenderBody();
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

  // Tirador esquina superior izquierda: ancla la esquina inferior derecha del
  // panel, por eso además de tamaño hay que desplazar left/top. tlStart
  // captura posición/tamaño de partida en getSize (llamada una única vez por
  // arrastre, misma garantía que ui/resizeHandle.js).
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
