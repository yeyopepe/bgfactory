// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents, replaceComponent, reorderComponent, sacarCartaDeMazo } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable, formatComponentIdentifier } from '../../ui/componentRenderer.js';
import { openDiceResultModal } from '../../ui/diceResultModal.js';
import { openContextMenu } from '../../ui/contextMenu.js';
import { getPosibleValores } from '../../core/dice.js';
import { getCartaIdsEnAlgunMazo, shuffleCartaIds } from '../../core/deck.js';
import { openMazoContentModal } from '../../ui/mazoContentModal.js';
import { openInsertIntoMazoModal } from '../../ui/insertIntoMazoModal.js';
import { isInteractionActive } from '../../core/interactions.js';

// Mapea el `type` de componente a la `key` de `core/interactions.js` cuya interacción
// de click corresponde a la fila "Clic izquierdo" de `interactionsByType`. Solo estos
// tres tipos tienen ahí una fila distinta de "Ninguno".
const CLICK_INTERACTION_KEY_BY_TYPE = {
  dado: 'lanzar',
  carta: 'voltear',
  mazo: 'sacarCarta',
};

// Selección del menú contextual, estado transitorio de la sesión en curso. Vive fuera
// de `renderPlayMode`: `components:changed` remonta todo el modo, así no se pierde al
// mover/bloquear/lanzar un componente. Único concepto de selección en modo juego,
// ligado siempre al menú contextual abierto.
let selectedComponentId = null;

const interactionsByType = {
  'texto': [
    { label: 'Clic izquierdo', value: 'Ninguno' },
    { label: 'Doble clic izquierdo', value: 'Ninguno' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
  'tableroSimple': [
    { label: 'Clic izquierdo', value: 'Ninguno' },
    { label: 'Doble clic izquierdo', value: 'Ninguno' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
  'tableroPersonalizado': [
    { label: 'Clic izquierdo', value: 'Ninguno' },
    { label: 'Doble clic izquierdo', value: 'Ninguno' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
  'documento': [
    { label: 'Clic izquierdo', value: 'Ninguno' },
    { label: 'Doble clic izquierdo', value: 'Ninguno' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
  'dado': [
    { label: 'Clic izquierdo', value: 'Lanzar el dado' },
    { label: 'Doble clic izquierdo', value: 'Ver el resultado en grande' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
  'carta': [
    { label: 'Clic izquierdo', value: 'Voltear la carta' },
    { label: 'Doble clic izquierdo', value: 'Ninguno' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
  'mazo': [
    { label: 'Clic izquierdo', value: 'Sacar la carta de arriba' },
    { label: 'Doble clic izquierdo', value: 'Ninguno' },
    { label: 'Clic derecho', value: 'Abrir este menú' },
  ],
};

// Sustituye el valor de la fila "Clic izquierdo" por "Ninguno" cuando la interacción
// de click de ese componente está desactivada. No muta `interactionsByType`, constante
// de módulo compartida entre renders.
function getInteractionItemsFor(component) {
  const items = interactionsByType[component.type] || [];
  const key = CLICK_INTERACTION_KEY_BY_TYPE[component.type];
  if (!key || isInteractionActive(component, key)) return items;
  return items.map((item, index) => (index === 0 ? { ...item, value: 'Ninguno' } : item));
}

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

function createShuffleIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML =
    '<path d="M4 4h4l6 6 6-6h0" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M4 20h4l6-6 6 6h0" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M17 4h3v3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M17 20h3v-3" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

function createEyeIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML =
    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="12" cy="12" r="3"/>';
  return svg;
}

function createInsertIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.innerHTML =
    '<rect x="4" y="3" width="12" height="16" rx="2"/>' +
    '<path d="M9 21h6a2 2 0 0 0 2-2V9l-6-6H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);

  function renderTable() {
    const cartasEnMazo = getCartaIdsEnAlgunMazo(getComponents());
    renderComponentsOnTable(table.worldEl, getComponents().filter((component) => !component.oculto && !cartasEnMazo.has(component.id)), {
      identifyMode: 'tooltip',
      liftOnDrag: true,
      selectedIds: selectedComponentId ? new Set([selectedComponentId]) : new Set(),
      onMove: (component, x, y) => {
        replaceComponent(component.id, updateComponent(component, { x, y }));
        if (component.subirAlMoverInteractuar) reorderComponent(component.id, 1);
      },
      canMove: (component) => component.bloqueado === 'ninguno',
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
      onMazoDraw: (mazo) => {
        const cartaIds = mazo.properties?.cartaIds || [];
        if (cartaIds.length === 0) return;
        sacarCartaDeMazo(mazo.id, cartaIds[0]);
        if (mazo.subirAlMoverInteractuar) reorderComponent(mazo.id, 1);
      },
      onContextMenu: (component, event) => {
        // Click derecho configurable por componente: con "Ninguno" seleccionado, no
        // hace nada — ni selecciona ni abre el menú.
        if (component.accionClickDerecho === 'ninguno') return;

        selectedComponentId = component.id;
        renderTable();

        const bloqueado = component.bloqueado !== 'ninguno';
        let extra;
        if (component.type === 'dado') {
          extra = `${getPosibleValores(component.properties || {}).length} caras`;
        } else if (component.type === 'tableroSimple' || component.type === 'tableroPersonalizado') {
          extra = `${Math.round(component.width)}x${Math.round(component.height)}`;
        } else if (component.type === 'mazo') {
          extra = `${(component.properties?.cartaIds || []).length} cartas`;
        }

        const specificItems = [];
        if (component.type === 'mazo') {
          specificItems.push({
            icon: createShuffleIcon(),
            label: 'Barajar',
            onClick: () => {
              replaceComponent(component.id, updateComponent(component, {
                properties: { cartaIds: shuffleCartaIds(component.properties?.cartaIds || []) },
              }));
            },
          });
          specificItems.push({
            icon: createEyeIcon(),
            label: 'Ver contenido...',
            onClick: () => {
              openMazoContentModal({
                mazoId: component.id,
                onSacar: (cartaId) => sacarCartaDeMazo(component.id, cartaId),
              });
            },
          });
        } else if (component.type === 'carta') {
          const mazos = getComponents().filter((c) => c.type === 'mazo');
          if (mazos.length > 0) {
            specificItems.push({
              icon: createInsertIcon(),
              label: 'Meter en mazo...',
              onClick: () => {
                openInsertIntoMazoModal({
                  carta: component,
                  mazos,
                  onAccept: ({ mazoId, posicion }) => {
                    const mazo = getComponents().find((c) => c.id === mazoId);
                    if (!mazo) return;
                    const cartaIds = mazo.properties?.cartaIds || [];
                    const nuevaLista = posicion === 'arriba' ? [component.id, ...cartaIds] : [...cartaIds, component.id];
                    replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds: nuevaLista } }));
                  },
                });
              },
            });
          }
        }

        // Una copia sincronizada no ofrece bloquear/desbloquear aquí: su "Bloqueado"
        // sigue siempre al original mientras esté sincronizada.
        const generalItems = (!component.copyOf || component.sincronizado === false) ? [
          {
            icon: createLockIcon(bloqueado),
            label: bloqueado ? 'Desbloquear' : 'Bloquear',
            onClick: () => {
              replaceComponent(component.id, updateComponent(component, { bloqueado: bloqueado ? 'ninguno' : 'juego' }));
            },
          },
        ] : [];

        openContextMenu({
          x: event.clientX,
          y: event.clientY,
          description: { main: formatComponentIdentifier(component), extra },
          generalItems,
          specificItems,
          interactionItems: getInteractionItemsFor(component),
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
