// Modal de confirmación para borrar un mazo en uso: a diferencia del bloqueo
// de ui/errorModal.js (usado por Recursos), aquí sí se permite continuar —
// muestra la lista de cartas afectadas y, si se acepta, borra el mazo y esas
// cartas quedan sin mazo asignado (ver modes/edit/editMode.js).

export function openDeckDeleteConfirmModal({ deckName, cardIds, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Eliminar mazo en uso';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  const message = document.createElement('p');
  message.textContent = `El mazo "${deckName}" está siendo usado por las siguientes cartas. Si continúas, se eliminará el mazo y esas cartas quedarán sin mazo asignado.`;
  content.appendChild(message);

  const list = document.createElement('ul');
  list.className = 'deck-delete-confirm-modal__list';
  for (const cardId of cardIds) {
    const item = document.createElement('li');
    item.textContent = cardId;
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
