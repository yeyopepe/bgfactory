// Modo juego: mesa infinita con los componentes renderizados directamente sobre ella.

import { getComponents, replaceComponent, reorderComponent, sacarCartaDeMazo, getGroups } from '../../core/state.js';
import { updateComponent } from '../../core/component.js';
import { getEffectiveGeneralProps } from '../../core/group.js';
import { createInfiniteTable } from '../../ui/table.js';
import { renderComponentsOnTable, formatComponentIdentifier } from '../../ui/componentRenderer.js';
import { openDiceResultModal } from '../../ui/diceResultModal.js';
import { openContextMenu } from '../../ui/contextMenu.js';
import { getPosibleValores } from '../../core/dice.js';
import { getCartaIdsEnAlgunMazo, shuffleCartaIds, rectsOverlap } from '../../core/deck.js';
import { openMazoContentModal } from '../../ui/mazoContentModal.js';
import { openInsertIntoMazoModal } from '../../ui/insertIntoMazoModal.js';
import { isInteractionActive } from '../../core/interactions.js';
import { t } from '../../core/i18n.js';
import { iconEl, ICON_SIZE } from '../../ui/icons.js';

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

// Filas por tipo: labelKey/valueKey son claves de i18n (contextMenu.js las
// resuelve con t() al pintar). El valueKey 'interaction.value.none' es además
// el centinela que marca la fila como "Ninguno" (estilo atenuado).
const ROW_LEFT = 'interaction.leftClick';
const ROW_DBL = 'interaction.doubleLeftClick';
const ROW_RIGHT = 'interaction.rightClick';
const V_NONE = 'interaction.value.none';
const V_MENU = 'interaction.value.openThisMenu';

const passiveRows = [
  { labelKey: ROW_LEFT, valueKey: V_NONE },
  { labelKey: ROW_DBL, valueKey: V_NONE },
  { labelKey: ROW_RIGHT, valueKey: V_MENU },
];

const interactionsByType = {
  'texto': passiveRows,
  'tableroSimple': passiveRows,
  'tableroPersonalizado': passiveRows,
  'documento': passiveRows,
  'dado': [
    { labelKey: ROW_LEFT, valueKey: 'interaction.value.rollDie' },
    { labelKey: ROW_DBL, valueKey: 'interaction.value.viewResultLarge' },
    { labelKey: ROW_RIGHT, valueKey: V_MENU },
  ],
  'carta': [
    { labelKey: ROW_LEFT, valueKey: 'interaction.value.flipCard' },
    { labelKey: ROW_DBL, valueKey: V_NONE },
    { labelKey: ROW_RIGHT, valueKey: V_MENU },
  ],
  'mazo': [
    { labelKey: ROW_LEFT, valueKey: 'interaction.value.drawTopCard' },
    { labelKey: ROW_DBL, valueKey: V_NONE },
    { labelKey: ROW_RIGHT, valueKey: V_MENU },
  ],
};

// Sustituye el valueKey de la fila "Clic izquierdo" por "Ninguno" cuando la
// interacción de click de ese componente está desactivada. No muta
// `interactionsByType`, constante de módulo compartida entre renders.
function getInteractionItemsFor(component) {
  const items = interactionsByType[component.type] || [];
  const key = CLICK_INTERACTION_KEY_BY_TYPE[component.type];
  if (!key || isInteractionActive(component, key)) return items;
  return items.map((item, index) => (index === 0 ? { ...item, valueKey: V_NONE } : item));
}

export function renderPlayMode(container) {
  const table = createInfiniteTable(container);

  function renderTable() {
    const allComponents = getComponents();
    const cartasEnMazo = getCartaIdsEnAlgunMazo(allComponents);
    const groups = getGroups();
    renderComponentsOnTable(table.worldEl, allComponents.filter((component) => !getEffectiveGeneralProps(component, groups).oculto && !cartasEnMazo.has(component.id)), {
      allComponents,
      groups,
      identifyMode: 'tooltip',
      liftOnDrag: true,
      selectedIds: selectedComponentId ? new Set([selectedComponentId]) : new Set(),
      onMove: (component, x, y) => {
        if (component.type === 'carta') {
          const mazo = getComponents()
            .filter((c) => c.type === 'mazo')
            .find((m) => rectsOverlap({ x, y, width: component.width ?? 100, height: component.height ?? 100 }, { x: m.x ?? 100, y: m.y ?? 100, width: m.width ?? 100, height: m.height ?? 100 }));
          if (mazo) {
            const cartaIds = [...(mazo.properties?.cartaIds || []), component.id];
            replaceComponent(mazo.id, updateComponent(mazo, { properties: { cartaIds } }));
            return;
          }
        }
        replaceComponent(component.id, updateComponent(component, { x, y }));
        if (component.groupId != null) {
          const dx = x - (component.x ?? 0);
          const dy = y - (component.y ?? 0);
          for (const sibling of getComponents()) {
            if (sibling.id === component.id || sibling.groupId !== component.groupId) continue;
            replaceComponent(sibling.id, updateComponent(sibling, { x: (sibling.x ?? 0) + dx, y: (sibling.y ?? 0) + dy }));
          }
        }
        if (getEffectiveGeneralProps(component, groups).subirAlMoverInteractuar) reorderComponent(component.id, 1);
      },
      canMove: (component) => getEffectiveGeneralProps(component, groups).bloqueado === 'ninguno',
      onDiceResult: (component, resultado) => {
        replaceComponent(component.id, updateComponent(component, {
          properties: { resultadoActual: resultado },
        }));
        if (getEffectiveGeneralProps(component, groups).subirAlMoverInteractuar) reorderComponent(component.id, 1);
      },
      onDiceOpenResult: (component) => {
        openDiceResultModal({ resultado: component.properties.resultadoActual });
      },
      onCartaFlip: (component, nuevaCara) => {
        replaceComponent(component.id, updateComponent(component, { properties: { caraActual: nuevaCara } }));
        if (getEffectiveGeneralProps(component, groups).subirAlMoverInteractuar) reorderComponent(component.id, 1);
      },
      onMazoDraw: (mazo) => {
        const cartaIds = mazo.properties?.cartaIds || [];
        if (cartaIds.length === 0) return;
        // El mazo sube de orden (si aplica) ANTES de sacar la carta: así el orden
        // "al frente" que fija sacarCartaDeMazo (state.js) para la carta revelada
        // es el que queda vigente, y no lo pisa este subir del propio mazo.
        if (getEffectiveGeneralProps(mazo, groups).subirAlMoverInteractuar) reorderComponent(mazo.id, 1);
        sacarCartaDeMazo(mazo.id, cartaIds[0]);
      },
      onContextMenu: (component, event) => {
        // Click derecho configurable por componente: con "Ninguno" seleccionado, no
        // hace nada — ni selecciona ni abre el menú.
        if (component.accionClickDerecho === 'ninguno') return;

        selectedComponentId = component.id;
        renderTable();

        const bloqueado = getEffectiveGeneralProps(component, groups).bloqueado !== 'ninguno';
        let extra;
        if (component.type === 'dado') {
          extra = t('contextMenu.extra.faces', { count: getPosibleValores(component.properties || {}).length });
        } else if (component.type === 'tableroSimple' || component.type === 'tableroPersonalizado') {
          extra = `${Math.round(component.width)}x${Math.round(component.height)}`;
        } else if (component.type === 'mazo') {
          extra = t('contextMenu.extra.cards', { count: (component.properties?.cartaIds || []).length });
        }

        const specificItems = [];
        if (component.type === 'mazo') {
          specificItems.push({
            icon: iconEl('shuffle', { size: ICON_SIZE.menu }),
            label: t('contextMenu.shuffle'),
            onClick: () => {
              replaceComponent(component.id, updateComponent(component, {
                properties: { cartaIds: shuffleCartaIds(component.properties?.cartaIds || []) },
              }));
            },
          });
          specificItems.push({
            icon: iconEl('view-contents', { size: ICON_SIZE.menu }),
            label: t('contextMenu.viewContent'),
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
              icon: iconEl('insert-into-deck', { size: ICON_SIZE.menu }),
              label: t('contextMenu.insertIntoMazo'),
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
            icon: iconEl(bloqueado ? 'unlock' : 'lock', { size: ICON_SIZE.menu }),
            label: bloqueado ? t('contextMenu.unlock') : t('contextMenu.lock'),
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
