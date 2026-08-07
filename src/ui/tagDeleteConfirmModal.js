// Confirmación de borrado de etiqueta en uso. A diferencia de ui/errorModal.js
// (Recursos), aquí sí se permite continuar. Lista elementos afectados (id +
// tipo, de cualquier tipo posible); al aceptar borra la etiqueta y esos
// elementos pierden la pertenencia a ella, pero conservan sus otras
// etiquetas (ver modes/edit/editMode.js).

import { getComponentTypeLabel } from './componentTypeModal.js';

export function openTagDeleteConfirmModal({ tagName, affectedComponents, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Eliminar etiqueta en uso';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = `La etiqueta "${tagName}" está siendo usada por los siguientes elementos. Si continúas, se eliminará la etiqueta y esos elementos perderán la pertenencia a esta etiqueta.`;
  content.appendChild(message);

  const list = document.createElement('ul');
  list.className = 'tag-delete-confirm-modal__list';
  for (const component of affectedComponents) {
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
