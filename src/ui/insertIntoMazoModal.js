// Modal "Meter en mazo..." (cambio 00106), abierta desde el menú contextual de
// una carta en modo juego (modes/play/playMode.js). Elegir el mazo destino y
// si la carta se coloca arriba o abajo del todo de su pila.

import { formatComponentIdentifier } from './componentRenderer.js';

export function openInsertIntoMazoModal({ carta, mazos, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Meter en mazo...';
  modal.appendChild(header);

  const hint = document.createElement('p');
  hint.className = 'modal__hint';
  hint.textContent = formatComponentIdentifier(carta);
  modal.appendChild(hint);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const mazoField = document.createElement('div');
  mazoField.className = 'modal__field';
  const mazoLabel = document.createElement('label');
  mazoLabel.textContent = 'Mazo de destino';
  const mazoSelect = document.createElement('select');
  for (const mazo of mazos) {
    const option = document.createElement('option');
    option.value = mazo.id;
    option.textContent = formatComponentIdentifier(mazo);
    mazoSelect.appendChild(option);
  }
  mazoField.appendChild(mazoLabel);
  mazoField.appendChild(mazoSelect);
  content.appendChild(mazoField);

  const posicionField = document.createElement('div');
  posicionField.className = 'modal__field';
  const posicionLabel = document.createElement('label');
  posicionLabel.textContent = 'Posición dentro del mazo';
  const posicionSelect = document.createElement('select');
  const posicionOptions = [
    { value: 'arriba', label: 'Arriba del todo' },
    { value: 'abajo', label: 'Abajo del todo' },
  ];
  for (const { value, label } of posicionOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    posicionSelect.appendChild(option);
  }
  posicionField.appendChild(posicionLabel);
  posicionField.appendChild(posicionSelect);
  content.appendChild(posicionField);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept({ mazoId: mazoSelect.value, posicion: posicionSelect.value });
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

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
