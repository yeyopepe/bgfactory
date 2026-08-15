// Icono de ayuda contextual reutilizable ("?"): abre una modal con el texto/HTML al pulsar.

export function createHelpIcon({ text, html } = {}) {
  const icon = document.createElement('span');
  icon.className = 'help-icon';
  icon.textContent = '?';

  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    openHelpModal({ text, html });
  });

  return icon;
}

function openHelpModal({ text, html }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const content = document.createElement('div');
  content.className = 'modal__content';
  if (html != null) {
    content.innerHTML = html;
  } else {
    content.textContent = text;
  }
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
  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}
