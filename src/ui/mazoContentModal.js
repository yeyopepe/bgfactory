// Modal "Ver contenido del mazo" (cambio 00106): lista todas las cartas de un
// mazo (miniatura de su cara frontal + id) con la posibilidad de sacar
// cualquiera de ellas, no solo la de arriba del todo. Misma modal reutilizada
// desde el menú contextual del mazo en modo juego ("Ver contenido...",
// modes/play/playMode.js) y desde el botón "Ver contenido del mazo" de la
// pestaña específica del mazo en modo edición (ui/componentModal.js).
//
// Lee siempre el mazo/las cartas actuales de core/state.js (nunca recibe una
// copia por parámetro) para poder refrescarse sola tras cada "Sacar" sin
// cerrarse — la mutación real la hace quien abre la modal, vía `onSacar`.

import { getComponents } from '../core/state.js';
import { paintCartaFace, formatComponentIdentifier } from './componentRenderer.js';
import { CARD_DESIGN_WIDTH } from '../core/cardProportions.js';

const THUMB_WIDTH = 42;
const THUMB_HEIGHT = 58; // mismo tamaño fijo que .mazo-contenido__thumb en main.css

export function openMazoContentModal({ mazoId, onSacar }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Contenido del mazo';
  modal.appendChild(header);

  const hint = document.createElement('p');
  hint.className = 'modal__hint';
  modal.appendChild(hint);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  function renderBody() {
    const mazo = getComponents().find((c) => c.id === mazoId);
    content.innerHTML = '';
    if (!mazo) {
      overlay.remove();
      return;
    }

    const cartaIds = mazo.properties?.cartaIds || [];
    hint.textContent = `${formatComponentIdentifier(mazo)} — ${cartaIds.length} cartas`;

    if (cartaIds.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'mazo-contenido__empty';
      empty.textContent = 'Este mazo no tiene cartas.';
      content.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'mazo-contenido__list';

    for (const cartaId of cartaIds) {
      const carta = getComponents().find((c) => c.id === cartaId);
      if (!carta) continue; // referencia huérfana: se omite en silencio

      const item = document.createElement('div');
      item.className = 'mazo-contenido__item';

      const thumb = document.createElement('div');
      thumb.className = 'mazo-contenido__thumb';
      paintCartaFace(thumb, carta.properties?.caraFrontal, THUMB_WIDTH / CARD_DESIGN_WIDTH, THUMB_WIDTH, THUMB_HEIGHT);
      item.appendChild(thumb);

      const idEl = document.createElement('span');
      idEl.className = 'mazo-contenido__id';
      idEl.textContent = carta.id;
      item.appendChild(idEl);

      const sacarBtn = document.createElement('button');
      sacarBtn.type = 'button';
      sacarBtn.className = 'btn-sacar';
      sacarBtn.textContent = 'Sacar';
      sacarBtn.addEventListener('click', () => {
        onSacar(cartaId);
        renderBody();
      });
      item.appendChild(sacarBtn);

      list.appendChild(item);
    }

    content.appendChild(list);
  }

  renderBody();

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.textContent = 'Cerrar';
  closeBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(closeBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) overlay.remove();
  });
}
