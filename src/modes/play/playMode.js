// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents, replaceComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);
  renderComponentsOnTable(table.worldEl, getComponents(), {
    onMove: (component, x, y) => {
      replaceComponent(component.id, updateComponent(component, { x, y }));
    },
    canMove: (component) => component.moverEnModoJuego === true,
  });
}
