// Modal reducida de propiedades para un componente Copia: sin pestañas, nada
// editable salvo "Sincronizado" y, si está desmarcado, "Bloqueado"/"Oculto"
// propios — el resto de campos siempre sincroniza con el original (ver
// core/component.js/state.js).

import { getComponents } from '../core/state.js';
import { createHelpIcon } from './helpIcon.js';
import { t } from '../core/i18n.js';

const BLOQUEADO_OPTIONS = [
  { value: 'ninguno', label: t('option.bloqueado.ninguno') },
  { value: 'juego', label: t('option.bloqueado.juego') },
  { value: 'todos', label: t('option.bloqueado.todos') },
];

export function openCopyComponentModal({ component, onAccept, onDelete }) {
  const workingComponent = { ...component };
  const original = getComponents().find((c) => c.id === component.copyOf);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';
  header.textContent = t('copyComponent.title');
  modal.appendChild(header);

  const content = document.createElement('div');
  content.className = 'modal__content';
  modal.appendChild(content);

  const idField = document.createElement('div');
  idField.className = 'modal__field';
  const idLabel = document.createElement('label');
  idLabel.textContent = t('copyComponent.idLabel');
  const idValue = document.createElement('div');
  idValue.textContent = component.id;
  idField.appendChild(idLabel);
  idField.appendChild(idValue);
  content.appendChild(idField);

  const notice = document.createElement('p');
  notice.className = 'modal__hint';
  notice.textContent = t('copyComponent.notice');
  content.appendChild(notice);

  const syncField = document.createElement('div');
  syncField.className = 'modal__field modal__field--checkbox';
  const syncCheckbox = document.createElement('input');
  syncCheckbox.type = 'checkbox';
  syncCheckbox.checked = workingComponent.sincronizado !== false;
  const syncLabel = document.createElement('label');
  syncLabel.textContent = t('copyComponent.synced');
  syncField.appendChild(syncCheckbox);
  syncField.appendChild(syncLabel);
  syncField.appendChild(createHelpIcon({
    text: t('help.copySync'),  }));
  content.appendChild(syncField);

  const bloqueadoOcultoSection = document.createElement('fieldset');
  bloqueadoOcultoSection.className = 'modal__section';
  const bloqueadoOcultoLegend = document.createElement('legend');
  bloqueadoOcultoLegend.className = 'modal__section-title';
  bloqueadoOcultoLegend.textContent = t('copyComponent.lockedHiddenLegend');
  bloqueadoOcultoSection.appendChild(bloqueadoOcultoLegend);

  const moveField = document.createElement('div');
  moveField.className = 'modal__field';
  const moveLabelRow = document.createElement('div');
  moveLabelRow.style.display = 'flex';
  moveLabelRow.style.alignItems = 'center';
  moveLabelRow.style.gap = '0.35rem';
  moveLabelRow.style.marginBottom = '0.25rem';
  const moveLabel = document.createElement('label');
  moveLabel.textContent = t('componentModal.locked');
  moveLabel.style.marginBottom = '0';
  const moveSelect = document.createElement('select');
  for (const { value, label } of BLOQUEADO_OPTIONS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    moveSelect.appendChild(option);
  }
  moveSelect.value = workingComponent.bloqueado ?? 'ninguno';
  moveSelect.addEventListener('change', () => {
    workingComponent.bloqueado = moveSelect.value;
  });
  moveLabelRow.appendChild(moveLabel);
  moveLabelRow.appendChild(createHelpIcon({
    text: t('help.lockedField'),  }));
  moveField.appendChild(moveLabelRow);
  moveField.appendChild(moveSelect);
  bloqueadoOcultoSection.appendChild(moveField);

  const hiddenField = document.createElement('div');
  hiddenField.className = 'modal__field modal__field--checkbox';
  const hiddenCheckbox = document.createElement('input');
  hiddenCheckbox.type = 'checkbox';
  hiddenCheckbox.checked = workingComponent.oculto ?? false;
  const hiddenLabel = document.createElement('label');
  hiddenLabel.textContent = t('componentModal.hidden');
  hiddenCheckbox.addEventListener('change', () => {
    workingComponent.oculto = hiddenCheckbox.checked;
  });
  hiddenField.appendChild(hiddenCheckbox);
  hiddenField.appendChild(hiddenLabel);
  hiddenField.appendChild(createHelpIcon({
    text: t('help.hiddenField'),  }));
  bloqueadoOcultoSection.appendChild(hiddenField);

  content.appendChild(bloqueadoOcultoSection);

  function updateSyncedFieldsState() {
    const synced = syncCheckbox.checked;
    bloqueadoOcultoSection.classList.toggle('modal__section--disabled', synced);
    moveSelect.disabled = synced;
    hiddenCheckbox.disabled = synced;
    if (synced && original) {
      moveSelect.value = original.bloqueado ?? 'ninguno';
      hiddenCheckbox.checked = original.oculto ?? false;
      workingComponent.bloqueado = original.bloqueado;
      workingComponent.oculto = original.oculto;
    }
  }
  syncCheckbox.addEventListener('change', updateSyncedFieldsState);
  updateSyncedFieldsState();

  const originalField = document.createElement('div');
  originalField.className = 'modal__field';
  const originalLabel = document.createElement('label');
  originalLabel.textContent = t('copyComponent.originalLabel');
  const originalValue = document.createElement('div');
  originalValue.textContent = component.copyOf;
  originalField.appendChild(originalLabel);
  originalField.appendChild(originalValue);
  content.appendChild(originalField);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  modal.appendChild(footer);

  if (onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.textContent = t('common.delete');
    deleteBtn.addEventListener('click', () => {
      if (confirm(t('confirm.deleteComponent', { id: component.id }))) {
        onDelete(component);
        overlay.remove();
      }
    });
    footer.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = t('common.cancel');
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
  });
  footer.appendChild(cancelBtn);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-accept';
  acceptBtn.textContent = t('common.accept');
  acceptBtn.addEventListener('click', () => {
    workingComponent.sincronizado = syncCheckbox.checked;
    if (syncCheckbox.checked && original) {
      workingComponent.bloqueado = original.bloqueado;
      workingComponent.oculto = original.oculto;
    }
    if (onAccept) onAccept(workingComponent);
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
    if (e.target === overlay && mousedownOnOverlay) {
      overlay.remove();
    }
  });
}
