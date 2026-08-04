// Modal de confirmación para borrar un grupo en uso: a diferencia del bloqueo
// de ui/errorModal.js (usado por Recursos), aquí sí se permite continuar —
// muestra la lista de elementos afectados (id + tipo, ya que pueden ser de
// cualquier tipo) y, si se acepta, borra el grupo y esos elementos quedan sin
// grupo asignado (ver modes/edit/editMode.js).

import { getComponentTypeLabel } from './componentTypeModal.js';

export function openGroupDeleteConfirmModal({ groupName, affectedComponents, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Eliminar grupo en uso';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = `El grupo "${groupName}" está siendo usado por los siguientes elementos. Si continúas, se eliminará el grupo y esos elementos quedarán sin grupo asignado.`;
  content.appendChild(message);

  const list = document.createElement('ul');
  list.className = 'group-delete-confirm-modal__list';
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
