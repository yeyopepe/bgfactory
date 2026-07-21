// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents, replaceComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openDiceResultModal } from '../../ui/diceResultModal.js';

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);
  renderComponentsOnTable(table.worldEl, getComponents(), {
    identifyMode: 'tooltip',
    onMove: (component, x, y) => {
      replaceComponent(component.id, updateComponent(component, { x, y }));
    },
    canMove: (component) => component.bloqueado !== true,
    onDiceResult: (component, resultado) => {
      replaceComponent(component.id, updateComponent(component, {
        properties: { resultadoActual: resultado },
      }));
    },
    onDiceOpenResult: (component) => {
      openDiceResultModal({ resultado: component.properties.resultadoActual });
    },
    onCartaFlip: (component, nuevaCara) => {
      replaceComponent(component.id, updateComponent(component, { properties: { caraActual: nuevaCara } }));
    },
  });
}
