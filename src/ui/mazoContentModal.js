// Modal "Ver contenido del mazo": lista todas las cartas de un mazo
// (miniatura de su cara frontal + id) con la posibilidad de sacar cualquiera
// de ellas, no solo la de arriba del todo. Misma modal reutilizada desde el
// menú contextual del mazo en modo juego ("Ver contenido...",
// modes/play/playMode.js) y desde el botón "Ver contenido del mazo" de la
// pestaña específica del mazo en modo edición (ui/componentModal.js).
//
// Lee siempre el mazo/las cartas actuales de core/state.js (nunca recibe una
// copia por parámetro) para poder refrescarse sola tras cada "Sacar" sin
// cerrarse — la mutación real la hace quien abre la modal, vía `onSacar`.

import { getComponents } from '../core/state.js';
import { paintCartaFace, formatComponentIdentifier } from './componentRenderer.js';
import { getCartaShapeCss } from '../core/cardProportions.js';

const THUMB_MAX_WIDTH = 42;
const THUMB_MAX_HEIGHT = 58; // máximo tamaño de la miniatura de carta

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
      // Diseño guardado en píxeles reales: encaja el ancho y alto reales de la
      // carta en la miniatura de tamaño máximo.
      const cartaWidth = carta.width || THUMB_MAX_WIDTH;
      const cartaHeight = carta.height || THUMB_MAX_HEIGHT;
      const renderScale = Math.min(THUMB_MAX_WIDTH / cartaWidth, THUMB_MAX_HEIGHT / cartaHeight);
      const thumbWidth = cartaWidth * renderScale;
      const thumbHeight = cartaHeight * renderScale;
      thumb.style.width = `${thumbWidth}px`;
      thumb.style.height = `${thumbHeight}px`;
      const { borderRadius, clipPath } = getCartaShapeCss(carta.properties?.proporcion, carta.properties?.esquinasRedondeadas);
      thumb.style.borderRadius = borderRadius;
      thumb.style.clipPath = clipPath;
      thumb.style.border = clipPath === 'none' ? '1px solid var(--border-neutral)' : 'none';
      paintCartaFace(thumb, carta.properties?.caraFrontal, renderScale, thumbWidth, thumbHeight);
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
