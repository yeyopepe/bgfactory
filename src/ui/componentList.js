// Panel flotante y colapsable con el listado de componentes, usado en modo edición.
// Tabla de tres columnas (Id, Tipo, Acciones) con selección de fila.

import { attachResizeHandle } from './resizeHandle.js';
import { attachColumnResizing } from './tableColumnResize.js';
import { attachColumnMenu } from './tableColumnMenu.js';
import { compareValues } from '../core/textSort.js';
import { t } from '../core/i18n.js';
import { getComponentTypeLabel } from './componentTypeModal.js';

// Nombre de tipo traducido al idioma activo, usado tanto en las celdas de la
// columna "Tipo" como en las opciones de su filtro. `getComponentTypeLabel`
// devuelve el valor tal cual si no es un tipo conocido, lo que cubre las filas
// sintéticas de grupo (cuyo `type` ya viene traducido vía
// `componentList.groupRowType`).
function formatTypeLabel(value) {
  return getComponentTypeLabel(value);
}

const MIN_PANEL_WIDTH = 290;
const MIN_PANEL_BODY_HEIGHT = 96;
const COMPONENT_LIST_COLUMNS = ['orden', 'id', 'tipo', 'copia', 'acciones'];

// Columnas interactivas del menú de cabecera: todas menos "Acciones".
// "Orden" no filtra (edición inline por posición, filtrar no aporta valor).
const COMPONENT_LIST_COLUMN_DEFS = [
  { key: 'orden', filterable: false, getValue: (c) => c.order },
  { key: 'id', filterable: true, getValue: (c) => c.id },
  { key: 'tipo', filterable: true, getValue: (c) => c.type, formatFilterLabel: formatTypeLabel },
  { key: 'copia', filterable: true, getValue: (c) => (c.copyOf ? t('common.yes') : t('common.no')) },
];
const COMPONENT_LIST_COLUMN_DEFS_BY_KEY = Object.fromEntries(COMPONENT_LIST_COLUMN_DEFS.map((d) => [d.key, d]));

// Estado del cuadro de filtro. El panel de componentes es único en la
// página, así que basta con estado de módulo para que sobreviva a los
// re-renders provocados por cambios en la lista de componentes, y se
// resetea solo al recargar la página. Análogo a resourceList.js.
let filterText = '';

// Mismo criterio de estado transitorio que `filterText`: una única
// ordenación activa a la vez, filtros por columna acumulables (AND) entre sí
// y con `filterText`.
let columnSort = null; // { column: string, direction: 'asc' | 'desc' } | null
let columnFilters = {}; // { [column]: string }

function matchesColumnFilters(component) {
  return Object.entries(columnFilters).every(([key, value]) => {
    const def = COMPONENT_LIST_COLUMN_DEFS_BY_KEY[key];
    return String(def.getValue(component)) === value;
  });
}

// Filas sintéticas de grupo: una por cada `groupId` con 2+ miembros, derivadas
// en tiempo de render a partir de `component.groupId` — no son una colección
// persistida aparte (a diferencia de "Etiquetas"). Participan en filtro/orden
// de columna igual que un componente ("id" = groupId, "tipo" = "Grupo",
// "copia" sin valor propio, "orden" = el mínimo de sus miembros) fusionándose
// con la lista real. `__members` son los componentes reales del grupo, ya
// ordenados ascendente por su propio `order` — ese orden relativo entre
// miembros de un mismo grupo nunca lo altera ningún criterio de columna.
function buildGroupRows(components) {
  const membersByGroup = new Map();
  for (const c of components) {
    if (c.groupId == null) continue;
    if (!membersByGroup.has(c.groupId)) membersByGroup.set(c.groupId, []);
    membersByGroup.get(c.groupId).push(c);
  }
  return [...membersByGroup.entries()]
    .filter(([, members]) => members.length >= 2)
    .map(([groupId, members]) => {
      const sortedMembers = [...members].sort((a, b) => a.order - b.order);
      return {
        id: groupId,
        type: t('componentList.groupRowType'),
        order: sortedMembers[0].order,
        copyOf: null,
        __isGroupRow: true,
        __members: sortedMembers,
      };
    });
}

// ¿El grupo (fila propia) o alguno de sus miembros coincide con el filtro de
// texto/columna activo? Un grupo se muestra si cualquiera de los dos coincide
// — igual que un explorador de ficheros mostrando la carpeta entera si algo
// dentro coincide con la búsqueda.
function groupOrAnyMemberMatches(groupRow) {
  if (matchesFilter(groupRow, filterText) && matchesColumnFilters(groupRow)) return true;
  return groupRow.__members.some((m) => matchesFilter(m, filterText) && matchesColumnFilters(m));
}

// Construye la lista a renderizar como bloques contiguos: cada grupo (con sus
// miembros ya resueltos) o componente suelto cuenta como "nivel superior" a
// efectos de orden/filtro de columna; los miembros de un mismo grupo se
// insertan siempre justo debajo de su fila de grupo, nunca intercalados con
// otros bloques, y entre ellos se ordenan siempre por su propio `order`
// ascendente (nunca por el criterio de columna activo). Con un filtro activo,
// el grupo se muestra si él o algún miembro coincide, pero debajo solo
// aparecen los miembros que coinciden individualmente.
function computeDisplayedList(components) {
  const groupRows = buildGroupRows(components);
  const looseComponents = components.filter((c) => c.groupId == null);
  let topLevel = [...looseComponents, ...groupRows];

  if (columnSort) {
    const def = COMPONENT_LIST_COLUMN_DEFS_BY_KEY[columnSort.column];
    const sign = columnSort.direction === 'asc' ? 1 : -1;
    topLevel = [...topLevel].sort((a, b) => sign * compareValues(def.getValue(a), def.getValue(b)));
  } else {
    topLevel = [...topLevel].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const list = [];
  for (const row of topLevel) {
    if (row.__isGroupRow) {
      if (!groupOrAnyMemberMatches(row)) continue;
      list.push(row);
      for (const member of row.__members) {
        if (matchesFilter(member, filterText) && matchesColumnFilters(member)) list.push(member);
      }
    } else if (matchesFilter(row, filterText) && matchesColumnFilters(row)) {
      list.push(row);
    }
  }
  return list;
}

// Última selección conocida (mismo criterio de estado de módulo que `filterText`),
// usada para detectar qué id se acaba de seleccionar y hacer scroll hasta su fila.
let lastSelectedIds = new Set();

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

function renderBody(body, displayedComponents, total, { onEdit, onEditGroup, onClone, onCopy, onRemove, onUngroup, onSelectRow, onReorder, onReorderGroup, selectedIds = new Set(), columnWidths, onColumnResize, allComponents = [], onColumnSortChange, onColumnFilterChange } = {}) {
  body.innerHTML = '';

  const hasActiveFilter = filterText.trim() !== '' || Object.keys(columnFilters).length > 0;

  const table = document.createElement('table');
  table.className = 'component-list';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headLabels = {
    orden: t('componentList.col.orden'),
    id: t('componentList.col.id'),
    tipo: t('componentList.col.tipo'),
    copia: t('componentList.col.copia'),
    acciones: t('common.actions'),
  };
  for (const key of COMPONENT_LIST_COLUMNS) {
    const th = document.createElement('th');
    th.dataset.col = key;
    th.textContent = headLabels[key];
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // Cabecera siempre visible, incluso sin filas: permite abrir el menú de
  // columna para quitar un filtro que haya dejado la lista vacía.
  if (displayedComponents.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = COMPONENT_LIST_COLUMNS.length;
    if (!hasActiveFilter) {
      emptyCell.className = 'component-list__empty';
      emptyCell.textContent = t('componentList.empty');
    } else {
      emptyCell.className = 'component-list__empty-filter';
      emptyCell.textContent = t('componentList.emptyFilter', { filter: filterText });
    }
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  }

  for (const component of displayedComponents) {
    if (component.__isGroupRow) {
      const row = document.createElement('tr');
      row.className = 'component-list__row component-list__row--group';
      row.dataset.id = component.id;
      if (component.__members.every((m) => selectedIds.has(m.id))) {
        row.classList.add('component-list__row--selected');
      }

      const orderCell = document.createElement('td');
      orderCell.className = 'component-list__order-cell';
      const groupOrderInput = document.createElement('input');
      groupOrderInput.type = 'number';
      groupOrderInput.className = 'component-list__order-input';
      groupOrderInput.min = 1;
      groupOrderInput.max = total;
      groupOrderInput.value = component.order;
      groupOrderInput.addEventListener('click', (event) => event.stopPropagation());
      groupOrderInput.addEventListener('input', () => {
        const sanitized = groupOrderInput.value.replace(/\D+/g, '');
        if (sanitized !== groupOrderInput.value) {
          groupOrderInput.value = sanitized;
        }
      });
      groupOrderInput.addEventListener('change', () => {
        if (groupOrderInput.value === '') {
          groupOrderInput.value = component.order;
          return;
        }
        const parsed = Math.min(Math.max(parseInt(groupOrderInput.value, 10), 1), total);
        groupOrderInput.value = parsed;
        if (onReorderGroup) onReorderGroup(component.id, component.__members.map((m) => m.id), parsed);
      });
      orderCell.appendChild(groupOrderInput);
      row.appendChild(orderCell);

      const idCell = document.createElement('td');
      idCell.className = 'component-list__id-cell';
      idCell.textContent = component.id;
      row.appendChild(idCell);

      const typeCell = document.createElement('td');
      typeCell.textContent = formatTypeLabel(component.type);
      row.appendChild(typeCell);

      const copyCell = document.createElement('td');
      copyCell.className = 'component-list__copy-cell';
      row.appendChild(copyCell);

      const actionsCell = document.createElement('td');
      actionsCell.className = 'component-list__actions-cell';
      if (onEditGroup) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'component-list__action-btn';
        editButton.textContent = t('common.edit');
        editButton.addEventListener('click', (event) => {
          event.stopPropagation();
          onEditGroup(component.id);
        });
        actionsCell.appendChild(editButton);
      }
      if (onUngroup) {
        const ungroupButton = document.createElement('button');
        ungroupButton.type = 'button';
        ungroupButton.className = 'component-list__action-btn';
        ungroupButton.textContent = t('componentList.ungroup');
        ungroupButton.addEventListener('click', (event) => {
          event.stopPropagation();
          onUngroup(component.__members.map((m) => m.id));
        });
        actionsCell.appendChild(ungroupButton);
      }
      row.appendChild(actionsCell);

      if (onSelectRow) {
        row.addEventListener('click', (event) => {
          onSelectRow(component.__members[0], event);
        });
      }

      tbody.appendChild(row);
      continue;
    }

    const isGroupMember = component.groupId != null;
    const row = document.createElement('tr');
    row.className = isGroupMember ? 'component-list__row component-list__row--member' : 'component-list__row';
    row.dataset.id = component.id;
    if (selectedIds.has(component.id)) {
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
    orderInput.disabled = isGroupMember;
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
    typeCell.textContent = formatTypeLabel(component.type);
    row.appendChild(typeCell);

    const copyCell = document.createElement('td');
    copyCell.className = 'component-list__copy-cell';
    copyCell.textContent = component.copyOf ? '✓' : '';
    row.appendChild(copyCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'component-list__actions-cell';

    if (onEdit) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'component-list__action-btn';
      editButton.textContent = t('common.edit');
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onEdit(component);
      });
      actionsCell.appendChild(editButton);
    }

    if (onClone && !component.copyOf) {
      const cloneButton = document.createElement('button');
      cloneButton.type = 'button';
      cloneButton.className = 'component-list__action-btn';
      cloneButton.textContent = t('contextMenu.clone');
      cloneButton.disabled = component.groupId != null;
      cloneButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onClone(component);
      });
      actionsCell.appendChild(cloneButton);
    }

    if (onCopy && !component.copyOf) {
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'component-list__action-btn';
      copyButton.textContent = t('contextMenu.copy');
      copyButton.disabled = component.groupId != null;
      copyButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onCopy(component);
      });
      actionsCell.appendChild(copyButton);
    }

    if (onRemove) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'component-list__action-btn component-list__action-btn--danger';
      removeButton.textContent = t('common.delete');
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (selectedIds.size > 1 && selectedIds.has(component.id)) {
          onRemove(component, { bulk: true });
          return;
        }
        if (confirm(t('confirm.deleteComponent', { id: component.id }))) {
          onRemove(component);
        }
      });
      actionsCell.appendChild(removeButton);
    }

    row.appendChild(actionsCell);

    if (onSelectRow) {
      row.addEventListener('click', (event) => onSelectRow(component, event));
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  body.appendChild(table);

  if (onColumnResize) {
    attachColumnResizing(table, COMPONENT_LIST_COLUMNS, columnWidths, onColumnResize);
  }

  if (onColumnSortChange && onColumnFilterChange) {
    attachColumnMenu(table, COMPONENT_LIST_COLUMN_DEFS, allComponents, {
      sortState: columnSort,
      filterState: columnFilters,
      onToggleSort: onColumnSortChange,
      onSelectFilter: onColumnFilterChange,
    });
  }
}

export function renderComponentList(
  container,
  components,
  {
    onEdit,
    onEditGroup,
    onClone,
    onCopy,
    onRemove,
    onUngroup,
    onSelectRow,
    onAdd,
    onReorder,
    onReorderGroup,
    selectedIds = new Set(),
    collapsed = false,
    onToggleCollapse,
    onPanelMove,
    onPanelResize,
    columnWidths = null,
    onColumnResize,
    bodyHeight = null,
  } = {}
) {
  const previousBody = container.querySelector('.component-panel__body');
  const previousScrollTop = previousBody ? previousBody.scrollTop : 0;
  const newlySelectedId = [...selectedIds].find((id) => !lastSelectedIds.has(id));

  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'component-panel';
  let body;

  const header = document.createElement('div');
  header.className = 'component-panel__header';

  const title = document.createElement('strong');
  title.textContent = t('componentList.title', { count: components.length });
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
    const rowHandlers = {
      onEdit, onEditGroup, onClone, onCopy, onRemove, onUngroup, onSelectRow, onReorder, onReorderGroup, selectedIds, columnWidths, onColumnResize,
      allComponents: [...components, ...buildGroupRows(components)],
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
      const displayed = computeDisplayedList(components);
      title.textContent = t('componentList.title', { count: displayed.filter((r) => !r.__isGroupRow).length });
      renderBody(body, displayed, components.length, rowHandlers);
    }

    if (components.length > 0) {
      const filterBar = document.createElement('div');
      filterBar.className = 'component-panel__filter';

      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = t('componentList.filterPlaceholder');
      filterInput.value = filterText;
      filterInput.addEventListener('input', () => {
        filterText = filterInput.value;
        rerenderBody();
        updateClearBtnState();
      });
      filterBar.appendChild(filterInput);

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'component-panel__filter-clear';
      clearBtn.title = t('common.clearSearch');
      clearBtn.setAttribute('aria-label', t('common.clearSearch'));
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
    body.className = 'component-panel__body';
    if (bodyHeight != null) {
      body.style.height = `${bodyHeight}px`;
    }
    rerenderBody();
    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'component-panel__footer';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = t('componentList.add');
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

  // Tirador superior izquierdo: ancla la esquina inferior derecha del panel,
  // así que además de tamaño hay que desplazar left/top. tlStart captura
  // posición/tamaño de partida en getSize (llamada una vez por arrastre).
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

  // Restaurar/ajustar el scroll aquí, no antes: hasta este appendChild, `body`
  // es un nodo desconectado del documento sin layout — asignarle `scrollTop`
  // o llamar a `scrollIntoView` ahí no tiene ningún efecto (el navegador no
  // puede calcular overflow de un elemento sin caja de layout).
  if (body) {
    body.scrollTop = previousScrollTop;
    if (newlySelectedId) {
      const selectedRow = body.querySelector(`[data-id="${CSS.escape(newlySelectedId)}"]`);
      if (selectedRow) selectedRow.scrollIntoView({ block: 'nearest' });
    }
  }

  lastSelectedIds = new Set(selectedIds);
}
