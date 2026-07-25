// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents, replaceComponent, reorderComponent } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable } from '../../ui/componentRenderer.js';
import { openDiceResultModal } from '../../ui/diceResultModal.js';
import { openContextMenu } from '../../ui/contextMenu.js';

// Selección del menú contextual de modo juego (cambio 00088), estado transitorio de
// la sesión de juego en curso: `renderPlayMode` se vuelve a invocar por completo
// (desde main.js) ante cualquier `components:changed`, así que este estado vive
// fuera de la función para no perderse cada vez que se mueve/bloquea/lanza un
// componente cualquiera — mismo criterio que `selectedComponentId` de
// `modes/edit/editMode.js`. No hay ningún otro concepto de selección en modo
// juego más allá de este, ligado siempre al menú contextual abierto.
let selectedComponentId = null;

function createLockIcon(open) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  body.setAttribute('x', '5');
  body.setAttribute('y', '11');
  body.setAttribute('width', '14');
  body.setAttribute('height', '9');
  body.setAttribute('rx', '1.5');
  svg.appendChild(body);
  const shackle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shackle.setAttribute('stroke-linecap', 'round');
  shackle.setAttribute('d', open ? 'M8 11V7a4 4 0 0 1 7.5-1.9' : 'M8 11V7a4 4 0 0 1 8 0v4');
  svg.appendChild(shackle);
  return svg;
}

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);

  function renderTable() {
    renderComponentsOnTable(table.worldEl, getComponents(), {
      identifyMode: 'tooltip',
      liftOnDrag: true,
      selectedId: selectedComponentId,
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
      onContextMenu: (component, event) => {
        selectedComponentId = component.id;
        renderTable();

        const bloqueado = component.bloqueado === true;
        openContextMenu({
          x: event.clientX,
          y: event.clientY,
          generalItems: [
            {
              icon: createLockIcon(bloqueado),
              label: bloqueado ? 'Desbloquear' : 'Bloquear',
              onClick: () => {
                replaceComponent(component.id, updateComponent(component, { bloqueado: !bloqueado }));
              },
            },
          ],
          onClose: () => {
            selectedComponentId = null;
            renderTable();
          },
        });
      },
    });
  }

  renderTable();
}
