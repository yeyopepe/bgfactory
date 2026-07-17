// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents } from '../../core/state.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);
  renderComponentsOnTable(table.worldEl, getComponents());
}
