// Sub-modal de edición de un cuadro de texto de una cara de carta, abierta
// con doble click desde ui/cardEditorModal.js. Sin tabs, mismo patrón visual
// que el resto de sub-modales del proyecto (overlay + modal).

import { openDiceFontModal } from './diceFontModal.js';
import { getResources } from '../core/state.js';

export function openCardTextBoxModal({ textBox, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = 'Editar cuadro de texto';
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const working = { ...textBox };

  // Contenido
  const contentField = document.createElement('div');
  contentField.className = 'modal__field';
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Contenido';
  const contentInput = document.createElement('textarea');
  contentInput.rows = 3;
  contentInput.value = working.contenido || '';
  contentInput.addEventListener('input', () => {
    working.contenido = contentInput.value;
  });
  contentField.appendChild(contentLabel);
  contentField.appendChild(contentInput);
  content.appendChild(contentField);

  // Tipografía
  const fontField = document.createElement('div');
  fontField.className = 'modal__field';
  const fontLabel = document.createElement('label');
  fontLabel.textContent = 'Tipografía';
  const fontRow = document.createElement('div');
  fontRow.style.display = 'flex';
  fontRow.style.gap = '0.5rem';
  fontRow.style.alignItems = 'center';

  const fontCurrentName = document.createElement('span');
  fontCurrentName.style.color = 'var(--text-muted)';
  function updateFontCurrentName() {
    const resource = getResources().find((r) => r.id === working.fuenteResourceId);
    fontCurrentName.textContent = resource ? resource.name : 'Por defecto';
  }
  updateFontCurrentName();

  const fontBtn = document.createElement('button');
  fontBtn.type = 'button';
  fontBtn.className = 'btn-cancel';
  fontBtn.textContent = 'Elegir tipografía';
  fontBtn.addEventListener('click', () => {
    openDiceFontModal({
      resources: getResources(),
      currentResourceId: working.fuenteResourceId,
      onAccept: (resourceId) => {
        working.fuenteResourceId = resourceId;
        updateFontCurrentName();
      },
    });
  });

  fontRow.appendChild(fontBtn);
  fontRow.appendChild(fontCurrentName);
  fontField.appendChild(fontLabel);
  fontField.appendChild(fontRow);
  content.appendChild(fontField);

  // Tamaño (unidades de diseño)
  const sizeField = document.createElement('div');
  sizeField.className = 'modal__field';
  const sizeLabel = document.createElement('label');
  sizeLabel.textContent = 'Tamaño de fuente';
  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.min = 4;
  sizeInput.max = 200;
  sizeInput.value = working.tamañoFuente || 16;
  sizeInput.addEventListener('input', () => {
    const parsed = parseInt(sizeInput.value, 10);
    working.tamañoFuente = Number.isNaN(parsed) ? 16 : Math.min(Math.max(parsed, 4), 200);
  });
  sizeField.appendChild(sizeLabel);
  sizeField.appendChild(sizeInput);
  content.appendChild(sizeField);

  // Color
  const colorField = document.createElement('div');
  colorField.className = 'modal__field';
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color';
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = working.color || '#000000';
  colorInput.addEventListener('input', () => {
    working.color = colorInput.value;
  });
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorInput);
  content.appendChild(colorField);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-eliminar';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', () => {
    if (onDelete) onDelete();
    overlay.remove();
  });
  footer.appendChild(deleteBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.addEventListener('click', () => {
    if (onAccept) onAccept(working);
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
