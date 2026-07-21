// Sub-modal "Imagen" del fondo de un tablero, abierta desde la pestaña
// "Específicas" de componentModal.js. Reutiliza el sistema de recursos ya
// existente (core/resource.js, panel "Recursos" de editMode.js): la galería
// lista los recursos de tipo 'imagen' ya subidos por el usuario, no requiere
// ningún mecanismo nuevo de carpeta estática ni de build.

import { RESOURCE_TYPES } from '../core/resource.js';

export function openBoardImageModal({ properties, resources, onAccept, title = 'Configurar fondo — Imagen' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = title;
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const images = resources.filter((r) => r.type === RESOURCE_TYPES.IMAGE);
  let selectedId = images.some((r) => r.id === properties.imagenResourceId) ? properties.imagenResourceId : null;

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';

  function updateAcceptButton() {
    acceptBtn.disabled = !selectedId;
  }

  if (images.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'board-image-modal__empty';
    empty.textContent = 'No hay imágenes disponibles';
    content.appendChild(empty);
  } else {
    const gallery = document.createElement('div');
    gallery.className = 'board-image-modal__gallery';

    for (const resource of images) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'board-image-modal__item';
      if (resource.id === selectedId) item.classList.add('board-image-modal__item--selected');

      const thumb = document.createElement('img');
      thumb.className = 'board-image-modal__thumb';
      thumb.src = resource.dataUrl;
      thumb.alt = resource.name;
      item.appendChild(thumb);

      const name = document.createElement('span');
      name.className = 'board-image-modal__name';
      name.textContent = resource.name;
      item.appendChild(name);

      item.addEventListener('click', () => {
        selectedId = resource.id;
        gallery.querySelectorAll('.board-image-modal__item').forEach((el) => el.classList.remove('board-image-modal__item--selected'));
        item.classList.add('board-image-modal__item--selected');
        updateAcceptButton();
      });

      gallery.appendChild(item);
    }

    content.appendChild(gallery);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  acceptBtn.addEventListener('click', () => {
    if (!selectedId) return;
    if (onAccept) onAccept(selectedId);
    overlay.remove();
  });
  footer.appendChild(acceptBtn);

  updateAcceptButton();

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
