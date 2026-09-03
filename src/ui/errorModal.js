// Modal de error común a toda la app: cualquier error debe mostrarse con
// showErrorModal en vez de un toast u otro aviso ad-hoc, para que todos se
// vean y se comporten igual. Reutiliza el mismo patrón modal-overlay/modal
// que ui/helpIcon.js, con un acento visual de error en la cabecera.

import { t } from '../core/i18n.js';
export function showErrorModal(title, message, detail) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header modal__header--error';
  const icon = document.createElement('span');
  icon.className = 'modal__error-icon';
  icon.textContent = '!';
  header.appendChild(icon);
  const heading = document.createElement('h2');
  heading.className = 'modal__header-title';
  heading.textContent = title;
  header.appendChild(heading);
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  content.appendChild(messageEl);
  if (detail) {
    const detailEl = document.createElement('div');
    detailEl.className = 'modal__error-detail';
    detailEl.textContent = detail;
    content.appendChild(detailEl);
  }
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.textContent = t('common.close');
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
