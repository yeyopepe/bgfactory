// Modal de edición de un recurso de la galería, análoga a componentModal.js
// pero sin tabs: el contenido varía según el tipo de recurso. Siempre opera
// sobre un recurso ya existente (el alta no pasa por esta modal, ver
// resourceList.js / editMode.js).

import { RESOURCE_TYPES, resourceTypeForFileName } from '../core/resource.js';
import { convertImageToWebP } from '../core/imageConversion.js';
import { fontFamilyFor } from './fontFaceRegistry.js';
import { t } from '../core/i18n.js';

export function openResourceModal({ resource, onAccept, onDelete }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const isImage = resource.type === RESOURCE_TYPES.IMAGE;

  const modal = document.createElement('div');
  modal.className = isImage ? 'modal resource-modal--image' : 'modal';

  const label = isImage ? t('resourceKind.image') : t('resourceKind.font');

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('resourceModal.title', { kind: label, name: resource.name });
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  const workingResource = { ...resource };

  let stopImagePreviewDrag = () => {};
  if (isImage) {
    stopImagePreviewDrag = renderImageContent(content, workingResource);
  } else {
    renderFontContent(content, workingResource);
  }

  function closeModal() {
    stopImagePreviewDrag();
    overlay.remove();
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-eliminar';
  deleteBtn.textContent = t('common.delete');
  deleteBtn.addEventListener('click', () => {
    const deleted = onDelete ? onDelete(resource) : false;
    if (deleted) closeModal();
  });
  footer.appendChild(deleteBtn);

  if (isImage) {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = t('common.cancel');
    cancelBtn.addEventListener('click', closeModal);
    footer.appendChild(cancelBtn);

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'btn-accept';
    acceptBtn.textContent = t('resourceModal.acceptChanges');
    acceptBtn.addEventListener('click', () => {
      if (onAccept) onAccept(workingResource);
      closeModal();
    });
    footer.appendChild(acceptBtn);
  } else {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-cancel';
    closeBtn.textContent = t('resourceModal.closeWindow');
    closeBtn.addEventListener('click', closeModal);
    footer.appendChild(closeBtn);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let mousedownOnOverlay = false;
  overlay.addEventListener('mousedown', (e) => {
    mousedownOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && mousedownOnOverlay) closeModal();
  });
}

function renderImageContent(content, workingResource) {
  const nameField = document.createElement('div');
  nameField.className = 'modal__field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = t('resourceModal.nameLabel');
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
  previewLabel.textContent = t('resourceModal.previewLabel');
  const previewBox = document.createElement('div');
  previewBox.className = 'resource-modal__image-preview';
  const previewImg = document.createElement('img');
  previewImg.className = 'resource-modal__image-preview__img';
  previewImg.src = workingResource.dataUrl;
  previewImg.alt = workingResource.name;
  previewImg.draggable = false;
  previewBox.appendChild(previewImg);

  const zoomLevel = document.createElement('div');
  zoomLevel.className = 'resource-modal__zoom-level';
  previewBox.appendChild(zoomLevel);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'resource-modal__zoom-controls';
  const zoomInBtn = createZoomButton(t('resourceModal.zoom.in'), ICON_ZOOM_IN);
  const zoomOutBtn = createZoomButton(t('resourceModal.zoom.out'), ICON_ZOOM_OUT);
  const resetBtn = createZoomButton(t('resourceModal.zoom.reset'), ICON_RESET);
  zoomControls.appendChild(zoomInBtn);
  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(resetBtn);
  previewBox.appendChild(zoomControls);

  previewField.appendChild(previewLabel);
  previewField.appendChild(previewBox);

  const hint = document.createElement('div');
  hint.className = 'resource-modal__hint';
  hint.textContent = t('resourceModal.zoomPanHint');
  previewField.appendChild(hint);

  content.appendChild(previewField);

  const view = { zoom: 1, offsetX: 0, offsetY: 0 };
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 5;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function updateTransform() {
    previewImg.style.transform = `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.zoom})`;
    previewImg.classList.toggle('resource-modal__image-preview__img--zoomed', view.zoom > 1);
    zoomLevel.textContent = `${Math.round(view.zoom * 100)}%`;
  }

  function zoomAt(mouseX, mouseY, factor) {
    const newZoom = clamp(view.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    const ratio = newZoom / view.zoom;
    view.offsetX = mouseX - (mouseX - view.offsetX) * ratio;
    view.offsetY = mouseY - (mouseY - view.offsetY) * ratio;
    view.zoom = newZoom;
    if (view.zoom === ZOOM_MIN) {
      view.offsetX = 0;
      view.offsetY = 0;
    }
    updateTransform();
  }

  function resetView() {
    view.zoom = 1;
    view.offsetX = 0;
    view.offsetY = 0;
    updateTransform();
  }

  previewBox.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = previewBox.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    zoomAt(mouseX, mouseY, e.deltaY > 0 ? 1 / 1.15 : 1.15);
  });

  zoomInBtn.addEventListener('click', () => zoomAt(0, 0, 1.2));
  zoomOutBtn.addEventListener('click', () => zoomAt(0, 0, 1 / 1.2));
  resetBtn.addEventListener('click', resetView);

  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;

  function handleDragMove(e) {
    view.offsetX = dragStartOffsetX + (e.clientX - dragStartX);
    view.offsetY = dragStartOffsetY + (e.clientY - dragStartY);
    updateTransform();
  }

  function stopDrag() {
    dragging = false;
    previewImg.classList.remove('resource-modal__image-preview__img--dragging');
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', stopDrag);
  }

  previewImg.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || view.zoom <= 1) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffsetX = view.offsetX;
    dragStartOffsetY = view.offsetY;
    previewImg.classList.add('resource-modal__image-preview__img--dragging');
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', stopDrag);
  });

  updateTransform();

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.png,.jpg,.jpeg,.gif,.svg,.webp';
  fileInput.hidden = true;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file || resourceTypeForFileName(file.name) !== RESOURCE_TYPES.IMAGE) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const { dataUrl, fileName, mimeType } = await convertImageToWebP(file, reader.result);
      workingResource.dataUrl = dataUrl;
      workingResource.fileName = fileName;
      workingResource.mimeType = mimeType;
      previewImg.src = workingResource.dataUrl;
      resetView();
    };
    reader.readAsDataURL(file);
  });
  content.appendChild(fileInput);

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn-cancel';
  changeBtn.textContent = t('resourceModal.changeImage');
  changeBtn.addEventListener('click', () => fileInput.click());
  content.appendChild(changeBtn);

  return stopDrag;
}

function createZoomButton(title, iconSvg) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'resource-modal__zoom-btn';
  btn.title = title;
  btn.setAttribute('aria-label', title);
  btn.innerHTML = iconSvg;
  return btn;
}

const ICON_ZOOM_IN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
  '<line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';

const ICON_ZOOM_OUT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
  '<line x1="8" y1="11" x2="14" y2="11"></line></svg>';

const ICON_RESET =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 12a9 9 0 1 1-3.2-6.9"></path><polyline points="21 3 21 9 15 9"></polyline></svg>';

function renderFontContent(content, resource) {
  const previewField = document.createElement('div');
  previewField.className = 'modal__field';
  const previewLabel = document.createElement('label');
  previewLabel.textContent = t('resourceModal.previewLabel');
  const previewBox = document.createElement('div');
  previewBox.className = 'resource-modal__font-preview';
  previewBox.style.fontFamily = `'${fontFamilyFor(resource.id)}'`;
  previewBox.textContent = t('resourceModal.fontSample');
  previewField.appendChild(previewLabel);
  previewField.appendChild(previewBox);
  content.appendChild(previewField);
}
