// Modal de confirmación al añadir uno o varios recursos cuyo nombre ya existe
// en la galería, mismo patrón de callbacks onAccept/onCancel que
// ui/importConfirmModal.js. Cubre tanto un único duplicado (subida de un
// fichero) como varios a la vez (subida múltiple o de carpeta).

import { t } from '../core/i18n.js';
export function openResourceReplaceConfirmModal({ names, onAccept, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = names.length === 1 ? t('resourceReplace.titleSingle') : t('resourceReplace.titleMulti');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';

  if (names.length === 1) {
    const message = document.createElement('p');
    message.textContent = t('resourceReplace.messageSingle', { name: names[0] });
    content.appendChild(message);
  } else {
    const intro = document.createElement('p');
    intro.textContent = t('resourceReplace.introMulti', { count: names.length });
    content.appendChild(intro);

    const list = document.createElement('ul');
    list.className = 'resource-replace-confirm-modal__list';
    for (const name of names) {
      const item = document.createElement('li');
      item.textContent = name;
      list.appendChild(item);
    }
    content.appendChild(list);

    const outro = document.createElement('p');
    outro.textContent = t('resourceReplace.outro');
    content.appendChild(outro);
  }

  modal.appendChild(content);

  function close() {
    overlay.remove();
  }

  const footer = document.createElement('div');
  footer.className = 'modal__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('resourceReplace.replace');
  acceptBtn.addEventListener('click', () => {
    close();
    if (onAccept) onAccept();
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
    if (e.target === overlay && mousedownOnOverlay) {
      close();
      if (onCancel) onCancel();
    }
  });
}
