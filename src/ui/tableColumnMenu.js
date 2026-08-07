// Ordenación/filtrado por columna de una tabla, reutilizado por
// ui/componentList.js, ui/resourceList.js y ui/tagList.js. Al pulsar el
// nombre de una columna abre ui/columnHeaderMenu.js con las opciones de
// ordenar/filtrar esa columna. Cualquier cabecera interactiva muestra siempre
// un pequeño indicador junto a su texto: tenue por defecto, destacado si
// tiene orden y/o filtro aplicados.

import { openColumnHeaderMenu } from './columnHeaderMenu.js';
import { compareValues } from '../core/textSort.js';

function buildIndicator(active) {
  const span = document.createElement('span');
  span.className = 'column-header-menu__indicator';
  if (active) span.classList.add('column-header-menu__indicator--active');
  span.title = active ? 'Columna con orden y/o filtro activos' : 'Columna ordenable/filtrable';
  span.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5L2 3z"/></svg>';
  return span;
}

// `table` debe estar ya insertado en el DOM, con `<th data-col="clave">` por columna.
// `columnDefs`: `{ key, filterable, getValue(item) }[]` — una entrada por columna interactiva
// (todas menos "Acciones"; columnas no filtrables como "Orden" llevan `filterable: false`).
// `items`: lista completa sin filtrar, usada para calcular los valores distintos del combo.
// `sortState`: `{ column, direction } | null`, la ordenación activa ahora mismo en esta tabla.
// `filterState`: `{ [column]: string }`, los filtros de columna activos ahora mismo.
// `onToggleSort(column, direction)` / `onSelectFilter(column, value)`: la tabla llamante decide
// la semántica de exclusividad/apagado y de acumulación de filtros, y vuelve a pintar tras aplicar.
export function attachColumnMenu(table, columnDefs, items, { sortState, filterState, onToggleSort, onSelectFilter } = {}) {
  for (const columnDef of columnDefs) {
    const { key, filterable, getValue } = columnDef;
    const th = table.querySelector(`th[data-col="${key}"]`);
    if (!th) continue;

    const isActive = sortState?.column === key || filterState?.[key] != null;
    th.appendChild(buildIndicator(isActive));

    th.classList.add('column-header--interactive');
    th.addEventListener('click', (event) => {
      if (event.target.closest('.column-resize-handle')) return;

      let filterValues = [];
      if (filterable) {
        const distinct = new Set(items.map((item) => String(getValue(item))));
        filterValues = [...distinct].sort(compareValues);
      }

      openColumnHeaderMenu({
        anchorEl: th,
        sortDirection: sortState?.column === key ? sortState.direction : null,
        filterable,
        filterValues,
        activeFilterValue: filterState?.[key] ?? null,
        onToggleSort: (direction) => onToggleSort(key, direction),
        onSelectFilter: (value) => onSelectFilter(key, value),
      });
    });
  }
}
