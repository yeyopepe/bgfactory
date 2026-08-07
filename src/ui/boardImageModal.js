// Sub-modal "Imagen" del fondo de tablero, abierta desde pestaña "Específicas" de componentModal.js.
// Reutiliza sistema de recursos existente (core/resource.js, panel "Recursos" de editMode.js):
// galería lista recursos tipo 'imagen' ya subidos, sin mecanismo nuevo de carpeta estática ni build.

import { RESOURCE_TYPES } from '../core/resource.js';

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesFilter(resource, query) {
  return normalize(resource.name).includes(normalize(query));
}

export function openBoardImageModal({ properties, resources, onAccept, title = 'Configurar fondo — Imagen' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal board-image-modal';

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

  let filterText = '';
  const resultsContainer = document.createElement('div');

  function renderGallery(list) {
    resultsContainer.innerHTML = '';

    if (list.length === 0) {
      const emptyFilter = document.createElement('p');
      emptyFilter.className = 'board-image-modal__empty-filter';
      emptyFilter.textContent = `No hay imágenes que coincidan con «${filterText}».`;
      resultsContainer.appendChild(emptyFilter);
      return;
    }

    const gallery = document.createElement('div');
    gallery.className = 'board-image-modal__gallery';

    for (const resource of list) {
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

      item.addEventListener('dblclick', () => {
        selectedId = resource.id;
        if (onAccept) onAccept(selectedId);
        overlay.remove();
      });

      gallery.appendChild(item);
    }

    resultsContainer.appendChild(gallery);
  }

  if (images.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'board-image-modal__empty';
    empty.textContent = 'No hay imágenes disponibles';
    content.appendChild(empty);
  } else {
    const searchBar = document.createElement('div');
    searchBar.className = 'board-image-modal__search';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar imagen…';
    searchInput.addEventListener('input', () => {
      filterText = searchInput.value;
      renderGallery(images.filter((r) => matchesFilter(r, filterText)));
    });
    searchBar.appendChild(searchInput);

    content.appendChild(searchBar);
    content.appendChild(resultsContainer);
    renderGallery(images);
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

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) overlay.remove();
  });
}
