// Sub-modal "Tipo de fuente" del dado, abierta desde la pestaña "Específicas"
// de componentModal.js. Análoga a ui/boardImageModal.js pero para recursos de
// tipo tipografía (RESOURCE_TYPES.FONT): en vez de una miniatura de imagen,
// cada opción muestra el nombre del recurso renderizado con su propia
// tipografía, vía ui/fontFaceRegistry.js (ya sincronizada globalmente).

import { RESOURCE_TYPES } from '../core/resource.js';
import { fontFamilyFor } from './fontFaceRegistry.js';

const SAMPLE_TEXT = 'Aa 123';

export function openDiceFontModal({ resources, currentResourceId, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Elegir tipografía';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const fonts = resources.filter((r) => r.type === RESOURCE_TYPES.FONT);
  let selectedId = fonts.some((r) => r.id === currentResourceId) ? currentResourceId : null;

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';

  function updateAcceptButton() {
    acceptBtn.disabled = !selectedId;
  }

  if (fonts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dice-font-modal__empty';
    empty.textContent = 'No hay tipografías disponibles';
    content.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'dice-font-modal__list';

    for (const resource of fonts) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'dice-font-modal__item';
      if (resource.id === selectedId) item.classList.add('dice-font-modal__item--selected');

      const name = document.createElement('span');
      name.className = 'dice-font-modal__name';
      name.textContent = resource.name;
      item.appendChild(name);

      const sample = document.createElement('span');
      sample.className = 'dice-font-modal__sample';
      sample.style.fontFamily = fontFamilyFor(resource.id);
      sample.textContent = SAMPLE_TEXT;
      item.appendChild(sample);

      item.addEventListener('click', () => {
        selectedId = resource.id;
        list.querySelectorAll('.dice-font-modal__item').forEach((el) => el.classList.remove('dice-font-modal__item--selected'));
        item.classList.add('dice-font-modal__item--selected');
        updateAcceptButton();
      });

      list.appendChild(item);
    }

    content.appendChild(list);
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
