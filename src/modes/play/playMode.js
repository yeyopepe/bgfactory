// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents, replaceComponent, reorderComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openDiceResultModal } from '../../ui/diceResultModal.js';

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);
  renderComponentsOnTable(table.worldEl, getComponents(), {
    identifyMode: 'tooltip',
    liftOnDrag: true,
    onMove: (component, x, y) => {
      replaceComponent(component.id, updateComponent(component, { x, y }));
      if (component.subirAlMoverInteractuar) reorderComponent(component.id, 1);
    },
    canMove: (component) => component.bloqueado !== true,
    onDiceResult: (component, resultado) => {
      replaceComponent(component.id, updateComponent(component, {
        properties: { resultadoActual: resultado },
      }));
      if (component.subirAlMoverInteractuar) reorderComponent(component.id, 1);
    },
    onDiceOpenResult: (component) => {
      openDiceResultModal({ resultado: component.properties.resultadoActual });
    },
    onCartaFlip: (component, nuevaCara) => {
      replaceComponent(component.id, updateComponent(component, { properties: { caraActual: nuevaCara } }));
      if (component.subirAlMoverInteractuar) reorderComponent(component.id, 1);
    },
  });
}
