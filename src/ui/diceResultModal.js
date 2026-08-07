// Modal "ver resultado en grande" del dado (doble click en modo juego).
// Reutiliza el patrón modal-overlay/modal sin tabs (mismo criterio que
// ui/resourceModal.js), solo con el resultado a tamaño grande y "Cerrar".

export function openDiceResultModal({ resultado }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Resultado';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  const value = document.createElement('div');
  value.className = 'dice-result-modal__value';
  value.textContent = resultado;
  content.appendChild(value);
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.textContent = 'Cerrar';
  closeBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(closeBtn);
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
