// Menú desplegable de ordenación/filtrado de columna de tabla, reutilizado por paneles flotantes
// de modo edición (Componentes, Recursos, Grupos) vía ui/tableColumnMenu.js. Hermano de ui/contextMenu.js
// en mecánica (singleton de módulo, `position: fixed` en document.body, cierre por click fuera o Esc,
// reajuste tras insertarse para no salirse de ventana). `position: fixed` es necesario porque el `<th>`
// que ancla el menú vive dentro de contenedor con overflow (`.component-panel__body` y análogos), que
// recortaría un `position: absolute` — a diferencia de `.resource-add__menu`
// (design/docs/style/03-modales-menus.md), que
// sí puede ser `absolute` al no estar dentro de overflow.
// Contenido propio, no reutiliza DOM de contextMenu.js: dos filas de ordenación tipo toggle y,
// si la columna es filtrable, un <select> con los valores distintos de esa columna.

let currentMenu = null;

function closeCurrentMenu() {
  if (!currentMenu) return;
  const { el, handleOutsideClick, handleKeydown } = currentMenu;
  document.removeEventListener('mousedown', handleOutsideClick);
  document.removeEventListener('keydown', handleKeydown);
  el.remove();
  currentMenu = null;
}

function addSortItem(menu, { label, active, onClick }) {
  const item = document.createElement('div');
  item.className = 'column-header-menu__item';
  if (active) item.classList.add('column-header-menu__item--active');
  item.textContent = label;
  item.addEventListener('click', () => {
    closeCurrentMenu();
    onClick();
  });
  menu.appendChild(item);
}

// `anchorEl`: <th> pulsado, solo para posición inicial (getBoundingClientRect) — menú no queda anclado en el DOM.
// `sortDirection`: 'asc' | 'desc' | null, ordenación activa en esta columna.
// `filterable`: si la columna ofrece bloque "Filtrar" (falso para "Orden" en Componentes).
// `filterValues`: string[] deduplicados/ordenados, valores distintos de la columna.
// `activeFilterValue`: valor de filtro activo, o null si ninguno ("Todos").
// `onToggleSort(direction)`: 'asc' | 'desc' pulsado — exclusividad/apagado los decide quien invoca.
// `onSelectFilter(value)`: valor elegido, o null si se elige "Todos".
export function openColumnHeaderMenu({
  anchorEl,
  sortDirection = null,
  filterable = false,
  filterValues = [],
  activeFilterValue = null,
  onToggleSort,
  onSelectFilter,
} = {}) {
  closeCurrentMenu();

  const menu = document.createElement('div');
  menu.className = 'column-header-menu';

  addSortItem(menu, {
    label: 'Ordenar A..Z',
    active: sortDirection === 'asc',
    onClick: () => onToggleSort('asc'),
  });
  addSortItem(menu, {
    label: 'Ordenar Z..A',
    active: sortDirection === 'desc',
    onClick: () => onToggleSort('desc'),
  });

  if (filterable) {
    const separator = document.createElement('div');
    separator.className = 'column-header-menu__separator';
    menu.appendChild(separator);

    const filterBlock = document.createElement('div');
    filterBlock.className = 'column-header-menu__filter';

    const label = document.createElement('div');
    label.className = 'column-header-menu__filter-label';
    label.textContent = 'Filtrar';
    filterBlock.appendChild(label);

    const select = document.createElement('select');
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Todos';
    select.appendChild(allOption);
    for (const value of filterValues) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
    select.value = activeFilterValue ?? '';
    select.addEventListener('click', (e) => e.stopPropagation());
    select.addEventListener('change', () => {
      closeCurrentMenu();
      onSelectFilter(select.value === '' ? null : select.value);
    });
    filterBlock.appendChild(select);

    menu.appendChild(filterBlock);
  }

  document.body.appendChild(menu);

  const anchorRect = anchorEl.getBoundingClientRect();
  const rect = menu.getBoundingClientRect();
  const maxLeft = window.innerWidth - rect.width;
  const maxTop = window.innerHeight - rect.height;
  menu.style.left = `${Math.max(0, Math.min(anchorRect.left, maxLeft))}px`;
  menu.style.top = `${Math.max(0, Math.min(anchorRect.bottom, maxTop))}px`;

  function handleOutsideClick(e) {
    if (!menu.contains(e.target)) closeCurrentMenu();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') closeCurrentMenu();
  }

  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('keydown', handleKeydown);

  currentMenu = { el: menu, handleOutsideClick, handleKeydown };
}
