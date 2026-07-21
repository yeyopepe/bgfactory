// Modal de edición de un recurso de la galería, análoga a componentModal.js
// pero sin tabs: el contenido varía según el tipo de recurso. Siempre opera
// sobre un recurso ya existente (el alta no pasa por esta modal, ver
// resourceList.js / editMode.js).

import { RESOURCE_TYPES, resourceTypeForFileName } from '../core/resource.js';
import { fontFamilyFor } from './fontFaceRegistry.js';

export function openResourceModal({ resource, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const isImage = resource.type === RESOURCE_TYPES.IMAGE;
  const label = isImage ? 'Imagen' : 'Tipografía';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = `Recurso: ${label} — ${resource.name}`;
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const workingResource = { ...resource };

  if (isImage) {
    renderImageContent(content, workingResource);
  } else {
    renderFontContent(content, workingResource);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-eliminar';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', () => {
    const deleted = onDelete ? onDelete(resource) : false;
    if (deleted) overlay.remove();
  });
  footer.appendChild(deleteBtn);

  if (isImage) {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());
    footer.appendChild(cancelBtn);

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'btn-accept';
    acceptBtn.textContent = 'Aceptar cambios';
    acceptBtn.addEventListener('click', () => {
      if (onAccept) onAccept(workingResource);
      overlay.remove();
    });
    footer.appendChild(acceptBtn);
  } else {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-cancel';
    closeBtn.textContent = 'Cerrar ventana';
    closeBtn.addEventListener('click', () => overlay.remove());
    footer.appendChild(closeBtn);
  }

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

function renderImageContent(content, workingResource) {
  const nameField = document.createElement('div');
  nameField.className = 'modal__field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nombre del recurso';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = workingResource.name;
  nameInput.addEventListener('input', () => {
    workingResource.name = nameInput.value;
  });
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  content.appendChild(nameField);

  const previewField = document.createElement('div');
  previewField.className = 'modal__field';
  const previewLabel = document.createElement('label');
  previewLabel.textContent = 'Vista previa';
  const previewBox = document.createElement('div');
  previewBox.className = 'resource-modal__image-preview';
  const previewImg = document.createElement('img');
  previewImg.src = workingResource.dataUrl;
  previewImg.alt = workingResource.name;
  previewBox.appendChild(previewImg);
  previewField.appendChild(previewLabel);
  previewField.appendChild(previewBox);
  content.appendChild(previewField);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.png,.jpg,.jpeg,.gif,.svg,.webp';
  fileInput.hidden = true;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file || resourceTypeForFileName(file.name) !== RESOURCE_TYPES.IMAGE) return;
    const reader = new FileReader();
    reader.onload = () => {
      workingResource.dataUrl = reader.result;
      workingResource.fileName = file.name;
      workingResource.mimeType = file.type;
      previewImg.src = workingResource.dataUrl;
    };
    reader.readAsDataURL(file);
  });
  content.appendChild(fileInput);

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn-cancel';
  changeBtn.textContent = 'Cambiar imagen...';
  changeBtn.addEventListener('click', () => fileInput.click());
  content.appendChild(changeBtn);
}

function renderFontContent(content, resource) {
  const previewField = document.createElement('div');
  previewField.className = 'modal__field';
  const previewLabel = document.createElement('label');
  previewLabel.textContent = 'Vista previa';
  const previewBox = document.createElement('div');
  previewBox.className = 'resource-modal__font-preview';
  previewBox.style.fontFamily = `'${fontFamilyFor(resource.id)}'`;
  previewBox.textContent = 'Errantes del Bosque — ABCDEFGHIJKLMÑ abcdefghijklmñ 0123456789';
  previewField.appendChild(previewLabel);
  previewField.appendChild(previewBox);
  content.appendChild(previewField);
}
