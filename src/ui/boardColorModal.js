// Sub-modal "Color" del fondo de tablero, abierta desde pestaña "Específicas" de componentModal.js.
// Misma estructura visual que boardImageModal.js/boardPatternModal.js (overlay/modal/header/content/footer,
// sin tabs). A diferencia de boardPatternModal.js, sin fieldset.modal__section: un único campo, sin agrupación.

import { t } from '../core/i18n.js';
export function openBoardColorModal({ properties, onAccept }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('boardColor.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = {
    // Ausente → blanco opaco. '' explícito (checkbox "Transparente" marcado) se distingue con '??', no '||'.
    // Mismo criterio que colorFondo en boardPatternModal.js.
    colorSolido: properties.colorSolido ?? '#ffffff',
  };

  const colorField = document.createElement('div');
  colorField.className = 'modal__field';
  const colorLabel = document.createElement('label');
  colorLabel.textContent = t('boardColor.colorLabel');
  const colorContainer = document.createElement('div');
  colorContainer.style.display = 'flex';
  colorContainer.style.gap = '0.5rem';
  colorContainer.style.alignItems = 'center';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = working.colorSolido || '#ffffff';

  const transparentCheckbox = document.createElement('input');
  transparentCheckbox.type = 'checkbox';
  transparentCheckbox.checked = !working.colorSolido;

  const transparentLabel = document.createElement('label');
  transparentLabel.textContent = t('common.transparent');
  transparentLabel.style.margin = 0;

  colorInput.disabled = transparentCheckbox.checked;

  transparentCheckbox.addEventListener('change', () => {
    colorInput.disabled = transparentCheckbox.checked;
    working.colorSolido = transparentCheckbox.checked ? '' : colorInput.value;
  });

  colorInput.addEventListener('input', () => {
    working.colorSolido = colorInput.value;
  });

  colorContainer.appendChild(colorInput);
  colorContainer.appendChild(transparentCheckbox);
  colorContainer.appendChild(transparentLabel);
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorContainer);
  content.appendChild(colorField);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.accept');
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept({ ...working });
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
