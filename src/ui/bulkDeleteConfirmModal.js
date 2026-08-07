// Modal de confirmación para borrar varios componentes a la vez (selección múltiple en modo edición).
// Mismo patrón que ui/tagDeleteConfirmModal.js: enumera elementos afectados (id + tipo) antes de confirmar.

import { getComponentTypeLabel } from './componentTypeModal.js';

export function openBulkDeleteConfirmModal({ components, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = `Eliminar ${components.length} componentes`;
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = 'Se van a eliminar los siguientes elementos:';
  content.appendChild(message);

  const list = document.createElement('ul');
  list.className = 'bulk-delete-confirm-modal__list';
  for (const component of components) {
    const item = document.createElement('li');
    item.textContent = `${getComponentTypeLabel(component.type)}: ${component.id}`;
    list.appendChild(item);
  }
  content.appendChild(list);

  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    onConfirm();
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

  modal.appendChild(footer);

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
