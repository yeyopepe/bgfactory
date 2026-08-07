// Modal "Copias vinculadas": lista de solo lectura de todos los ids de copias
// vinculadas a un componente Original. Misma estructura que mazoContentModal.js
// pero simplificada (sin miniaturas, sin botones de acción).

import { getComponents } from '../core/state.js';
import { formatComponentIdentifier } from './componentRenderer.js';

export function openComponentCopiesModal({ originalId }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Copias vinculadas';
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

  const original = getComponents().find((c) => c.id === originalId);
  if (!original) return;

  const copies = getComponents().filter((c) => c.copyOf === originalId);
  hint.textContent = `${formatComponentIdentifier(original)} — ${copies.length} copias`;

  const list = document.createElement('ul');
  list.className = 'component-copies-modal__list';

  for (const copy of copies) {
    const item = document.createElement('li');
    item.className = 'component-copies-modal__list-item';

    const idSpan = document.createElement('span');
    idSpan.className = 'component-copies-modal__id';
    idSpan.textContent = copy.id;
    item.appendChild(idSpan);

    list.appendChild(item);
  }

  content.appendChild(list);

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
