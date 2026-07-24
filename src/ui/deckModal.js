// Modal mínima de alta/edición de un mazo, misma estructura visual que
// ui/resourceModal.js (overlay/modal/header/content/footer) pero única para
// ambos casos: sin `deck`, alta (sin botón "Eliminar"); con `deck`, edición.

import { createDeck, updateDeck, isDeckNameTaken } from '../core/deck.js';
import { getDecks } from '../core/state.js';

export function openDeckModal({ deck = null, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = deck ? `Mazo: ${deck.name}` : 'Nuevo mazo';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const nameField = document.createElement('div');
  nameField.className = 'modal__field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nombre';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = deck?.name ?? '';
  const nameError = document.createElement('div');
  nameError.className = 'modal__error';
  nameError.style.display = 'none';
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  nameField.appendChild(nameError);
  content.appendChild(nameField);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  if (deck) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => {
      onDelete(deck, () => overlay.remove());
    });
    footer.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  footer.appendChild(acceptBtn);

  function validateName() {
    const name = nameInput.value.trim();
    if (!name) {
      nameError.textContent = 'El nombre no puede estar vacío';
      nameError.style.display = 'block';
      return false;
    }
    if (isDeckNameTaken(name, getDecks(), deck?.id ?? null)) {
      nameError.textContent = 'Ya existe un mazo con este nombre';
      nameError.style.display = 'block';
      return false;
    }
    nameError.style.display = 'none';
    return true;
  }

  function updateAcceptState() {
    acceptBtn.disabled = !validateName();
  }
  nameInput.addEventListener('input', updateAcceptState);
  updateAcceptState();

  acceptBtn.addEventListener('click', () => {
    if (!validateName()) return;
    const name = nameInput.value.trim();
    onAccept(deck ? updateDeck(deck, { name }) : createDeck({ name }));
    overlay.remove();
  });

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
