// Ajuste manual del ancho de columnas de una tabla, reutilizado por
// ui/componentList.js y ui/resourceList.js. Reutiliza el manejador de
// arrastre genérico de ui/resizeHandle.js (axis: 'x') sobre cada <th>, en
// vez de reimplementar la lógica de mousedown/mousemove/mouseup.

import { attachResizeHandle } from './resizeHandle.js';

const MIN_COLUMN_WIDTH = 60;

// `table` debe estar ya insertado en el DOM (se miden anchos reales).
// `columns`: array ordenado de claves, una por cada <th data-col="clave">.
// `widths`: objeto persistido { [columna]: pxNumber } o null/undefined.
// `onChange(newWidths)`: invocado al soltar el arrastre con el objeto completo.
export function attachColumnResizing(table, columns, widths, onChange) {
  const ths = columns.map((key) => table.querySelector(`th[data-col="${key}"]`));

  if (widths) {
    table.style.tableLayout = 'fixed';
    ths.forEach((th, i) => {
      const w = widths[columns[i]];
      if (th && w != null) th.style.width = `${w}px`;
    });
  }

  ths.forEach((th, index) => {
    if (!th) return;

    let workingWidths = null;

    const handle = attachResizeHandle(th, {
      axis: 'x',
      getSize: () => ({ width: th.getBoundingClientRect().width, height: 0 }),
      clamp: ({ width }) => ({ width: Math.max(width, MIN_COLUMN_WIDTH) }),
      onResize: ({ width }) => {
        if (!workingWidths) {
          workingWidths = {};
          columns.forEach((key, i) => {
            workingWidths[key] = ths[i] ? ths[i].getBoundingClientRect().width : null;
          });
          table.style.tableLayout = 'fixed';
          columns.forEach((key, i) => {
            if (ths[i] && workingWidths[key] != null) ths[i].style.width = `${workingWidths[key]}px`;
          });
        }
        workingWidths[columns[index]] = width;
        th.style.width = `${width}px`;
      },
      onResizeEnd: ({ width }) => {
        if (!workingWidths) return;
        workingWidths[columns[index]] = width;
        onChange({ ...workingWidths });
      },
    });
    handle.classList.add('column-resize-handle');
  });
}
